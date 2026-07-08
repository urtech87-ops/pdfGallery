/**
 * ToolsGallery — Video Screenshot
 * Handler: vid-screenshot
 * Captures frames directly from a <video> element via canvas — no
 * FFmpeg download needed for this tool.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-screenshot' };
  var _shots = [];

  function getOptionsHTML() {
    _shots = [];
    return '<div id="vss-wrap">' +
      '<div id="vss-player-wrap" hidden>' +
        '<video id="vss-player" style="max-width:100%;border-radius:6px;background:#000" controls></video>' +
        '<div style="margin-top:8px;display:flex;gap:8px;align-items:center">' +
          '<select id="vss-fmt" class="tg-select" style="width:100px">' +
            '<option value="png">PNG</option><option value="jpeg">JPEG</option>' +
          '</select>' +
          '<input type="range" id="vss-quality" min="50" max="100" value="90" style="flex:1" title="Quality (JPEG)">' +
          '<button type="button" id="vss-capture-btn" class="tg-btn tg-btn--primary" style="white-space:nowrap">&#128248; Capture Frame</button>' +
        '</div>' +
      '</div>' +
      '<p id="vss-upload-hint" style="font-size:13px;color:#666">Upload a video, seek to the frame you want, then capture. The action button downloads the frame at the current playhead.</p>' +
      '<div id="vss-gallery" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>' +
    '</div>';
  }

  function captureFrame(player, fmt, quality) {
    return new Promise(function (resolve, reject) {
      if (!player || !player.videoWidth) {
        reject(new Error('Video is not ready yet. Wait for it to load, seek to a frame, then try again.'));
        return;
      }
      var canvas = document.createElement('canvas');
      canvas.width = player.videoWidth;
      canvas.height = player.videoHeight;
      canvas.getContext('2d').drawImage(player, 0, 0);
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Could not capture the frame. Try a different video format.'));
      }, 'image/' + fmt, quality);
    });
  }

  function wireOptions(container) {
    var captureBtn = container.querySelector('#vss-capture-btn');
    var gallery = container.querySelector('#vss-gallery');
    if (!captureBtn) return;
    captureBtn.addEventListener('click', function () {
      var player = document.getElementById('vss-player');
      var fmtSel = container.querySelector('#vss-fmt');
      var qualSlider = container.querySelector('#vss-quality');
      var fmt = fmtSel ? fmtSel.value : 'png';
      var quality = qualSlider ? parseInt(qualSlider.value, 10) / 100 : 0.9;
      captureFrame(player, fmt, quality).then(function (blob) {
        _shots.push({ blob: blob, fmt: fmt });
        var url = URL.createObjectURL(blob);
        var idx = _shots.length;
        var div = document.createElement('div');
        div.style.cssText = 'position:relative;display:inline-block';
        var img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'height:80px;border-radius:4px;border:1px solid #ddd';
        var btn = document.createElement('button');
        btn.textContent = '⬇';
        btn.title = 'Download';
        btn.type = 'button';
        btn.style.cssText = 'position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:3px;cursor:pointer;padding:2px 5px;font-size:12px';
        btn.addEventListener('click', function () {
          var a = document.createElement('a');
          a.href = url;
          a.download = 'screenshot-' + idx + '.' + fmt;
          a.click();
        });
        div.appendChild(img);
        div.appendChild(btn);
        if (gallery) gallery.appendChild(div);
      }).catch(function (e) {
        alert(e.message);
      });
    });
  }

  function onFileReady(file) {
    var player = document.getElementById('vss-player');
    var playerWrap = document.getElementById('vss-player-wrap');
    var hint = document.getElementById('vss-upload-hint');
    if (!player) return;
    player.src = URL.createObjectURL(file);
    if (playerWrap) playerWrap.hidden = false;
    if (hint) hint.textContent = 'Seek to the frame you want, then use "Capture Frame" or the action button below.';
  }

  function getOptions(el) {
    var fmt = el && el.querySelector('#vss-fmt');
    var q = el && el.querySelector('#vss-quality');
    return {
      format: fmt ? fmt.value : 'png',
      quality: q ? parseInt(q.value, 10) / 100 : 0.9,
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    var player = document.getElementById('vss-player');
    if (player && !player.src) onFileReady(file);

    onProgress && onProgress(0.3, 'Capturing frame...');
    var fmt = options.format || 'png';
    var blob = await captureFrame(player, fmt, options.quality || 0.9);
    onProgress && onProgress(1, 'Done!');

    var base = U ? U.stripExt(file.name) : 'video';
    var ext = fmt === 'jpeg' ? 'jpg' : fmt;
    return { blob: blob, filename: base + '-screenshot.' + ext };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();
