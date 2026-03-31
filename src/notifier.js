const axios = require('axios');

async function sendToDiscord(listings) {
  for (const l of listings) {
    await axios.post(process.env.DISCORD_WEBHOOK, {
      content: `🏠 **${l.title}**
💰 ${l.price}
🔗 ${l.link}`
    });
  }
}

module.exports = { sendToDiscord };