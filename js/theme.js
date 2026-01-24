(function () {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const icon = btn.querySelector('span');

  // Estado inicial del icono
  icon.textContent =
    document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'light_mode'
      : 'dark_mode';

  btn.addEventListener('click', () => {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';

    const nextTheme = isDark ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);

    icon.textContent = nextTheme === 'dark'
      ? 'light_mode'
      : 'dark_mode';
  });
});
