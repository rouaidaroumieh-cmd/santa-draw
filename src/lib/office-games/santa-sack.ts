export type SackDifficulty = "easy" | "medium" | "hard";

export type SackQuestion = {
  id: string;
  objectLabel: string;
  /** Large emoji “silhouette” stand-in until real art is added */
  emoji: string;
  options: string[];
  answer: number;
  difficulty: SackDifficulty;
  hint: string;
  /** Points without / with hint */
  pointsFull: number;
  pointsHint: number;
};

type SackItem = Omit<SackQuestion, "answer"> & { answerLabel: string };

/** Big festive pool — each round draws a random subset. */
const SANTA_SACK_POOL: SackItem[] = [
  {
    id: "candy-cane",
    objectLabel: "Candy Cane",
    emoji: "🍭",
    answerLabel: "Candy Cane",
    options: ["Candy Cane", "Lollipop", "Candy Corn"],
    difficulty: "easy",
    hint: "Striped and minty.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "bell",
    objectLabel: "Christmas Bell",
    emoji: "🔔",
    answerLabel: "Christmas Bell",
    options: ["Christmas Bell", "Cowbell", "Door knocker"],
    difficulty: "easy",
    hint: "It jingles when you shake it.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "tree",
    objectLabel: "Christmas Tree",
    emoji: "🎄",
    answerLabel: "Christmas Tree",
    options: ["Wreath", "Christmas Tree", "Pine cone"],
    difficulty: "easy",
    hint: "Evergreen and dressed for December.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "gift",
    objectLabel: "Wrapped Gift",
    emoji: "🎁",
    answerLabel: "Wrapped Gift",
    options: ["Wrapped Gift", "Shopping bag", "Parcel"],
    difficulty: "easy",
    hint: "Bow on top, mystery inside.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "santa",
    objectLabel: "Santa Claus",
    emoji: "🎅",
    answerLabel: "Santa Claus",
    options: ["Santa Claus", "Elf", "Snowman"],
    difficulty: "easy",
    hint: "Red suit, white beard, big list.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "snowman",
    objectLabel: "Snowman",
    emoji: "⛄",
    answerLabel: "Snowman",
    options: ["Snowman", "Ice sculpture", "Marshmallow"],
    difficulty: "easy",
    hint: "Three scoops of snow and a carrot nose.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "cookie",
    objectLabel: "Gingerbread Cookie",
    emoji: "🍪",
    answerLabel: "Gingerbread Cookie",
    options: ["Shortbread", "Gingerbread Cookie", "Macaron"],
    difficulty: "medium",
    hint: "Spiced biscuit, often shaped like a person.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "star",
    objectLabel: "Christmas Star",
    emoji: "⭐",
    answerLabel: "Christmas Star",
    options: ["Snowflake", "Christmas Star", "Sun"],
    difficulty: "medium",
    hint: "Usually sits on top of the tree.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "stocking",
    objectLabel: "Christmas Stocking",
    emoji: "🧦",
    answerLabel: "Christmas Stocking",
    options: ["Christmas Stocking", "Mittens", "Scarf"],
    difficulty: "hard",
    hint: "Hung by the chimney with care.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "reindeer",
    objectLabel: "Reindeer",
    emoji: "🦌",
    answerLabel: "Reindeer",
    options: ["Teddy bear", "Reindeer", "Penguin"],
    difficulty: "hard",
    hint: "Antlers optional, cuteness mandatory.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "holly",
    objectLabel: "Holly",
    emoji: "🌿",
    answerLabel: "Holly",
    options: ["Mistletoe", "Holly", "Ivy"],
    difficulty: "medium",
    hint: "Sharp leaves, bright red berries.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "wreath",
    objectLabel: "Wreath",
    emoji: "⭕",
    answerLabel: "Wreath",
    options: ["Wreath", "Garland", "Door hanger"],
    difficulty: "medium",
    hint: "A circle of greenery for the front door.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "candle",
    objectLabel: "Candle",
    emoji: "🕯️",
    answerLabel: "Candle",
    options: ["Candle", "Lantern", "Torch"],
    difficulty: "easy",
    hint: "Warm glow on the windowsill.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "snowflake",
    objectLabel: "Snowflake",
    emoji: "❄️",
    answerLabel: "Snowflake",
    options: ["Snowflake", "Ice crystal", "Diamond"],
    difficulty: "easy",
    hint: "No two alike — or so they say.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "hot-chocolate",
    objectLabel: "Hot Chocolate",
    emoji: "☕",
    answerLabel: "Hot Chocolate",
    options: ["Coffee", "Hot Chocolate", "Mulled wine"],
    difficulty: "medium",
    hint: "Best with marshmallows on top.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "ornament",
    objectLabel: "Glass Ornament",
    emoji: "🔮",
    answerLabel: "Glass Ornament",
    options: ["Glass Ornament", "Crystal ball", "Bauble jar"],
    difficulty: "hard",
    hint: "Shiny sphere hanging from a branch.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "angel",
    objectLabel: "Christmas Angel",
    emoji: "👼",
    answerLabel: "Christmas Angel",
    options: ["Fairy", "Christmas Angel", "Cherub statue"],
    difficulty: "medium",
    hint: "Often perched at the top of the tree.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "elf",
    objectLabel: "Christmas Elf",
    emoji: "🧝",
    answerLabel: "Christmas Elf",
    options: ["Gnome", "Christmas Elf", "Leprechaun"],
    difficulty: "medium",
    hint: "Santa’s workshop helper.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "mitten",
    objectLabel: "Mittens",
    emoji: "🧤",
    answerLabel: "Mittens",
    options: ["Gloves", "Mittens", "Socks"],
    difficulty: "hard",
    hint: "Warm hands, one big pocket for fingers.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "scarf",
    objectLabel: "Winter Scarf",
    emoji: "🧣",
    answerLabel: "Winter Scarf",
    options: ["Winter Scarf", "Tie", "Belt"],
    difficulty: "medium",
    hint: "Wrapped around necks on frosty mornings.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "nutcracker",
    objectLabel: "Nutcracker",
    emoji: "🪖",
    answerLabel: "Nutcracker",
    options: ["Toy soldier", "Nutcracker", "Guard figurine"],
    difficulty: "hard",
    hint: "Ballet star that cracks nuts with its mouth.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "sleigh",
    objectLabel: "Sleigh",
    emoji: "🛷",
    answerLabel: "Sleigh",
    options: ["Sleigh", "Toboggan", "Carriage"],
    difficulty: "medium",
    hint: "Santa’s preferred night transport.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "fireplace",
    objectLabel: "Fireplace",
    emoji: "🔥",
    answerLabel: "Fireplace",
    options: ["Campfire", "Fireplace", "Candle"],
    difficulty: "hard",
    hint: "Stockings hang above it.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "cookie-plate",
    objectLabel: "Plate of Cookies",
    emoji: "🍽️",
    answerLabel: "Plate of Cookies",
    options: ["Dinner plate", "Plate of Cookies", "Cheese board"],
    difficulty: "hard",
    hint: "Left out for a midnight visitor.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "milk",
    objectLabel: "Glass of Milk",
    emoji: "🥛",
    answerLabel: "Glass of Milk",
    options: ["Glass of Milk", "Eggnog", "Water"],
    difficulty: "medium",
    hint: "Classic pairing with cookies for Santa.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "gingerbread-house",
    objectLabel: "Gingerbread House",
    emoji: "🏠",
    answerLabel: "Gingerbread House",
    options: ["Dollhouse", "Gingerbread House", "Cabin"],
    difficulty: "hard",
    hint: "Edible walls, icing snow on the roof.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "advent-calendar",
    objectLabel: "Advent Calendar",
    emoji: "📅",
    answerLabel: "Advent Calendar",
    options: ["Advent Calendar", "Planner", "Wall calendar"],
    difficulty: "medium",
    hint: "Open one little door a day until Christmas.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "christmas-card",
    objectLabel: "Christmas Card",
    emoji: "✉️",
    answerLabel: "Christmas Card",
    options: ["Letter", "Christmas Card", "Postcard"],
    difficulty: "medium",
    hint: "Season’s greetings on paper.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "tinsel",
    objectLabel: "Tinsel",
    emoji: "✨",
    answerLabel: "Tinsel",
    options: ["Fairy lights", "Tinsel", "Confetti"],
    difficulty: "hard",
    hint: "Shiny strands draped over the tree.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "lights",
    objectLabel: "Fairy Lights",
    emoji: "💡",
    answerLabel: "Fairy Lights",
    options: ["Candles", "Fairy Lights", "Lanterns"],
    difficulty: "medium",
    hint: "Tiny bulbs that tangle every year.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "present-bow",
    objectLabel: "Gift Bow",
    emoji: "🎀",
    answerLabel: "Gift Bow",
    options: ["Ribbon", "Gift Bow", "Hair clip"],
    difficulty: "hard",
    hint: "The finishing touch on a wrapped box.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "ice-skate",
    objectLabel: "Ice Skates",
    emoji: "⛸️",
    answerLabel: "Ice Skates",
    options: ["Roller skates", "Ice Skates", "Ski boots"],
    difficulty: "medium",
    hint: "Blades for the frozen pond.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "mug",
    objectLabel: "Festive Mug",
    emoji: "🫖",
    answerLabel: "Festive Mug",
    options: ["Bowl", "Festive Mug", "Jug"],
    difficulty: "hard",
    hint: "Holds cocoa by the fireplace.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "penguin",
    objectLabel: "Penguin",
    emoji: "🐧",
    answerLabel: "Penguin",
    options: ["Penguin", "Puffin", "Seal"],
    difficulty: "easy",
    hint: "Black-tie bird of the ice.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "mrs-claus",
    objectLabel: "Mrs Claus",
    emoji: "🤶",
    answerLabel: "Mrs Claus",
    options: ["Mrs Claus", "Fairy godmother", "Baker"],
    difficulty: "easy",
    hint: "Keeps the North Pole running.",
    pointsFull: 2,
    pointsHint: 1,
  },
  {
    id: "drum",
    objectLabel: "Toy Drum",
    emoji: "🥁",
    answerLabel: "Toy Drum",
    options: ["Tambourine", "Toy Drum", "Xylophone"],
    difficulty: "hard",
    hint: "Little drummer energy under the tree.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "trumpet",
    objectLabel: "Toy Trumpet",
    emoji: "🎺",
    answerLabel: "Toy Trumpet",
    options: ["Horn", "Toy Trumpet", "Whistle"],
    difficulty: "hard",
    hint: "Brassy Christmas morning noise.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "chocolate",
    objectLabel: "Chocolate Box",
    emoji: "🍫",
    answerLabel: "Chocolate Box",
    options: ["Chocolate Box", "Candy tin", "Cookie tin"],
    difficulty: "medium",
    hint: "Assorted sweets in festive foil.",
    pointsFull: 3,
    pointsHint: 1,
  },
  {
    id: "pinecone",
    objectLabel: "Pine Cone",
    emoji: "🪵",
    answerLabel: "Pine Cone",
    options: ["Acorn", "Pine Cone", "Walnut"],
    difficulty: "hard",
    hint: "Forest decoration, often glittered.",
    pointsFull: 4,
    pointsHint: 2,
  },
  {
    id: "mistletoe",
    objectLabel: "Mistletoe",
    emoji: "🌱",
    answerLabel: "Mistletoe",
    options: ["Holly", "Mistletoe", "Olive branch"],
    difficulty: "hard",
    hint: "Hang it and wait for a kiss.",
    pointsFull: 4,
    pointsHint: 2,
  },
];

/** How many objects per play session. */
export const SACK_ROUND_SIZE = 7;

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function toQuestion(item: SackItem): SackQuestion {
  const options = shuffleInPlace([...item.options]);
  const answer = options.indexOf(item.answerLabel);
  return {
    id: item.id,
    objectLabel: item.objectLabel,
    emoji: item.emoji.trim(),
    options,
    answer: answer >= 0 ? answer : 0,
    difficulty: item.difficulty,
    hint: item.hint,
    pointsFull: item.pointsFull,
    pointsHint: item.pointsHint,
  };
}

/** Random round of distinct sack objects (options shuffled). */
export function pickSackRound(size = SACK_ROUND_SIZE): SackQuestion[] {
  const pool = shuffleInPlace([...SANTA_SACK_POOL]);
  return pool.slice(0, Math.min(size, pool.length)).map(toQuestion);
}

/** Theoretical max for one round (best-scoring items in the pool). */
export function maxSackScore(size = SACK_ROUND_SIZE): number {
  return [...SANTA_SACK_POOL]
    .sort((a, b) => b.pointsFull - a.pointsFull)
    .slice(0, Math.min(size, SANTA_SACK_POOL.length))
    .reduce((sum, q) => sum + q.pointsFull, 0);
}

export function roundMaxScore(questions: SackQuestion[]): number {
  return questions.reduce((sum, q) => sum + q.pointsFull, 0);
}

/** @deprecated Prefer pickSackRound — kept for any imports expecting a static list. */
export const SANTA_SACK_QUESTIONS: SackQuestion[] = SANTA_SACK_POOL.map(toQuestion);
