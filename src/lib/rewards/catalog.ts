/**
 * Reward art: eggs you hatch in Focus, the food inside them, and rank badges.
 * Images live in /public/rewards (cut out from the sticker sheets you supplied).
 */

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface EggArt {
  id: string;
  name: string;
  src: string;
}
export interface FoodArt {
  id: string;
  name: string;
  src: string;
  rarity: Rarity;
}

export const EGGS: EggArt[] = [
  { id: "teal-swirl", name: "Teal Swirl", src: "/rewards/eggs/teal-swirl.webp" },
  { id: "ember-stripe", name: "Ember Stripe", src: "/rewards/eggs/ember-stripe.webp" },
  { id: "rose-crackle", name: "Rose Crackle", src: "/rewards/eggs/rose-crackle.webp" },
  { id: "jade-wave", name: "Jade Wave", src: "/rewards/eggs/jade-wave.webp" },
  { id: "candy-crackle", name: "Candy Crackle", src: "/rewards/eggs/candy-crackle.webp" },
  { id: "peach-swirl", name: "Peach Swirl", src: "/rewards/eggs/peach-swirl.webp" },
  { id: "blaze", name: "Blaze", src: "/rewards/eggs/blaze.webp" },
  { id: "aurora", name: "Aurora", src: "/rewards/eggs/aurora.webp" },
  { id: "amethyst-gem", name: "Amethyst Gem", src: "/rewards/eggs/amethyst-gem.webp" },
  { id: "sea-mist", name: "Sea Mist", src: "/rewards/eggs/sea-mist.webp" },
  { id: "coral-pearl", name: "Coral Pearl", src: "/rewards/eggs/coral-pearl.webp" },
  { id: "sunset-spot", name: "Sunset Spot", src: "/rewards/eggs/sunset-spot.webp" },
  { id: "bark-scale", name: "Bark Scale", src: "/rewards/eggs/bark-scale.webp" },
  { id: "moon-tide", name: "Moon Tide", src: "/rewards/eggs/moon-tide.webp" },
  { id: "solar-flare", name: "Solar Flare", src: "/rewards/eggs/solar-flare.webp" },
  { id: "moss-scale", name: "Moss Scale", src: "/rewards/eggs/moss-scale.webp" },
  { id: "storm-bolt", name: "Storm Bolt", src: "/rewards/eggs/storm-bolt.webp" },
  { id: "plum-smoke", name: "Plum Smoke", src: "/rewards/eggs/plum-smoke.webp" },
  { id: "jungle-vine", name: "Jungle Vine", src: "/rewards/eggs/jungle-vine.webp" },
  { id: "bubblegum", name: "Bubblegum", src: "/rewards/eggs/bubblegum.webp" },
  { id: "sand-pebble", name: "Sand Pebble", src: "/rewards/eggs/sand-pebble.webp" },
];

export const FOODS: FoodArt[] = [
  { id: "ramen", name: "Ramen", src: "/rewards/food/ramen.webp", rarity: "rare" },
  { id: "omurice", name: "Omurice", src: "/rewards/food/omurice.webp", rarity: "rare" },
  { id: "pancake-stack", name: "Pancake Stack", src: "/rewards/food/pancake-stack.webp", rarity: "rare" },
  { id: "boba-tea", name: "Boba Tea", src: "/rewards/food/boba-tea.webp", rarity: "rare" },
  { id: "sushi-platter", name: "Sushi Platter", src: "/rewards/food/sushi-platter.webp", rarity: "legendary" },
  { id: "gyudon", name: "Gyudon", src: "/rewards/food/gyudon.webp", rarity: "rare" },
  { id: "strawberry-shortcake", name: "Strawberry Shortcake", src: "/rewards/food/strawberry-shortcake.webp", rarity: "epic" },
  { id: "dango", name: "Dango", src: "/rewards/food/dango.webp", rarity: "common" },
  { id: "steamed-buns", name: "Steamed Buns", src: "/rewards/food/steamed-buns.webp", rarity: "rare" },
  { id: "takoyaki", name: "Takoyaki", src: "/rewards/food/takoyaki.webp", rarity: "rare" },
  { id: "bento-box", name: "Bento Box", src: "/rewards/food/bento-box.webp", rarity: "epic" },
  { id: "curry-rice", name: "Curry Rice", src: "/rewards/food/curry-rice.webp", rarity: "rare" },
  { id: "ice-cream-cone", name: "Ice Cream Cone", src: "/rewards/food/ice-cream-cone.webp", rarity: "common" },
  { id: "happy-fries", name: "Happy Fries", src: "/rewards/food/happy-fries.webp", rarity: "common" },
  { id: "garden-salad", name: "Garden Salad", src: "/rewards/food/garden-salad.webp", rarity: "common" },
  { id: "cheeseburger", name: "Cheeseburger", src: "/rewards/food/cheeseburger.webp", rarity: "common" },
  { id: "spaghetti", name: "Spaghetti", src: "/rewards/food/spaghetti.webp", rarity: "common" },
  { id: "donut-duo", name: "Donut Duo", src: "/rewards/food/donut-duo.webp", rarity: "common" },
  { id: "tteokbokki", name: "Tteokbokki", src: "/rewards/food/tteokbokki.webp", rarity: "common" },
  { id: "pizza-slice", name: "Pizza Slice", src: "/rewards/food/pizza-slice.webp", rarity: "common" },
  { id: "bear-curry", name: "Bear Curry", src: "/rewards/food/bear-curry.webp", rarity: "rare" },
  { id: "taiyaki", name: "Taiyaki", src: "/rewards/food/taiyaki.webp", rarity: "rare" },
  { id: "fried-rice", name: "Fried Rice", src: "/rewards/food/fried-rice.webp", rarity: "common" },
  { id: "karaage", name: "Karaage", src: "/rewards/food/karaage.webp", rarity: "common" },
  { id: "fruit-plate", name: "Fruit Plate", src: "/rewards/food/fruit-plate.webp", rarity: "common" },
  { id: "rainbow-cake", name: "Rainbow Cake", src: "/rewards/food/rainbow-cake.webp", rarity: "legendary" },
  { id: "bingsu", name: "Bingsu", src: "/rewards/food/bingsu.webp", rarity: "epic" },
  { id: "pho", name: "Pho", src: "/rewards/food/pho.webp", rarity: "rare" },
  { id: "club-sandwich", name: "Club Sandwich", src: "/rewards/food/club-sandwich.webp", rarity: "common" },
  { id: "hot-pot", name: "Hot Pot", src: "/rewards/food/hot-pot.webp", rarity: "legendary" },
  { id: "panda-bento", name: "Panda Bento", src: "/rewards/food/panda-bento.webp", rarity: "rare" },
  { id: "chicken-waffles", name: "Chicken & Waffles", src: "/rewards/food/chicken-waffles.webp", rarity: "epic" },
  { id: "orange-chicken-bowl", name: "Orange Chicken Bowl", src: "/rewards/food/orange-chicken-bowl.webp", rarity: "common" },
  { id: "dumpling-platter", name: "Dumpling Platter", src: "/rewards/food/dumpling-platter.webp", rarity: "epic" },
  { id: "noodle-pot", name: "Noodle Pot", src: "/rewards/food/noodle-pot.webp", rarity: "common" },
  { id: "tonkotsu-ramen", name: "Tonkotsu Ramen", src: "/rewards/food/tonkotsu-ramen.webp", rarity: "epic" },
  { id: "lobster-feast", name: "Lobster Feast", src: "/rewards/food/lobster-feast.webp", rarity: "legendary" },
  { id: "fresh-spring-rolls", name: "Fresh Spring Rolls", src: "/rewards/food/fresh-spring-rolls.webp", rarity: "rare" },
  { id: "veggie-curry", name: "Veggie Curry", src: "/rewards/food/veggie-curry.webp", rarity: "common" },
  { id: "bacon-veggie-plate", name: "Bacon Veggie Plate", src: "/rewards/food/bacon-veggie-plate.webp", rarity: "common" },
  { id: "tempura-udon", name: "Tempura Udon", src: "/rewards/food/tempura-udon.webp", rarity: "rare" },
  { id: "beef-stew", name: "Beef Stew", src: "/rewards/food/beef-stew.webp", rarity: "common" },
  { id: "egg-toast", name: "Egg Toast", src: "/rewards/food/egg-toast.webp", rarity: "common" },
  { id: "loaded-nachos", name: "Loaded Nachos", src: "/rewards/food/loaded-nachos.webp", rarity: "common" },
  { id: "egg-rolls", name: "Egg Rolls", src: "/rewards/food/egg-rolls.webp", rarity: "common" },
  { id: "potstickers", name: "Potstickers", src: "/rewards/food/potstickers.webp", rarity: "common" },
  { id: "pork-belly-bowl", name: "Pork Belly Bowl", src: "/rewards/food/pork-belly-bowl.webp", rarity: "epic" },
  { id: "egg-noodle-soup", name: "Egg Noodle Soup", src: "/rewards/food/egg-noodle-soup.webp", rarity: "common" },
  { id: "croque-madame", name: "Croque Madame", src: "/rewards/food/croque-madame.webp", rarity: "rare" },
  { id: "smoothie-bowl", name: "Smoothie Bowl", src: "/rewards/food/smoothie-bowl.webp", rarity: "epic" },
  { id: "tonkatsu", name: "Tonkatsu", src: "/rewards/food/tonkatsu.webp", rarity: "rare" },
];

export const RARITY: Record<Rarity, { label: string; color: string; weight: number }> = {
  common: { label: "Common", color: "#9CA3AF", weight: 62 },
  rare: { label: "Rare", color: "#38BDF8", weight: 25 },
  epic: { label: "Epic", color: "#C084FC", weight: 10 },
  legendary: { label: "Legendary", color: "#FBBF24", weight: 3 },
};

export const eggById = (id?: string) => EGGS.find((e) => e.id === id) ?? EGGS[0];
export const foodById = (id?: string) => FOODS.find((f) => f.id === id);

export function randomEgg(): EggArt {
  return EGGS[Math.floor(Math.random() * EGGS.length)];
}

/** Rarer food for longer sessions: each 25 focused minutes nudges the odds up a little. */
export function randomFood(minutes = 25): FoodArt {
  const boost = Math.min(2, Math.max(0, minutes / 25 - 1));
  const tiers = (Object.keys(RARITY) as Rarity[]).map((r, i) => ({ r, w: RARITY[r].weight * (1 + boost * i * 0.35) }));
  let x = Math.random() * tiers.reduce((a, t) => a + t.w, 0);
  let pick: Rarity = "common";
  for (const t of tiers) {
    if ((x -= t.w) <= 0) {
      pick = t.r;
      break;
    }
  }
  const pool = FOODS.filter((f) => f.rarity === pick);
  return pool[Math.floor(Math.random() * pool.length)] ?? FOODS[0];
}

/* ---------------- rank badges ---------------- */
export type Tier = "iron" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master" | "grandmaster" | "challenger";
export const TIERS: { id: Tier; name: string; at: number; color: string }[] = [
  { id: "iron", name: "Iron", at: 10, color: "#9CA3AF" },
  { id: "bronze", name: "Bronze", at: 25, color: "#C08457" },
  { id: "silver", name: "Silver", at: 40, color: "#CBD5E1" },
  { id: "gold", name: "Gold", at: 55, color: "#F2C14E" },
  { id: "platinum", name: "Platinum", at: 70, color: "#3CC9B4" },
  { id: "diamond", name: "Diamond", at: 85, color: "#6D8BFF" },
  { id: "master", name: "Master", at: 100, color: "#B565F5" },
  { id: "grandmaster", name: "Grandmaster", at: 101, color: "#F0524F" },
  { id: "challenger", name: "Challenger", at: 102, color: "#F5D76E" },
];
export const tierById = (id: Tier) => TIERS.find((t) => t.id === id)!;
export const badgeSrc = (id: Tier) => `/rewards/badges/${id}.webp`;
