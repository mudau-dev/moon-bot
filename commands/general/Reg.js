/**
 * commands/general/Reg.js
 *
 * .reg / .register
 * .whois / .myid
 *
 * Correctly handles WhatsApp @lid users.
 *
 * Example:
 *
 * WhatsApp sender:
 *   149487074996234@lid
 *
 * Group participant:
 *   {
 *      id: 149487074996234@lid,
 *      jid: 27673871846@s.whatsapp.net,
 *      lid: 149487074996234@lid
 *   }
 *
 * Real phone number:
 *   27673871846
 */

const User = require('../../models/User');


// ============================================================================
// GET REAL PHONE NUMBER
// ============================================================================

async function getRealUserNumber(sock, chatJid, targetJid) {
  if (!targetJid) return null;

  try {

    // ============================================================
    // 1. Normal phone JID
    // ============================================================

    if (targetJid.endsWith('@s.whatsapp.net')) {
      const number = targetJid
        .split('@')[0]
        .replace(/\D/g, '');

      return number || null;
    }


    // ============================================================
    // 2. LID inside a group
    // ============================================================

    if (
      targetJid.endsWith('@lid') &&
      chatJid &&
      chatJid.endsWith('@g.us')
    ) {

      const metadata =
        await sock.groupMetadata(chatJid);

      const participants =
        metadata?.participants || [];

      const participant =
        participants.find(p =>
          p?.id === targetJid ||
          p?.lid === targetJid ||
          p?.jid === targetJid
        );

      if (participant) {

        console.log(
          '[REG] Participant:',
          JSON.stringify(participant, null, 2)
        );


        // ========================================================
        // THIS IS THE IMPORTANT PART
        // ========================================================

        if (
          participant.jid &&
          participant.jid.endsWith('@s.whatsapp.net')
        ) {

          const number =
            participant.jid
              .split('@')[0]
              .replace(/\D/g, '');

          if (number) {

            console.log(
              `[REG] Phone from participant JID: ${number}`
            );

            return number;
          }
        }


        // ========================================================
        // Fallback: phoneNumber
        // ========================================================

        if (participant.phoneNumber) {

          const number =
            participant.phoneNumber
              .split('@')[0]
              .replace(/\D/g, '');

          if (number) {

            console.log(
              `[REG] Phone from participant phoneNumber: ${number}`
            );

            return number;
          }
        }
      }
    }


    // ============================================================
    // 3. Fallback: Baileys LID mapping
    // ============================================================

    if (targetJid.endsWith('@lid')) {

      try {

        const mapping =
          sock.signalRepository?.lidMapping;

        if (mapping) {

          const phoneJid =
            await mapping.getPNForLID(targetJid);

          if (phoneJid) {

            const number =
              phoneJid
                .split('@')[0]
                .replace(/\D/g, '');

            if (number) {

              console.log(
                `[REG] Phone from LID mapping: ${number}`
              );

              return number;
            }
          }
        }

      } catch (err) {

        console.error(
          '[REG] LID mapping error:',
          err
        );
      }
    }


    // ============================================================
    // Could not resolve
    // ============================================================

    console.log(
      `[REG] Could not resolve phone number for ${targetJid}`
    );

    return null;

  } catch (err) {

    console.error(
      '[REG] Phone resolution error:',
      err
    );

    return null;
  }
}


// ============================================================================
// REGISTER
// ============================================================================

moon({
  name: 'register',
  aliases: ['reg'],
  category: 'general',
  description: 'Register your Moonlight Haven account.',

  async execute(
    sock,
    jid,
    sender,
    args,
    m,
    { reply, pushName }
  ) {

    try {

      console.log(
        '[REG] Sender:',
        sender
      );


      // ============================================================
      // GET REAL PHONE NUMBER
      // ============================================================

      const userNumber =
        await getRealUserNumber(
          sock,
          jid,
          sender
        );


      console.log(
        '[REG] Resolved phone:',
        userNumber
      );


      if (!userNumber) {

        return reply(
          '❌ *Could not determine your phone number.*\n\n' +
          'WhatsApp identified your account using a Linked ID (LID), ' +
          'but the real phone number was not available.\n\n' +
          'Please try `.reg` again.'
        );
      }


      const phoneJid =
        `${userNumber}@s.whatsapp.net`;


      console.log(
        '[REG] Real phone JID:',
        phoneJid
      );


      // ============================================================
      // FIND EXISTING USER
      // ============================================================
      //
      // IMPORTANT:
      // Search by the REAL phone number first.
      //
      // This prevents the duplicate whatsappNumber problem
      // that happened with .setid.
      // ============================================================

      let user =
        await User.findOne({
          whatsappNumber: phoneJid
        });


      // ============================================================
      // If not found, search by phoneNumber
      // ============================================================

      if (!user) {

        user =
          await User.findOne({
            phoneNumber: userNumber
          });
      }


      // ============================================================
      // If not found, search by userId
      // ============================================================

      if (!user) {

        user =
          await User.findOne({
            userId: userNumber
          });
      }


      // ============================================================
      // If not found, search old LID record
      // ============================================================

      if (!user) {

        user =
          await User.findOne({
            whatsappNumber: sender
          });
      }


      // ============================================================
      // If not found, search Moon ID
      // ============================================================

      if (!user) {

        user =
          await User.findOne({
            moonId: userNumber
          });
      }


      // ============================================================
      // CREATE USER
      // ============================================================

      if (!user) {

        console.log(
          `[REG] Creating new user: ${userNumber}`
        );

        user =
          new User({
            whatsappNumber: phoneJid,
            phoneNumber: userNumber,
            userId: userNumber,
            username: pushName || 'Unknown',
            createdAt: new Date()
          });
      }


      // ============================================================
      // ALREADY REGISTERED
      // ============================================================

      const isRegistered =
        user.moonId &&
        !String(user.moonId).startsWith('moon_');


      if (isRegistered) {

        // Make sure the account has the real phone number
        // without blindly creating another record.

        if (
          !user.whatsappNumber ||
          user.whatsappNumber === sender ||
          user.whatsappNumber === phoneJid
        ) {
          user.whatsappNumber =
            phoneJid;
        }

        user.phoneNumber =
          userNumber;

        user.userId =
          userNumber;

        await user.save();


        let profileText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `✅ *You are already registered!*\n\n` +
          `👤 *Name:* ${user.username || pushName || 'Unknown'}\n` +
          `🆔 *Moon ID:* \`${user.moonId}\`\n` +
          `📞 *Number:* ${userNumber}\n` +
          `🔐 *Web Password:* ${user.webPassword ? '✅ Set' : '❌ Not Set'}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;


        let profilePic = null;

        try {

          profilePic =
            await sock.profilePictureUrl(
              sender,
              'image'
            );

        } catch {}


        if (profilePic) {

          try {

            return await sock.sendMessage(
              jid,
              {
                image: {
                  url: profilePic
                },
                caption: profileText
              },
              {
                quoted: m
              }
            );

          } catch {}
        }


        return reply(profileText);
      }


      // ============================================================
      // REGISTER ACCOUNT
      // ============================================================

      user.moonId =
        userNumber;

      user.phoneNumber =
        userNumber;

      user.userId =
        userNumber;


      // IMPORTANT:
      //
      // If this user was previously stored using @lid,
      // change it to the real phone JID.
      //
      // We already searched for an existing real-phone
      // account above, so this should not create the
      // duplicate-key problem we saw earlier.

      user.whatsappNumber =
        phoneJid;


      if (
        !user.username ||
        user.username === 'Unknown'
      ) {

        user.username =
          pushName || 'Unknown';
      }


      // ============================================================
      // PROFILE PICTURE
      // ============================================================

      let profilePic = null;

      try {

        profilePic =
          await sock.profilePictureUrl(
            sender,
            'image'
          );

      } catch {}


      if (profilePic) {

        user.avatarUrl =
          profilePic;
      }


      // ============================================================
      // SAVE
      // ============================================================

      await user.save();


      console.log(
        `[REG] SUCCESS: ${userNumber}`
      );


      // ============================================================
      // REGISTRATION MESSAGE
      // ============================================================

      const regText =
        `🌙 *MOONLIGHT HAVEN*\n` +
        `─────────────『❀』\n` +
        `✅ *Registration Successful!*\n\n` +
        `👤 *Name:* ${user.username}\n` +
        `🆔 *Moon ID:* \`${user.moonId}\`\n` +
        `📞 *Number:* ${userNumber}\n` +
        `📊 *Status:* Active\n` +
        `─────────────『❀』\n` +
        `> Use \`.webcp\` to create your website password.\n` +
        `> Welcome to Moonlight Haven! 🎉`;


      if (profilePic) {

        try {

          return await sock.sendMessage(
            jid,
            {
              image: {
                url: profilePic
              },
              caption: regText
            },
            {
              quoted: m
            }
          );

        } catch {}
      }


      return reply(regText);


    } catch (err) {

      console.error(
        '[REG ERROR]',
        err
      );


      // ============================================================
      // MONGODB DUPLICATE KEY
      // ============================================================

      if (err?.code === 11000) {

        return reply(
          '❌ Registration could not be completed because this WhatsApp number already belongs to another account.'
        );
      }


      return reply(
        '❌ Failed to register your account. Please try again.'
      );
    }
  }
});


// ============================================================================
// WHOIS / MYID
// ============================================================================

moon({
  name: 'whois',
  aliases: ['myid'],
  category: 'general',
  description: 'Check if you are registered in Moonlight Haven.',

  async execute(
    sock,
    jid,
    sender,
    args,
    m,
    { reply, pushName }
  ) {

    try {

      console.log(
        '[WHOIS] Sender:',
        sender
      );


      // ============================================================
      // GET REAL PHONE NUMBER
      // ============================================================

      const userNumber =
        await getRealUserNumber(
          sock,
          jid,
          sender
        );


      console.log(
        '[WHOIS] Resolved phone:',
        userNumber
      );


      if (!userNumber) {

        return reply(
          '❌ *Could not determine your phone number.*\n\n' +
          'WhatsApp identified your account using a Linked ID (LID), ' +
          'but the real phone number was not available.\n\n' +
          'Please try again.'
        );
      }


      const phoneJid =
        `${userNumber}@s.whatsapp.net`;


      // ============================================================
      // FIND USER
      // ============================================================

      let user =
        await User.findOne({
          whatsappNumber: phoneJid
        });


      if (!user) {

        user =
          await User.findOne({
            phoneNumber: userNumber
          });
      }


      if (!user) {

        user =
          await User.findOne({
            userId: userNumber
          });
      }


      if (!user) {

        user =
          await User.findOne({
            whatsappNumber: sender
          });
      }


      if (!user) {

        user =
          await User.findOne({
            moonId: userNumber
          });
      }


      // ============================================================
      // CHECK REGISTRATION
      // ============================================================

      const isRegistered =
        user &&
        user.moonId &&
        !String(user.moonId).startsWith('moon_');


      let cardText;


      // ============================================================
      // NOT REGISTERED
      // ============================================================

      if (!isRegistered) {

        cardText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `❌ *Not registered in Moonlight*\n\n` +
          `👤 *Name:* ${pushName || 'Unknown'}\n` +
          `📞 *Number:* ${userNumber}\n` +
          `📊 *Status:* Unregistered\n` +
          `─────────────『❀』\n` +
          `> Use \`.reg\` to register your account.`;
      }


      // ============================================================
      // REGISTERED
      // ============================================================

      else {

        cardText =
          `🌙 *MOONLIGHT HAVEN*\n` +
          `─────────────『❀』\n` +
          `✅ *Registered Member*\n\n` +
          `👤 *Name:* ${user.username || pushName || 'Unknown'}\n` +
          `🆔 *Moon ID:* \`${user.moonId}\`\n` +
          `📞 *Number:* ${userNumber}\n` +
          `📊 *Status:* ${user.suspended ? '⛔ Suspended' : '✅ Active'}\n` +
          `─────────────『❀』\n` +
          `> Use \`.webcp\` to create your web password.`;
      }


      // ============================================================
      // PROFILE PICTURE
      // ============================================================

      let profilePic = null;

      try {

        profilePic =
          await sock.profilePictureUrl(
            sender,
            'image'
          );

      } catch {}


      if (profilePic) {

        try {

          return await sock.sendMessage(
            jid,
            {
              image: {
                url: profilePic
              },
              caption: cardText
            },
            {
              quoted: m
            }
          );

        } catch {}
      }


      return reply(cardText);


    } catch (err) {

      console.error(
        '[WHOIS ERROR]',
        err
      );

      return reply(
        '❌ Failed to check registration.'
      );
    }
  }
});
