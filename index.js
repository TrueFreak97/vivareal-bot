import got from 'got';
import { Webhook } from 'discord-webhook-node';
import Database from 'better-sqlite3'; // New, more stable library
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);
const API_URL = "https://glue-api.vivareal.com/v4/listings?portal=VIVAREAL&business=RENTAL&sort=MOST_RECENT&usableAreasMin=40&rentalTotalPriceMax=6200&rentTotalPrice=true&viewport=-43.1600,-22.9180|-43.2376,-23.0098&page=1&size=10";

async function testConnection() {
    console.log("🛠️ STARTING EMERGENCY DEBUG (BETTER-SQLITE3)...");
    
    try {
        // 1. Database Setup
        const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
            ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'listings.db') 
            : path.resolve(__dirname, 'listings.db');
            
        const db = new Database(dbPath);
        db.prepare("CREATE TABLE IF NOT EXISTS seen_listings (id TEXT PRIMARY KEY)").run();

        // 2. Test Discord
        console.log("📤 Sending Test Ping...");
        await hook.send("🚀 **Bot Debug:** Connection test starting with better-sqlite3!");

        // 3. Fetch Data
        const response = await got(API_URL, {
            headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
            http2: true,
            responseType: 'json'
        });

        const listings = response.body?.search?.result?.listings || [];
        console.log(`📡 API returned ${listings.length} items.`);

        if (listings.length > 0) {
            const first = listings[0];
            const id = first.listing?.id;
            const neighborhood = first.listing?.address?.neighborhood || "Unknown";
            const link = "https://www.vivareal.com.br" + (first.link?.href || "");
            
            console.log(`✨ FORCING NOTIFICATION FOR: ${neighborhood}`);
            await hook.send(`🚨 **Success!** Found a place in **${neighborhood}**.\n[Link](${link})`);
            
            // Mark as seen
            db.prepare("INSERT OR IGNORE INTO seen_listings (id) VALUES (?)").run(id);
        }
        
        db.close();

    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

testConnection();