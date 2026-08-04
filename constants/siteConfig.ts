export const SITE_CONFIG = {
  name: 'Super Townhouse',
  tagline: 'Premium Hotel Experience in Bengaluru',
  description:
    'Super Townhouse — A premium 3-star hotel in Whitefield, ITPL, Bengaluru. Book comfortable rooms with modern amenities for business and leisure travelers.',
  url: 'https://supertownhouse.in',
  location: {
    address: 'CA, Plot Number 1, 87, near Aster Hospital, Sadara Mangala Industrial Area',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560048',
    coordinates: { lat: 12.988031, lng: 77.733833 },
    googleMapsUrl: 'https://maps.app.goo.gl/iRQ79dWgyT8pEbJH7',
  },
  contact: {
    phone: '+91 62091 24788',
    email: 'reservations@supertownhouse.in',
    whatsapp: '+916209124788',
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
