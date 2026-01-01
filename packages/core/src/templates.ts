// Template library for quick-start tier lists
import type { Items, Item } from "./models";

export interface TierTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string; // Emoji or icon name
  tierOrder: string[];
  tierLabels: Record<string, string>;
  tierColors: Record<string, string>;
  items: Item[];
  featured?: boolean;
  popularity?: number;
}

export type TemplateCategory =
  | "entertainment"
  | "gaming"
  | "sports"
  | "food"
  | "music"
  | "technology"
  | "lifestyle"
  | "education"
  | "custom";

export const TEMPLATE_CATEGORIES: Record<
  TemplateCategory,
  { label: string; icon: string }
> = {
  entertainment: { label: "Entertainment", icon: "film" },
  gaming: { label: "Gaming", icon: "gamepad" },
  sports: { label: "Sports", icon: "trophy" },
  food: { label: "Food & Drink", icon: "utensils" },
  music: { label: "Music", icon: "music" },
  technology: { label: "Technology", icon: "laptop" },
  lifestyle: { label: "Lifestyle", icon: "heart" },
  education: { label: "Education", icon: "book" },
  custom: { label: "Custom", icon: "sparkles" },
};

// Default tier structure used across many templates
const DEFAULT_TIER_ORDER = ["S", "A", "B", "C", "D", "F"];
const DEFAULT_TIER_LABELS: Record<string, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  F: "F",
  unranked: "Unranked",
};
const DEFAULT_TIER_COLORS: Record<string, string> = {
  S: "#ff7f7f",
  A: "#ffbf7f",
  B: "#ffdf7f",
  C: "#ffff7f",
  D: "#bfff7f",
  F: "#7fff7f",
  unranked: "#475569",
};

// Generate unique IDs for template items
let itemIdCounter = 0;
function generateId(): string {
  return `tmpl-${++itemIdCounter}-${Date.now().toString(36)}`;
}

function createItems(names: string[]): Item[] {
  return names.map((name) => ({
    id: generateId(),
    name,
  }));
}

// Entertainment Templates
const movieGenresTemplate: TierTemplate = {
  id: "movie-genres",
  name: "Movie Genres",
  description: "Rank your favorite film genres from best to worst",
  category: "entertainment",
  icon: "film",
  featured: true,
  popularity: 95,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Sci-Fi",
    "Romance",
    "Thriller",
    "Animation",
    "Documentary",
    "Fantasy",
    "Mystery",
    "Musical",
    "Western",
    "Crime",
    "Adventure",
  ]),
};

const streamingServicesTemplate: TierTemplate = {
  id: "streaming-services",
  name: "Streaming Services",
  description: "Which streaming platform reigns supreme?",
  category: "entertainment",
  icon: "tv",
  featured: true,
  popularity: 92,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Netflix",
    "Disney+",
    "HBO Max",
    "Amazon Prime Video",
    "Hulu",
    "Apple TV+",
    "Peacock",
    "Paramount+",
    "YouTube Premium",
    "Crunchyroll",
  ]),
};

const marvelMoviesTemplate: TierTemplate = {
  id: "marvel-movies",
  name: "Marvel Movies",
  description: "Rank every MCU movie",
  category: "entertainment",
  icon: "star",
  popularity: 88,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Avengers: Endgame",
    "Avengers: Infinity War",
    "Spider-Man: No Way Home",
    "The Avengers",
    "Black Panther",
    "Guardians of the Galaxy",
    "Iron Man",
    "Captain America: Civil War",
    "Thor: Ragnarok",
    "Captain America: The Winter Soldier",
    "Doctor Strange",
    "Ant-Man",
    "Black Widow",
    "Shang-Chi",
    "Eternals",
  ]),
};

const starWarsMoviesTemplate: TierTemplate = {
  id: "star-wars-movies",
  name: "Star Wars Films",
  description: "Rank all Star Wars theatrical releases",
  category: "entertainment",
  icon: "star",
  featured: true,
  popularity: 91,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "A New Hope (1977)",
    "The Empire Strikes Back (1980)",
    "Return of the Jedi (1983)",
    "The Phantom Menace (1999)",
    "Attack of the Clones (2002)",
    "Revenge of the Sith (2005)",
    "The Force Awakens (2015)",
    "Rogue One (2016)",
    "The Last Jedi (2017)",
    "Solo (2018)",
    "The Rise of Skywalker (2019)",
  ]),
};

const survivorSeasonsTemplate: TierTemplate = {
  id: "survivor-seasons",
  name: "Survivor Seasons",
  description: "Rank all 47 seasons of Survivor",
  category: "entertainment",
  icon: "trophy",
  featured: true,
  popularity: 86,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Borneo (S1)",
    "The Australian Outback (S2)",
    "Africa (S3)",
    "Marquesas (S4)",
    "Thailand (S5)",
    "The Amazon (S6)",
    "Pearl Islands (S7)",
    "All-Stars (S8)",
    "Vanuatu (S9)",
    "Palau (S10)",
    "Guatemala (S11)",
    "Panama (S12)",
    "Cook Islands (S13)",
    "Fiji (S14)",
    "China (S15)",
    "Micronesia (S16)",
    "Gabon (S17)",
    "Tocantins (S18)",
    "Samoa (S19)",
    "Heroes vs. Villains (S20)",
    "Nicaragua (S21)",
    "Redemption Island (S22)",
    "South Pacific (S23)",
    "One World (S24)",
    "Philippines (S25)",
    "Caramoan (S26)",
    "Blood vs. Water (S27)",
    "Cagayan (S28)",
    "San Juan del Sur (S29)",
    "Worlds Apart (S30)",
    "Cambodia (S31)",
    "Kaôh Rōng (S32)",
    "Millennials vs. Gen X (S33)",
    "Game Changers (S34)",
    "Heroes vs. Healers vs. Hustlers (S35)",
    "Ghost Island (S36)",
    "David vs. Goliath (S37)",
    "Edge of Extinction (S38)",
    "Island of the Idols (S39)",
    "Winners at War (S40)",
    "Survivor 41",
    "Survivor 42",
    "Survivor 43",
    "Survivor 44",
    "Survivor 45",
    "Survivor 46",
    "Survivor 47",
  ]),
};

const animated90sTemplate: TierTemplate = {
  id: "animated-90s",
  name: "90s Animated Shows",
  description: "Rank classic 90s Saturday morning cartoons",
  category: "entertainment",
  icon: "tv",
  popularity: 84,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Batman: The Animated Series",
    "X-Men",
    "Spider-Man",
    "Animaniacs",
    "Pinky and the Brain",
    "Dexter's Laboratory",
    "The Powerpuff Girls",
    "Johnny Bravo",
    "Courage the Cowardly Dog",
    "Ed, Edd n Eddy",
    "Hey Arnold!",
    "Rugrats",
    "Doug",
    "Rocko's Modern Life",
    "The Ren & Stimpy Show",
    "CatDog",
    "Recess",
    "Arthur",
    "The Magic School Bus",
    "Captain Planet",
    "Gargoyles",
    "Teenage Mutant Ninja Turtles",
    "Darkwing Duck",
    "DuckTales",
    "TaleSpin",
  ]),
};

// Gaming Templates
const gameGenresTemplate: TierTemplate = {
  id: "game-genres",
  name: "Game Genres",
  description: "What type of games do you love most?",
  category: "gaming",
  icon: "gamepad",
  featured: true,
  popularity: 90,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "RPG",
    "Action-Adventure",
    "FPS",
    "Strategy",
    "Platformer",
    "Racing",
    "Sports",
    "Fighting",
    "Puzzle",
    "Simulation",
    "Horror",
    "Battle Royale",
    "MOBA",
    "Roguelike",
    "Sandbox",
  ]),
};

const gamingConsolesTemplate: TierTemplate = {
  id: "gaming-consoles",
  name: "Gaming Consoles",
  description: "Rate gaming consoles through the ages",
  category: "gaming",
  icon: "monitor",
  popularity: 85,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "PS5",
    "Xbox Series X",
    "Nintendo Switch",
    "PS4",
    "Xbox One",
    "PS3",
    "Xbox 360",
    "Wii",
    "PS2",
    "Nintendo 64",
    "SNES",
    "NES",
    "Steam Deck",
    "Game Boy",
    "Sega Genesis",
  ]),
};

const pokemonGenerationsTemplate: TierTemplate = {
  id: "pokemon-generations",
  name: "Pokemon Generations",
  description: "Which generation is the best?",
  category: "gaming",
  icon: "star",
  popularity: 82,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Gen 1 (Red/Blue/Yellow)",
    "Gen 2 (Gold/Silver/Crystal)",
    "Gen 3 (Ruby/Sapphire/Emerald)",
    "Gen 4 (Diamond/Pearl/Platinum)",
    "Gen 5 (Black/White)",
    "Gen 6 (X/Y)",
    "Gen 7 (Sun/Moon)",
    "Gen 8 (Sword/Shield)",
    "Gen 9 (Scarlet/Violet)",
  ]),
};

// Sports Templates
const nbaTeamsTemplate: TierTemplate = {
  id: "nba-teams",
  name: "NBA Teams",
  description: "Rank all 30 NBA franchises",
  category: "sports",
  icon: "basketball",
  featured: true,
  popularity: 78,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Lakers",
    "Celtics",
    "Warriors",
    "Bulls",
    "Heat",
    "Spurs",
    "Knicks",
    "Nets",
    "76ers",
    "Mavericks",
    "Suns",
    "Bucks",
    "Clippers",
    "Nuggets",
    "Thunder",
  ]),
};

const sportsTemplate: TierTemplate = {
  id: "sports",
  name: "Sports to Watch",
  description: "Which sports are most entertaining?",
  category: "sports",
  icon: "trophy",
  popularity: 75,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Football (NFL)",
    "Basketball (NBA)",
    "Soccer (FIFA)",
    "Baseball (MLB)",
    "Hockey (NHL)",
    "Tennis",
    "Golf",
    "UFC/MMA",
    "Boxing",
    "Formula 1",
    "Olympics",
    "Cricket",
    "Rugby",
    "Volleyball",
    "Swimming",
  ]),
};

// Food Templates
const fastFoodTemplate: TierTemplate = {
  id: "fast-food",
  name: "Fast Food Chains",
  description: "Which fast food reigns supreme?",
  category: "food",
  icon: "hamburger",
  featured: true,
  popularity: 88,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "McDonald's",
    "Chick-fil-A",
    "In-N-Out",
    "Wendy's",
    "Taco Bell",
    "Chipotle",
    "Five Guys",
    "Shake Shack",
    "Popeyes",
    "Burger King",
    "KFC",
    "Subway",
    "Panda Express",
    "Arby's",
    "Sonic",
  ]),
};

const pizzaToppingsTemplate: TierTemplate = {
  id: "pizza-toppings",
  name: "Pizza Toppings",
  description: "Settle the pizza debate once and for all",
  category: "food",
  icon: "pizza",
  popularity: 85,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Pepperoni",
    "Mushrooms",
    "Sausage",
    "Bacon",
    "Extra Cheese",
    "Onions",
    "Bell Peppers",
    "Black Olives",
    "Pineapple",
    "Jalapeños",
    "Ham",
    "Anchovies",
    "Spinach",
    "Tomatoes",
    "Chicken",
  ]),
};

const coffeeShopsTemplate: TierTemplate = {
  id: "coffee-shops",
  name: "Coffee Shops",
  description: "Where do you get your caffeine fix?",
  category: "food",
  icon: "coffee",
  popularity: 80,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Starbucks",
    "Dunkin'",
    "Dutch Bros",
    "Peet's Coffee",
    "Tim Hortons",
    "Caribou Coffee",
    "Blue Bottle",
    "Philz Coffee",
    "Local Coffee Shop",
    "Gas Station Coffee",
  ]),
};

// Music Templates
const musicGenresTemplate: TierTemplate = {
  id: "music-genres",
  name: "Music Genres",
  description: "What music makes you move?",
  category: "music",
  icon: "music",
  featured: true,
  popularity: 82,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Pop",
    "Hip-Hop/Rap",
    "Rock",
    "R&B",
    "Country",
    "Electronic/EDM",
    "Jazz",
    "Classical",
    "Metal",
    "Indie",
    "Alternative",
    "Reggae",
    "Blues",
    "Folk",
    "K-Pop",
  ]),
};

const musicDecadesTemplate: TierTemplate = {
  id: "music-decades",
  name: "Music by Decade",
  description: "Which era had the best music?",
  category: "music",
  icon: "clock",
  popularity: 78,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "1950s",
    "1960s",
    "1970s",
    "1980s",
    "1990s",
    "2000s",
    "2010s",
    "2020s",
  ]),
};

// Technology Templates
const programmingLanguagesTemplate: TierTemplate = {
  id: "programming-languages",
  name: "Programming Languages",
  description: "For developers: rank your favorite languages",
  category: "technology",
  icon: "code",
  featured: true,
  popularity: 85,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Python",
    "JavaScript",
    "TypeScript",
    "Rust",
    "Go",
    "Java",
    "C#",
    "C++",
    "Swift",
    "Kotlin",
    "Ruby",
    "PHP",
    "C",
    "Haskell",
    "R",
  ]),
};

const smartphoneBrandsTemplate: TierTemplate = {
  id: "smartphone-brands",
  name: "Smartphone Brands",
  description: "Which phone manufacturer makes the best devices?",
  category: "technology",
  icon: "smartphone",
  popularity: 80,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Apple iPhone",
    "Samsung Galaxy",
    "Google Pixel",
    "OnePlus",
    "Xiaomi",
    "Sony Xperia",
    "Motorola",
    "LG",
    "Huawei",
    "Oppo",
  ]),
};

const socialMediaTemplate: TierTemplate = {
  id: "social-media",
  name: "Social Media Platforms",
  description: "Which social network is the best?",
  category: "technology",
  icon: "share",
  popularity: 88,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitter/X",
    "Reddit",
    "Discord",
    "LinkedIn",
    "Snapchat",
    "Facebook",
    "Pinterest",
    "Twitch",
    "Threads",
    "BeReal",
  ]),
};

// Lifestyle Templates
const holidaysTemplate: TierTemplate = {
  id: "holidays",
  name: "Holidays",
  description: "Which holidays are the best?",
  category: "lifestyle",
  icon: "gift",
  popularity: 75,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Christmas",
    "Halloween",
    "Thanksgiving",
    "4th of July",
    "New Year's Eve",
    "Valentine's Day",
    "Easter",
    "Memorial Day",
    "Labor Day",
    "St. Patrick's Day",
    "Mother's Day",
    "Father's Day",
    "Birthday",
  ]),
};

const workoutTypesTemplate: TierTemplate = {
  id: "workout-types",
  name: "Workout Types",
  description: "How do you like to exercise?",
  category: "lifestyle",
  icon: "dumbbell",
  popularity: 70,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Weightlifting",
    "Running",
    "HIIT",
    "Yoga",
    "Swimming",
    "Cycling",
    "CrossFit",
    "Pilates",
    "Dance",
    "Martial Arts",
    "Rock Climbing",
    "Walking",
    "Sports",
  ]),
};

const petTypesTemplate: TierTemplate = {
  id: "pet-types",
  name: "Types of Pets",
  description: "Which pet would you want?",
  category: "lifestyle",
  icon: "paw",
  popularity: 72,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Dog",
    "Cat",
    "Fish",
    "Bird",
    "Hamster",
    "Rabbit",
    "Guinea Pig",
    "Turtle",
    "Snake",
    "Lizard",
    "Ferret",
    "Hedgehog",
  ]),
};

// Education Templates
const schoolSubjectsTemplate: TierTemplate = {
  id: "school-subjects",
  name: "School Subjects",
  description: "What was your favorite subject?",
  category: "education",
  icon: "book",
  featured: true,
  popularity: 82,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: createItems([
    "Math",
    "Science",
    "English/Literature",
    "History",
    "Art",
    "Music",
    "Physical Education",
    "Foreign Language",
    "Computer Science",
    "Geography",
    "Psychology",
    "Economics",
    "Philosophy",
  ]),
};

// Custom/Blank Templates
const blankSABCDFTemplate: TierTemplate = {
  id: "blank-sabcdf",
  name: "Blank S-F Tier List",
  description: "Classic tier list format with S, A, B, C, D, F tiers",
  category: "custom",
  icon: "sparkles",
  featured: true,
  popularity: 100,
  tierOrder: DEFAULT_TIER_ORDER,
  tierLabels: DEFAULT_TIER_LABELS,
  tierColors: DEFAULT_TIER_COLORS,
  items: [],
};

const blankTop10Template: TierTemplate = {
  id: "blank-top10",
  name: "Top 10 Ranking",
  description: "Simple 1-10 ranking system",
  category: "custom",
  icon: "list-ordered",
  popularity: 90,
  tierOrder: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  tierLabels: {
    "1": "#1",
    "2": "#2",
    "3": "#3",
    "4": "#4",
    "5": "#5",
    "6": "#6",
    "7": "#7",
    "8": "#8",
    "9": "#9",
    "10": "#10",
    unranked: "Unranked",
  },
  tierColors: {
    "1": "#ffd700",
    "2": "#c0c0c0",
    "3": "#cd7f32",
    "4": "#6366f1",
    "5": "#8b5cf6",
    "6": "#06b6d4",
    "7": "#10b981",
    "8": "#f59e0b",
    "9": "#ef4444",
    "10": "#64748b",
    unranked: "#475569",
  },
  items: [],
};

const blankThumbsTemplate: TierTemplate = {
  id: "blank-thumbs",
  name: "Like / Dislike",
  description: "Simple thumbs up or thumbs down",
  category: "custom",
  icon: "thumbs-up",
  popularity: 85,
  tierOrder: ["love", "like", "neutral", "dislike", "hate"],
  tierLabels: {
    love: "Love It",
    like: "Like It",
    neutral: "Neutral",
    dislike: "Dislike",
    hate: "Hate It",
    unranked: "Not Rated",
  },
  tierColors: {
    love: "#22c55e",
    like: "#84cc16",
    neutral: "#eab308",
    dislike: "#f97316",
    hate: "#ef4444",
    unranked: "#475569",
  },
  items: [],
};

const blankYesNoMaybeTemplate: TierTemplate = {
  id: "blank-yes-no-maybe",
  name: "Yes / No / Maybe",
  description: "Simple decision-making tier list",
  category: "custom",
  icon: "check-circle",
  popularity: 80,
  tierOrder: ["yes", "maybe", "no"],
  tierLabels: {
    yes: "Yes",
    maybe: "Maybe",
    no: "No",
    unranked: "Undecided",
  },
  tierColors: {
    yes: "#22c55e",
    maybe: "#eab308",
    no: "#ef4444",
    unranked: "#475569",
  },
  items: [],
};

// Export all templates
export const TEMPLATES: TierTemplate[] = [
  // Custom/Blank (show first)
  blankSABCDFTemplate,
  blankTop10Template,
  blankThumbsTemplate,
  blankYesNoMaybeTemplate,
  // Entertainment
  movieGenresTemplate,
  streamingServicesTemplate,
  marvelMoviesTemplate,
  starWarsMoviesTemplate,
  survivorSeasonsTemplate,
  animated90sTemplate,
  // Gaming
  gameGenresTemplate,
  gamingConsolesTemplate,
  pokemonGenerationsTemplate,
  // Sports
  nbaTeamsTemplate,
  sportsTemplate,
  // Food
  fastFoodTemplate,
  pizzaToppingsTemplate,
  coffeeShopsTemplate,
  // Music
  musicGenresTemplate,
  musicDecadesTemplate,
  // Technology
  programmingLanguagesTemplate,
  smartphoneBrandsTemplate,
  socialMediaTemplate,
  // Lifestyle
  holidaysTemplate,
  workoutTypesTemplate,
  petTypesTemplate,
  // Education
  schoolSubjectsTemplate,
];

export function getTemplatesByCategory(
  category: TemplateCategory
): TierTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getFeaturedTemplates(): TierTemplate[] {
  return TEMPLATES.filter((t) => t.featured).sort(
    (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
  );
}

export function searchTemplates(query: string): TierTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.items.some((item) =>
        item.name?.toLowerCase().includes(lowercaseQuery)
      )
  );
}

export function getTemplateById(id: string): TierTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
