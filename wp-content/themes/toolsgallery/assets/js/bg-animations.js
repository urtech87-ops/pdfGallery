(function() {
  function initBgAnimations() {
    if (document.documentElement.getAttribute('data-theme') !== 'dark') {
      return;
    }

    var page = document.body;
    var category = page.dataset.category || 'utility';

    var categoryIcons = {
      'pdf-tools': ['📄','📃','📑','🗂️','📋','🖨️','📝'],
      'image-tools': ['🖼️','📸','🎨','🖌️','✂️','🔍','📷'],
      'ai-tools': ['🤖','⚡','💡','🧠','✍️','📊','🔮'],
      'video-tools': ['🎬','🎥','📽️','🎞️','🎵','📹','▶️'],
      'file-tools': ['📁','📂','🗃️','💾','🔄','📦','🗜️'],
      'utility-tools': ['⚙️','🔧','🛠️','⚡','🎯','🔑','📌'],
      'default': ['⚡','🔧','📄','🖼️','🤖','🎬','💡'],
    };

    var icons = categoryIcons[category] || categoryIcons['default'];

    var container = document.createElement('div');
    container.className = 'tg-bg-animation';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    var count = 12;
    for (var i = 0; i < count; i++) {
      var icon = document.createElement('span');
      icon.className = 'tg-float-icon';
      icon.textContent = icons[i % icons.length];

      var size = 20 + Math.random() * 20;
      var x = Math.random() * 100;
      var delay = Math.random() * 10;
      var duration = 15 + Math.random() * 20;
      var opacity = 0.04 + Math.random() * 0.06;

      icon.style.cssText = 'left:' + x + '%;font-size:' + size + 'px;opacity:' + opacity + ';animation-delay:-' + delay + 's;animation-duration:' + duration + 's;';

      container.appendChild(icon);
    }
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'data-theme') {
        var existing = document.querySelector('.tg-bg-animation');
        if (existing) existing.remove();
        initBgAnimations();
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });

  document.addEventListener('DOMContentLoaded', initBgAnimations);
})();
