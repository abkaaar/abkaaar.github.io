/* Focus outline only for keyboard users */

const handleFirstTab = (e) => {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDownOnce);
  }
};

const handleMouseDownOnce = () => {
  document.body.classList.remove('user-is-tabbing');
  window.removeEventListener('mousedown', handleMouseDownOnce);
  window.addEventListener('keydown', handleFirstTab);
};

window.addEventListener('keydown', handleFirstTab);

const backToTopButton = document.querySelector('.back-to-top');

if (backToTopButton) {
  const alterStyles = (rendered) => {
    backToTopButton.style.visibility = rendered ? 'visible' : 'hidden';
    backToTopButton.style.opacity = rendered ? '1' : '0';
    backToTopButton.style.transform = rendered ? 'scale(1)' : 'scale(0)';
  };

  window.addEventListener('scroll', () => {
    alterStyles(window.scrollY > 700);
  });
}

function bindMoreProjects() {
  const moreProjectsButton = document.querySelector('.work__button');
  const moreProjectsContainer = document.querySelector('.more__work');
  if (!moreProjectsButton || !moreProjectsContainer) return;
  moreProjectsButton.addEventListener('click', () => {
    moreProjectsContainer.style.display = 'block';
    moreProjectsButton.style.display = 'none';
  });
}

window.bindMoreProjects = bindMoreProjects;
