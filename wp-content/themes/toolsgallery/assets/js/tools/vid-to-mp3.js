/**
 * ToolsGallery — Video to Audio
 * Handler: vid-to-mp3
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-to-mp3' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML() : '';
    return notice +
      '<div class="tg-opt-row"><label class="tg-opt-label">Output Format</label>' +
        '<select id="v2a-fmt" class="tg-select">' +
          '<option value="mp3">MP3</option><option value="aac">AAC</option>' +
          '<option value="wav">WAV</option><option value="ogg">OGG</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Quality</label>' +
        '<select id="v2a-q" class="tg-select">' +
          '<option value="320k">High (320kbps)</option>' +
          '<option value="192k" selected>Standard (192kbps)</option>' +
          '<option value="128k">Low (128kbps)</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Extract Section</label>' +
        '<select id="v2a-section" class="tg-select">' +
          '<option value="full">Full audio</option>' +
          '<option value="custom">Custom range</option>' +
        '</select>' +
      '</div>' +
      '<div id="v2a-range" hidden style="margin-top:8px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
          '<input type="text" id="v2a-start" class="tg-text-input" placeholder="0:00" value="0:00">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">End (MM:SS)</label>' +
          '<input type="text" id="v2a-end" class="tg-text-input" placeholder="1:00" value="1:00">' +
        '</div>' +
      '</div>';
  }

  function wireOptions(container) {
    var s = container.querySelector('#v2a-section');
    var r = container.querySelector('#v2a-range');
    if (s && r) s.addEventListener('change', function () { r.hidden = s.value !== 'custom'; });
  }

  function getOptions(el) {
    if (!el) return {};
    var fmt = el.querySelector('#v2a-fmt');
    var q = el.querySelector('#v2a-q');
    var sec = el.querySelector('#v2a-section');
    var st = el.querySelector('#v2a-start');
    var en = el.querySelector('#v2a-end');
    return {
      format: fmt ? fmt.value : 'mp3',
      bitrate: q ? q.value : '192k',
      section: sec ? sec.value : 'full',
      start: st ? st.value : '0:00',
      end: en ? en.value : '',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var fmt = options.format || 'mp3';
    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.' + fmt;
    var ffmpeg = null;

    if (options.section === 'custom' && U.parseTime(options.end) <= U.parseTime(options.start)) {
      throw new Error('End time must be after start time.');
    }

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var args = ['-i', inName];
      if (options.section === 'custom') {
        args = args.concat(['-ss', String(U.parseTime(options.start)), '-to', String(U.parseTime(options.end))]);
      }
      args.push('-vn');

      var codecMap = {
        mp3: ['-acodec', 'libmp3lame', '-b:a', options.bitrate, '-ar', '44100'],
        aac: ['-acodec', 'aac', '-b:a', options.bitrate],
        wav: ['-acodec', 'pcm_s16le'],
        ogg: ['-acodec', 'libvorbis', '-b:a', options.bitrate],
      };
      args = args.concat(codecMap[fmt] || codecMap.mp3);
      args.push(outName);

      onProgress && onProgress(0.15, 'Extracting audio...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, U.mimeForExt(fmt));
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '.' + fmt };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, wireOptions: wireOptions, CONFIG: CONFIG };
})();
