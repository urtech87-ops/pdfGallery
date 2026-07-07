/**
 * ToolsGallery — Audio Extractor (Advanced)
 * Handler: vid-audio-extract
 * Extracts the audio track as MP3 / WAV / AAC / FLAC / OGG with optional
 * bitrate choice, loudness normalization and trimming.
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-audio-extract' };

  var MIMES = { mp3: 'audio/mpeg', wav: 'audio/wav', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg' };

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('WAV and FLAC files may be large.') : '';
    return notice +
      '<div class="tg-opt-row"><label class="tg-opt-label">Output Format</label>' +
        '<select id="vae-fmt" class="tg-select">' +
          '<option value="mp3" selected>MP3</option>' +
          '<option value="wav">WAV (lossless)</option>' +
          '<option value="aac">AAC</option>' +
          '<option value="flac">FLAC (lossless)</option>' +
          '<option value="ogg">OGG Vorbis</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row" id="vae-bitrate-wrap"><label class="tg-opt-label">Bitrate</label>' +
        '<select id="vae-bitrate" class="tg-select">' +
          '<option value="128k">128 kbps</option>' +
          '<option value="192k" selected>192 kbps</option>' +
          '<option value="256k">256 kbps</option>' +
          '<option value="320k">320 kbps</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row" id="vae-depth-wrap" hidden><label class="tg-opt-label">Bit Depth</label>' +
        '<select id="vae-depth" class="tg-select">' +
          '<option value="pcm_s16le" selected>16-bit</option>' +
          '<option value="pcm_s24le">24-bit</option>' +
          '<option value="pcm_s32le">32-bit</option>' +
        '</select>' +
      '</div>' +
      '<div class="tg-opt-row"><label><input type="checkbox" id="vae-norm"> Normalize audio (loudnorm)</label></div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Trim</label>' +
        '<select id="vae-trim" class="tg-select">' +
          '<option value="full" selected>Full audio</option>' +
          '<option value="custom">Custom range</option>' +
        '</select>' +
      '</div>' +
      '<div id="vae-range" hidden style="margin-top:8px">' +
        '<div class="tg-opt-row"><label class="tg-opt-label">Start (MM:SS)</label>' +
          '<input type="text" id="vae-start" class="tg-text-input" placeholder="0:00" value="0:00" style="width:80px">' +
        '</div>' +
        '<div class="tg-opt-row"><label class="tg-opt-label">End (MM:SS)</label>' +
          '<input type="text" id="vae-end" class="tg-text-input" placeholder="1:00" value="1:00" style="width:80px">' +
        '</div>' +
      '</div>';
  }

  function wireOptions(container) {
    var fmt = container.querySelector('#vae-fmt');
    var bitrateWrap = container.querySelector('#vae-bitrate-wrap');
    var depthWrap = container.querySelector('#vae-depth-wrap');
    if (fmt) {
      fmt.addEventListener('change', function () {
        if (bitrateWrap) bitrateWrap.hidden = fmt.value !== 'mp3' && fmt.value !== 'aac';
        if (depthWrap)   depthWrap.hidden   = fmt.value !== 'wav';
      });
    }
    var trim = container.querySelector('#vae-trim');
    var range = container.querySelector('#vae-range');
    if (trim && range) trim.addEventListener('change', function () { range.hidden = trim.value !== 'custom'; });
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      format: (el.querySelector('#vae-fmt') || {}).value || 'mp3',
      bitrate: (el.querySelector('#vae-bitrate') || {}).value || '192k',
      depth: (el.querySelector('#vae-depth') || {}).value || 'pcm_s16le',
      normalize: !!(el.querySelector('#vae-norm') || {}).checked,
      trim: (el.querySelector('#vae-trim') || {}).value || 'full',
      start: (el.querySelector('#vae-start') || {}).value || '0:00',
      end: (el.querySelector('#vae-end') || {}).value || '',
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    var fmt = MIMES[options.format] ? options.format : 'mp3';
    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.' + fmt;
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var args = ['-i', inName];

      if (options.trim === 'custom') {
        var start = U.parseTime(options.start);
        var end = U.parseTime(options.end);
        if (end <= start) throw new Error('Please enter an end time after the start time.');
        args = args.concat(['-ss', String(start), '-to', String(end)]);
      }

      args.push('-vn');
      if (options.normalize) args = args.concat(['-af', 'loudnorm']);

      var codecMap = {
        mp3: ['-acodec', 'libmp3lame', '-b:a', options.bitrate || '192k', '-ar', '44100'],
        wav: ['-acodec', options.depth || 'pcm_s16le', '-ar', '44100'],
        aac: ['-acodec', 'aac', '-b:a', options.bitrate || '192k'],
        flac: ['-acodec', 'flac'],
        ogg: ['-acodec', 'libvorbis', '-q:a', '5'],
      };
      args = args.concat(codecMap[fmt]);
      args.push(outName);

      onProgress && onProgress(0.15, 'Extracting audio...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, MIMES[fmt]);
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
