// Roles classify each meal component; the weight is a proxy for effort/cost used
// by the divider to balance shares across crews.
export const ROLES = ['Protein', 'Starch', 'Veg', 'Salad/Side', 'Bread', 'Eggs/Dairy', 'Fruit', 'Pantry/Condiments', 'Dessert', 'Other']

export const ROLE_WEIGHTS = {
  'Protein': 3,
  'Starch': 2,
  'Veg': 2,
  'Bread': 1.5,
  'Eggs/Dairy': 1.5,
  'Salad/Side': 1,
  'Fruit': 1,
  'Pantry/Condiments': 1,
  'Dessert': 1,
  'Other': 1,
}

export const roleWeight = (role) => ROLE_WEIGHTS[role] ?? 1

let n = 0
export function uid(prefix = 'id') {
  n += 1
  return `${prefix}-${Date.now().toString(36)}-${n}-${Math.random().toString(36).slice(2, 6)}`
}

// component factory
const c = (name, role, qty = '', baseServes = 7) => ({ name, role, qty, baseServes })

// ── Crews (households), seeded from past trips ────────────────────────────────
export const SEED_HOUSEHOLDS = [
  { id: 'hh-ld', name: 'L/D (Leia & Dana)', defaultSize: 2 },
  { id: 'hh-gong', name: 'Gong', defaultSize: 2 },
  { id: 'hh-quinley', name: 'Quinley', defaultSize: 2 },
  { id: 'hh-adam', name: 'Adam', defaultSize: 1 },
  { id: 'hh-gary', name: 'Gary & Delphine', defaultSize: 2 },
  { id: 'hh-rudes', name: 'Rudes', defaultSize: 2 },
  { id: 'hh-dh', name: 'D&H (Debbie & Harry)', defaultSize: 2 },
]

// ── Meal library, distilled from the RTF plans ────────────────────────────────
export const SEED_LIBRARY = [
  {
    id: 'lib-skillet', name: 'Chicken Sausage & Veggie Skillet', slot: 'dinner',
    components: [
      c('Chicken sausage', 'Protein', '~2 lb'),
      c('Skillet veggies (bell pepper, mushroom, zucchini)', 'Veg'),
      c('Red potatoes', 'Starch', '7 potatoes'),
      c('Salad of choice', 'Salad/Side'),
    ],
  },
  {
    id: 'lib-bbq', name: 'BBQ Night — Tri-Tip & Grilled Chicken', slot: 'dinner',
    components: [
      c('Tri-tip', 'Protein'),
      c('Chicken breast', 'Protein', '~3 lb'),
      c('Veggies to grill (zucchini, carrots, mushrooms)', 'Veg'),
      c('Red potatoes', 'Starch'),
      c('Salad of choice', 'Salad/Side'),
    ],
  },
  {
    id: 'lib-tacos', name: 'Tacos / Burritos', slot: 'dinner',
    components: [
      c('Ground or shredded meat', 'Protein'),
      c('Tortillas (flour + corn)', 'Bread'),
      c('Rice & beans', 'Starch'),
      c('Fixins (cheese, tomatoes, sour cream, lettuce)', 'Pantry/Condiments'),
      c('Fruit salad', 'Fruit'),
    ],
  },
  {
    id: 'lib-dogs', name: 'Hot Dogs / Burgers', slot: 'dinner',
    components: [
      c('Hot dogs / bratwurst', 'Protein'),
      c('Hamburger patties', 'Protein'),
      c('Buns', 'Bread'),
      c('Baked beans', 'Starch'),
      c('Pasta salad', 'Salad/Side'),
      c('Burger fixins (lettuce, tomato, pickle, condiments)', 'Pantry/Condiments'),
    ],
  },
  {
    id: 'lib-italian', name: 'Creamy Italian Sausage Pasta (Dutch oven)', slot: 'dinner',
    recipeUrl: 'https://pestlechef.app/recipes/creamyitaliansausage-F10C3',
    components: [
      c('Spicy Italian ground sausage', 'Protein', '1.5 lb'),
      c('Pasta', 'Starch'),
      c('Cream, bouillon, red pepper flakes', 'Pantry/Condiments'),
      c('Carrots, spinach, onion & garlic', 'Veg'),
    ],
  },
  {
    id: 'lib-brats', name: 'Brats / Links & Grilled Veggies', slot: 'dinner',
    components: [
      c('Brats / links', 'Protein'),
      c('Buns', 'Bread'),
      c('Veggies to grill (onion, bell pepper, mushroom)', 'Veg'),
      c('Salad of choice', 'Salad/Side'),
    ],
  },
  {
    id: 'lib-potpie', name: 'Chicken Pot Pie Soup with Biscuits', slot: 'dinner',
    recipeUrl: 'https://pestlechef.app/recipes/chickenpotpie-0D5D7',
    components: [
      c('Chicken breasts', 'Protein', '~2-3 lb'),
      c('Russet potatoes', 'Starch'),
      c('Pre-made biscuits', 'Bread'),
      c('Carrots, onion, garlic, celery', 'Veg'),
      c('Frozen peas & corn', 'Veg'),
      c('Spices & other', 'Pantry/Condiments'),
    ],
  },
  {
    id: 'lib-sandwiches', name: 'Sandwich Bar', slot: 'lunch',
    components: [
      c('Bread / rolls', 'Bread'),
      c('Deli meats & cheese', 'Protein'),
      c('Lettuce, tomato, condiments', 'Pantry/Condiments'),
      c('Chips', 'Salad/Side'),
    ],
  },
  {
    id: 'lib-quesadillas', name: 'Quesadillas', slot: 'lunch',
    components: [
      c('Tortillas', 'Bread'),
      c('Cheese', 'Eggs/Dairy'),
      c('Chicken or beans', 'Protein'),
      c('Salsa & sour cream', 'Pantry/Condiments'),
    ],
  },
  {
    id: 'lib-scramble', name: 'Camp Breakfast Scramble', slot: 'breakfast',
    components: [
      c('Soyrizo', 'Protein'),
      c('Bacon / sausage', 'Protein'),
      c('Eggs', 'Eggs/Dairy', '1-2 dozen'),
      c('Potatoes', 'Starch'),
      c('Fruit', 'Fruit'),
    ],
  },
  {
    id: 'lib-tomato-egg', name: 'Tomato Egg with Lap Cheung', slot: 'breakfast',
    components: [
      c('Chinese sausage (lap cheung)', 'Protein', '1 package'),
      c('Eggs', 'Eggs/Dairy', '1 dozen'),
      c('Slicer tomatoes', 'Veg', '~10 medium'),
      c('Onion, ginger & garlic', 'Veg'),
      c('Rice', 'Starch'),
    ],
  },
  {
    id: 'lib-pancakes', name: 'Pancake Breakfast', slot: 'breakfast',
    components: [
      c('Pancake mix', 'Bread'),
      c('Breakfast meat (bacon / sausage)', 'Protein'),
      c('Eggs', 'Eggs/Dairy', '1 dozen'),
      c('Fruit', 'Fruit'),
    ],
  },
]

// Recurring trip extras (toggled on per trip)
export const SEED_EXTRAS = [
  c("S'mores stuff", 'Dessert'),
  c('Coffee', 'Pantry/Condiments'),
  c('Orange juice', 'Pantry/Condiments'),
]

export function makeInitialState() {
  return {
    households: SEED_HOUSEHOLDS,
    library: SEED_LIBRARY,
    campsites: [],
    trips: [],
    rev: 0,
    updatedAt: Date.now(),
  }
}
