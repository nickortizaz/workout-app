export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = '1b298096-b9c2-4b34-829b-150b7e11e6e7';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN is not set in Vercel environment variables.' });
  }

  const { sessionName, dayType, date, energy, bodyweight, notes, exerciseText } = req.body || {};

  // Notion rich_text blocks have a 2000 char limit — truncate safely
  const safeText = (str = '') => str.length > 1900 ? str.slice(0, 1900) + '…' : str;

  const properties = {
    'Session':  { title:  [{ text: { content: sessionName || 'Untitled Session' } }] },
    'Day Type': { select: { name: dayType || 'Push' } },
    'Date':     { date:   { start: date || new Date().toISOString().split('T')[0] } },
    'Location': { select: { name: 'FitLab AZ' } },
  };

  if (energy)     properties['Energy']          = { select: { name: energy } };
  if (bodyweight) properties['Bodyweight (lbs)'] = { number: parseFloat(bodyweight) };
  if (notes)      properties['Notes']            = { rich_text: [{ text: { content: safeText(notes) } }] };

  const blocks = [
    {
      object: 'block', type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Exercise Log' } }] }
    },
    {
      object: 'block', type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: safeText(exerciseText) || 'No sets logged.' } }] }
    }
  ];

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type':   'application/json',
      },
      body: JSON.stringify({ parent: { database_id: DATABASE_ID }, properties, children: blocks }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Surface the exact Notion error so we can diagnose
      return res.status(response.status).json({
        error: data.message || 'Notion API error',
        notion_code: data.code,
        notion_status: response.status,
      });
    }

    return res.status(200).json({ success: true, page_id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}
