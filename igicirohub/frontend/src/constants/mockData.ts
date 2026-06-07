export const MARKET_PRICES = [
  { id: '1', name: 'Ibirayi (Potatoes)', emoji: '🥔', price: 350, unit: 'RWF/kg', change: 5.2, trend: 'up' as const, location: 'Musanze', district: 'Musanze', chartData: [310, 320, 335, 340, 345, 350] },
  { id: '2', name: 'Ibishyimbo (Beans)', emoji: '🫘', price: 800, unit: 'RWF/kg', change: 2.8, trend: 'up' as const, location: 'Huye', district: 'Huye', chartData: [750, 760, 770, 785, 790, 800] },
  { id: '3', name: 'Ibigori (Maize)', emoji: '🌽', price: 312, unit: 'RWF/kg', change: -1.4, trend: 'down' as const, location: 'Kayonza', district: 'Kayonza', chartData: [330, 325, 320, 318, 315, 312] },
  { id: '4', name: 'Umuceri (Rice)', emoji: '🍚', price: 1200, unit: 'RWF/kg', change: 3.1, trend: 'up' as const, location: 'Kirehe', district: 'Kirehe', chartData: [1100, 1120, 1150, 1170, 1190, 1200] },
  { id: '5', name: 'Ibitoki (Bananas)', emoji: '🍌', price: 200, unit: 'RWF/kg', change: 1.5, trend: 'up' as const, location: 'Rwamagana', district: 'Rwamagana', chartData: [185, 190, 192, 195, 198, 200] },
  { id: '6', name: 'Inyanya (Tomatoes)', emoji: '🍅', price: 600, unit: 'RWF/kg', change: -2.1, trend: 'down' as const, location: 'Kigali', district: 'Gasabo', chartData: [640, 630, 620, 615, 608, 600] },
  { id: '7', name: 'Karoti (Carrots)', emoji: '🥕', price: 450, unit: 'RWF/kg', change: 0.8, trend: 'up' as const, location: 'Burera', district: 'Burera', chartData: [430, 435, 440, 442, 445, 450] },
  { id: '8', name: 'Urusenda (Sorghum)', emoji: '🌾', price: 500, unit: 'RWF/kg', change: 4.2, trend: 'up' as const, location: 'Ngoma', district: 'Ngoma', chartData: [460, 470, 478, 485, 492, 500] },
];

export const MARKETPLACE_CATEGORIES = ['All', 'Vegetables', 'Grains', 'Fruits', 'Tubers', 'Legumes'];

export const MARKETPLACE_LISTINGS = [
  { id: '1', cropName: 'Fresh Potatoes', emoji: '🥔', quantity: '500 kg', price: 350, unit: 'RWF/kg', seller: 'Jean Baptiste', location: 'Musanze', phone: '+250788123456', posted: '2h ago' },
  { id: '2', cropName: 'Organic Beans', emoji: '🫘', quantity: '200 kg', price: 820, unit: 'RWF/kg', seller: 'Marie Uwase', location: 'Huye', phone: '+250788234567', posted: '4h ago' },
  { id: '3', cropName: 'Yellow Maize', emoji: '🌽', quantity: '1000 kg', price: 300, unit: 'RWF/kg', seller: 'Patrick Habimana', location: 'Kayonza', phone: '+250788345678', posted: '6h ago' },
  { id: '4', cropName: 'Premium Rice', emoji: '🍚', quantity: '300 kg', price: 1250, unit: 'RWF/kg', seller: 'Alice Mukamana', location: 'Kirehe', phone: '+250788456789', posted: '1d ago' },
  { id: '5', cropName: 'Sweet Bananas', emoji: '🍌', quantity: '150 bunches', price: 2000, unit: 'RWF/bunch', seller: 'Emmanuel Nziza', location: 'Rwamagana', phone: '+250788567890', posted: '1d ago' },
  { id: '6', cropName: 'Fresh Tomatoes', emoji: '🍅', quantity: '100 kg', price: 620, unit: 'RWF/kg', seller: 'Grace Ingabire', location: 'Kigali', phone: '+250788678901', posted: '2d ago' },
];

export const TRENDING_CROPS = MARKET_PRICES.filter((c) => c.trend === 'up').slice(0, 4);

export const CROPS_PREDICT = [
  { label: 'Maize (Ibigori)', value: 'maize', kinyarwanda: 'Ibigori', currentPrice: 312, prediction7d: 24.8, prediction14d: 18.2, prediction30d: 12.5 },
  { label: 'Beans (Ibishyimbo)', value: 'beans', kinyarwanda: 'Ibishyimbo', currentPrice: 800, prediction7d: 8.5, prediction14d: 12.0, prediction30d: 15.3 },
  { label: 'Potatoes (Ibirayi)', value: 'potatoes', kinyarwanda: 'Ibirayi', currentPrice: 350, prediction7d: 5.2, prediction14d: 7.8, prediction30d: 10.1 },
  { label: 'Rice (Umuceri)', value: 'rice', kinyarwanda: 'Umuceri', currentPrice: 1200, prediction7d: 3.1, prediction14d: 5.5, prediction30d: 8.0 },
  { label: 'Sorghum (Urusenda)', value: 'sorghum', kinyarwanda: 'Urusenda', currentPrice: 500, prediction7d: 4.2, prediction14d: 6.0, prediction30d: 9.3 },
];

export const REGIONS_PREDICT = {
  provinces: ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'],
  districts: [
    'Gasabo', 'Kicukiro', 'Nyarugenge', 'Musanze', 'Burera', 'Gakenke', 'Gicumbi', 'Rulindo',
    'Huye', 'Gisagara', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
    'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
    'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro',
  ],
  markets: ['Kimironko', 'Nyabugogo', 'Kicukiro Center', 'Musanze Central', 'Huye Market'],
};

export const DISEASE_SCAN_HISTORY = [
  { id: '1', disease: 'Late Blight', crop: 'Potatoes', confidence: 94, severity: 'High' as const, date: '2024-01-15', treatment: 'Apply copper-based fungicide (Mancozeb) immediately. Remove infected leaves. Ensure proper spacing for air circulation.' },
  { id: '2', disease: 'Rust', crop: 'Beans', confidence: 87, severity: 'Medium' as const, date: '2024-01-10', treatment: 'Apply sulfur-based fungicide. Rotate crops next season. Remove severely infected plants.' },
  { id: '3', disease: 'Healthy', crop: 'Maize', confidence: 98, severity: 'Low' as const, date: '2024-01-08', treatment: 'No treatment needed. Continue regular watering and fertilization schedule.' },
];

export const NOTIFICATIONS_DATA = [
  { id: '1', type: 'price' as const, title: 'Price Alert: Potatoes Up!', message: 'Potato prices increased by 5.2% in Musanze market.', time: '10m ago', read: false },
  { id: '2', type: 'buyer' as const, title: 'New Buyer Inquiry', message: 'Marie is interested in your 500kg potato listing.', time: '1h ago', read: false },
  { id: '3', type: 'message' as const, title: 'Message from Patrick', message: 'Can you deliver the maize to Kayonza?', time: '3h ago', read: true },
  { id: '4', type: 'price' as const, title: 'Price Drop: Tomatoes', message: 'Tomato prices dropped by 2.1% in Kigali.', time: '5h ago', read: true },
  { id: '5', type: 'buyer' as const, title: 'Order Confirmed', message: 'Your order for 200kg beans has been confirmed.', time: '1d ago', read: true },
];

export const FARMER_CROPS = [
  { id: '1', name: 'Irish Potatoes', emoji: '🥔', quantity: '500 kg', price: 350, status: 'listed' },
  { id: '2', name: 'Red Beans', emoji: '🫘', quantity: '200 kg', price: 820, status: 'listed' },
  { id: '3', name: 'Sweet Corn', emoji: '🌽', quantity: '300 kg', price: 280, status: 'harvesting' },
];

export const BUYER_ORDERS = [
  { id: '1', cropName: 'Fresh Potatoes', emoji: '🥔', quantity: '100 kg', price: 35000, seller: 'Jean Baptiste', status: 'Delivered', date: '2024-01-14' },
  { id: '2', cropName: 'Organic Beans', emoji: '🫘', quantity: '50 kg', price: 41000, seller: 'Marie Uwase', status: 'In Transit', date: '2024-01-15' },
];

export const BUYER_SAVED = [
  { id: '1', cropName: 'Premium Rice', emoji: '🍚', price: 1250, unit: 'RWF/kg', seller: 'Alice Mukamana', location: 'Kirehe' },
  { id: '2', cropName: 'Fresh Tomatoes', emoji: '🍅', price: 620, unit: 'RWF/kg', seller: 'Grace Ingabire', location: 'Kigali' },
];
