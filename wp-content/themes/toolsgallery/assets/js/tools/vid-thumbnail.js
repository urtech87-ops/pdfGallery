/**
 * ToolsGallery — Video Thumbnail Maker
 * Handler: vid-thumbnail
 * Extracts real video frames with FFmpeg — a single frame at a chosen
 * timestamp, or several frames at a fixed interval (zipped).
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-thumbnail' };
  var _duration = 0;

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
      '<div id="vth-info" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to see its duration.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Capture Method</label>' +
        '<select id="vth-mode" class="tg-select">' +
          '<option value="single" selected>Single frame at specific time</option>' +
          '<option value="multi">Multiple frames (every N seconds)</option>' +
        '</select>' +
      '</div>' +
      '<div id="vth-single-wrap">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Time (HH:MM:SS)</label>' +
          '<input type="text" id="vth-time" class="tg-text-input" value="00:00:01" placeholder="00:00:05" style="width:110px">' +
        '</div>' +
      '</div>' +
      '<div id="vth-multi-wrap" hidden>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Every N seconds</label>' +
          '<input type="number" id="vth-interval" class="tg-text-input" min="1" max="3600" value="5" style="width:80px">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Max thumbnails</label>' +
          '<select id="vth-count" class="tg-select" style="width:90px">' +
            '<option value="3">3</option><option value="5" selected>5</option><option value="10">10</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Format</label>' +
        '<select id="vth-fmt" class="tg-select" style="width:110px">' +
          '<option value="jpg" selected>JPG</option>' +
          '<option value="png">PNG</option>' +
        '</select>' +
      '</div>' +
      '<div id="vth-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>';
  }

  function wireOptions(container) {
    var mode = container.querySelector('#vth-mode');
    var singleWrap = container.querySelector('#vth-single-wrap');
    var multiWrap = container.querySelector('#vth-multi-wrap');
    if (mode) {
      mode.addEventListener('change', function () {
        if (singleWrap) singleWrap.hidden = mode.value !== 'single';
        if (multiWrap)  multiWrap.hidden  = mode.value !== 'multi';
      });
    }
  }

  function onFileReady(file) {
    _duration = 0;
    var infoEl = document.getElementById('vth-info');
    var vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.src = URL.createObjectURL(file);
    vid.onloadedmetadata = function () {
      _duration = vid.duration || 0;
      if (infoEl && window.TGVideoUtil) {
        infoEl.textContent = 'Video duration: ' + TGVideoUtil.toHHMMSS(_duration) +
          ' — resolution: ' + vid.videoWidth + ' × ' + vid.videoHeight + ' px';
      }
      URL.revokeObjectURL(vid.src);
    };
  }

  function getOptions(el) {
    if (!el) return {};
    var mode = el.querySelector('#vth-mode');
    var time = el.querySelector('#vth-time');
    var interval = el.querySelector('#vth-interval');
    var count = el.querySelector('#vth-count');
    var fmt = el.querySelector('#vth-fmt');
    return {
      mode: mode ? mode.value : 'single',
      time: time ? time.value : '00:00:01',
      interval: interval ? parseInt(interval.value, 10) || 5 : 5,
      count: count ? parseInt(count.value, 10) || 5 : 5,
      format: fmt ? fmt.value : 'jpg',
    };
  }

  function showGrid(thumbs, mime) {
    var grid = document.getElementById('vth-grid');
    if (!grid) return;
    grid.innerHTML = '';
    thumbs.forEach(function (data) {
      var img = document.createElement('img');
      img.src = URL.createObjectURL(new Blob([data.buffer], { type: mime }));
      img.style.cssText = 'height:80px;border-radius:4px;border:1px solid #ddd';
      grid.appendChild(img);
    });
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var ext = options.format === 'png' ? 'png' : 'jpg';
    var mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    var quality = ext === 'jpg' ? ['-q:v', '2'] : [];
    var isMulti = options.mode === 'multi';
    var maxCount = isMulti ? Math.min(Math.max(options.count, 1), 20) : 1;

    if (isMulti && typeof JSZip === 'undefined') {
      throw new Error('ZIP library not loaded. Please refresh the page.');
    }

    var inName = 'input.' + U.getExt(file.name);
    var ffmpeg = null;
    var made = [];

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      onProgress && onProgress(0.15, 'Extracting frame' + (isMulti ? 's' : '') + '...');
      if (isMulti) {
        var interval = Math.max(1, options.interval || 5);
        await U.exec(ffmpeg, ['-i', inName, '-vf', 'fps=1/' + interval,
          '-frames:v', String(maxCount)].concat(quality).concat(['thumb%03d.' + ext]));
      } else {
        var secs = U.parseTime(options.time);
        if (_duration && secs >= _duration) {
          throw new Error('Please enter a time within the video (duration is ' + U.toHHMMSS(_duration) + ').');
        }
        await U.exec(ffmpeg, ['-ss', String(secs), '-i', inName,
          '-frames:v', '1'].concat(quality).concat(['thumb001.' + ext]));
      }

      onProgress && onProgress(0.9, 'Collecting thumbnails...');
      var thumbs = [];
      for (var i = 1; i <= maxCount; i++) {
        var fname = 'thumb' + String(i).padStart(3, '0') + '.' + ext;
        var data;
        try {
          data = ffmpeg.FS('readFile', fname);
        } catch (e) { break; }
        made.push(fname);
        if (data && data.length) thumbs.push(data);
      }
      if (!thumbs.length) {
        throw new Error('No frames could be extracted. Check the timestamp and try again.');
      }

      showGrid(thumbs, mime);

      var base = U.stripExt(file.name);
      if (thumbs.length > 1) {
        onProgress && onProgress(0.95, 'Creating ZIP...');
        var zip = new JSZip();
        thumbs.forEach(function (t, idx) {
          zip.file('thumbnail-' + (idx + 1) + '.' + ext, t.buffer);
        });
        var zipBlob = await zip.generateAsync({ type: 'blob' });
        onProgress && onProgress(1, 'Done! ' + thumbs.length + ' thumbnails created.');
        return { blob: zipBlob, filename: base + '-thumbnails.zip' };
      }
      onProgress && onProgress(1, 'Done!');
      return { blob: U.makeBlob(thumbs[0], mime), filename: base + '-thumbnail.' + ext };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName].concat(made));
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();
