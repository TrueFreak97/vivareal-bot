import got from 'got';
import { Webhook } from 'discord-webhook-node';
import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

// Rio Zona Sul - Max 6200 BRL
const API_URL = "https://glue-api.vivareal.com/v4/listings?portal=VIVAREAL&includeFields=search(result(listings(listing(id,title,address,pricingInfos,link),link)))&business=RENTAL&sort=MOST_RECENT&usableAreasMin=40&rentalTotalPriceMax=6200&rentTotalPrice=true&viewport=-43.1600,-22.9180|-43.2376,-23.0098&page=1&size=30";

// Persistent Database Path (For Railway Volumes)
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'listings.db') 
    : path.resolve(__dirname, 'listings.db');

const db = new Database(dbPath);
db.prepare("CREATE TABLE IF NOT EXISTS seen_listings (id TEXT PRIMARY KEY)").run();

async function checkVivaReal() {
    console.log(`\n--- 🕵️ Checking VivaReal [${new Date().toLocaleTimeString()}] ---`);
    
    try {
        const response = await got(API_URL, {
            headers: {
                'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
                'x-domain': '.vivareal.com.br',
                'x-deviceid': 'f' + Math.random().toString(16).slice(2, 15)
            },
            http2: true,
            responseType: 'json',
            timeout: { request: 15000 }
        });

        const listings = response.body?.search?.result?.listings || [];
        console.log(`📡 API returned ${listings.length} items.`);

        let newCount = 0;

        for (const item of listings) {
            const listing = item.listing;
            if (!listing || !item.link?.href) continue;

            const id = listing.id;
            
            // Check if seen
            const alreadySeen = db.prepare("SELECT id FROM seen_listings WHERE id = ?").get(id);

            if (!alreadySeen) {
                const neighborhood = listing.address?.neighborhood || "Rio";
                const price = listing.pricingInfos?.[0]?.rentalTotalPrice;
                const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
                const link = "https://www.vivareal.com.br" + item.link.href;

                console.log(`✨ NEW! Found in ${neighborhood} for ${formattedPrice}`);

                try {
                    await hook.send(`🏠 **New Listing in ${neighborhood}!**\n**Price:** ${formattedPrice}\n**Title:** ${listing.title || 'Apartment'}\n[View Listing](${link})`);
                    db.prepare("INSERT INTO seen_listings (id) VALUES (?)").run(id);
                    newCount++;
                } catch (discordErr) {
                    console.error("❌ Discord Notification Error:", discordErr.message);
                }
            }
        }

        console.log(newCount > 0 ? `✅ Sent ${newCount} new notifications.` : "😴 No new listings.");

    } catch (error) {
        console.error('❌ Scraper Error:', error.message);
    }
}

// 1. Run immediately on start
checkVivaReal();

// 2. Schedule every 10 minutes (using node-cron)
cron.schedule('*/10 * * * *', checkVivaReal);

console.log("🚀 Monitor is active. Checking every 10 minutes...");