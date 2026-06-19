export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN is not set.' });

  const { pageId } = req.body || {};
  if (!pageId) return res.status(400).json({ error: 'No pageId provided' });

  const headers = { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

  try {
    // Archive = move to Notion trash (recoverable 30 days). Safer than hard delete.
    const r = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH', headers, body: JSON.stringify({ archived: true }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || 'Notion delete failed' });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
