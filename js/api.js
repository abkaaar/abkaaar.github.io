async function fetchContent(path, fallbackUrl) {
  const base = (window.NOTION_API_BASE || '').replace(/\/+$/, '');
  if (base) {
    try {
      const res = await fetch(`${base}${path}`, { cache: 'no-store' });
      if (res.ok) return res.json();
      console.warn(`API ${path} failed (${res.status}), trying fallback`);
    } catch (err) {
      console.warn(`API ${path} error, trying fallback`, err);
    }
  }
  const res = await fetch(fallbackUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${fallbackUrl}`);
  return res.json();
}

window.fetchContent = fetchContent;
