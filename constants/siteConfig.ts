export const SITE_CONFIG = {
  name: 'Super Townhouse',
  tagline: 'Premium Hotel Experience in Bengaluru',
  description:
    'Super Townhouse — A premium 3-star hotel in Whitefield, ITPL, Bengaluru. Book comfortable rooms with modern amenities for business and leisure travelers.',
  url: 'https://supertownhouse.in',
  location: {
    address: 'ITPL, Whitefield',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560066',
    coordinates: { lat: 12.9791, lng: 77.7279 },
    googleMapsUrl: 'https://maps.google.com/?q=ITPL+Whitefield+Bengaluru',
  },
  contact: {
    phone: '+91 80 0000 0000',
    email: 'reservations@supertownhouse.in',
    whatsapp: '+91 99999 00000',
  },
  social: {
    instagram: 'https://instagram.com/supertownhouse',
    facebook: 'https://facebook.com/supertownhouse',
    twitter: 'https://twitter.com/supertownhouse',
  },
  seo: {
    keywords: ['hotel whitefield', 'hotel ITPL', 'hotel bengaluru', 'super townhouse', 'book hotel bangalore'],
    ogImage: '/images/og-default.jpg',
    twitterHandle: '@supertownhouse',
  },
  rating: {
    score: 4.3,
    count: 1240,
    platform: 'Google',
  },
  hotel: {
    starRating: 3,
    totalRooms: 45,
    checkInTime: '14:00',
    checkOutTime: '11:00',
  },
} as const;
