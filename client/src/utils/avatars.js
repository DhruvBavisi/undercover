// Predefined avatar options for users
export const avatarOptions = [
  {
    id: 1,
    name: "Anime Girl",
    bgColor: "from-pink-400 to-rose-500",
    image: "/avatars/character1.png"
  },
  {
    id: 2,
    name: "Cool Boy",
    bgColor: "from-blue-400 to-indigo-500",
    image: "/avatars/character2.png"
  },
  {
    id: 3,
    name: "Cute Girl",
    bgColor: "from-red-400 to-pink-500",
    image: "/avatars/character3.png"
  },
  {
    id: 4,
    name: "Ninja Boy",
    bgColor: "from-blue-500 to-cyan-600",
    image: "/avatars/character4.png"
  },
  {
    id: 5,
    name: "Samurai",
    bgColor: "from-purple-400 to-violet-600",
    image: "/avatars/character5.png"
  },
  {
    id: 6,
    name: "School Girl",
    bgColor: "from-orange-400 to-red-500",
    image: "/avatars/character6.png"
  },
  {
    id: 7,
    name: "Warrior",
    bgColor: "from-yellow-400 to-amber-500",
    image: "/avatars/character7.png"
  },
  {
    id: 8,
    name: "Princess",
    bgColor: "from-cyan-400 to-blue-500",
    image: "/avatars/character8.png"
  },
  {
    id: 9,
    name: "Hero",
    bgColor: "from-emerald-400 to-green-600",
    image: "/avatars/character9.png"
  }
];

// Function to get a random avatar
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * avatarOptions.length);
  return avatarOptions[randomIndex];
};

// Function to get avatar by ID
export const getAvatarById = (id) => {
  return avatarOptions.find(avatar => avatar.id === id) || avatarOptions[0];
}; 