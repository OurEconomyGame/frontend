const BACKEND = 'https://server-oureconomy.napp9.com';

const RESOURCES = [
  { id: 0, name: 'Resource #0 (Food)' },
  { id: 1, name: 'Resource #1 (Water)' },
  { id: 2, name: 'Resource #2 (Grain)' },
  { id: 3, name: 'Resource #3 (Electricity)' },
  { id: 4, name: 'Resource #4 (Cement)' },
  { id: 5, name: 'Resource #5 (Metal)' },
  { id: 6, name: 'Resource #6 (RawOre)' }
];

const RECIPES = [
  { id: 'water_pump', name: 'Water Pump ($200 • Output: 500 Water)' },
  { id: 'manual_grain_farm', name: 'Manual Grain Farm ($500 • 300 Water → 150 Grain)' },
  { id: 'geothermal_plant', name: 'Geothermal Plant ($500 • 100 Water → 200 Electricity)' },
  { id: 'electric_water_pump', name: 'Electric Water Pump ($2,000 • 200 Electricity → 3,000 Water)' },
  { id: 'pre_packaged_food', name: 'Pre Packaged Food ($2,000 • 550 Elec + 1k Water + 100 Grain → 25 Food)' }
];
