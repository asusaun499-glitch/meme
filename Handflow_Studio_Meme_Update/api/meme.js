const categories = {
  thumb: 'based', index: 'programmer', point: 'programmer', middle: 'dank', middle_finger: 'dank',
  ring: 'cringe', pinky: 'surreal', peace: 'reaction', open: 'reaction', fist: 'reaction',
  pinch: 'cringe', ok: 'based', thumb_index: 'based', index_middle: 'reaction',
  thumb_index_middle: 'dank', ring_pinky: 'cringe', thumb_middle: 'dank', thumb_ring: 'cringe',
  thumb_pinky: 'surreal', index_ring: 'programmer', index_pinky: 'surreal', middle_ring: 'dank',
  middle_pinky: 'dank', thumb_index_ring: 'based', thumb_index_pinky: 'surreal',
  thumb_middle_ring: 'dank', thumb_middle_pinky: 'dank', thumb_ring_pinky: 'cringe',
  index_middle_ring: 'reaction', index_middle_pinky: 'surreal', index_ring_pinky: 'cringe',
  middle_ring_pinky: 'dank', thumb_index_middle_ring: 'reaction', thumb_index_middle_pinky: 'dank',
  thumb_index_ring_pinky: 'cringe', thumb_middle_ring_pinky: 'surreal', index_middle_ring_pinky: 'reaction',
  thumb_index_middle_ring_pinky: 'reaction'
};

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const gesture = String(req.query.gesture || 'reaction').slice(0, 80);
  const category = categories[gesture] || 'reaction';
  try {
    const upstream = await fetch(`https://cubsoftware.site/api/memes/${category}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Handflow-AI-Hand-Tracking-Studio/1.0' },
      signal: AbortSignal.timeout(4000)
    });
    if (!upstream.ok) return res.status(502).json({ error: 'Meme API unavailable' });
    const meme = await upstream.json();
    if (typeof meme.url !== 'string' || !meme.url) {
      return res.status(502).json({ error: 'No image meme available' });
    }
    const mediaUrl = new URL(meme.url, 'https://cubsoftware.site');
    if (mediaUrl.protocol !== 'https:' || !['cubsoftware.site','i.redd.it','preview.redd.it'].includes(mediaUrl.hostname)) {
      return res.status(502).json({ error: 'Invalid meme image URL' });
    }
    return res.status(200).json({ url: mediaUrl.href, title: String(meme.title || ''), category: String(meme.category || category) });
  } catch {
    return res.status(502).json({ error: 'Meme API unavailable' });
  }
};