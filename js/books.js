function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function resolveAsset(url) {
  if (!url) return null;
  if (/^(https?:|data:)/i.test(url)) return url;
  return '/' + String(url).replace(/^\//, '');
}

async function loadBooks() {
  const root = document.getElementById('books-root');
  if (!root) return;

  try {
    const res = await fetch('/data/books.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const books = await res.json();

    if (!books.length) {
      root.innerHTML =
        '<p class="empty-state">No books yet. Add published entries in Notion and run <code>npm run sync</code>.</p>';
      return;
    }

    root.innerHTML = `<div class="books-grid">${books
      .map((book) => {
        const cover = book.coverUrl
          ? `<img src="${escapeHtml(resolveAsset(book.coverUrl))}" class="book-card__cover" alt="Cover of ${escapeHtml(book.name)}" />`
          : '<div class="book-card__cover" aria-hidden="true"></div>';
        return `
          <article class="book-card">
            ${cover}
            <span class="book-card__status">${escapeHtml(book.status || 'Want to read')}</span>
            <h3>${escapeHtml(book.name)}</h3>
            ${book.author ? `<p class="content-meta">${escapeHtml(book.author)}</p>` : ''}
            ${book.notes ? `<p>${escapeHtml(book.notes)}</p>` : ''}
          </article>
        `;
      })
      .join('')}</div>`;
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p class="empty-state">Could not load books. Run <code>npm run sync</code> then refresh.</p>';
  }
}

loadBooks();
