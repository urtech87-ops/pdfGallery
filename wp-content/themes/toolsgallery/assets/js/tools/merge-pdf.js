/**
 * ToolsGallery — Merge PDF
 * Handler: merge
 * URL: /tool/merge-pdf/
 *
 * Renders every uploaded PDF as a "frame" (first-page thumbnail + filename +
 * page count + order badge) so the user can see what they are merging,
 * drag the frames into the order they want, rotate individual files and
 * drop files they no longer need. The merge itself runs in the visual
 * order of the frames, applying each file's chosen rotation.
 *
 * Thumbnails reuse the shared window.TGPdfTools renderer — only page 1 of
 * each file is rasterised, lazily, one file at a time, so a 100-file
 * selection does not lock up the tab.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'merge', multiFile: true, downloadName: 'merged.pdf' };

  /* Thumbnails are decorative — small is fine and keeps memory sane. */
  var THUMB_SCALE = 0.3;
  /* Cap live canvases; the ones scrolled furthest away are released and
     re-rendered if the user scrolls back to them. */
  var MAX_CACHED_THUMBS = 60;
  /* Above this many files, warn that the merge is browser-side work. */
  var LARGE_MERGE_THRESHOLD = 30;

  /* Ordered merge list: { key, file, rotation, pages, canvas, state } */
  var entries = [];
  var gridEl = null;
  var renderQueue = [];
  var renderBusy = false;
  var renderedKeys = [];
  var observer = null;
  var drag = null;

  /* -----------------------------------------------
     OPTIONS MARKUP
  ----------------------------------------------- */
  function getOptionsHTML() {
    return '<div class="tg-opt-row" style="flex-direction:column;gap:8px">' +
        '<label class="tg-opt-label">Upload multiple PDF files to merge them into one.</label>' +
        '<p class="tg-opt-info">Files are merged in the order shown below. Drag a frame (or its number badge on touch) to reorder, rotate a file with &#8635;, or remove it with &times;.</p>' +
      '</div>' +
      '<p class="tg-merge-note" id="mp-large-note" hidden></p>' +
      '<div id="mp-file-list"></div>';
  }

  function getOptions() {
    return {};
  }

  /* -----------------------------------------------
     STATE
  ----------------------------------------------- */
  function fileKey(file) {
    /* Matches the runner's own de-duplication (name + size), so a key
       always maps back to exactly one entry in its selection. */
    return file.name + '|' + file.size;
  }

  function isPdfFile(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().slice(-4) === '.pdf';
  }

  function selectedFiles(fallbackFile) {
    var files = [];
    if (window.TGTool && typeof window.TGTool.getCurrentFiles === 'function') {
      files = window.TGTool.getCurrentFiles() || [];
    }
    if (!files.length) {
      var box = document.querySelector('.tg-tool-box');
      if (box && box._tgFiles && box._tgFiles.length) files = Array.from(box._tgFiles);
    }
    if (!files.length && fallbackFile) files = [fallbackFile];
    return files;
  }

  /* Keep the current visual order and each file's rotation while the
     selection changes underneath us: surviving files stay put, new ones
     are appended, removed ones drop out. */
  function syncEntries(files) {
    var incoming = {};
    files.forEach(function (f) { incoming[fileKey(f)] = f; });

    var next = [];
    var kept = {};
    entries.forEach(function (entry) {
      if (!incoming[entry.key] || kept[entry.key]) {
        releaseCanvas(entry);
        return;
      }
      /* Same file, possibly a fresh File object — keep order + rotation. */
      entry.file = incoming[entry.key];
      kept[entry.key] = true;
      next.push(entry);
    });

    files.forEach(function (f) {
      var key = fileKey(f);
      if (kept[key]) return;
      kept[key] = true;
      next.push({ key: key, file: f, rotation: 0, pages: null, canvas: null, state: 'idle' });
    });

    entries = next;
  }

  function entryByKey(key) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].key === key) return entries[i];
    }
    return null;
  }

  /* -----------------------------------------------
     THUMBNAIL RENDERING (lazy, one file at a time)
  ----------------------------------------------- */
  function releaseCanvas(entry) {
    if (entry.canvas) {
      /* Zeroing the backing store is what actually frees the pixels. */
      entry.canvas.width = 0;
      entry.canvas.height = 0;
      if (entry.canvas.parentNode) entry.canvas.parentNode.removeChild(entry.canvas);
      entry.canvas = null;
    }
    var at = renderedKeys.indexOf(entry.key);
    if (at !== -1) renderedKeys.splice(at, 1);
    if (entry.state === 'done') entry.state = 'idle';
  }

  function trimCanvasCache() {
    while (renderedKeys.length > MAX_CACHED_THUMBS) {
      var oldest = renderedKeys[0];
      var entry = entryByKey(oldest);
      if (!entry) { renderedKeys.shift(); continue; }
      var frame = frameFor(entry.key);
      releaseCanvas(entry);
      if (frame) {
        setThumbPlaceholder(frame, '');
        if (observer) observer.observe(frame);
      }
    }
  }

  function enqueueRender(key) {
    var entry = entryByKey(key);
    if (!entry || entry.state === 'done' || entry.state === 'loading') return;
    if (renderQueue.indexOf(key) !== -1) return;
    renderQueue.push(key);
    pumpQueue();
  }

  function pumpQueue() {
    if (renderBusy) return;
    var key = renderQueue.shift();
    if (!key) return;
    var entry = entryByKey(key);
    if (!entry || entry.state === 'done') { pumpQueue(); return; }

    renderBusy = true;
    entry.state = 'loading';
    renderFirstPage(entry.file).then(function (res) {
      entry.pages = res.pages;
      entry.canvas = res.canvas;
      entry.state = 'done';
      renderedKeys.push(entry.key);
      paintFrame(entry);
      trimCanvasCache();
    }).catch(function () {
      entry.state = 'error';
      var frame = frameFor(entry.key);
      if (frame) setThumbPlaceholder(frame, 'Preview unavailable');
    }).then(function () {
      renderBusy = false;
      /* Yield between files so scrolling/clicks stay responsive on a
         100-file selection. */
      setTimeout(pumpQueue, 0);
    });
  }

  /* Page 1 only, via the shared PDF helpers — renderThumbnail rasterises a
     single page, which matters when a file has hundreds of them. */
  function renderFirstPage(file) {
    var T = window.TGPdfTools;
    if (!T) return Promise.reject(new Error('PDF renderer not loaded'));

    if (typeof T.renderThumbnail === 'function' && typeof T.getPageCount === 'function') {
      return T.getPageCount(file).then(function (count) {
        return T.renderThumbnail(file, 1, THUMB_SCALE).then(function (thumb) {
          return { canvas: thumb.canvas, pages: count };
        });
      });
    }
    /* Fallback for older pdf-tools builds. */
    return T.renderAllThumbnails(file, THUMB_SCALE, null).then(function (pages) {
      if (!pages || !pages.length) throw new Error('No pages rendered');
      return { canvas: pages[0].canvas, pages: pages.length };
    });
  }

  /* -----------------------------------------------
     FRAME UI
  ----------------------------------------------- */
  function frameFor(key) {
    if (!gridEl) return null;
    return gridEl.querySelector('.tg-merge-frame[data-key="' + cssEscape(key) + '"]');
  }

  function cssEscape(value) {
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function setThumbPlaceholder(frame, text) {
    var thumb = frame.querySelector('.tg-merge-thumb');
    if (!thumb) return;
    thumb.innerHTML = text
      ? '<p class="tg-merge-thumb-msg">' + text + '</p>'
      : '<span class="tg-merge-spinner" aria-hidden="true"></span>';
  }

  function paintFrame(entry) {
    var frame = frameFor(entry.key);
    if (!frame) return;
    var thumb = frame.querySelector('.tg-merge-thumb');
    if (thumb && entry.canvas) {
      thumb.innerHTML = '';
      thumb.appendChild(entry.canvas);
      applyRotation(entry);
    }
    var pagesEl = frame.querySelector('.tg-merge-pages');
    if (pagesEl && entry.pages != null) {
      pagesEl.textContent = entry.pages + ' page' + (entry.pages === 1 ? '' : 's');
    }
  }

  function applyRotation(entry) {
    if (!entry.canvas) return;
    /* pdf.js already renders the page in its stored orientation, so the
       transform only shows the rotation the user asked for. */
    entry.canvas.style.transform = 'rotate(' + entry.rotation + 'deg)';
    var frame = frameFor(entry.key);
    if (frame) frame.dataset.rotation = String(entry.rotation);
  }

  function buildFrame(entry) {
    var frame = document.createElement('div');
    frame.className = 'tg-merge-frame';
    frame.dataset.key = entry.key;
    frame.dataset.rotation = String(entry.rotation);

    var handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'tg-merge-badge';
    handle.title = 'Drag to reorder (arrow keys also work)';
    handle.setAttribute('aria-label', 'Reorder ' + entry.file.name);
    frame.appendChild(handle);

    var thumb = document.createElement('div');
    thumb.className = 'tg-merge-thumb';
    thumb.innerHTML = '<span class="tg-merge-spinner" aria-hidden="true"></span>';
    frame.appendChild(thumb);

    var name = document.createElement('p');
    name.className = 'tg-merge-name';
    name.textContent = entry.file.name;
    name.title = entry.file.name;
    frame.appendChild(name);

    var pages = document.createElement('p');
    pages.className = 'tg-merge-pages';
    pages.textContent = entry.pages != null ? entry.pages + ' page' + (entry.pages === 1 ? '' : 's') : '\u2026';
    frame.appendChild(pages);

    var actions = document.createElement('div');
    actions.className = 'tg-merge-actions';

    var rotateBtn = document.createElement('button');
    rotateBtn.type = 'button';
    rotateBtn.className = 'tg-merge-btn';
    rotateBtn.innerHTML = '&#8635;';
    rotateBtn.title = 'Rotate this file 90\u00B0';
    rotateBtn.setAttribute('aria-label', 'Rotate ' + entry.file.name + ' 90 degrees');
    rotateBtn.addEventListener('click', function () {
      entry.rotation = (entry.rotation + 90) % 360;
      applyRotation(entry);
    });
    actions.appendChild(rotateBtn);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'tg-merge-btn tg-merge-btn--remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove this file';
    removeBtn.setAttribute('aria-label', 'Remove ' + entry.file.name);
    removeBtn.addEventListener('click', function () { removeEntry(entry); });
    actions.appendChild(removeBtn);

    frame.appendChild(actions);

    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveFrame(frame, e.key === 'ArrowLeft' ? -1 : 1);
        handle.focus();
      }
    });
    frame.addEventListener('pointerdown', onPointerDown);

    if (entry.canvas) {
      thumb.innerHTML = '';
      thumb.appendChild(entry.canvas);
      entry.canvas.style.transform = 'rotate(' + entry.rotation + 'deg)';
    } else if (entry.state === 'error') {
      setThumbPlaceholder(frame, 'Preview unavailable');
    }

    return frame;
  }

  function removeEntry(entry) {
    /* Drop it from the runner's selection so the merge, the file count and
       the "add more" affordance all stay in sync; that re-enters
       onFileReady, which re-renders the grid. */
    if (window.TGTool && typeof window.TGTool.removeFileAt === 'function') {
      var files = selectedFiles(null);
      for (var i = 0; i < files.length; i++) {
        if (fileKey(files[i]) === entry.key) {
          window.TGTool.removeFileAt(i);
          return;
        }
      }
    }
    releaseCanvas(entry);
    entries = entries.filter(function (e) { return e.key !== entry.key; });
    render();
  }

  function renumber() {
    if (!gridEl) return;
    var frames = gridEl.querySelectorAll('.tg-merge-frame');
    for (var i = 0; i < frames.length; i++) {
      var badge = frames[i].querySelector('.tg-merge-badge');
      if (badge) badge.textContent = String(i + 1);
    }
  }

  /* Rebuild the ordered array from what the user can actually see. */
  function commitOrder() {
    if (!gridEl) return;
    var order = [];
    gridEl.querySelectorAll('.tg-merge-frame').forEach(function (frame) {
      var entry = entryByKey(frame.dataset.key);
      if (entry) order.push(entry);
    });
    if (order.length === entries.length) entries = order;
    renumber();
  }

  function moveFrame(frame, delta) {
    if (!gridEl) return;
    var sibling = delta < 0 ? frame.previousElementSibling : frame.nextElementSibling;
    if (!sibling) return;
    if (delta < 0) gridEl.insertBefore(frame, sibling);
    else gridEl.insertBefore(sibling, frame);
    commitOrder();
  }

  /* -----------------------------------------------
     DRAG TO REORDER (pointer events — mouse + touch)
  ----------------------------------------------- */
  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    var frame = e.currentTarget;
    var onHandle = !!(e.target.closest && e.target.closest('.tg-merge-badge'));
    /* Touch/pen drags start from the badge only, so the rest of the frame
       is still free to scroll the page. A mouse can grab anywhere except
       the action buttons. */
    if (e.pointerType !== 'mouse' && !onHandle) return;
    if (!onHandle && e.target.closest && e.target.closest('button')) return;

    drag = {
      frame: frame,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
      pointerId: e.pointerId,
      rects: null,
      raf: 0,
    };
    /* Tracked on the document rather than through setPointerCapture:
       browsers release capture as soon as the pointer leaves the element
       under some conditions, which would strand a drag half-way. The drop
       target is found geometrically, so no hit-testing is needed either. */
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  }

  function collectRects() {
    var rects = [];
    var frames = gridEl ? gridEl.children : [];
    for (var i = 0; i < frames.length; i++) {
      rects.push({ el: frames[i], rect: frames[i].getBoundingClientRect() });
    }
    return rects;
  }

  function frameAtPoint(x, y) {
    if (!drag || !drag.rects) return null;
    for (var i = 0; i < drag.rects.length; i++) {
      var r = drag.rects[i].rect;
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return drag.rects[i];
    }
    return null;
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.active) {
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 6) return;
      drag.active = true;
      drag.frame.classList.add('dragging');
      drag.rects = collectRects();
      startAutoScroll();
    }
    e.preventDefault();
    drag.x = e.clientX;
    drag.y = e.clientY;

    var hit = frameAtPoint(e.clientX, e.clientY);
    if (!hit || hit.el === drag.frame) return;

    var before = e.clientX < hit.rect.left + hit.rect.width / 2;
    gridEl.insertBefore(drag.frame, before ? hit.el : hit.el.nextSibling);
    /* Everything shifted — re-measure for the next move. */
    drag.rects = collectRects();
  }

  /* Long selections scroll; nudge the page when the pointer sits near an edge. */
  function startAutoScroll() {
    if (!drag || drag.raf) return;
    var step = function () {
      if (!drag || !drag.active) return;
      var margin = 70;
      if (drag.y < margin) window.scrollBy(0, -14);
      else if (drag.y > window.innerHeight - margin) window.scrollBy(0, 14);
      else { drag.raf = requestAnimationFrame(step); return; }
      drag.rects = collectRects();
      drag.raf = requestAnimationFrame(step);
    };
    drag.raf = requestAnimationFrame(step);
  }

  function onPointerUp(e) {
    if (!drag || (e && e.pointerId != null && e.pointerId !== drag.pointerId)) return;
    var frame = drag.frame;
    document.removeEventListener('pointermove', onPointerMove, { passive: false });
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    if (drag.raf) cancelAnimationFrame(drag.raf);
    if (drag.active) {
      frame.classList.remove('dragging');
      drag = null;
      commitOrder();
      return;
    }
    drag = null;
  }

  /* -----------------------------------------------
     RENDER
  ----------------------------------------------- */
  function render() {
    var listEl = document.getElementById('mp-file-list');
    if (!listEl) return;

    if (observer) { observer.disconnect(); observer = null; }
    renderQueue = [];
    listEl.innerHTML = '';
    gridEl = null;

    if (!entries.length) {
      updateLargeNote();
      return;
    }

    var bar = document.createElement('div');
    bar.className = 'tg-merge-bar';

    /* <p>, not <span>: the dark theme forces span colour to inherit, which
       would make this unreadable on the dark tool box. */
    var count = document.createElement('p');
    count.className = 'tg-merge-count';
    count.textContent = entries.length + ' file' + (entries.length === 1 ? '' : 's') + ' \u2014 merged top-left to bottom-right';
    bar.appendChild(count);

    if (window.TGTool && typeof window.TGTool.openFilePicker === 'function' &&
        entries.length < (window.TGTool.maxFiles || 100)) {
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'tg-merge-add';
      addBtn.textContent = '+ Add more files';
      addBtn.addEventListener('click', function () { window.TGTool.openFilePicker(); });
      bar.appendChild(addBtn);
    }
    listEl.appendChild(bar);

    gridEl = document.createElement('div');
    gridEl.className = 'tg-merge-grid';
    entries.forEach(function (entry) { gridEl.appendChild(buildFrame(entry)); });
    listEl.appendChild(gridEl);

    /* The runner's own drop target is the plain file list, which the merge
       grid replaces — keep dropping more PDFs onto the grid working. */
    if (window.TGTool && typeof window.TGTool.addFiles === 'function') {
      gridEl.addEventListener('dragover', function (ev) { ev.preventDefault(); gridEl.dataset.dragover = ''; });
      gridEl.addEventListener('dragleave', function (ev) { if (!gridEl.contains(ev.relatedTarget)) delete gridEl.dataset.dragover; });
      gridEl.addEventListener('drop', function (ev) {
        ev.preventDefault();
        delete gridEl.dataset.dragover;
        if (ev.dataTransfer && ev.dataTransfer.files.length) window.TGTool.addFiles(ev.dataTransfer.files);
      });
    }

    renumber();
    updateLargeNote();
    observeFrames();
  }

  function observeFrames() {
    if (!gridEl) return;
    var frames = gridEl.querySelectorAll('.tg-merge-frame');

    if (!('IntersectionObserver' in window)) {
      /* No lazy loading available — still render one file at a time. */
      entries.forEach(function (entry) { enqueueRender(entry.key); });
      return;
    }

    observer = new IntersectionObserver(function (records) {
      records.forEach(function (record) {
        if (!record.isIntersecting) return;
        observer.unobserve(record.target);
        enqueueRender(record.target.dataset.key);
      });
    }, { rootMargin: '300px 0px' });

    frames.forEach(function (frame) {
      var entry = entryByKey(frame.dataset.key);
      if (entry && entry.state === 'done') return;
      observer.observe(frame);
    });
  }

  function updateLargeNote() {
    var note = document.getElementById('mp-large-note');
    if (!note) return;
    if (entries.length > LARGE_MERGE_THRESHOLD) {
      note.textContent = 'Heads up: merging ' + entries.length + ' files runs entirely in your browser. It may take a while and use a lot of memory on lower-end devices.';
      note.hidden = false;
    } else {
      note.hidden = true;
      note.textContent = '';
    }
  }

  function setSummary(text) {
    var bar = document.querySelector('.tg-merge-bar');
    if (!bar) return;
    var el = bar.querySelector('.tg-merge-summary');
    if (!el) {
      el = document.createElement('p');
      el.className = 'tg-merge-summary';
      bar.appendChild(el);
    }
    el.textContent = text;
  }

  /* -----------------------------------------------
     HOOKS
  ----------------------------------------------- */
  function onFileReady(file) {
    syncEntries(selectedFiles(file));
    render();
  }

  /* -----------------------------------------------
     RUN
  ----------------------------------------------- */
  async function run(file, options, onProgress) {
    /* Safety net: the frames are the source of truth for order and
       rotation, but re-sync so a selection changed outside this UI (reset,
       a stale entry) can never merge the wrong set. */
    syncEntries(selectedFiles(file));
    if (!entries.length) throw new Error('Please add at least one PDF file to merge.');

    for (var v = 0; v < entries.length; v++) {
      if (!isPdfFile(entries[v].file)) {
        throw new Error(entries[v].file.name + ' is not a valid PDF file.');
      }
    }

    if (!window.PDFLib) throw new Error('pdf-lib not loaded');
    var PDFDocument = window.PDFLib.PDFDocument;
    var degrees = window.PDFLib.degrees;

    onProgress && onProgress(0.05, 'Starting merge\u2026');

    var order = entries.slice();
    var mergedDoc = await PDFDocument.create();

    for (var i = 0; i < order.length; i++) {
      var entry = order[i];
      onProgress && onProgress(
        0.1 + (i / order.length) * 0.8,
        'Merging ' + (i + 1) + ' of ' + order.length + ': ' + entry.file.name + '\u2026'
      );

      var ab = await entry.file.arrayBuffer();
      var srcDoc = await PDFDocument.load(ab, { ignoreEncryption: true });
      var copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());

      var turn = entry.rotation % 360;
      copiedPages.forEach(function (pg) {
        if (turn && degrees) {
          var current = 0;
          try { current = pg.getRotation().angle || 0; } catch (err) { current = 0; }
          pg.setRotation(degrees((current + turn) % 360));
        }
        mergedDoc.addPage(pg);
      });

      /* Let the browser paint the progress bar between files. */
      await new Promise(function (resolve) { setTimeout(resolve, 0); });
    }

    onProgress && onProgress(0.95, 'Saving\u2026');
    var pdfBytes = await mergedDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });

    setSummary('\u2713 Merged ' + order.length + ' file' + (order.length === 1 ? '' : 's') +
      ' \u2014 ' + mergedDoc.getPageCount() + ' pages');

    onProgress && onProgress(1, 'Done!');
    return { blob: blob, filename: 'merged.pdf' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = {
    run: run,
    getOptionsHTML: getOptionsHTML,
    getOptions: getOptions,
    onFileReady: onFileReady,
    CONFIG: CONFIG,
  };
})();
