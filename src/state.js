const seen = new Set();

function isNew(listing) {
  if (seen.has(listing.link)) return false;
  seen.add(listing.link);
  return true;
}

module.exports = { isNew };

const { isNew } = require('./state');

const filtered = applyFilters(listings).filter(isNew);