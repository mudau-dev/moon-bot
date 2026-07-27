function checkCooldown(lastUsed, cooldownMs) {
  if (!lastUsed) return { onCooldown: false, remaining: 0 };
  const elapsed = Date.now() - new Date(lastUsed).getTime();
  if (elapsed < cooldownMs) return { onCooldown: true, remaining: cooldownMs - elapsed };
  return { onCooldown: false, remaining: 0 };
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

module.exports = { checkCooldown, formatTime };
