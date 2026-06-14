/* ToolsGallery — main.js */
(function () {
  'use strict';

  /* --- Mobile nav toggle --- */
  var hamburger = document.querySelector('.tg-header__hamburger');
  var mobileNav = document.querySelector('.tg-mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* --- FAQ accordion --- */
  var faqItems = document.querySelectorAll('.tg-faq__item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.tg-faq__question');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (i) { i.classList.remove('is-open'); });
      if (!isOpen) item.classList.add('is-open');
    });
  });

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
