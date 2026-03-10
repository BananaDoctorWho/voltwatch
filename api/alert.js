import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, deals } = req.body;

  if (!to || !deals || deals.length === 0) {
    return res.status(400).json({ error: 'Missing recipient or deals data' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  const dealRows = deals.map(d => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
        <strong style="color:#f0f0f0;">${d.brand} ${d.name}</strong>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;color:#c8ff00;font-family:monospace;">
        $${d.currentPrice.toLocaleString()}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;color:#666;text-decoration:line-through;font-family:monospace;">
        $${d.msrp.toLocaleString()}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
        <span style="background:rgba(34,197,94,0.15);color:#22c55e;padding:3px 10px;font-family:monospace;font-size:12px;border:1px solid rgba(34,197,94,0.3);">
          –$${d.msrp - d.currentPrice} (${(((d.msrp - d.currentPrice) / d.msrp) * 100).toFixed(0)}% off)
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
        <a href="${d.url}" style="color:#c8ff00;font-family:monospace;font-size:12px;">View Deal →</a>
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="border-bottom:2px solid #c8ff00;padding-bottom:24px;margin-bottom:32px;">
      <div style="font-size:36px;font-weight:900;letter-spacing:0.1em;color:#c8ff00;">⚡ VOLTWATCH</div>
      <div style="font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.2em;margin-top:4px;">
        eBike Price Intelligence — Deal Alert
      </div>
    </div>

    <!-- Alert banner -->
    <div style="background:#111;border-left:3px solid #c8ff00;padding:16px 20px;margin-bottom:28px;">
      <div style="font-size:18px;font-weight:600;color:#f0f0f0;">
        🔥 ${deals.length} deal${deals.length > 1 ? 's' : ''} detected on your watchlist
      </div>
      <div style="font-family:monospace;font-size:12px;color:#666;margin-top:4px;">
        Scanned ${new Date().toLocaleString()} · VoltWatch AI Agent
      </div>
    </div>

    <!-- Deals table -->
    <table style="width:100%;border-collapse:collapse;background:#111;border:1px solid #222;">
      <thead>
        <tr style="background:#181818;">
          <th style="padding:10px 16px;text-align:left;font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #222;">Bike</th>
          <th style="padding:10px 16px;text-align:left;font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #222;">Sale Price</th>
          <th style="padding:10px 16px;text-align:left;font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #222;">MSRP</th>
          <th style="padding:10px 16px;text-align:left;font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #222;">Savings</th>
          <th style="padding:10px 16px;text-align:left;font-family:monospace;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.15em;border-bottom:1px solid #222;">Link</th>
        </tr>
      </thead>
      <tbody style="color:#f0f0f0;">
        ${dealRows}
      </tbody>
    </table>

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1a1a1a;font-family:monospace;font-size:11px;color:#444;text-align:center;">
      VoltWatch · eBike Price Intelligence · You're receiving this because you subscribed to deal alerts.
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"VoltWatch ⚡" <${process.env.GMAIL_USER}>`,
      to,
      subject: `⚡ VoltWatch: ${deals.length} eBike deal${deals.length > 1 ? 's' : ''} detected!`,
      html
    });
    return res.status(200).json({ success: true, sent: to });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
