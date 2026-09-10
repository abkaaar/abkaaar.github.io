function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function loadPost() {
  const root = document.getElementById('post-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) {
    root.innerHTML = '<p class="empty-state">Missing post slug.</p>';
    return;
  }

  try {
    const base = (window.NOTION_API_BASE || '').replace(/\/+$/, '');
    if (!base) {
      root.innerHTML =
        '<p class="empty-state">Set <code>NOTION_API_BASE</code> in <code>js/config.js</code> after deploying the Worker.</p>';
      return;
    }

    const res = await fetch(`${base}/blogs/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const post = await res.json();

    document.title = `${post.name} | Abubakar Abdullahi`;
    const dateLabel = formatDate(post.date);
    const cover = post.coverUrl
      ? `<img src="${escapeHtml(post.coverUrl)}" alt="" style="margin-top: 2rem; max-width: 100%;" />`
      : '';

    root.innerHTML = `
      <p class="content-meta"><a href="/blog/">Blog</a></p>
      <h1>${escapeHtml(post.name)}</h1>
      ${dateLabel ? `<p class="content-meta">${escapeHtml(dateLabel)}</p>` : ''}
      ${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''}
      ${cover}
      <div class="prose">${post.contentHtml || ''}</div>
    `;
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p class="empty-state">Could not load this post. Check the Worker URL and that the post is Published.</p>';
  }
}

loadPost();
