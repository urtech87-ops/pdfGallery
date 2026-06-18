/**
 * ============================================================
 * ToolsGallery — Extract Text Tool
 * ============================================================
 * Handler key: extract-text
 * Tool URL: /tool/extract-text/
 *
 * DEPENDENCIES (loaded by functions.php):
 * - pdf.js (pdfjsLib)
 * ============================================================
 */
(function () {
  'use strict';

  async function run(files, options, callbacks) {
    var onProgress = callbacks.onProgress;
    var onError    = callbacks.onError;
    var getBox     = callbacks.getBox;
    var getActionBtn   = callbacks.getActionBtn;
    var getDownloadBtn = callbacks.getDownloadBtn;
    var getResultEl    = callbacks.getResultEl;
    var getSuccessBanner = callbacks.getSuccessBanner;
    var getErrorBanner   = callbacks.getErrorBanner;
    var onSuccess        = callbacks.onSuccess;

    onProgress(10, 'Loading PDF…');
    var ab     = await files[0].arrayBuffer();
    var pdfDoc = await pdfjsLib.getDocument({ data: ab }).promise;
    var numPages = pdfDoc.numPages;

    var pagesToProcess = [];
    if (options.pageMode === 'specific') {
      var pn = options.specificPage || 1;
      pagesToProcess = [pn];
    } else {
      for (var i = 1; i <= numPages; i++) pagesToProcess.push(i);
    }

    var results = [];
    for (var j = 0; j < pagesToProcess.length; j++) {
      var pageNum = pagesToProcess[j];
      onProgress(10 + Math.round((j / pagesToProcess.length) * 80), 'Reading page ' + pageNum + '…');
      var page        = await pdfDoc.getPage(pageNum);
      var textContent = await page.getTextContent();
      var items        = textContent.items;

      var lines = [];
      items.forEach(function (item) {
        if (!item.str) return;
        var y  = Math.round(item.transform[5]);
        var fs = Math.abs(item.transform[3]) || 12;
        var last = lines[lines.length - 1];
        if (!last || Math.abs(last.y - y) > 3) {
          lines.push({ y: y, text: item.str, fontSize: fs, x: item.transform[4] });
        } else {
          last.text += item.str;
          last.fontSize = Math.max(last.fontSize, fs);
        }
      });
      lines.sort(function (a, b) { return b.y - a.y; });

      results.push({
        page:  pageNum,
        text:  lines.map(function (l) { return l.text; }).join('\n'),
        lines: lines,
        items: items.map(function (it) {
          return { x: Math.round(it.transform[4]), y: Math.round(it.transform[5]), str: it.str, fontSize: Math.round(Math.abs(it.transform[3])) };
        }),
      });
    }

    var allText = results.map(function (r) { return '--- Page ' + r.page + ' ---\n' + r.text; }).join('\n\n');
    if (!allText.trim()) { onError('No text found. This PDF may contain scanned images only.'); return; }

    /* Build result UI */
    var box = getBox ? getBox() : null;
    if (box) {
      var existing = box.querySelector('.tg-extract-result-wrap');
      if (existing) existing.parentNode.removeChild(existing);
      var etWrap = document.createElement('div');
      etWrap.className = 'tg-extract-result-wrap';
      etWrap.innerHTML =
        '<div class="tg-tab-group" style="margin-bottom:8px">' +
          '<button type="button" class="tg-tab-btn tg-tab-btn--active" data-etfmt="plain">Plain Text</button>' +
          '<button type="button" class="tg-tab-btn" data-etfmt="markdown">Markdown</button>' +
          '<button type="button" class="tg-tab-btn" data-etfmt="json">JSON</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px">' +
          '<button type="button" class="tg-btn-secondary et-copy-btn">Copy All</button>' +
          '<button type="button" class="tg-btn-secondary et-dl-txt-btn">Download .txt</button>' +
          '<button type="button" class="tg-btn-secondary et-dl-md-btn">Download .md</button>' +
          '<button type="button" class="tg-btn-secondary et-dl-json-btn">Download .json</button>' +
        '</div>' +
        '<textarea class="tg-extract-textarea" readonly style="width:100%;height:300px;font-family:monospace;font-size:12px;resize:vertical;box-sizing:border-box"></textarea>' +
        '<p class="tg-opt-info et-stats" style="margin-top:6px"></p>';

      var actionBtn = getActionBtn ? getActionBtn() : null;
      if (actionBtn && actionBtn.parentNode) actionBtn.parentNode.insertBefore(etWrap, actionBtn);

      function getFmt(fmt) {
        if (fmt === 'json') return JSON.stringify(results, null, 2);
        if (fmt === 'markdown') return results.map(function (r) {
          return '## Page ' + r.page + '\n\n' + r.lines.map(function (l) { return l.fontSize > 14 ? '### ' + l.text : l.text; }).join('\n') + '\n';
        }).join('\n---\n\n');
        return allText;
      }

      var ta    = etWrap.querySelector('.tg-extract-textarea');
      var stats = etWrap.querySelector('.et-stats');
      function updateDisplay(fmt) {
        var txt = getFmt(fmt);
        ta.value = txt;
        stats.textContent = txt.length + ' characters · ' + txt.split(/\s+/).filter(Boolean).length + ' words';
      }
      updateDisplay('plain');

      etWrap.querySelectorAll('.tg-tab-btn[data-etfmt]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          etWrap.querySelectorAll('.tg-tab-btn[data-etfmt]').forEach(function (b) { b.classList.remove('tg-tab-btn--active'); });
          btn.classList.add('tg-tab-btn--active');
          updateDisplay(btn.dataset.etfmt);
        });
      });

      function dlText(filename, content) {
        var b = new Blob([content], { type: 'text/plain' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }

      var copyBtn = etWrap.querySelector('.et-copy-btn');
      if (copyBtn) copyBtn.addEventListener('click', function () {
        navigator.clipboard.writeText(ta.value).then(function () {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy All'; }, 2000);
        }).catch(function () { ta.select(); document.execCommand('copy'); });
      });
      etWrap.querySelector('.et-dl-txt-btn')  && etWrap.querySelector('.et-dl-txt-btn').addEventListener('click',  function () { dlText('extracted-text.txt',  getFmt('plain'));    });
      etWrap.querySelector('.et-dl-md-btn')   && etWrap.querySelector('.et-dl-md-btn').addEventListener('click',   function () { dlText('extracted-text.md',   getFmt('markdown')); });
      etWrap.querySelector('.et-dl-json-btn') && etWrap.querySelector('.et-dl-json-btn').addEventListener('click', function () { dlText('extracted-text.json', getFmt('json'));     });
    }

    /* Show result area without download button */
    var resultEl = getResultEl ? getResultEl() : null;
    var sbanner  = getSuccessBanner ? getSuccessBanner() : null;
    var ebanner  = getErrorBanner   ? getErrorBanner()   : null;
    var dlBtn    = getDownloadBtn   ? getDownloadBtn()   : null;
    if (resultEl)  resultEl.hidden  = false;
    if (sbanner)   sbanner.hidden   = false;
    if (ebanner)   ebanner.hidden   = true;
    if (dlBtn)     dlBtn.hidden     = true;

    /* Signal done — no blob download */
    onSuccess(null, null);
  }

  function getOptionsHTML() {
    return '<label class="tg-opt-label">Pages</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="et-pages" value="all" checked> All pages</label>' +
        '<label><input type="radio" name="et-pages" value="specific"> Specific page</label>' +
      '</div>' +
      '<div id="et-page-wrap" hidden>' +
        '<input type="number" id="et-page-num" class="tg-text-input" min="1" value="1" placeholder="Page number" style="width:100px">' +
      '</div>';
  }

  function afterOptionsInjected(container) {
    container.querySelectorAll('input[name="et-pages"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var w = container.querySelector('#et-page-wrap');
        if (w) w.hidden = r.value !== 'specific';
      });
    });
  }

  function getOptions() {
    var pm = document.querySelector('input[name="et-pages"]:checked');
    var pn = document.querySelector('#et-page-num');
    return {
      pageMode:     pm ? pm.value : 'all',
      specificPage: pn ? parseInt(pn.value) : 1,
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools['extract-text'] = { run: run, getOptionsHTML: getOptionsHTML, afterOptionsInjected: afterOptionsInjected, getOptions: getOptions };
})();
