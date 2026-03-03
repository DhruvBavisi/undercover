// Predefined avatar options for users
// Predefined glowing styles for each avatar to give them a colored border and shadow
const glowingStyles = [
  "border-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]",
  "border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]",
  "border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]",
  "border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]",
  "border-2 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]",
  "border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]",
  "border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]",
  "border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]",
  "border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]",
  "border-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]",
  "border-2 border-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.6)]",
  "border-2 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.6)]",
  "border-2 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.6)]",
  "border-2 border-rose-400 shadow-[0_0_15px_rgba(251,113,133,0.6)]",
  "border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]",
  "border-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.6)]",
  "border-2 border-neutral-400 shadow-[0_0_15px_rgba(163,163,163,0.6)]",
  "border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]",
  "border-2 border-slate-400 shadow-[0_0_15px_rgba(148,163,184,0.6)]",
  "border-2 border-zinc-400 shadow-[0_0_15px_rgba(161,161,170,0.6)]"
];

export const avatarOptions = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Avatar ${i + 1}`,
  bgColor: glowingStyles[i],
  image: `/avatars/characters/character${i + 1}.png`
}));

// Function to get a random avatar
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * avatarOptions.length);
  return avatarOptions[randomIndex];
};

// Function to get avatar by ID
export const getAvatarById = (id) => {
  return avatarOptions.find(avatar => avatar.id === id) || avatarOptions[0];
}; 