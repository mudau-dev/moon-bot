const User = require('../../models/User');

/**
 * Resolve a WhatsApp JID to the real phone number.
 *
 * For @lid users in groups, Baileys participant metadata
 * can provide:
 *
 * {
 *   id: 123456@lid,
 *   jid: 27821234567@s.whatsapp.net,
 *   lid: 123456@lid
 * }
 */
async function getRealUserNumber(sock, chatJid, targetJid, m) {
  if (!targetJid) return null;

  try {
    // Already a normal phone JID
    if (targetJid.endsWith('@s.whatsapp.net')) {
      return targetJid
        .split('@')[0]
        .replace(/\D/g, '') || null;
    }

    // If this is a group, get the participant information
    if (
      targetJid.endsWith('@lid') &&
      chatJid &&
      chatJid.endsWith('@g.us')
    ) {
      const metadata = await sock.groupMetadata(chatJid);

      const participant = (metadata.participants || []).find(
        p =>
          p?.id === targetJid ||
          p?.lid === targetJid ||
          p?.jid === targetJid
      );

      if (participant) {
        console.log(
          '[SETID] Participant:',
          JSON.stringify(participant, null, 2)
        );

        // THIS IS WHAT YOUR SCREENSHOT SHOWS
        if (
          participant.jid &&
          participant.jid.endsWith('@s.whatsapp.net')
        ) {
          const number = participant.jid
            .split('@')[0]
            .replace(/\D/g, '');

          if (number) {
            console.log(
              `[SETID] Phone from participant JID: ${number}`
            );

            return number;
          }
        }

        // Fallback for versions that expose phoneNumber
        if (participant.phoneNumber) {
          const number = participant.phoneNumber
            .split('@')[0]
            .replace(/\D/g, '');

          if (number) {
            console.log(
              `[SETID] Phone from participant phoneNumber: ${number}`
            );

            return number;
          }
        }
      }
    }

    // Fallback: Baileys LID mapping
    if (targetJid.endsWith('@lid')) {
      try {
        const mapping =
          sock.signalRepository?.lidMapping;

        if (mapping) {
          const phoneJid =
            await mapping.getPNForLID(targetJid);

          if (phoneJid) {
            const number = phoneJid
              .split('@')[0]
              .replace(/\D/g, '');

            if (number) {
              console.log(
                `[SETID] Phone from LID mapping: ${number}`
              );

              return number;
            }
          }
        }
      } catch (err) {
        console.error(
          '[SETID] LID mapping error:',
          err
        );
      }
    }

    return null;

  } catch (err) {
    console.error(
      '[SETID] Number resolution error:',
      err
    );

    return null;
  }
}


// ============================================================
// SETID
// ============================================================

moon({
  name: 'setid',
  aliases: ['changeid'],
  category: 'admin',
  description: 'Change a user\'s Moon ID. (Owners/Mods only)',
  usage: '.setid [@user] [newid]',
  roles: ['Mod', 'Owner', 'True Owner', 'CDC'],

  async execute(sock, jid, sender, args, m, { reply }) {
    try {

      // ========================================================
      // FIND TARGET
      // ========================================================

      const context =
        m.message?.extendedTextMessage?.contextInfo || {};

      const mentioned =
        context.mentionedJid?.[0];

      const quoted =
        context.participant;

      const target =
        mentioned ||
        quoted ||
        sender;

      console.log(
        '[SETID] Target JID:',
        target
      );

      // ========================================================
      // GET REAL PHONE NUMBER
      // ========================================================

      const targetNumber =
        await getRealUserNumber(
          sock,
          jid,
          target,
          m
        );

      console.log(
        '[SETID] Target phone:',
        targetNumber
      );

      if (!targetNumber) {
        return reply(
          '❌ Could not determine the target user\'s phone number.'
        );
      }

      const targetPhoneJid =
        `${targetNumber}@s.whatsapp.net`;

      // ========================================================
      // DETERMINE NEW MOON ID
      // ========================================================

      let newId;

      if (mentioned && args.length >= 2) {
        // .setid @user newid
        newId = args[1].trim();

      } else if (
        !mentioned &&
        !quoted &&
        args.length >= 1
      ) {
        // .setid newid
        newId = args[0].trim();

      } else {
        // .setid @user
        // .setid quoted user
        // .setid
        //
        // Default to real phone number
        newId = targetNumber;
      }

      // ========================================================
      // VALIDATE ID
      // ========================================================

      if (!newId || newId.length < 3) {
        return reply(
          '❌ Invalid ID. Must be at least 3 characters.'
        );
      }

      if (
        newId.includes('@') ||
        newId.includes(' ') ||
        newId.includes('/')
      ) {
        return reply(
          '❌ Invalid ID. Do not use spaces, @, or /.'
        );
      }

      // ========================================================
      // FIND USER
      // ========================================================
      //
      // IMPORTANT:
      // Search by REAL PHONE first.
      //
      // Your screenshot proves the phone number already
      // exists in MongoDB.
      //
      // This prevents the duplicate whatsappNumber error.
      // ========================================================

      let user =
        await User.findOne({
          whatsappNumber: targetPhoneJid
        });

      // If not found, try phoneNumber
      if (!user) {
        user =
          await User.findOne({
            phoneNumber: targetNumber
          });
      }

      // If not found, try userId
      if (!user) {
        user =
          await User.findOne({
            userId: targetNumber
          });
      }

      // If not found, try the LID
      if (!user) {
        user =
          await User.findOne({
            whatsappNumber: target
          });
      }

      // If not found, try current Moon ID
      if (!user) {
        user =
          await User.findOne({
            moonId: targetNumber
          });
      }

      // ========================================================
      // USER DOES NOT EXIST
      // ========================================================

      if (!user) {
        return reply(
          `❌ User @${targetNumber} is not registered.`
        );
      }

      // ========================================================
      // CHECK IF MOON ID IS ALREADY USED
      // ========================================================

      const existingId =
        await User.findOne({
          moonId: newId
        });

      if (
        existingId &&
        String(existingId._id) !== String(user._id)
      ) {
        return reply(
          `❌ The ID \`${newId}\` is already in use by another user.`
        );
      }

      // ========================================================
      // UPDATE MOON ID
      // ========================================================

      const oldId =
        user.moonId || 'none';

      user.moonId = newId;

      // Keep these fields synchronized.
      //
      // IMPORTANT:
      // Only set whatsappNumber if it is already this user's
      // record OR it is empty.
      //
      // We DON'T blindly overwrite another unique record.
      // ========================================================

      if (
        !user.whatsappNumber ||
        user.whatsappNumber === target ||
        user.whatsappNumber === targetPhoneJid
      ) {
        user.whatsappNumber =
          targetPhoneJid;
      }

      user.phoneNumber =
        targetNumber;

      user.userId =
        targetNumber;

      await user.save();

      console.log(
        `[SETID] SUCCESS ${targetNumber}: ${oldId} -> ${newId}`
      );

      // ========================================================
      // SUCCESS MESSAGE
      // ========================================================

      return await sock.sendMessage(
        jid,
        {
          text:
            `🌙 *MOONLIGHT HAVEN — ID UPDATED*\n` +
            `─────────────『❀』\n` +
            `👤 *User:* @${targetNumber}\n` +
            `📞 *Number:* ${targetNumber}\n` +
            `🔄 *Old ID:* \`${oldId}\`\n` +
            `✅ *New ID:* \`${newId}\`\n` +
            `─────────────『❀』\n` +
            `> Updated by @${sender.split('@')[0]}`,

          mentions: [
            target,
            sender
          ]
        },
        {
          quoted: m
        }
      );

    } catch (err) {

      console.error(
        '[SETID ERROR]',
        err
      );

      // Handle MongoDB duplicate key specifically
      if (err?.code === 11000) {
        return reply(
          '❌ MongoDB rejected the update because this phone number already belongs to another account.'
        );
      }

      return reply(
        '❌ Failed to update the user ID.'
      );
    }
  }
});
