/* ToolsGallery — add-signature.js
   Handler: add-signature
   Phase 3C
*/
(function () {
  'use strict';

  var CONFIG = {
    handler: 'add-signature',
    downloadName: 'signed.pdf',
  };

  var _signatureDataUrl = null;
  var _activeTab = 'draw';
  var _drawing = false;
  var _lastX = 0, _lastY = 0;
  var _canvas = null, _ctx = null;

  function getOptionsHTML(pageCount) {
    var pagesOptions = '<option value="last">Last page only</option><option value="all">All pages</option><option value="custom">Custom page(s)</option>';
    return '<div class="tg-sig-tabs" style="display:flex;gap:4px;margin-bottom:12px;">' +
      '<button type="button" class="tg-sig-tab tg-sig-tab--active" data-tab="draw">Draw</button>' +
      '<button type="button" class="tg-sig-tab" data-tab="type">Type</button>' +
      '<button type="button" class="tg-sig-tab" data-tab="upload">Upload</button>' +
    '</div>' +
    '<div class="tg-sig-panel" id="sig-panel-draw">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<label class="tg-opt-label" style="margin:0">Color:</label>' +
        '<input type="color" id="sig-color" value="#000000" style="width:36px;height:28px;border:1px solid #ccc;border-radius:4px;">' +
        '<label class="tg-opt-label" style="margin:0">Width:</label>' +
        '<input type="range" id="sig-width" min="1" max="6" value="2" style="width:80px;">' +
        '<button type="button" id="sig-clear" class="tg-btn-secondary" style="margin-left:auto;">Clear</button>' +
      '</div>' +
      '<canvas id="sig-canvas" width="400" height="150" style="border:1px solid #ccc;border-radius:4px;cursor:crosshair;background:#fff;touch-action:none;max-width:100%;"></canvas>' +
    '</div>' +
    '<div class="tg-sig-panel" id="sig-panel-type" hidden>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label" for="sig-name-input">Your name</label>' +
        '<input type="text" id="sig-name-input" class="tg-text-input" placeholder="Type your name..." style="font-size:18px;">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Style</label>' +
        '<div class="tg-radio-group">' +
          '<label><input type="radio" name="sig-style" value="cursive" checked> Script</label>' +
          '<label><input type="radio" name="sig-style" value="sans-serif"> Print</label>' +
        '</div>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Color</label>' +
        '<input type="color" id="sig-type-color" value="#000080" style="width:36px;height:28px;border:1px solid #ccc;border-radius:4px;">' +
      '</div>' +
      '<canvas id="sig-type-preview" width="400" height="80" style="border:1px solid #eee;border-radius:4px;background:#fff;max-width:100%;margin-top:8px;"></canvas>' +
    '</div>' +
    '<div class="tg-sig-panel" id="sig-panel-upload" hidden>' +
      '<label class="tg-opt-label">Upload signature image (PNG/JPG/SVG)</label>' +
      '<input type="file" id="sig-upload-input" accept="image/*" class="tg-text-input">' +
      '<img id="sig-upload-preview" src="" alt="" style="max-width:300px;max-height:100px;margin-top:8px;border:1px solid #eee;display:none;">' +
    '</div>' +
    '<hr style="margin:16px 0;">' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="sig-position-sel">Position</label>' +
      '<select id="sig-position-sel" class="tg-select">' +
        '<option value="bottom-right">Bottom Right</option>' +
        '<option value="bottom-center">Bottom Center</option>' +
        '<option value="bottom-left">Bottom Left</option>' +
        '<option value="custom">Custom (X/Y)</option>' +
      '</select>' +
    '</div>' +
    '<div id="sig-custom-pos" hidden style="display:flex;gap:8px;margin-top:4px;">' +
      '<label>X%: <input type="number" id="sig-custom-x" min="0" max="100" value="70" style="width:60px;"></label>' +
      '<label>Y%: <input type="number" id="sig-custom-y" min="0" max="100" value="85" style="width:60px;"></label>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="sig-pages-sel">Apply to pages</label>' +
      '<select id="sig-pages-sel" class="tg-select">' + pagesOptions + '</select>' +
    '</div>' +
    '<div id="sig-custom-pages-wrap" hidden>' +
      '<input type="text" id="sig-custom-pages" class="tg-text-input" placeholder="e.g. 1,3,5-8">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Signature size</label>' +
      '<input type="range" id="sig-size" min="50" max="300" value="150" style="width:200px;">' +
      '<span id="sig-size-label" style="margin-left:8px;font-size:13px;color:#666;">150px wide</span>' +
    '</div>' +
    '<style>' +
      '.tg-sig-tab{padding:6px 16px;border:1px solid #ccc;border-radius:4px;background:#f5f5f5;cursor:pointer;}' +
      '.tg-sig-tab--active{background:#E07B39;color:#fff;border-color:#E07B39;}' +
    '</style>' +
    '<script>' +
    '(function(){' +
      'var tabs=document.querySelectorAll(".tg-sig-tab");' +
      'tabs.forEach(function(t){t.addEventListener("click",function(){' +
        'tabs.forEach(function(x){x.classList.remove("tg-sig-tab--active");});' +
        't.classList.add("tg-sig-tab--active");' +
        'document.querySelectorAll(".tg-sig-panel").forEach(function(p){p.hidden=true;});' +
        'var panel=document.getElementById("sig-panel-"+t.dataset.tab);if(panel)panel.hidden=false;' +
        'window._tgSigActiveTab=t.dataset.tab;' +
      '});});' +
      // Draw canvas setup
      'var c=document.getElementById("sig-canvas");' +
      'if(c){var ctx=c.getContext("2d");ctx.strokeStyle="#000";ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";' +
        'var drawing=false,lx=0,ly=0;' +
        'function getPos(e,canvas){var r=canvas.getBoundingClientRect();var cl=e.touches?e.touches[0]:e;return{x:(cl.clientX-r.left)*(canvas.width/r.width),y:(cl.clientY-r.top)*(canvas.height/r.height)};}' +
        'c.addEventListener("mousedown",function(e){drawing=true;var p=getPos(e,c);lx=p.x;ly=p.y;ctx.beginPath();ctx.arc(lx,ly,ctx.lineWidth/2,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();});' +
        'c.addEventListener("mousemove",function(e){if(!drawing)return;var p=getPos(e,c);ctx.beginPath();ctx.moveTo(lx,ly);ctx.quadraticCurveTo(lx,ly,p.x,p.y);ctx.stroke();lx=p.x;ly=p.y;});' +
        'document.addEventListener("mouseup",function(){drawing=false;});' +
        'c.addEventListener("touchstart",function(e){e.preventDefault();drawing=true;var p=getPos(e,c);lx=p.x;ly=p.y;},{passive:false});' +
        'c.addEventListener("touchmove",function(e){e.preventDefault();if(!drawing)return;var p=getPos(e,c);ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(p.x,p.y);ctx.stroke();lx=p.x;ly=p.y;},{passive:false});' +
        'c.addEventListener("touchend",function(){drawing=false;});' +
        'document.getElementById("sig-clear").addEventListener("click",function(){ctx.clearRect(0,0,c.width,c.height);});' +
        'document.getElementById("sig-color").addEventListener("input",function(e){ctx.strokeStyle=e.target.value;ctx.fillStyle=e.target.value;});' +
        'document.getElementById("sig-width").addEventListener("input",function(e){ctx.lineWidth=parseInt(e.target.value,10);});' +
        'window._tgSigCanvas=c;}' +
      // Type tab
      'function updateTypePreview(){' +
        'var nameEl=document.getElementById("sig-name-input");' +
        'var styleEl=document.querySelector("input[name=\\'sig-style\\']:checked");' +
        'var colorEl=document.getElementById("sig-type-color");' +
        'var previewC=document.getElementById("sig-type-preview");' +
        'if(!nameEl||!previewC)return;' +
        'var pCtx=previewC.getContext("2d");' +
        'pCtx.clearRect(0,0,previewC.width,previewC.height);' +
        'var font=styleEl?styleEl.value:"cursive";' +
        'pCtx.font="36px "+font;' +
        'pCtx.fillStyle=colorEl?colorEl.value:"#000080";' +
        'pCtx.fillText(nameEl.value||"Your Signature",10,55);' +
        'window._tgSigTypeCanvas=previewC;}' +
      'var ni=document.getElementById("sig-name-input");if(ni)ni.addEventListener("input",updateTypePreview);' +
      'var tc=document.getElementById("sig-type-color");if(tc)tc.addEventListener("input",updateTypePreview);' +
      'document.querySelectorAll("input[name=\\'sig-style\\']").forEach(function(r){r.addEventListener("change",updateTypePreview);});' +
      // Upload tab
      'var ui=document.getElementById("sig-upload-input");if(ui)ui.addEventListener("change",function(e){' +
        'var f=e.target.files[0];if(!f)return;' +
        'var reader=new FileReader();' +
        'reader.onload=function(ev){' +
          'var img=document.getElementById("sig-upload-preview");' +
          'if(img){img.src=ev.target.result;img.style.display="block";}' +
          'window._tgSigUploadDataUrl=ev.target.result;};' +
        'reader.readAsDataURL(f);});' +
      // Position
      'var posSel=document.getElementById("sig-position-sel");if(posSel)posSel.addEventListener("change",function(){' +
        'var cp=document.getElementById("sig-custom-pos");if(cp)cp.hidden=posSel.value!=="custom";});' +
      // Pages
      'var pgSel=document.getElementById("sig-pages-sel");if(pgSel)pgSel.addEventListener("change",function(){' +
        'var cpw=document.getElementById("sig-custom-pages-wrap");if(cpw)cpw.hidden=pgSel.value!=="custom";});' +
      // Size
      'var szSlider=document.getElementById("sig-size");if(szSlider)szSlider.addEventListener("input",function(){' +
        'var lbl=document.getElementById("sig-size-label");if(lbl)lbl.textContent=szSlider.value+"px wide";});' +
    '})();' +
    '<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var pos = optionsEl.querySelector('#sig-position-sel');
    var pages = optionsEl.querySelector('#sig-pages-sel');
    var customPages = optionsEl.querySelector('#sig-custom-pages');
    var sizeSlider = optionsEl.querySelector('#sig-size');
    var customX = optionsEl.querySelector('#sig-custom-x');
    var customY = optionsEl.querySelector('#sig-custom-y');
    var activeTab = window._tgSigActiveTab || 'draw';

    var sigDataUrl = null;
    if (activeTab === 'draw' && window._tgSigCanvas) {
      sigDataUrl = window._tgSigCanvas.toDataURL('image/png');
    } else if (activeTab === 'type' && window._tgSigTypeCanvas) {
      sigDataUrl = window._tgSigTypeCanvas.toDataURL('image/png');
    } else if (activeTab === 'upload' && window._tgSigUploadDataUrl) {
      sigDataUrl = window._tgSigUploadDataUrl;
    }

    return {
      sigDataUrl: sigDataUrl,
      position: pos ? pos.value : 'bottom-right',
      customX: customX ? parseInt(customX.value, 10) : 70,
      customY: customY ? parseInt(customY.value, 10) : 85,
      pagesMode: pages ? pages.value : 'last',
      customPagesStr: customPages ? customPages.value : '',
      sigWidth: sizeSlider ? parseInt(sizeSlider.value, 10) : 150,
    };
  }

  function parsePageRange(rangeStr, total) {
    var pages = [];
    rangeStr.split(',').forEach(function (part) {
      part = part.trim();
      var m = part.match(/^(\d+)-(\d+)$/);
      if (m) {
        for (var i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) {
          if (i >= 1 && i <= total) pages.push(i - 1);
        }
      } else if (/^\d+$/.test(part)) {
        var n = parseInt(part, 10);
        if (n >= 1 && n <= total) pages.push(n - 1);
      }
    });
    return pages;
  }

  async function run(file, options, onProgress) {
    if (!window.PDFLib) throw new Error('pdf-lib not loaded.');

    if (!options.sigDataUrl) {
      throw new Error('Please create a signature first using Draw, Type, or Upload tab.');
    }

    onProgress && onProgress(0.1, 'Loading PDF...');
    var arrayBuffer = await file.arrayBuffer();
    var pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    var pages = pdfDoc.getPages();
    var totalPages = pages.length;

    var targetPageIndices;
    if (options.pagesMode === 'all') {
      targetPageIndices = pages.map(function (_, i) { return i; });
    } else if (options.pagesMode === 'custom' && options.customPagesStr) {
      targetPageIndices = parsePageRange(options.customPagesStr, totalPages);
    } else {
      targetPageIndices = [totalPages - 1]; // last page
    }

    onProgress && onProgress(0.3, 'Embedding signature...');

    // Convert data URL to bytes
    var base64 = options.sigDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    var bytes = Uint8Array.from(atob(base64), function (c) { return c.charCodeAt(0); });

    var sigImage;
    if (options.sigDataUrl.startsWith('data:image/png')) {
      sigImage = await pdfDoc.embedPng(bytes);
    } else {
      sigImage = await pdfDoc.embedJpg(bytes);
    }

    var targetWidth = options.sigWidth;
    var dims = sigImage.scaleToFit(targetWidth, targetWidth * (sigImage.height / sigImage.width));

    for (var i = 0; i < targetPageIndices.length; i++) {
      onProgress && onProgress(0.3 + i / targetPageIndices.length * 0.6, 'Signing page ' + (targetPageIndices[i] + 1) + '...');
      var page = pages[targetPageIndices[i]];
      var pageSize = page.getSize();

      var x, y;
      if (options.position === 'bottom-right') {
        x = pageSize.width - dims.width - 20;
        y = 20;
      } else if (options.position === 'bottom-center') {
        x = (pageSize.width - dims.width) / 2;
        y = 20;
      } else if (options.position === 'bottom-left') {
        x = 20;
        y = 20;
      } else {
        x = (options.customX / 100) * pageSize.width;
        y = (1 - options.customY / 100) * pageSize.height;
      }

      page.drawImage(sigImage, { x: x, y: y, width: dims.width, height: dims.height });
    }

    onProgress && onProgress(0.95, 'Saving...');
    var pdfBytes = await pdfDoc.save();
    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
    return { blob: blob, filename: CONFIG.downloadName };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
