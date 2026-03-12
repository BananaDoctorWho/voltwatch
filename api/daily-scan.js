// Runs every day at 9am UTC via Vercel Cron
// Asks Groq AI to estimate current prices, stores to Vercel KV

import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

const BIKES = [
  { id: 'revibikes-cougar',    name: 'Revibikes Cougar',          msrp: 1699, url: 'https://www.revibikes.com/products/cougar-electric-motorbikes' },
  { id: 'lectric-xp4',         name: 'Lectric XP4 750W',          msrp: 1299, url: 'https://lectricebikes.com/collections/xp4-ebikes' },
  { id: 'aventon-aventure3',   name: 'Aventon Aventure 3',        msrp: 1999, url: 'https://www.aventon.com/products/aventure-3-ebike' },
  { id: 'rad-radrover6',       name: 'Rad Power RadRover 6 Plus', msrp: 1999, url: 'https://www.radpowerbikes.com/collections/electric-bikes' },
  { id: 'velotric-discover2',  name: 'Velotric Discover 2',       msrp: 1799, url: 'https://www.velotricbike.com/products/velotric-discover-2-ebike' },
  { id: 'ride1up-prodigy',     name: 'Ride1Up Prodigy',           msrp: 2095, url: 'https://ride1up.com/product/prodigy/' },
];

export default async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const label = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const results = [];

  try {
    // Ask Groq to estimate current prices for all bikes
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `You are an eBike price tracking assistant. Given a list of bikes with their MSRP, return your best estimate of their current sale price today (${today}). Consider that bikes are frequently on sale 5-20% off MSRP. Respond ONLY as a JSON array: [{"id":"...","price":0}, ...]. No markdown, no explanation.`
          },
          {
            role: 'user',
            content: `Estimate today's actual selling price for each bike (may be on sale below MSRP):\n${JSON.stringify(BIKES.map(b => ({ id: b.id, name: b.name, msrp: b.msrp })))}`
          }
        ]
      })
    });

    const groqData = await groqRes.json();
    const text = groqData.choices?.[0]?.message?.content || '[]';
    const prices = JSON.parse(text.replace(/```json|```/g, '').trim());

    // Store each bike's price into KV history
    for (const bike of BIKES) {
      const priceEntry = prices.find(p => p.id === bike.id);
      const price = priceEntry?.price || bike.msrp;

      // Read existing history
      const key = `history:${bike.id}`;
      let history = await kv.get(key) || [];

      // Avoid duplicate entries for same day
      const alreadyToday = history.some(h => h.date === today);
      if (!alreadyToday) {
        history.push({ date: today, label, price, type: 'auto' });
        // Keep max 365 days
        if (history.length > 365) history = history.slice(-365);
        await kv.set(key, history);
      }

      results.push({ id: bike.id, date: today, price, skipped: alreadyToday });
    }

    return res.status(200).json({ success: true, date: today, results });
  } catch (err) {
    console.error('Daily scan error:', err);
    return res.status(500).json({ error: err.message });
  }
}
