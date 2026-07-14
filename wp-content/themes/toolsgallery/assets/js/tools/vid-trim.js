/**
 * ToolsGallery — Trim Video
 * Handler: vid-trim
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-trim' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Fast trim (stream copy) is near-instant; precise trim re-encodes and takes longer.') : '';
    return notice +
      '<div id="vt-preview-wrap" style="margin-bottom:12px">' +
        '<video id="vt-preview" style="max-width:100%;border-radius:6px;background:#000" controls></video>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Start Time</label>' +
        '<input type="text" id="vt-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">End Time</label>' +
        '<input type="text" id="vt-end" class="tg-text-input" placeholder="0:30" value="0:30" style="width:80px">' +
      '</div>' +
      '<div id="vt-dur-info" style="font-size:12px;color:#666;margin-top:4px"></div>' +
      '<div class="tg-opt-row" style="margin-top:8px"><label class="tg-opt-label">Trim Mode</label>' +
        '<select id="vt-mode" class="tg-select">' +
          '<option value="fast">Fast trim (recommended)</option>' +
          '<option value="precise">Precise trim (re-encodes, slower)</option>' +
        '</select>' +
      '</div>';
  }

  function wireOptions(container) {
    function update() {
      var st = container.querySelector('#vt-start');
      var en = container.querySelector('#vt-end');
      var di = container.querySelector('#vt-dur-info');
      if (st && en && di && window.TGVideoUtil) {
        var d = Math.max(0, TGVideoUtil.parseTime(en.value) - TGVideoUtil.parseTime(st.value));
        di.textContent = 'Trimmed duration: ' + d + ' seconds';
      }
    }
    var s = container.querySelector('#vt-start');
    var e = container.querySelector('#vt-end');
    if (s) s.addEventListener('input', update);
    if (e) e.addEventListener('input', update);
  }

  /* Called by tool-runner when a file is selected — load the preview
     player and default the end time to the full duration. */
  function onFileReady(file) {
    var preview = document.getElementById('vt-preview');
    if (!preview) return;
    preview.src = URL.createObjectURL(file);
    preview.onloadedmetadata = function () {
      var dur = Math.floor(preview.duration) || 0;
      var endEl = document.getElementById('vt-end');
      if (endEl && window.TGVideoUtil) endEl.value = TGVideoUtil.toHHMMSS(dur);
      var di = document.getElementById('vt-dur-info');
      if (di && window.TGVideoUtil) di.textContent = 'Video duration: ' + TGVideoUtil.toHHMMSS(dur);
    };
  }

  function getOptions(el) {
    if (!el) return {};
    var st = el.querySelector('#vt-start');
    var en = el.querySelector('#vt-end');
    var mode = el.querySelector('#vt-mode');
    return {
      start: st ? st.value : '0:00',
      end: en ? en.value : '0:30',
      mode: mode ? mode.value : 'fast',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var startSec = U.parseTime(options.start || '0:00');
    var endSec = U.parseTime(options.end || '0:30');
    if (endSec <= startSec) throw new Error('End time must be after start time.');

    /* Fast mode stream-copies, so keep the source container; precise
       mode re-encodes to MP4. */
    var inExt = U.getExt(file.name);
    var precise = options.mode === 'precise';
    var outExt = precise ? 'mp4' : inExt;
    var inName = 'input.' + inExt;
    var outName = 'output.' + outExt;
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      /* Input-seek (-ss before -i) plus an explicit duration (-t) trims
         the exact selected range; output-seeking with -to is unreliable
         in ffmpeg.wasm. Raw seconds keep the timestamps precise. */
      var durSec = endSec - startSec;
      var codec = precise ? ['-c:v', 'libx264', '-c:a', 'aac', '-preset', 'veryfast'] : ['-c', 'copy'];
      var args = ['-ss', String(startSec), '-i', inName, '-t', String(durSec)].concat(codec).concat([outName]);

      onProgress && onProgress(0.15, 'Trimming video...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, U.mimeForExt(outExt));
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-trimmed.' + outExt };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();
