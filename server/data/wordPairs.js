<<<<<<< HEAD
// 200 unique word pairs for the Undercover game - simple single words
const wordPairs = [
  { civilian: 'Cat', undercover: 'Dog', category: 'animals' },
  { civilian: 'Sun', undercover: 'Moon', category: 'sky' },
  { civilian: 'Hot', undercover: 'Cold', category: 'temperature' },
  { civilian: 'Day', undercover: 'Night', category: 'time' },
  { civilian: 'Big', undercover: 'Small', category: 'size' },
  { civilian: 'Fast', undercover: 'Slow', category: 'speed' },
  { civilian: 'Hard', undercover: 'Soft', category: 'texture' },
  { civilian: 'High', undercover: 'Low', category: 'position' },
  { civilian: 'Rich', undercover: 'Poor', category: 'wealth' },
  { civilian: 'Happy', undercover: 'Sad', category: 'emotion' },
  { civilian: 'Love', undercover: 'Hate', category: 'feeling' },
  { civilian: 'War', undercover: 'Peace', category: 'state' },
  { civilian: 'Life', undercover: 'Death', category: 'existence' },
  { civilian: 'East', undercover: 'West', category: 'direction' },
  { civilian: 'North', undercover: 'South', category: 'direction' },
  { civilian: 'Push', undercover: 'Pull', category: 'action' },
  { civilian: 'Buy', undercover: 'Sell', category: 'transaction' },
  { civilian: 'Give', undercover: 'Take', category: 'action' },
  { civilian: 'Win', undercover: 'Lose', category: 'outcome' },
  { civilian: 'Laugh', undercover: 'Cry', category: 'expression' },
  { civilian: 'Start', undercover: 'Stop', category: 'action' },
  { civilian: 'Front', undercover: 'Back', category: 'position' },
  { civilian: 'Top', undercover: 'Bottom', category: 'position' },
  { civilian: 'Left', undercover: 'Right', category: 'direction' },
  { civilian: 'Up', undercover: 'Down', category: 'direction' },
  { civilian: 'In', undercover: 'Out', category: 'position' },
  { civilian: 'Full', undercover: 'Empty', category: 'state' },
  { civilian: 'Dark', undercover: 'Light', category: 'brightness' },
  { civilian: 'Wet', undercover: 'Dry', category: 'state' },
  { civilian: 'Old', undercover: 'New', category: 'age' },
  { civilian: 'Good', undercover: 'Bad', category: 'quality' },
  { civilian: 'Sweet', undercover: 'Sour', category: 'taste' },
  { civilian: 'Clean', undercover: 'Dirty', category: 'condition' },
  { civilian: 'Loud', undercover: 'Quiet', category: 'sound' },
  { civilian: 'Rough', undercover: 'Smooth', category: 'texture' },
  { civilian: 'Sharp', undercover: 'Dull', category: 'edge' },
  { civilian: 'Thick', undercover: 'Thin', category: 'dimension' },
  { civilian: 'Wide', undercover: 'Narrow', category: 'dimension' },
  { civilian: 'Deep', undercover: 'Shallow', category: 'depth' },
  { civilian: 'Long', undercover: 'Short', category: 'length' },
  { civilian: 'Tall', undercover: 'Short', category: 'height' },
  { civilian: 'Far', undercover: 'Near', category: 'distance' },
  { civilian: 'Early', undercover: 'Late', category: 'time' },
  { civilian: 'First', undercover: 'Last', category: 'order' },
  { civilian: 'Open', undercover: 'Shut', category: 'state' },
  { civilian: 'Weak', undercover: 'Strong', category: 'strength' },
  { civilian: 'Young', undercover: 'Old', category: 'age' },
  { civilian: 'Brave', undercover: 'Scared', category: 'trait' },
  { civilian: 'Calm', undercover: 'Angry', category: 'emotion' },
  { civilian: 'Wise', undercover: 'Dumb', category: 'intelligence' },
  { civilian: 'Sick', undercover: 'Well', category: 'health' },
  { civilian: 'Sane', undercover: 'Crazy', category: 'mental' },
  { civilian: 'Awake', undercover: 'Asleep', category: 'state' },
  { civilian: 'Alive', undercover: 'Dead', category: 'state' },
  { civilian: 'Safe', undercover: 'Risk', category: 'security' },
  { civilian: 'True', undercover: 'False', category: 'validity' },
  { civilian: 'Yes', undercover: 'No', category: 'answer' },
  { civilian: 'Come', undercover: 'Go', category: 'movement' },
  { civilian: 'Sit', undercover: 'Stand', category: 'posture' },
  { civilian: 'Work', undercover: 'Play', category: 'activity' },
  { civilian: 'Walk', undercover: 'Run', category: 'movement' },
  { civilian: 'Float', undercover: 'Sink', category: 'physics' },
  { civilian: 'Rise', undercover: 'Fall', category: 'movement' },
  { civilian: 'Pass', undercover: 'Fail', category: 'outcome' },
  { civilian: 'Lead', undercover: 'Follow', category: 'role' },
  { civilian: 'Teach', undercover: 'Learn', category: 'education' },
  { civilian: 'Save', undercover: 'Spend', category: 'money' },
  { civilian: 'Bless', undercover: 'Curse', category: 'wish' },
  { civilian: 'Help', undercover: 'Harm', category: 'action' },
  { civilian: 'Smile', undercover: 'Frown', category: 'expression' },
  { civilian: 'Build', undercover: 'Break', category: 'action' },
  { civilian: 'Bend', undercover: 'Snap', category: 'action' },
  { civilian: 'Grow', undercover: 'Shrink', category: 'change' },
  { civilian: 'Add', undercover: 'Subtract', category: 'math' },
  { civilian: 'Join', undercover: 'Split', category: 'action' },
  { civilian: 'Tie', undercover: 'Loose', category: 'state' },
  { civilian: 'Catch', undercover: 'Throw', category: 'action' },
  { civilian: 'Hide', undercover: 'Seek', category: 'action' },
  { civilian: 'Fly', undercover: 'Crawl', category: 'movement' },
  { civilian: 'Swim', undercover: 'Dive', category: 'water' },
  { civilian: 'Jump', undercover: 'Fall', category: 'movement' },
  { civilian: 'Climb', undercover: 'Descend', category: 'movement' },
  { civilian: 'Speak', undercover: 'Listen', category: 'communication' },
  { civilian: 'Ask', undercover: 'Tell', category: 'communication' },
  { civilian: 'Read', undercover: 'Write', category: 'literacy' },
  { civilian: 'Sing', undercover: 'Hum', category: 'music' },
  { civilian: 'Dance', undercover: 'March', category: 'movement' },
  { civilian: 'Cook', undercover: 'Bake', category: 'food' },
  { civilian: 'Eat', undercover: 'Drink', category: 'consumption' },
  { civilian: 'Cut', undercover: 'Paste', category: 'action' },
  { civilian: 'Fold', undercover: 'Unfold', category: 'action' },
  { civilian: 'Tie', undercover: 'Untie', category: 'action' },
  { civilian: 'Lock', undercover: 'Unlock', category: 'security' },
  { civilian: 'Plant', undercover: 'Harvest', category: 'agriculture' },
  { civilian: 'Sow', undercover: 'Reap', category: 'agriculture' },
  { civilian: 'Melt', undercover: 'Freeze', category: 'state' },
  { civilian: 'Boil', undercover: 'Chill', category: 'temperature' },
  { civilian: 'Burn', undercover: 'Cool', category: 'temperature' },
  { civilian: 'Bake', undercover: 'Fry', category: 'cooking' },
  { civilian: 'Wash', undercover: 'Dry', category: 'cleaning' },
  { civilian: 'Fill', undercover: 'Drain', category: 'action' },
  { civilian: 'Lift', undercover: 'Drop', category: 'movement' },
  { civilian: 'Blow', undercover: 'Suck', category: 'air' },
  { civilian: 'Twist', undercover: 'Turn', category: 'movement' },
  { civilian: 'Spin', undercover: 'Roll', category: 'movement' },
  { civilian: 'Slide', undercover: 'Stick', category: 'movement' },
  { civilian: 'Slip', undercover: 'Grip', category: 'traction' },
  { civilian: 'Bounce', undercover: 'Crash', category: 'movement' },
  { civilian: 'Crack', undercover: 'Shatter', category: 'damage' },
  { civilian: 'Drip', undercover: 'Pour', category: 'liquid' },
  { civilian: 'Spray', undercover: 'Splash', category: 'liquid' },
  { civilian: 'Stir', undercover: 'Shake', category: 'movement' },
  { civilian: 'Mix', undercover: 'Blend', category: 'combination' },
  { civilian: 'Chop', undercover: 'Slice', category: 'cutting' },
  { civilian: 'Grind', undercover: 'Crush', category: 'destruction' },
  { civilian: 'Peel', undercover: 'Skin', category: 'preparation' },
  { civilian: 'Rip', undercover: 'Tear', category: 'damage' },
  { civilian: 'Glue', undercover: 'Tape', category: 'adhesion' },
  { civilian: 'Nail', undercover: 'Screw', category: 'fastener' },
  { civilian: 'Drill', undercover: 'Bore', category: 'tool' },
  { civilian: 'Saw', undercover: 'Axe', category: 'tool' },
  { civilian: 'Hammer', undercover: 'Mallet', category: 'tool' },
  { civilian: 'Brush', undercover: 'Comb', category: 'grooming' },
  { civilian: 'Soap', undercover: 'Shampoo', category: 'cleaning' },
  { civilian: 'Towel', undercover: 'Cloth', category: 'fabric' },
  { civilian: 'Shirt', undercover: 'Pants', category: 'clothing' },
  { civilian: 'Sock', undercover: 'Shoe', category: 'clothing' },
  { civilian: 'Hat', undercover: 'Cap', category: 'clothing' },
  { civilian: 'Coat', undercover: 'Vest', category: 'clothing' },
  { civilian: 'Ring', undercover: 'Bracelet', category: 'jewelry' },
  { civilian: 'Watch', undercover: 'Clock', category: 'time' },
  { civilian: 'Pen', undercover: 'Pencil', category: 'writing' },
  { civilian: 'Book', undercover: 'Magazine', category: 'reading' },
  { civilian: 'Map', undercover: 'Chart', category: 'navigation' },
  { civilian: 'Phone', undercover: 'Radio', category: 'communication' },
  { civilian: 'Chair', undercover: 'Stool', category: 'furniture' },
  { civilian: 'Table', undercover: 'Desk', category: 'furniture' },
  { civilian: 'Bed', undercover: 'Couch', category: 'furniture' },
  { civilian: 'Lamp', undercover: 'Light', category: 'lighting' },
  { civilian: 'Fan', undercover: 'Vent', category: 'air' },
  { civilian: 'Door', undercover: 'Gate', category: 'entrance' },
  { civilian: 'Wall', undercover: 'Fence', category: 'barrier' },
  { civilian: 'Floor', undercover: 'Ceiling', category: 'structure' },
  { civilian: 'Roof', undercover: 'Attic', category: 'building' },
  { civilian: 'Stairs', undercover: 'Ramp', category: 'access' },
  { civilian: 'Road', undercover: 'Path', category: 'route' },
  { civilian: 'Bridge', undercover: 'Tunnel', category: 'passage' },
  { civilian: 'Car', undercover: 'Truck', category: 'vehicle' },
  { civilian: 'Bike', undercover: 'Scooter', category: 'vehicle' },
  { civilian: 'Boat', undercover: 'Ship', category: 'vessel' },
  { civilian: 'Plane', undercover: 'Jet', category: 'aircraft' },
  { civilian: 'Train', undercover: 'Tram', category: 'transport' },
  { civilian: 'Bus', undercover: 'Van', category: 'vehicle' },
  { civilian: 'Tree', undercover: 'Bush', category: 'plant' },
  { civilian: 'Grass', undercover: 'Moss', category: 'plant' },
  { civilian: 'Flower', undercover: 'Weed', category: 'plant' },
  { civilian: 'Leaf', undercover: 'Stem', category: 'plant' },
  { civilian: 'Fruit', undercover: 'Seed', category: 'plant' },
  { civilian: 'Apple', undercover: 'Pear', category: 'fruit' },
  { civilian: 'Grape', undercover: 'Berry', category: 'fruit' },
  { civilian: 'Meat', undercover: 'Fish', category: 'food' },
  { civilian: 'Bread', undercover: 'Rice', category: 'food' },
  { civilian: 'Soup', undercover: 'Stew', category: 'food' },
  { civilian: 'Milk', undercover: 'Juice', category: 'drink' },
  { civilian: 'Tea', undercover: 'Coffee', category: 'drink' },
  { civilian: 'Water', undercover: 'Soda', category: 'drink' },
  { civilian: 'Salt', undercover: 'Sugar', category: 'seasoning' },
  { civilian: 'Plate', undercover: 'Bowl', category: 'dish' },
  { civilian: 'Cup', undercover: 'Mug', category: 'container' },
  { civilian: 'Fork', undercover: 'Spoon', category: 'utensil' },
  { civilian: 'Knife', undercover: 'Blade', category: 'tool' },
  { civilian: 'Pot', undercover: 'Pan', category: 'cookware' },
  { civilian: 'Oven', undercover: 'Stove', category: 'appliance' },
  { civilian: 'Fridge', undercover: 'Freezer', category: 'appliance' },
  { civilian: 'Sink', undercover: 'Tub', category: 'plumbing' },
  { civilian: 'Shower', undercover: 'Bath', category: 'bathroom' },
  { civilian: 'Soap', undercover: 'Lotion', category: 'hygiene' },
  { civilian: 'Brush', undercover: 'Sponge', category: 'cleaning' },
  { civilian: 'Trash', undercover: 'Waste', category: 'garbage' },
  { civilian: 'Bag', undercover: 'Sack', category: 'container' },
  { civilian: 'Box', undercover: 'Crate', category: 'container' },
  { civilian: 'Jar', undercover: 'Can', category: 'container' },
  { civilian: 'Rope', undercover: 'Chain', category: 'fastener' },
  { civilian: 'Wire', undercover: 'Cable', category: 'connector' },
  { civilian: 'Tape', undercover: 'Glue', category: 'adhesive' },
  { civilian: 'Pin', undercover: 'Clip', category: 'fastener' },
  { civilian: 'Hook', undercover: 'Loop', category: 'fastener' },
  { civilian: 'Key', undercover: 'Lock', category: 'security' },
  { civilian: 'Coin', undercover: 'Bill', category: 'money' },
  { civilian: 'Card', undercover: 'Pass', category: 'identification' },
  { civilian: 'Ball', undercover: 'Disc', category: 'toy' },
  { civilian: 'Doll', undercover: 'Toy', category: 'plaything' },
  { civilian: 'Game', undercover: 'Sport', category: 'activity' },
  { civilian: 'Song', undercover: 'Tune', category: 'music' },
  { civilian: 'Film', undercover: 'Show', category: 'entertainment' },
  { civilian: 'Art', undercover: 'Craft', category: 'creation' },
  { civilian: 'Paint', undercover: 'Draw', category: 'art' },
  { civilian: 'Photo', undercover: 'Image', category: 'picture' }
=======
const wordPairs = [
  // General
  { civilian: 'Sun', undercover: 'Moon', category: 'General' },
  { civilian: 'Chair', undercover: 'Table', category: 'General' },
  { civilian: 'Car', undercover: 'Bike', category: 'General' },
  { civilian: 'Pen', undercover: 'Pencil', category: 'General' },
  { civilian: 'Clock', undercover: 'Watch', category: 'General' },
  { civilian: 'Hand', undercover: 'Foot', category: 'General' },
  { civilian: 'Window', undercover: 'Door', category: 'General' },
  { civilian: 'School', undercover: 'College', category: 'General' },
  { civilian: 'Rain', undercover: 'Snow', category: 'General' },
  { civilian: 'Street', undercover: 'Road', category: 'General' },
  { civilian: 'Tree', undercover: 'Plant', category: 'General' },
  { civilian: 'House', undercover: 'Apartment', category: 'General' },
  { civilian: 'Shoe', undercover: 'Sandal', category: 'General' },
  { civilian: 'Key', undercover: 'Lock', category: 'General' },
  { civilian: 'Bus', undercover: 'Train', category: 'General' },
  { civilian: 'Bed', undercover: 'Sofa', category: 'General' },
  { civilian: 'Hat', undercover: 'Cap', category: 'General' },
  { civilian: 'Cloud', undercover: 'Fog', category: 'General' },
  { civilian: 'Battery', undercover: 'Charger', category: 'General' },
  { civilian: 'Ladder', undercover: 'Stairs', category: 'General' },

  // Animals
  { civilian: 'Cat', undercover: 'Dog', category: 'Animals' },
  { civilian: 'Lion', undercover: 'Tiger', category: 'Animals' },
  { civilian: 'Fish', undercover: 'Shark', category: 'Animals' },
  { civilian: 'Cow', undercover: 'Buffalo', category: 'Animals' },
  { civilian: 'Sheep', undercover: 'Goat', category: 'Animals' },
  { civilian: 'Frog', undercover: 'Toad', category: 'Animals' },
  { civilian: 'Dolphin', undercover: 'Whale', category: 'Animals' },
  { civilian: 'Butterfly', undercover: 'Moth', category: 'Animals' },
  { civilian: 'Eagle', undercover: 'Hawk', category: 'Animals' },
  { civilian: 'Horse', undercover: 'Donkey', category: 'Animals' },
  { civilian: 'Parrot', undercover: 'Pigeon', category: 'Animals' },
  { civilian: 'Ant', undercover: 'Bee', category: 'Animals' },
  { civilian: 'Cheetah', undercover: 'Leopard', category: 'Animals' },
  { civilian: 'Deer', undercover: 'Moose', category: 'Animals' },
  { civilian: 'Wolf', undercover: 'Fox', category: 'Animals' },
  { civilian: 'Rabbit', undercover: 'Squirrel', category: 'Animals' },
  { civilian: 'Crocodile', undercover: 'Alligator', category: 'Animals' },
  { civilian: 'Peacock', undercover: 'Ostrich', category: 'Animals' },
  { civilian: 'Octopus', undercover: 'Squid', category: 'Animals' },
  { civilian: 'Penguin', undercover: 'Seal', category: 'Animals' },

  // Movies
  { civilian: 'Avengers', undercover: 'Justice League', category: 'Movies' },
  { civilian: 'Batman', undercover: 'Superman', category: 'Movies' },
  { civilian: 'Titanic', undercover: 'Avatar', category: 'Movies' },
  { civilian: 'Harry Potter', undercover: 'Lord of the Rings', category: 'Movies' },
  { civilian: 'Spider-Man', undercover: 'Iron Man', category: 'Movies' },
  { civilian: 'Frozen', undercover: 'Moana', category: 'Movies' },
  { civilian: 'Inception', undercover: 'Interstellar', category: 'Movies' },
  { civilian: 'Toy Story', undercover: 'Finding Nemo', category: 'Movies' },
  { civilian: 'Jaws', undercover: 'Godzilla', category: 'Movies' },
  { civilian: 'Fast & Furious', undercover: 'Need for Speed', category: 'Movies' },
  { civilian: 'Star Wars', undercover: 'Star Trek', category: 'Movies' },
  { civilian: 'The Matrix', undercover: 'Blade Runner', category: 'Movies' },
  { civilian: 'Deadpool', undercover: 'Wolverine', category: 'Movies' },
  { civilian: 'The Dark Knight', undercover: 'Joker', category: 'Movies' },
  { civilian: 'The Lion King', undercover: 'Madagascar', category: 'Movies' },
  { civilian: 'Cinderella', undercover: 'Snow White', category: 'Movies' },
  { civilian: 'The Godfather', undercover: 'Scarface', category: 'Movies' },
  { civilian: 'Black Panther', undercover: 'Aquaman', category: 'Movies' },
  { civilian: 'The Conjuring', undercover: 'Insidious', category: 'Movies' },
  { civilian: 'Shrek', undercover: 'Kung Fu Panda', category: 'Movies' },

  // Food
  { civilian: 'Pizza', undercover: 'Burger', category: 'Food' },
  { civilian: 'Pasta', undercover: 'Noodles', category: 'Food' },
  { civilian: 'Rice', undercover: 'Bread', category: 'Food' },
  { civilian: 'Milk', undercover: 'Juice', category: 'Food' },
  { civilian: 'Apple', undercover: 'Banana', category: 'Food' },
  { civilian: 'Chocolate', undercover: 'Candy', category: 'Food' },
  { civilian: 'Salt', undercover: 'Sugar', category: 'Food' },
  { civilian: 'Butter', undercover: 'Cheese', category: 'Food' },
  { civilian: 'Tea', undercover: 'Coffee', category: 'Food' },
  { civilian: 'Strawberry', undercover: 'Blueberry', category: 'Food' },
  { civilian: 'Orange', undercover: 'Mango', category: 'Food' },
  { civilian: 'Egg', undercover: 'Omelet', category: 'Food' },
  { civilian: 'Honey', undercover: 'Syrup', category: 'Food' },
  { civilian: 'Coconut', undercover: 'Almond', category: 'Food' },
  { civilian: 'Ice Cream', undercover: 'Cake', category: 'Food' },
  { civilian: 'Tomato', undercover: 'Potato', category: 'Food' },
  { civilian: 'Carrot', undercover: 'Beetroot', category: 'Food' },
  { civilian: 'Spinach', undercover: 'Cabbage', category: 'Food' },
  { civilian: 'Corn', undercover: 'Wheat', category: 'Food' },
  { civilian: 'Lemon', undercover: 'Lime', category: 'Food' },

  // Technology
  { civilian: 'Laptop', undercover: 'Tablet', category: 'Technology' },
  { civilian: 'Phone', undercover: 'Smartwatch', category: 'Technology' },
  { civilian: 'Keyboard', undercover: 'Mouse', category: 'Technology' },
  { civilian: 'TV', undercover: 'Projector', category: 'Technology' },
  { civilian: 'WiFi', undercover: 'Bluetooth', category: 'Technology' },
  { civilian: 'Charger', undercover: 'Battery', category: 'Technology' },
  { civilian: 'Drone', undercover: 'Helicopter', category: 'Technology' },
  { civilian: 'USB', undercover: 'Hard Drive', category: 'Technology' },
  { civilian: 'Camera', undercover: 'Camcorder', category: 'Technology' },
  { civilian: 'Robot', undercover: 'AI', category: 'Technology' }
>>>>>>> acee4249aaca93903e8f897da575f14caed84efd
];

export default wordPairs;
