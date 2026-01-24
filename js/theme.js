(function () {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateMetaThemeColor(savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggle');
  const logo = document.getElementById('mainLogo');

  if (!btn) return;

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);

    btn.querySelector('span').textContent =
      nextTheme === 'dark' ? 'light_mode' : 'dark_mode';

    if (logo) {
      logo.src = nextTheme === 'dark'
        ? 'LOGO_EDITABLE_oficial_white.png'
        : 'LOGO_EDITABLE_oficial.png';
    }

    updateMetaThemeColor(nextTheme);
  });
});

function updateMetaThemeColor(theme) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = theme === 'dark' ? '#000000' : '#ffffff';
}
