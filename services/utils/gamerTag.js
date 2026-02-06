// Gamer tag generator for onboarding
const adjectives = [
  'Neon', 'Crimson', 'Phantom', 'Galactic', 'Cyber', 'Shadow', 'Mythic', 'Arcane', 'Quantum', 'Solar'
];
const archetypes = [
  'Rogue', 'Ranger', 'Viper', 'Nova', 'Falcon', 'Specter', 'Titan', 'Samurai', 'Glitch', 'Rider'
];
const finishers = [
  'Prime', 'Eclipse', 'Strike', 'Pulse', 'Forge', 'Blaze', 'Shift', 'Storm', 'Flux', 'Drift'
];
const connectors = ['_', '-', ''];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomDigits(length = 3) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateGamerTag() {
  const prefix = pick(adjectives) + pick(archetypes);
  const suffix = pick(finishers);
  const connector = pick(connectors);
  return `${prefix}${suffix}${connector}${randomDigits(3)}`;
}

module.exports = { generateGamerTag };
