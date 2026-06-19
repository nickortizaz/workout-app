export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID  = '40ad8b51-2ff2-4aa3-ac77-5bf82e34b4d9';
  if (!NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN is not set in Vercel environment variables.' });

  const { sessionName, dayType, date, energy, bodyweight, notes, exerciseText, duration, existingPageId } = req.body || {};
  const safeText = (s = '') => s.length > 1900 ? s.slice(0, 1900) + '…' : s;

  const properties = {
    'Session':  { title:  [{ text: { content: sessionName || 'Untitled Session' } }] },
    'Day Type': { select: { name: dayType || 'Push' } },
    'Date':     { date:   { start: date || new Date().toISOString().split('T')[0] } },
    'Location': { select: { name: 'FitLab AZ' } },
  };
  if (energy)     properties['Energy']           = { select: { name: energy } };
  if (bodyweight) properties['Bodyweight (lbs)'] = { number: parseFloat(bodyweight) };
  if (notes)      properties['Notes']            = { rich_text: [{ text: { content: safeText(notes) } }] };
  if (duration)   properties['Duration (min)']   = { number: parseInt(duration) };

  const headers = { 'Authorization': `Bearer ${NOTION_TOKEN}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

  try {
    // UPDATE existing page if we have its ID (prevents duplicates)
    if (existingPageId) {
      const upd = await fetch(`https://api.notion.com/v1/pages/${existingPageId}`, {
        method: 'PATCH', headers, body: JSON.stringify({ properties }),
      });
      if (upd.ok) {
        // Replace page content: clear children then re-add
        const kids = await fetch(`https://api.notion.com/v1/blocks/${existingPageId}/children`, { headers });
        const kidData = await kids.json();
        if (kidData.results) {
          for (const block of kidData.results) {
            await fetch(`https://api.notion.com/v1/blocks/${block.id}`, { method: 'DELETE', headers });
          }
        }
        await fetch(`https://api.notion.com/v1/blocks/${existingPageId}/children`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ children: [
            { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Exercise Log' } }] } },
            { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: safeText(exerciseText) || 'No sets logged.' } }] } },
          ] }),
        });
        return res.status(200).json({ success: true, page_id: existingPageId, updated: true });
      }
      // if update failed (page deleted etc), fall through to create
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST', headers,
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties,
        children: [
          { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: 'Exercise Log' } }] } },
          { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: safeText(exerciseText) || 'No sets logged.' } }] } },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion API error', notion_code: data.code });
    return res.status(200).json({ success: true, page_id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}
