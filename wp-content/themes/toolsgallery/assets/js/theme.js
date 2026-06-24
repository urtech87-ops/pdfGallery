(function() {
  var STORAGE_KEY = 'tg-theme';
  var root = document.documentElement;

  function getTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply theme immediately to prevent flash of wrong theme
  root.setAttribute('data-theme', getTheme());

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.querySelector('.tg-theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function() {
      var current = root.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEY, next);

      btn.style.transition = 'transform 0.3s ease';
      btn.style.transform = 'rotate(360deg)';
      setTimeout(function() {
        btn.style.transform = '';
      }, 300);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  });
})();
