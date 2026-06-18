export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const DATABASE_ID = '1b298096b9c24b34829b150b7e11e6e7'; // Training Log

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'NOTION_TOKEN not set in environment variables' });
  }

  const { sessionName, dayType, date, energy, bodyweight, notes, exerciseText } = req.body;

  const properties = {
    'Session': { title: [{ text: { content: sessionName || 'Untitled Session' } }] },
    'Day Type': { select: { name: dayType } },
    'Date': { date: { start: date } },
    'Location': { select: { name: 'FitLab AZ' } },
  };

  if (energy) properties['Energy'] = { select: { name: energy } };
  if (bodyweight) properties['Bodyweight (lbs)'] = { number: parseFloat(bodyweight) };
  if (notes) properties['Notes'] = { rich_text: [{ text: { content: notes } }] };

  const body = {
    parent: { database_id: DATABASE_ID },
    properties,
    children: [
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Exercise Log' } }]
        }
      },
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: exerciseText || 'No sets logged.' } }]
        }
      }
    ]
  };

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Notion API error' });
    }

    return res.status(200).json({ success: true, page_id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
