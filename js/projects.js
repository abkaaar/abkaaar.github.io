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

function projectCardHtml(project) {
  const tags = (project.tags || [])
    .map((tag) => `<li>${escapeHtml(tag)}</li>`)
    .join('');
  const site = project.siteUrl
    ? `<a href="${escapeHtml(project.siteUrl)}" target="_blank" rel="noopener noreferrer" class="link__text">Visit Site <span>&rarr;</span></a>`
    : '';
  const github = project.githubUrl
    ? `<a href="${escapeHtml(project.githubUrl)}" title="View Source Code" target="_blank" rel="noopener noreferrer"><img src="/Images/github.svg" class="work__code" alt="GitHub" /></a>`
    : '';
  const image = project.imageUrl
    ? `<div class="work__image-box"><img src="${escapeHtml(resolveAsset(project.imageUrl))}" class="work__image" alt="${escapeHtml(project.name)}" /></div>`
    : '';

  return `
    <div class="work__box">
      <div class="work__text">
        <h3>${escapeHtml(project.name)}</h3>
        <p>${escapeHtml(project.description)}</p>
        ${tags ? `<ul class="work__list">${tags}</ul>` : ''}
        <div class="work__links">${site}${github}</div>
      </div>
      ${image}
    </div>
  `;
}

async function loadProjects() {
  const root = document.getElementById('projects-root');
  if (!root) return;

  try {
    const res = await fetch('/data/projects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const projects = await res.json();
    const featured = projects.filter((p) => p.featured);
    const more = projects.filter((p) => !p.featured);

    let html = featured.map(projectCardHtml).join('');
    if (more.length) {
      html += `
        <div class="more__work-container">
          <div class="work__btn-container">
            <button class="work__button btn" id="load-more">More Projects <span>&rarr;</span></button>
          </div>
          <div class="more__work">
            ${more.map(projectCardHtml).join('')}
          </div>
        </div>
      `;
    }

    root.innerHTML = html || '<p class="empty-state">No published projects yet.</p>';
    if (typeof window.bindMoreProjects === 'function') window.bindMoreProjects();
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p class="empty-state">Could not load projects. Run <code>npm run sync</code> then refresh.</p>';
  }
}

loadProjects();
