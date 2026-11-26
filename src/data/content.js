// All editable site content lives here.
export const brand = {
  name: 'Fusk-it',
  nameTa: 'பஸ்க்-இட்',
  hashtag: '#Lets Fusk it',
  tagline: 'A little wooden cart full of dessert.',
  motto: 'Fusing Flavors, Fuelling Fun', // from fuskit.com
  taglineTa: 'முதலில் இனிப்பு, பிறகு மற்றவை.', // TODO: verify Tamil line with owner
}

// TODO: verify all items and prices with owner.
// Drafted from the TV menu board photo + dishes reviewers name on Restaurant Guru (Malaysian/iced Milo,
// gulab jamun bun, bread omelette, "Paal Panji"). Milo packets are visible on the shelf in the daytime photo.
// Prices are only those readable on the cart's TV board photo (₹69, ₹29, ₹15); items without a confirmed price
// show no price at all rather than a placeholder. TODO: owner to confirm every item, price and description.
export const menu = [
  { category: 'Popcorn', categoryTa: 'பாப்கார்ன்', items: [
    { name: 'Fusk Popcorn', price: 69, desc: 'Popped fresh in the machine, warm and buttery', best: true },
  ]},
  { category: 'Soft-serve', categoryTa: 'சாஃப்ட் சர்வ்', items: [
    { name: 'Fusky Soft-it', price: 29, desc: 'Creamy swirl in a crisp cone', best: true },
  ]},
  { category: 'Milo & hot drinks', categoryTa: 'மைலோ & சூடான பானங்கள்', items: [
    { name: 'Malaysian Milo', desc: 'Thick, chocolatey, the way they make it in KL', best: true },
    { name: 'Iced Milo', desc: 'Milo over ice for warm ECR nights' },
    { name: 'Hot Badam Milk', desc: 'Almond milk with saffron, steaming hot' },
    { name: 'Masala Milk', desc: 'Spiced milk with a pinch of pepper and cardamom' },
    { name: 'Hot Chocolate', desc: 'Rich cocoa, topped up to the brim' },
  ]},
  { category: 'Paal Punch', categoryTa: 'பால் பஞ்ச்', items: [
    { name: 'Paal Panji', desc: "The cart's own milk punch, chilled and sweet", best: true },
  ]},
  { category: 'Bites', categoryTa: 'சிறு தீனி', items: [
    { name: 'Gulab Jamun Bun', desc: 'Soft bun stuffed with warm gulab jamun', best: true },
    { name: 'Bread Omelette', desc: 'Street-style, peppery and buttery' },
    { name: 'Little treat', price: 15, desc: 'A small sweet for the road' },
  ]},
]

export const freeFood = {
  en: "If you can't buy food, it's for free.",
  how: 'Just ask at the counter. No questions asked.', // TODO: owner's exact words
  ta: 'உணவு வாங்க முடியவில்லையா? இலவசம்', // as written on the cart's own chalkboard (hero photo)
  paragraph: '', // TODO: owner's words
}

// Sources: Zomato / Restaurant Guru / Mappls listings (Nov 2026). TODO: owner to confirm every field.
export const visit = {
  area: 'East Coast Road, Akkarai, Chennai',
  address: '2/12, Paniyur, East Coast Road, near Sea Cliff Conclave, Akkarai, Chennai', // TODO: verify (Zomato listing)
  hours: '10 AM – 6 AM, every day', // TODO: verify — Restaurant Guru lists this but contradicts itself
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fusk-it%20ECR%20Akkarai%20Chennai', // TODO: replace with the exact place link
  instagram: 'https://www.instagram.com/fusk.it/', // verified account @fusk.it (50K followers)
  phone: '+91 91768 88048', // TODO: verify (listed on Restaurant Guru)
  rating: { score: 4.3, count: 624, source: 'Google' }, // TODO: verify before launch (via Restaurant Guru, Nov 2026)
  reviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Fusk-it%20ECR%20Akkarai%20Chennai', // TODO: link to the Google reviews tab
}

export const seedNotes = [
  'best popcorn on this street', 'came for dessert, stayed for the vibe', 'soft-serve at midnight = joy',
  'the panda says hi', 'eat dessert first!!', 'my happy place', 'paal punch hits different',
  'thank you for being kind', 'popcorn + friends', 'see you tomorrow', 'love the wheels',
  'cutest cart in Chennai', 'sweet tooth satisfied', 'one more scoop pls', 'good vibes only',
  'came back 3 times this week', 'the lights!!', 'hot badam on a rainy night', 'smile :)',
  'first date spot', 'exam stress cured', 'kindness is free here', 'more toys pls', '#LetsFuskIt', 'stay sweet',
]

// Outlets, from the brand's Instagram bio (@fusk.it: "ECR", "Bessy", "@fuskit.kolathur"), a Katpadi post credit,
// and the Bangalore account (@fuskit.bangalore). TODO: owner to confirm addresses, hours and exact map links.
const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
export const branches = [
  { name: 'ECR', area: 'Akkarai', city: 'Chennai', flagship: true, ig: 'fusk.it', maps: maps('Fusk-it Akkarai ECR Chennai') },
  { name: 'Bessy', area: 'Besant Nagar', city: 'Chennai', ig: 'fusk.it', maps: maps('Fusk-it Besant Nagar Chennai') },
  { name: 'Kolathur', area: 'Kolathur', city: 'Chennai', ig: 'fuskit.kolathur', maps: maps('Fusk-it Kolathur Chennai') },
  { name: 'Katpadi', area: 'Katpadi', city: 'Vellore', ig: 'fusk.it', maps: maps('Fusk-it Katpadi Vellore') },
  { name: 'Kammanahalli', area: 'Kammanahalli', city: 'Bengaluru', ig: 'fuskit.bangalore', maps: maps('Fusk-it Kammanahalli Bangalore') },
]
