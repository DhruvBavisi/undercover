// Word packs for the game
// Each pack contains pairs of related words (civilian word, undercover word)

const wordPacks = {
  standard: [
    ['Cat', 'Dog'],
    ['Coffee', 'Tea'],
    ['Summer', 'Winter'],
    ['Beach', 'Mountain'],
    ['Movie', 'Theater'],
    ['Book', 'Magazine'],
    ['Car', 'Bicycle'],
    ['Piano', 'Guitar'],
    ['Apple', 'Orange'],
    ['Pen', 'Pencil'],
    ['Shirt', 'Pants'],
    ['Sun', 'Moon'],
    ['River', 'Lake'],
    ['Breakfast', 'Dinner'],
    ['Train', 'Bus'],
    ['Laptop', 'Desktop'],
    ['Soccer', 'Football'],
    ['Painting', 'Drawing'],
    ['Hotel', 'Motel'],
    ['Chair', 'Sofa'],
    ['Doctor', 'Nurse'],
    ['King', 'Queen'],
    ['Apartment', 'House'],
    ['Ocean', 'Sea'],
    ['Cake', 'Pie'],
    ['Sneakers', 'Sandals'],
    ['Hammer', 'Screwdriver'],
    ['Potato', 'Tomato'],
    ['Butter', 'Margarine'],
    ['Shower', 'Bath']
  ],
  
  food: [
    ['Pizza', 'Pasta'],
    ['Burger', 'Sandwich'],
    ['Chocolate', 'Vanilla'],
    ['Steak', 'Chicken'],
    ['Sushi', 'Sashimi'],
    ['Taco', 'Burrito'],
    ['Soup', 'Stew'],
    ['Fries', 'Chips'],
    ['Salad', 'Coleslaw'],
    ['Pancake', 'Waffle'],
    ['Cupcake', 'Muffin'],
    ['Rice', 'Noodles'],
    ['Bread', 'Bagel'],
    ['Donut', 'Croissant'],
    ['Bacon', 'Ham']
  ],
  
  places: [
    ['Airport', 'Station'],
    ['Library', 'Bookstore'],
    ['Park', 'Garden'],
    ['School', 'College'],
    ['Hospital', 'Clinic'],
    ['Restaurant', 'Cafe'],
    ['Mall', 'Market'],
    ['Museum', 'Gallery'],
    ['Office', 'Workspace'],
    ['Theater', 'Cinema'],
    ['Stadium', 'Arena'],
    ['Beach', 'Shore'],
    ['Hotel', 'Resort'],
    ['Church', 'Temple'],
    ['Gym', 'Fitness Center']
  ]
};

// Get a random word pair from a specific pack
export const getRandomWordPair = (packName = 'standard') => {
  const pack = wordPacks[packName] || wordPacks.standard;
  const randomIndex = Math.floor(Math.random() * pack.length);
  return pack[randomIndex];
};

// Get all available pack names
export const getWordPackNames = () => {
  return Object.keys(wordPacks);
};

export { wordPacks }; 