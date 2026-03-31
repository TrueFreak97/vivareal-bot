require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Vivareal bot running');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});

const cron = require('node-cron');
const { fetchListings } = require('./scraper');
const { applyFilters } = require('./filters');
const { sendToDiscord } = require('./notifier');

app.get('/run', async (req, res) => {
  const listings = await fetchListings();
  const filtered = applyFilters(listings);

  await sendToDiscord(filtered);

  res.json(filtered);
});

// run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking listings...');

  const listings = await fetchListings();
  const filtered = applyFilters(listings);

  if (filtered.length) {
    await sendToDiscord(filtered);
  }
});