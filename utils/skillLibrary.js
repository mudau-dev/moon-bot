/**
 * utils/skillLibrary.js
 * A library of 50 unique Moonlight Legacy skills.
 */

const SKILLS = [
  // --- MAGE / MAGIC SKILLS ---
  { name: 'Fireball', type: 'Magic', mana: 12, dmg: 12, effect: 'burn', chance: 0.4, desc: '🔥 Deals 12 dmg · 40% burn' },
  { name: 'Ice Spike', type: 'Magic', mana: 23, dmg: 23, effect: 'freeze', chance: 0.3, desc: '🧊 Deals 23 dmg · 30% freeze' },
  { name: 'Thunderbolt', type: 'Magic', mana: 21, dmg: 21, effect: 'paralyze', chance: 0.25, desc: '⚡ Deals 21 dmg · 25% paralyze' },
  { name: 'Arcane Blast', type: 'Magic', mana: 23, dmg: 23, effect: 'none', chance: 0, desc: '🔮 Deals 23 pure magic dmg' },
  { name: 'Meteor Rain', type: 'Magic', mana: 31, dmg: 31, effect: 'burn', chance: 0.5, desc: '☄️ Massive AoE · 31 dmg · 50% burn' },
  { name: 'Frost Nova', type: 'Magic', mana: 8, dmg: 8, effect: 'freeze', chance: 0.6, desc: '❄️ Deals 8 dmg · 60% freeze' },
  { name: 'Chain Lightning', type: 'Magic', mana: 22, dmg: 22, effect: 'paralyze', chance: 0.3, desc: '🌩️ Deals 22 dmg · 30% paralyze' },
  { name: 'Shadow Bolt', type: 'Magic', mana: 31, dmg: 31, effect: 'curse', chance: 0.2, desc: '🌑 Deals 31 dmg · 20% curse' },
  { name: 'Abyssal Gaze', type: 'Magic', mana: 0, dmg: 0, effect: 'fear', chance: 0.8, desc: '👁️ Causes Fear (80%) · Target skips turn' },
  { name: 'Solar Flare', type: 'Magic', mana: 24, dmg: 24, effect: 'blind', chance: 0.4, desc: '☀️ Deals 24 dmg · 40% blind' },

  // --- WARRIOR / PHYSICAL SKILLS ---
  { name: 'Slash', type: 'Physical', mana: 4, dmg: 4, effect: 'bleed', chance: 0.25, desc: '⚔️ Deals 4 dmg · 25% bleed' },
  { name: 'Heavy Strike', type: 'Physical', mana: 21, dmg: 21, effect: 'none', chance: 0, desc: '🔨 Deals 21 heavy physical dmg' },
  { name: 'Cleave', type: 'Physical', mana: 22, dmg: 22, effect: 'none', chance: 0, desc: '🪓 Hits multiple targets · 22 dmg' },
  { name: 'Berserk Rage', type: 'Physical', mana: 0, dmg: 0, effect: 'buff_atk', chance: 1, desc: '💢 ATK +20 for 3 rounds' },
  { name: 'Execute', type: 'Physical', mana: 41, dmg: 41, effect: 'none', chance: 0, desc: '🩸 High dmg finisher · 41 dmg' },
  { name: 'Whirlwind', type: 'Physical', mana: 21, dmg: 21, effect: 'none', chance: 0, desc: '🌪️ Spins to deal 21 dmg' },
  { name: 'Shield Bash', type: 'Physical', mana: 11, dmg: 11, effect: 'stun', chance: 0.3, desc: '🛡️ Deals 11 dmg · 30% stun' },
  { name: 'Pommel Strike', type: 'Physical', mana: 7, dmg: 7, effect: 'silence', chance: 0.4, desc: '🗡️ Deals 7 dmg · 40% silence' },
  { name: 'Dragon Leap', type: 'Physical', mana: 24, dmg: 24, effect: 'none', chance: 0, desc: '🐉 Powerful jump attack · 27 dmg' },
  { name: 'Warlord Cry', type: 'Physical', mana: 0, dmg: 0, effect: 'buff_def', chance: 1, desc: '📢 DEF +15 for 3 rounds' },

  // --- ASSASSIN / AGILITY SKILLS ---
  { name: 'Shadow Strike', type: 'Physical', mana: 20, dmg: 20, effect: 'none', chance: 0, desc: '🗡️ Fast strike · 20 dmg' },
  { name: 'Poison Blade', type: 'Physical', mana: 11, dmg: 11, effect: 'poison', chance: 0.7, desc: '☠️ Deals 11 dmg · 70% poison' },
  { name: 'Backstab', type: 'Physical', mana: 30, dmg: 20, effect: 'none', chance: 0, desc: '🔪 Critical strike · 20 dmg' },
  { name: 'Smoke Bomb', type: 'Agility', mana: 0, dmg: 0, effect: 'dodge', chance: 1, desc: '💨 100% dodge next attack' },
  { name: 'Assassinate', type: 'Physical', mana: 24, dmg: 24, effect: 'none', chance: 0, desc: '💀 Ultimate strike · 24 dmg' },
  { name: 'Viper Bite', type: 'Physical', mana: 15, dmg: 15, effect: 'poison', chance: 0.5, desc: '🐍 Deals 15 dmg · 50% poison' },
  { name: 'Eviscerate', type: 'Physical', mana: 30, dmg: 30, effect: 'bleed', chance: 0.4, desc: '🥩 Deals 30 dmg · 40% bleed' },
  { name: 'Cloak of Shadows', type: 'Agility', mana: 0, dmg: 0, effect: 'stealth', chance: 1, desc: '👻 Cannot be targeted for 1 round' },
  { name: 'Blade Dance', type: 'Physical', mana: 22, dmg: 22, effect: 'multi_hit', chance: 4, desc: '💃 4 hits of 22 dmg each' },
  { name: 'Toxic Mist', type: 'Magic', mana: 5, dmg: 5, effect: 'poison_all', chance: 1, desc: '🌫️ Poisons all enemies' },

  // --- ARCHER / RANGED SKILLS ---
  { name: 'Arrow Shot', type: 'Physical', mana: 25, dmg: 25, effect: 'none', chance: 0, desc: '🏹 Standard shot · 25 dmg' },
  { name: 'Triple Shot', type: 'Physical', mana: 20, dmg: 20, effect: 'multi_hit', chance: 3, desc: '🏹 3 hits of 20 dmg each' },
  { name: 'Eagle Eye', type: 'Physical', mana: 35, dmg: 35, effect: 'crit_buff', chance: 1, desc: '🎯 +30% Crit for 2 rounds' },
  { name: 'Explosive Arrow', type: 'Physical', mana: 22, dmg: 22, effect: 'burn', chance: 0.3, desc: '💥 Deals 22 dmg · 30% burn' },
  { name: 'Rain of Arrows', type: 'Physical', mana: 32, dmg: 32, effect: 'none', chance: 0, desc: '🌧️ AoE barrage · 32 dmg' },
  { name: 'Piercing Shot', type: 'Physical', mana: 22, dmg: 22, effect: 'ignore_def', chance: 1, desc: '🏹 Ignores 50% of DEF' },
  { name: 'Venom Tip', type: 'Physical', mana: 25, dmg: 25, effect: 'poison', chance: 0.6, desc: '🏹 Poisoned arrow · 60% poison' },
  { name: 'Wind Walk', type: 'Agility', mana: 0, dmg: 0, effect: 'speed_buff', chance: 1, desc: '🌪️ SPD +20 for 2 rounds' },
  { name: 'Steady Aim', type: 'Physical', mana: 23, dmg: 23, effect: 'none', chance: 0, desc: '🏹 High accuracy · 23 dmg' },
  { name: 'Dragon Arrow', type: 'Physical', mana: 34, dmg: 34, effect: 'none', chance: 0, desc: '🐲 Ultimate arrow · 34 dmg' },

  // --- PALADIN / HOLY SKILLS ---
  { name: 'Holy Strike', type: 'Magic', mana: 28, dmg: 28, effect: 'silence', chance: 0.25, desc: '✨ Deals 28 dmg · 25% silence' },
  { name: 'Heal', type: 'Heal', mana: 6, dmg: -22, effect: 'none', chance: 0, desc: '💚 Restores 40 HP' },
  { name: 'Divine Shield', type: 'Shield', mana: 0, dmg: 0, effect: 'shield', chance: 1, desc: '🛡️ Blocks 0 dmg for 2 rounds' },
  { name: 'Judgment', type: 'Magic', mana: 22, dmg: 22, effect: 'none', chance: 0, desc: '⚖️ Holy hammer · 22 dmg' },
  { name: 'Guardian Angel', type: 'Shield', mana: 0, dmg: 0, effect: 'invulnerable', chance: 1, desc: '👼 Invulnerable for 1 round' },
  { name: 'Blessing', type: 'Heal', mana: 0, dmg: -30, effect: 'cleanse', chance: 1, desc: '💛 Restores 30 HP · Removes debuffs' },
  { name: 'Retribution', type: 'Physical', mana: 25, dmg: 25, effect: 'reflect', chance: 0.3, desc: '⚔️ Deals 25 dmg · 30% reflect' },
  { name: 'Consecration', type: 'Magic', mana: 20, dmg: 20, effect: 'burn', chance: 0.2, desc: '⛪ Holy ground · 20 dmg · 20% burn' },
  { name: 'Lay on Hands', type: 'Heal', mana: 0, dmg: -50, effect: 'none', chance: 0, desc: '🙌 Massive heal · 50 HP' },
  { name: 'Holy Light', type: 'Magic', mana: 35, dmg: 35, effect: 'blind', chance: 0.3, desc: '🌟 Deals 35 dmg · 30% blind' },
];

module.exports = { SKILLS };
