/**
 * ToolsGallery — Merge Videos
 * Handler: vid-merge
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-merge', multiFile: true };
  var _ffmpeg = null, _loaded = false;
  var _files = [];

  var NOTICE = '<div class="tg-video-notice" style="background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
    '&#9889; Merging converts all videos to MP4, then concatenates. Processing time scales with total file size.</div>';

  function getOptionsHTML() {
    return NOTICE +
      '<div id="vm-list-wrap">' +
        '<p style="font-size:13px;color:#666">Upload 2-5 videos. They will be merged in the order shown.</p>' +
        '<div id="vm-file-list" style="margin-top:8px"></div>' +
      '</div>';
  }

  function getOptions(el) { return {}; }

  function renderFileList() {
    var list = document.getElementById('vm-file-list');
    if (!list) return;
    if (_files.length === 0) { list.innerHTML = '<p style="color:#999;font-size:12px">No files added yet.</p>'; return; }
    var html = '<ul style="list-style:none;padding:0;margin:0">';
    _files.forEach(function (f, i) {
      html += '<li style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#f9f9f9;border-radius:4px;margin-bottom:4px">' +
        '<span style="background:#4a90e2;color:#fff;border-radius:3px;padding:1px 6px;font-size:11px">' + (i + 1) + '</span>' +
        '<span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(f.name) + '</span>' +
        '<span style="font-size:11px;color:#999">' + fmtBytes(f.size) + '</span>' +
        '<button type="button" data-vm-remove="' + i + '" style="background:none;border:none;cursor:pointer;color:#e53935;font-size:16px;padding:0 4px">&#x2715;</button>' +
        '</li>';
    });
    html += '</ul>';
    list.innerHTML = html;
    list.querySelectorAll('[data-vm-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.vmRemove);
        _files.splice(idx, 1);
        renderFileList();
      });
    });
  }

  function fmtBytes(b) {
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(s) { return s.replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function loadFFmpeg(onProgress) {
    if (_loaded) return;
    var FFmpeg = window.FFmpegWASM && window.FFmpegWASM.FFmpeg;
    var toBlobURL = window.FFmpegUtil && window.FFmpegUtil.toBlobURL;
    if (!FFmpeg || !toBlobURL) throw new Error('FFmpeg.wasm not loaded.');
    _ffmpeg = new FFmpeg();
    _ffmpeg.on('log', function (e) { console.log('[FFmpeg]', e.message); });
    _ffmpeg.on('progress', function (e) {
      onProgress && onProgress(20 + Math.round(e.progress * 65), 'Merging... ' + Math.round(e.progress * 100) + '%');
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

    // Collect files from box
    var box = document.querySelector('.tg-tool-box');
    var files = (box && box._tgFiles && box._tgFiles.length) ? Array.from(box._tgFiles) : [file];
    _files = files;

    if (_files.length < 2) throw new Error('Please upload at least 2 videos to merge.');
    if (_files.length > 5) throw new Error('Maximum 5 videos can be merged at once.');

    renderFileList();

    onProgress && onProgress(3, 'Loading processor...');
    await loadFFmpeg(onProgress);

    // Write each file and convert to MP4
    var concatList = '';
    for (var i = 0; i < _files.length; i++) {
      var f = _files[i];
      var ext = f.name.split('.').pop().toLowerCase() || 'mp4';
      var inN = 'input' + i + '.' + ext;
      onProgress && onProgress(5 + Math.round((i / _files.length) * 10), 'Reading file ' + (i + 1) + '/' + _files.length + '...');
      await _ffmpeg.writeFile(inN, await fetchFile(f));

      // Convert to normalized MP4
      var normN = 'norm' + i + '.mp4';
      await _ffmpeg.exec(['-i', inN, '-vcodec', 'libx264', '-acodec', 'aac', '-crf', '23', normN]);
      concatList += 'file ' + normN + '\n';
    }

    onProgress && onProgress(70, 'Concatenating videos...');
    var enc = new TextEncoder();
    await _ffmpeg.writeFile('list.txt', enc.encode(concatList));
    await _ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);

    onProgress && onProgress(90, 'Preparing download...');
    var data = await _ffmpeg.readFile('output.mp4');
    var blob = new Blob([data.buffer], { type: 'video/mp4' });
    onProgress && onProgress(100, 'Done!');
    return { blob: blob, filename: 'merged.mp4' };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
