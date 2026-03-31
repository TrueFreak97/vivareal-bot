const TARGET_AREAS = [
  'copacabana',
  'ipanema',
  'leblon',
  'botafogo',
  'catete',
  'gloria',
  'tijuca',
  'laranjeiras'
];

function isInTargetArea(listing) {
  const text = (listing.title + listing.description).toLowerCase();
  return TARGET_AREAS.some(area => text.includes(area));
}

function isFurnished(listing) {
  return listing.description.includes('mobiliado');
}

function applyFilters(listings) {
  return listings.filter(l => {
    return (
      l.price > 0 &&
      l.price <= 6200 &&
      l.area >= 40 &&
      isFurnished(l) &&
      isInTargetArea(l)
    );
  });
}

module.exports = { applyFilters };