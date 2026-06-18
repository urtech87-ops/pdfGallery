/**
 * ============================================================
 * ToolsGallery — Rearrange PDF Tool
 * ============================================================
 * Handler key: rearrange-pdf
 * Tool URL: /tool/rearrange-pdf/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf-lib (PDFLib), pdf.js (pdfjsLib)
 * ============================================================
 */
(function () {
  'use strict';

  var rearrangeOrder   = [];
  var rearrangeDeleted = {};

  function onFileReady(file, toolBox) {
    var existing = toolBox.querySelector('.tg-rearrange-wrap');
    if (existing) existing.parentNode.removeChild(existing);

    var wrap = document.createElement('div');
    wrap.className = 'tg-rearrange-wrap';
    wrap.innerHTML =
      '<div class="tg-rearrange-toolbar" style="margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button type="button" class="tg-btn-secondary" id="rr-reverse">⇅ Reverse Order</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-select-all">Select All</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-deselect">Deselect All</button>' +
        '<button type="button" class="tg-btn-secondary" id="rr-to-front">Move to Front</button>' +
      '</div>' +
      '<div class="tg-rearrange-grid" style="display:flex;flex-wrap:wrap;gap:10px"></div>' +
      '<p class="tg-opt-info" style="margin-top:8px">Drag thumbnails to reorder · Click thumbnail to select · 🗑 to delete</p>';

    var actionBtn = toolBox.querySelector('.tg-action-btn');
    if (actionBtn && actionBtn.parentNode) actionBtn.parentNode.insertBefore(wrap, actionBtn);

    var grid = wrap.querySelector('.tg-rearrange-grid');
    grid.innerHTML = '<p class="tg-opt-info">Rendering thumbnails…</p>';

    window.TGPdfTools.renderAllThumbnails(file, 0.2, null).then(function (pages) {
      grid.innerHTML = '';
      rearrangeOrder   = pages.map(function (p) { return p.pageNum - 1; });
      rearrangeDeleted = {};
      var selectedSet = {};

      function renderCards() {
        grid.innerHTML = '';
        rearrangeOrder.forEach(function (origIdx, pos) {
          var card = document.createElement('div');
          card.className = 'tg-rr-card' + (selectedSet[origIdx] ? ' tg-rr-card--selected' : '') + (rearrangeDeleted[origIdx] ? ' tg-rr-card--deleted' : '');
          card.dataset.origIdx = origIdx;
          card.dataset.pos     = pos;
          card.draggable = true;
          card.style.cssText = 'position:relative;border:2px solid ' + (selectedSet[origIdx] ? '#E07B39' : '#ccc') + ';border-radius:6px;padding:4px;cursor:grab;width:100px;text-align:center;flex-shrink:0;opacity:' + (rearrangeDeleted[origIdx] ? '0.4' : '1');

          var thumb = pages[origIdx].canvas.cloneNode(true);
          thumb.style.cssText = 'max-width:90px;height:auto;display:block;margin:0 auto';
          card.appendChild(thumb);

          var lbl = document.createElement('p');
          lbl.style.cssText = 'margin:4px 0 0;font-size:11px;color:#555';
          lbl.textContent = 'Page ' + (pos + 1);
          card.appendChild(lbl);

          var delBtn = document.createElement('button');
          delBtn.type = 'button'; delBtn.title = 'Delete page'; delBtn.textContent = '🗑';
          delBtn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(255,255,255,.8);border:none;cursor:pointer;font-size:14px;padding:0 2px;border-radius:3px';
          delBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            rearrangeDeleted[origIdx] = !rearrangeDeleted[origIdx];
            renderCards();
          });
          card.appendChild(delBtn);

          card.addEventListener('click', function (e) {
            if (e.shiftKey && Object.keys(selectedSet).length > 0) {
              var lastSel = parseInt(Object.keys(selectedSet).pop(), 10);
              var from = Math.min(rearrangeOrder.indexOf(lastSel), pos);
              var to   = Math.max(rearrangeOrder.indexOf(lastSel), pos);
              for (var si = from; si <= to; si++) selectedSet[rearrangeOrder[si]] = true;
            } else {
              selectedSet[origIdx] ? delete selectedSet[origIdx] : (selectedSet[origIdx] = true);
            }
            renderCards();
          });

          card.addEventListener('dragstart', function () { card.style.opacity = '0.4'; card.dataset.dragging = '1'; });
          card.addEventListener('dragend',   function () { card.style.opacity = rearrangeDeleted[origIdx] ? '0.4' : '1'; delete card.dataset.dragging; });
          card.addEventListener('dragover',  function (e) { e.preventDefault(); card.style.borderStyle = 'dashed'; card.style.borderColor = '#E07B39'; });
          card.addEventListener('dragleave', function () { card.style.borderStyle = 'solid'; card.style.borderColor = selectedSet[origIdx] ? '#E07B39' : '#ccc'; });
          card.addEventListener('drop', function (e) {
            e.preventDefault();
            card.style.borderStyle = 'solid'; card.style.borderColor = '#ccc';
            var dragged = grid.querySelector('[data-dragging="1"]');
            if (!dragged || dragged === card) return;
            var fromPos = parseInt(dragged.dataset.pos, 10);
            var toPos   = parseInt(card.dataset.pos, 10);
            var moved   = rearrangeOrder.splice(fromPos, 1)[0];
            rearrangeOrder.splice(toPos, 0, moved);
            renderCards();
          });

          grid.appendChild(card);
        });
      }

      renderCards();

      wrap.querySelector('#rr-reverse').addEventListener('click', function () { rearrangeOrder.reverse(); renderCards(); });
      wrap.querySelector('#rr-select-all').addEventListener('click', function () { rearrangeOrder.forEach(function (i) { selectedSet[i] = true; }); renderCards(); });
      wrap.querySelector('#rr-deselect').addEventListener('click', function () { selectedSet = {}; renderCards(); });
      wrap.querySelector('#rr-to-front').addEventListener('click', function () {
        var sel  = rearrangeOrder.filter(function (i) { return selectedSet[i]; });
        var rest = rearrangeOrder.filter(function (i) { return !selectedSet[i]; });
        rearrangeOrder = sel.concat(rest);
        renderCards();
      });
    }).catch(function () {
      grid.innerHTML = '<p style="color:red">Could not render thumbnails.</p>';
    });
  }

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onSuccess  = callbacks.onSuccess;
    var onError    = callbacks.onError;

    var active = rearrangeOrder.filter(function (idx) { return !rearrangeDeleted[idx]; });
    if (active.length === 0) {
      if (callbacks.onInlineError) callbacks.onInlineError('Cannot delete all pages — keep at least one page.');
      return;
    }

    onProgress(30, 'Rearranging pages…');
    var ab     = await files[0].arrayBuffer();
    var srcDoc = await PDFLib.PDFDocument.load(ab);
    var newDoc = await PDFLib.PDFDocument.create();

    for (var i = 0; i < active.length; i++) {
      var copied = await newDoc.copyPages(srcDoc, [active[i]]);
      newDoc.addPage(copied[0]);
    }

    onProgress(90, 'Saving PDF…');
    var bytes = await newDoc.save();
    onSuccess(new Blob([bytes], { type: 'application/pdf' }), 'rearranged.pdf');
  }

  function getOptionsHTML() { return ''; }
  function getOptions() { return { pageOrder: rearrangeOrder.filter(function (idx) { return !rearrangeDeleted[idx]; }) }; }

  function reset(toolBox) {
    rearrangeOrder   = [];
    rearrangeDeleted = {};
    var rrWrap = toolBox ? toolBox.querySelector('.tg-rearrange-wrap') : null;
    if (rrWrap) rrWrap.parentNode.removeChild(rrWrap);
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['rearrange-pdf'] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, reset: reset };
})();
