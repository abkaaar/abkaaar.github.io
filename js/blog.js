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

async function loadBlog() {
  const root = document.getElementById('blog-root');
  if (!root) return;

  try {
    const res = await fetch('/data/blogs.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();

    if (!posts.length) {
      root.innerHTML =
        '<p class="empty-state">No posts yet. Add published entries in Notion and run <code>npm run sync</code>.</p>';
      return;
    }

    root.innerHTML = posts
      .map((post) => {
        const href = `/blog/${encodeURIComponent(post.slug)}/`;
        const dateLabel = formatDate(post.date);
        return `
          <article class="content-card">
            <h3><a href="${href}">${escapeHtml(post.name)}</a></h3>
            ${dateLabel ? `<p class="content-meta">${escapeHtml(dateLabel)}</p>` : ''}
            ${post.summary ? `<p>${escapeHtml(post.summary)}</p>` : ''}
            <a href="${href}" class="link__text">Read <span>&rarr;</span></a>
          </article>
        `;
      })
      .join('');
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p class="empty-state">Could not load posts. Run <code>npm run sync</code> then refresh.</p>';
  }
}

loadBlog();
