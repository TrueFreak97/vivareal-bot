import got from 'got';
import { Webhook } from 'discord-webhook-node';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

const API_URL = "https://glue-api.vivareal.com/v4/listings?portal=VIVAREAL&business=RENTAL&sort=MOST_RECENT&usableAreasMin=40&rentalTotalPriceMax=6200&rentTotalPrice=true&viewport=-43.1600,-22.9180|-43.2376,-23.0098&page=1&size=10";

async function testConnection() {
    console.log("🛠️ STARTING EMERGENCY DEBUG...");
    
    try {
        // 1. Test Discord immediately
        console.log("📤 Attempting one direct Discord ping...");
        await hook.send("🚀 **Bot Debug:** Connection test starting!");
        console.log("✅ If you see this, the Webhook URL is working.");

        // 2. Fetch data
        const response = await got(API_URL, {
            headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
            http2: true,
            responseType: 'json'
        });

        const listings = response.body?.search?.result?.listings || [];
        console.log(`📡 API returned ${listings.length} items.`);

        if (listings.length > 0) {
            const first = listings[0];
            console.log("📝 Examining first item structure...");
            
            // Log exactly what the ID and Link look like to see if they are undefined
            console.log("ID:", first.listing?.id);
            console.log("Link:", first.link?.href);

            const neighborhood = first.listing?.address?.neighborhood || "Unknown";
            const link = "https://www.vivareal.com.br" + (first.link?.href || "");
            
            console.log(`✨ FORCING NOTIFICATION FOR: ${neighborhood}`);
            await hook.send(`🚨 **Debug Check!**\nFound a place in **${neighborhood}**.\n[Link](${link})`);
        }

    } catch (error) {
        console.error("❌ ERROR DURING DEBUG:", error.message);
        if (error.response) console.log("Status Code:", error.response.statusCode);
    }
}

testConnection();