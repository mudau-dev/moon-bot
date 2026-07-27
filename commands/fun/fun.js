const randomPercent = () => Math.floor(Math.random() * 101);

const randomItem = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

moon({
  name: "friends",
  category: "fun",
  description: "Tag your friends",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply("👯 Friends forever!");
  }
});

moon({
  name: "gay",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`🏳️‍🌈 You are ${randomPercent()}% gay!`);
  }
});

moon({
  name: "lesbian",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`🏳️‍🌈 You are ${randomPercent()}% lesbian!`);
  }
});

moon({
  name: "simp",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`🥺 You are ${randomPercent()}% simp!`);
  }
});

moon({
  name: "joke",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Parallel lines have so much in common. It's a shame they'll never meet.",
      "I told my wife she was drawing her eyebrows too high. She looked surprised."
    ];

    return reply(randomItem(jokes));
  }
});

moon({
  name: "roast",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const roasts = [
      "I'd roast you, but my mom told me not to burn trash.",
      "You're the reason the gene pool needs a lifeguard.",
      "Your secrets are always safe with me. I never even listen."
    ];

    return reply(randomItem(roasts));
  }
});

moon({
  name: "wyr",
  aliases: ["wouldyourather"],
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const questions = [
      "Would you rather always be 10 minutes late or 20 minutes early?",
      "Would you rather lose all your money or all your photos?",
      "Would you rather fly or become invisible?"
    ];

    return reply(randomItem(questions));
  }
});

moon({
  name: "ship",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply(`❤️ Ship Success Rate: ${randomPercent()}%`);
  }
});

moon({
  name: "pov",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    return reply("🎬 POV: You're reading this message.");
  }
});

moon({
  name: "truth",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const truths = [
      "What is your biggest fear?",
      "What is the most embarrassing thing you've ever done?",
      "What is a secret you've never told anyone?"
    ];

    return reply(randomItem(truths));
  }
});

moon({
  name: "dare",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const dares = [
      "Send a voice note singing your favorite song.",
      "Change your profile picture for 1 hour.",
      "Message the last person in your chat list and say hello."
    ];

    return reply(randomItem(dares));
  }
});

moon({
  name: "pp",
  category: "fun",
  async execute(sock, jid, sender, args, m, { reply }) {
    const size = Math.floor(Math.random() * 20) + 1;

    return reply(
      `📏 PP Size\n\n8${"=".repeat(size)}D\n\nLength: ${size}cm`
    );
  }
});