(() => {
  // Public, keyless CUB meme endpoint. Cache results per API category to reduce requests.
  const cache = new Map();
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
  window.fetchGestureMeme = async (gesture) => {
    const category = categories[gesture] || 'reaction';
    if (cache.has(category)) return cache.get(category);
    const request = fetch(`/api/meme?gesture=${encodeURIComponent(gesture)}`, { headers: { Accept: 'application/json' } })
      .then(async response => {
        if (!response.ok) throw new Error(`Meme API returned ${response.status}`);
        const data = await response.json();
        const url = typeof data.url === 'string' && data.url.startsWith('https://') ? data.url : '';
        if (!url) throw new Error('No image meme in API response');
        return { url, title: String(data.title || ''), category: String(data.category || category) };
      })
      .catch(error => { cache.delete(category); throw error; });
    cache.set(category, request);
    return request;
  };
})();