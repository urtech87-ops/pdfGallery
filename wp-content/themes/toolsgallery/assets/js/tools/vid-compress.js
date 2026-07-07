/**
 * ToolsGallery — Video Compressor
 * Handler: vid-compress
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-compress' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Quality Preset</label>' +
        '<select id="vc-quality" class="tg-select">' +
          '<option value="28">Web (smaller file, good quality)</option>' +
          '<option value="23" selected>Balanced (recommended)</option>' +
          '<option value="18">High Quality (larger file)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label class="tg-opt-label">Resolution</label>' +
        '<select id="vc-res" class="tg-select">' +
          '<option value="">Keep original</option>' +
          '<option value="1920:1080">1080p</option>' +
          '<option value="1280:720">720p</option>' +
          '<option value="854:480">480p</option>' +
          '<option value="640:360">360p</option>' +
        '</select>' +
      '</div>' +
      '<div id="vc-size-info" style="margin-top:8px;font-size:12px;color:#666"></div>';
  }

  function getOptions(el) {
    if (!el) return {};
    var q = el.querySelector('#vc-quality');
    var r = el.querySelector('#vc-res');
    return {
      crf: q ? q.value : '23',
      res: r ? r.value : '',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    if (file.size > 524288000) {
      var proceed = confirm('This file is ' + (file.size / 1048576).toFixed(0) + 'MB. Processing may take a very long time. Continue?');
      if (!proceed) throw new Error('Cancelled by user.');
    }

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var args = ['-i', inName, '-vcodec', 'libx264', '-crf', options.crf || '23', '-preset', 'fast', '-acodec', 'aac', '-b:a', '128k'];
      if (options.res) {
        args = args.concat(['-vf', 'scale=' + options.res + ':force_original_aspect_ratio=decrease:force_divisible_by=2']);
      }
      args.push(outName);

      onProgress && onProgress(0.15, 'Compressing video...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');

      var infoEl = document.getElementById('vc-size-info');
      if (infoEl) {
        var saved = Math.round((1 - blob.size / file.size) * 100);
        infoEl.innerHTML = '<strong>Original:</strong> ' + fmtBytes(file.size) +
          ' &rarr; <strong>Compressed:</strong> ' + fmtBytes(blob.size) +
          ' <span style="color:' + (saved > 0 ? 'green' : '#999') + '">(' + (saved > 0 ? saved + '% smaller' : 'no change') + ')</span>';
      }

      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-compressed.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  function fmtBytes(b) {
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
