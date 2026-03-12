// Returns full price history for all bikes from Vercel KV
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });

const BIKE_IDS = [
  'revibikes-cougar',
  'lectric-xp4',
  'aventon-aventure3',
  'rad-radrover6',
  'velotric-discover2',
  'ride1up-prodigy',
];

// Jan 1 2026 baseline prices (MSRP)
const BASELINES = {
  'revibikes-cougar':   { date: '2026-01-01', label: 'Jan 1', price: 1699, type: 'baseline' },
  'lectric-xp4':        { date: '2026-01-01', label: 'Jan 1', price: 1299, type: 'baseline' },
  'aventon-aventure3':  { date: '2026-01-01', label: 'Jan 1', price: 1999, type: 'baseline' },
  'rad-radrover6':      { date: '2026-01-01', label: 'Jan 1', price: 1999, type: 'baseline' },
  'velotric-discover2': { date: '2026-01-01', label: 'Jan 1', price: 1799, type: 'baseline' },
  'ride1up-prodigy':    { date: '2026-01-01', label: 'Jan 1', price: 2095, type: 'baseline' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const history = {};

    for (const id of BIKE_IDS) {
      const stored = await kv.get(`history:${id}`) || [];
      // Prepend baseline if not already present
      const hasBaseline = stored.some(h => h.date === '2026-01-01');
      history[id] = hasBaseline ? stored : [BASELINES[id], ...stored];
    }

    // Also return any custom bike IDs passed as query param
    const customIds = req.query.custom ? req.query.custom.split(',') : [];
    for (const id of customIds) {
      if (id.startsWith('custom-')) {
        const stored = await kv.get(`history:${id}`) || [];
        if (stored.length) history[id] = stored;
      }
    }

    return res.status(200).json({ success: true, history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
