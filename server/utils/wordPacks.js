// Word packs for the game
// Each pack contains pairs of related words (civilian word, undercover word)

import { Game } from '../src/game.js'; // Updated import path for Game model

const wordPacks = {
  standard: [
    ['Cat', 'Dog'],
    ['Sun', 'Moon'],
    ['Hot', 'Cold'],
    ['Day', 'Night'],
    ['Big', 'Small'],
    ['Fast', 'Slow'],
    ['Hard', 'Soft'],
    ['High', 'Low'],
    ['Rich', 'Poor'],
    ['Happy', 'Sad'],
    ['Love', 'Hate'],
    ['War', 'Peace'],
    ['Life', 'Death'],
    ['East', 'West'],
    ['North', 'South'],
    ['Push', 'Pull'],
    ['Buy', 'Sell'],
    ['Give', 'Take'],
    ['Win', 'Lose'],
    ['Laugh', 'Cry'],
    ['Start', 'Stop'],
    ['Front', 'Back'],
    ['Top', 'Bottom'],
    ['Left', 'Right'],
    ['Up', 'Down'],
    ['In', 'Out'],
    ['Full', 'Empty'],
    ['Dark', 'Light'],
    ['Wet', 'Dry'],
    ['Old', 'New']
  ],
  
  actions: [
    ['Work', 'Play'],
    ['Walk', 'Run'],
    ['Float', 'Sink'],
    ['Rise', 'Fall'],
    ['Pass', 'Fail'],
    ['Lead', 'Follow'],
    ['Teach', 'Learn'],
    ['Save', 'Spend'],
    ['Help', 'Harm'],
    ['Smile', 'Frown'],
    ['Build', 'Break'],
    ['Grow', 'Shrink'],
    ['Add', 'Subtract'],
    ['Join', 'Split'],
    ['Catch', 'Throw'],
    ['Hide', 'Seek'],
    ['Fly', 'Crawl'],
    ['Swim', 'Dive'],
    ['Jump', 'Fall'],
    ['Climb', 'Descend'],
    ['Speak', 'Listen'],
    ['Ask', 'Tell'],
    ['Read', 'Write'],
    ['Sing', 'Hum'],
    ['Dance', 'March'],
    ['Cook', 'Bake'],
    ['Eat', 'Drink'],
    ['Cut', 'Paste'],
    ['Fold', 'Unfold'],
    ['Lock', 'Unlock']
  ],
  
  objects: [
    ['Book', 'Magazine'],
    ['Map', 'Chart'],
    ['Phone', 'Radio'],
    ['Chair', 'Stool'],
    ['Table', 'Desk'],
    ['Bed', 'Couch'],
    ['Lamp', 'Light'],
    ['Door', 'Gate'],
    ['Wall', 'Fence'],
    ['Floor', 'Ceiling'],
    ['Road', 'Path'],
    ['Bridge', 'Tunnel'],
    ['Car', 'Truck'],
    ['Bike', 'Scooter'],
    ['Boat', 'Ship'],
    ['Plane', 'Jet'],
    ['Train', 'Tram'],
    ['Tree', 'Bush'],
    ['Flower', 'Weed'],
    ['Leaf', 'Stem'],
    ['Fruit', 'Seed'],
    ['Apple', 'Pear'],
    ['Bread', 'Rice'],
    ['Soup', 'Stew'],
    ['Milk', 'Juice'],
    ['Tea', 'Coffee'],
    ['Water', 'Soda'],
    ['Salt', 'Sugar'],
    ['Plate', 'Bowl'],
    ['Cup', 'Mug']
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