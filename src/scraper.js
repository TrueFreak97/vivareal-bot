const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.vivareal.com.br';

function parsePrice(text) {
  return parseInt(text.replace(/\D/g, '')) || 0;
}

function parseArea(text) {
  const match = text.match(/(\d+)\s*m²/);
  return match ? parseInt(match[1]) : 0;
}

async function fetchListings() {
  const url = `${BASE_URL}/aluguel/rj/rio-de-janeiro/apartamento_residencial/`;

  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio.load(data);

  const listings = [];

  $('.property-card').each((i, el) => {
    const title = $(el).find('.property-card__title').text().trim();
    const priceText = $(el).find('.property-card__price').text();
    const details = $(el).find('.property-card__detail-value').text();

    const link = BASE_URL + $(el).find('a').attr('href');

    const price = parsePrice(priceText);
    const area = parseArea(details);

    const description = $(el).text().toLowerCase();

    listings.push({
      title,
      price,
      area,
      link,
      description
    });
  });

  return listings;
}

module.exports = { fetchListings };