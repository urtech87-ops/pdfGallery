/* Tool Acadmy — Unique SVG icons per tool type */
var TG_TOOL_ICONS = {
  'merge-pdf': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="20" height="28" rx="3" fill="#FF6B35" opacity="0.9"/><rect x="20" y="10" width="20" height="28" rx="3" fill="#FF8C5A"/><path d="M16 20h16M16 26h12" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M30 32l4 4-4 4" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',

  'compress-pdf': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="32" height="40" rx="4" fill="#E74C3C"/><path d="M24 14v20M17 27l7 7 7-7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="12" width="8" height="3" rx="1" fill="white" opacity="0.7"/></svg>',

  'split-pdf': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="16" height="22" rx="3" fill="#E74C3C"/><rect x="26" y="4" width="16" height="22" rx="3" fill="#FF8C5A"/><path d="M24 8v32M20 32l4 4 4-4" stroke="#E74C3C" stroke-width="2.5" stroke-linecap="round"/></svg>',

  'pdf-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="32" height="40" rx="4" fill="#E74C3C"/><path d="M14 20h20M14 27h20M14 34h12" stroke="white" stroke-width="2" stroke-linecap="round"/><rect x="8" y="4" width="14" height="14" rx="4" fill="white" opacity="0.15"/></svg>',

  'img-compress': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="6" fill="#9B59B6"/><circle cx="16" cy="16" r="5" fill="#F1C40F"/><path d="M8 36l10-12 8 8 6-6 10 10" fill="#2ECC71" opacity="0.9"/><path d="M28 22l4-4 4 4M32 18v10" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',

  'img-remove-bg': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="6" fill="#3498DB"/><circle cx="24" cy="22" r="10" fill="white" opacity="0.9"/><circle cx="24" cy="18" r="5" fill="#3498DB"/><path d="M15 32c0-5 4-8 9-8s9 3 9 8" fill="#3498DB"/><path d="M34 10l4 4-4 4M38 14H28" stroke="#E74C3C" stroke-width="2" stroke-linecap="round"/></svg>',

  'img-resize': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="25" height="25" rx="4" fill="#27AE60"/><rect x="20" y="20" width="25" height="25" rx="4" fill="#2ECC71" opacity="0.8"/><path d="M32 8l8 8-8 8M8 32l8 8-8 8" stroke="#27AE60" stroke-width="2" stroke-linecap="round"/></svg>',

  'img-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="40" height="32" rx="6" fill="#9B59B6"/><circle cx="16" cy="20" r="4" fill="#F1C40F"/><path d="M6 36l10-12 8 8 6-6 12 10" fill="#7D3C98" opacity="0.8"/><path d="M6 36l10-12 8 8 6-6 12 10" fill="white" opacity="0.3"/></svg>',

  'grammar-fixer': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#2ECC71"/><path d="M12 16h24M12 24h24M12 32h16" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="36" cy="32" r="8" fill="#27AE60"/><path d="M32 32l3 3 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  'summarizer': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#3498DB"/><path d="M12 14h24M12 21h24M12 28h18M12 35h12" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M36 28l-6 6 2 2 6-6-2-2z" fill="#F39C12"/><circle cx="36" cy="36" r="4" fill="#E67E22"/></svg>',

  'paraphraser': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#E74C3C"/><path d="M12 16h10M12 22h14M12 28h10" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M28 14c0 0 8 4 8 10s-8 10-8 10" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M34 22l4-2v4l-4-2z" fill="white"/></svg>',

  'ai-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#8E44AD"/><circle cx="24" cy="20" r="8" stroke="white" stroke-width="2" fill="none"/><circle cx="24" cy="20" r="3" fill="white"/><path d="M16 34c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M32 12l2-3M36 16l3-2M36 24l3 2M32 28l2 3" stroke="#F39C12" stroke-width="1.5" stroke-linecap="round"/></svg>',

  'vid-compress': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="40" height="28" rx="6" fill="#E74C3C"/><circle cx="24" cy="24" r="10" fill="rgba(0,0,0,0.3)"/><path d="M20 19l10 5-10 5V19z" fill="white"/><path d="M8 42h8M32 42h8" stroke="#E74C3C" stroke-width="2" stroke-linecap="round"/></svg>',

  'vid-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="10" width="30" height="28" rx="6" fill="#E74C3C"/><path d="M34 18l10-6v24l-10-6V18z" fill="#C0392B"/><circle cx="19" cy="24" r="6" fill="rgba(255,255,255,0.2)"/><path d="M16 20l8 4-8 4V20z" fill="white"/></svg>',

  'excel-to-csv': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="6" fill="#27AE60"/><rect x="8" y="8" width="32" height="32" rx="4" fill="#2ECC71"/><path d="M14 18l6 6-6 6M22 30h12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  'file-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="4" width="24" height="32" rx="4" fill="#F39C12"/><path d="M32 4l8 8h-8V4z" fill="#E67E22"/><path d="M14 18h16M14 24h16M14 30h10" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',

  'color-picker': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="20" fill="#1ABC9C"/><circle cx="24" cy="24" r="8" fill="white" opacity="0.9"/><circle cx="24" cy="24" r="4" fill="#F97316"/></svg>',

  'unit-converter': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#1ABC9C"/><path d="M12 20h24M12 28h24" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M20 12l-8 8 8 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 36l8-8-8-8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  'utility-default': '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="40" height="40" rx="8" fill="#1ABC9C"/><path d="M24 8v8M24 32v8M8 24h8M32 24h8" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="24" cy="24" r="6" fill="white" opacity="0.9"/><circle cx="24" cy="24" r="3" fill="#1ABC9C"/></svg>',
};

var TG_HANDLER_TO_ICON = {
  'merge-pdf': 'merge-pdf',
  'compress-pdf': 'compress-pdf',
  'split-pdf': 'split-pdf',
  'img-compress': 'img-compress',
  'img-remove-bg': 'img-remove-bg',
  'img-resize': 'img-resize',
  'grammar-fixer': 'grammar-fixer',
  'summarizer': 'summarizer',
  'paraphraser': 'paraphraser',
  'vid-compress': 'vid-compress',
  'excel-to-csv': 'excel-to-csv',
  'color-picker': 'color-picker',
  'unit-converter': 'unit-converter',
};

function getTGToolIcon(handler, category) {
  var iconKey = TG_HANDLER_TO_ICON[handler];
  if (iconKey && TG_TOOL_ICONS[iconKey]) {
    return TG_TOOL_ICONS[iconKey];
  }
  var catDefaults = {
    'pdf-tools': 'pdf-default',
    'image-tools': 'img-default',
    'ai-tools': 'ai-default',
    'video-tools': 'vid-default',
    'file-tools': 'file-default',
    'utility-tools': 'utility-default',
  };
  var defaultKey = catDefaults[category] || 'pdf-default';
  return TG_TOOL_ICONS[defaultKey];
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-tool-handler]').forEach(function(el) {
    var handler = el.dataset.toolHandler;
    var category = el.dataset.toolCategory || '';
    var iconEl = el.querySelector('.tg-tool-card__icon, .tg-tool-icon');
    if (iconEl) {
      iconEl.innerHTML = getTGToolIcon(handler, category);
    }
  });
});
