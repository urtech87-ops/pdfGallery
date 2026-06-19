/**
 * ToolsGallery — Add Border to Image
 * Handler: img-add-border
 * URL: /tool/add-border-to-image/
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'img-add-border' };

  function getOptionsHTML() {
    return '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Border Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-style" value="solid" checked> Solid</label>' +
        '<label><input type="radio" name="iab-style" value="dashed"> Dashed</label>' +
        '<label><input type="radio" name="iab-style" value="double"> Double</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-color">Color</label>' +
      '<input type="color" id="iab-color" value="#000000">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-width">Width: <span id="iab-width-val">20</span>px</label>' +
      '<input type="range" id="iab-width" min="1" max="100" value="20" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Position</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-pos" value="outside" checked> Outside (expand canvas)</label>' +
        '<label><input type="radio" name="iab-pos" value="inside"> Inside (overlap)</label>' +
      '</div>' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label">Corner Style</label>' +
      '<div class="tg-radio-group">' +
        '<label><input type="radio" name="iab-corner" value="sharp" checked> Sharp</label>' +
        '<label><input type="radio" name="iab-corner" value="rounded"> Rounded</label>' +
      '</div>' +
    '</div>' +
    '<div id="iab-radius-wrap" hidden class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-radius">Radius: <span id="iab-radius-val">10</span>px</label>' +
      '<input type="range" id="iab-radius" min="0" max="50" value="10" style="flex:1">' +
    '</div>' +
    '<div class="tg-opt-row">' +
      '<label class="tg-opt-label" for="iab-padding">Inner Padding: <span id="iab-padding-val">0</span>px</label>' +
      '<input type="range" id="iab-padding" min="0" max="50" value="0" style="flex:1">' +
    '</div>' +
    '<script>(function(){' +
      'function link(id,valId,suf){var s=document.getElementById(id),v=document.getElementById(valId);if(s&&v)s.addEventListener("input",function(){v.textContent=s.value+(suf||"");});}' +
      'link("iab-width","iab-width-val","");link("iab-radius","iab-radius-val","");link("iab-padding","iab-padding-val","");' +
      'document.querySelectorAll("input[name=\'iab-corner\']").forEach(function(r){r.addEventListener("change",function(){var w=document.getElementById("iab-radius-wrap");if(w)w.hidden=r.value!=="rounded";});});' +
    '})();<\/script>';
  }

  function getOptions(optionsEl) {
    if (!optionsEl) return {};
    var style = optionsEl.querySelector('input[name="iab-style"]:checked');
    var color = optionsEl.querySelector('#iab-color');
    var width = optionsEl.querySelector('#iab-width');
    var pos = optionsEl.querySelector('input[name="iab-pos"]:checked');
    var corner = optionsEl.querySelector('input[name="iab-corner"]:checked');
    var radius = optionsEl.querySelector('#iab-radius');
    var padding = optionsEl.querySelector('#iab-padding');
    return {
      style: style ? style.value : 'solid',
      color: color ? color.value : '#000000',
      width: width ? parseInt(width.value) : 20,
      position: pos ? pos.value : 'outside',
      corner: corner ? corner.value : 'sharp',
      radius: radius ? parseInt(radius.value) : 10,
      padding: padding ? parseInt(padding.value) : 0,
    };
  }

  async function run(file, options, onProgress) {
    onProgress && onProgress(0.1, 'Loading image...');
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var bw = options.width;
        var pad = options.padding;
        var outside = options.position === 'outside';

        var iw = img.width, ih = img.height;
        var cw = outside ? iw + (bw + pad) * 2 : iw;
        var ch = outside ? ih + (bw + pad) * 2 : ih;
        var imgX = outside ? bw + pad : 0;
        var imgY = outside ? bw + pad : 0;

        var canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        var ctx = canvas.getContext('2d');

        // Draw background/image
        ctx.drawImage(img, imgX, imgY);

        // Draw border
        ctx.strokeStyle = options.color;
        ctx.lineWidth = bw;

        var borderOffset = bw / 2;
        var rx = outside ? bw/2 + pad : borderOffset;
        var ry = outside ? bw/2 + pad : borderOffset;
        var rw = cw - bw - (outside ? pad * 2 : 0);
        var rh = ch - bw - (outside ? pad * 2 : 0);
        if (!outside) { rw = iw - bw; rh = ih - bw; }

        if (options.style === 'dashed') {
          ctx.setLineDash([bw * 3, bw * 2]);
        } else if (options.style === 'double') {
          // Draw two borders
          ctx.setLineDash([]);
          drawBorderRect(ctx, rx, ry, rw, rh, options.corner === 'rounded' ? options.radius : 0);
          var innerOffset = bw;
          drawBorderRect(ctx, rx + innerOffset, ry + innerOffset, rw - innerOffset*2, rh - innerOffset*2, options.corner === 'rounded' ? Math.max(0, options.radius - innerOffset) : 0);
          ctx.lineWidth = bw / 3;
          ctx.stroke();

          var ext2 = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '.jpg';
          var mime2 = ext2 === '.png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('Failed')); return; }
            onProgress && onProgress(1, 'Done!');
            resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-bordered' + ext2 });
          }, mime2, 0.92);
          return;
        }

        drawBorderRect(ctx, rx, ry, rw, rh, options.corner === 'rounded' ? options.radius : 0);
        ctx.stroke();

        var ext = file.name.match(/\.[^.]+$/) ? file.name.match(/\.[^.]+$/)[0] : '.jpg';
        var mime = ext === '.png' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Failed')); return; }
          onProgress && onProgress(1, 'Done!');
          resolve({ blob: blob, filename: file.name.replace(/\.[^.]+$/, '') + '-bordered' + ext });
        }, mime, 0.92);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function drawBorderRect(ctx, x, y, w, h, radius) {
    if (!radius) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    } else {
      var r = Math.min(radius, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
