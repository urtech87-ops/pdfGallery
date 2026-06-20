/**
 * ToolsGallery — Video Metadata Editor
 * Handler: vid-metadata
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-metadata' };
  var _ffmpeg = null, _loaded = false;

  function getOptionsHTML() {
    return '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
      '&#9889; Metadata is updated without re-encoding (stream copy) — this is fast.</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Title</label>' +
        '<input type="text" id="vme-title" class="tg-text-input" placeholder="Video title">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Artist</label>' +
        '<input type="text" id="vme-artist" class="tg-text-input" placeholder="Artist / Creator">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Album</label>' +
        '<input type="text" id="vme-album" class="tg-text-input" placeholder="Album / Collection">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Year</label>' +
        '<input type="text" id="vme-year" class="tg-text-input" placeholder="2024" style="width:80px">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Genre</label>' +
        '<input type="text" id="vme-genre" class="tg-text-input" placeholder="e.g. Documentary">' +
      '</div>' +
      '<div class="tg-opt-row"><label class="tg-opt-label">Comment</label>' +
        '<input type="text" id="vme-comment" class="tg-text-input" placeholder="Additional notes">' +
      '</div>' +
      '<div class="tg-opt-row">' +
        '<label><input type="checkbox" id="vme-clear"> Clear all existing metadata first</label>' +
      '</div>';
  }

  function getOptions(el) {
    if (!el) return {};
    return {
      title: (el.querySelector('#vme-title') || {}).value || '',
      artist: (el.querySelector('#vme-artist') || {}).value || '',
      album: (el.querySelector('#vme-album') || {}).value || '',
      year: (el.querySelector('#vme-year') || {}).value || '',
      genre: (el.querySelector('#vme-genre') || {}).value || '',
      comment: (el.querySelector('#vme-comment') || {}).value || '',
      clearAll: !!(el.querySelector('#vme-clear') || {}).checked,
    };
  }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Updating metadata... ' + Math.round(e.progress * 100) + '%');
    });
    onProgress && onProgress(5, 'Loading processor...');
    var base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await _ffmpeg.load({
      coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
      wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm'),
    });
    _loaded = true;
  }

  async function run(file, options, onProgress) {
    var fetchFile = window.FFmpegUtil && window.FFmpegUtil.fetchFile;
    if (!fetchFile) throw new Error('FFmpeg utilities not loaded.');

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    var ext = file.name.split('.').pop().toLowerCase() || 'mp4';
    var inName = 'input.' + ext;
    onProgress && onProgress(15, 'Reading file...');
    await _ffmpeg.writeFile(inName, await fetchFile(file));

    var args = ['-i', inName];
    if (options.clearAll) args = args.concat(['-map_metadata', '-1']);

    var fields = { title: options.title, artist: options.artist, album: options.album, date: options.year, genre: options.genre, comment: options.comment };
    Object.keys(fields).forEach(function (key) {
      if (fields[key]) args = args.concat(['-metadata', key + '=' + fields[key]]);
    });

    args = args.concat(['-codec', 'copy', 'output.mp4']);

    onProgress && onProgress(20, 'Updating metadata...');
    await _ffmpeg.exec(args);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'updated.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
