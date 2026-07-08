/**
 * ToolsGallery — Video Metadata Editor
 * Handler: vid-metadata
 * Reads existing metadata into the form on upload, then writes the edited
 * values back with a stream copy (no re-encode).
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-metadata' };
  var _readPromise = null; /* run() waits on this so exec calls never overlap */

  function getOptionsHTML() {
    var notice = window.TGVideoUtil ? TGVideoUtil.noticeHTML('Metadata is updated without re-encoding (stream copy) — this is fast.') : '';
    return notice +
      '<div id="vme-status" style="font-size:12px;color:#666;margin-bottom:8px">Upload a video to load its existing metadata.</div>' +
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
        '<input type="text" id="vme-year" class="tg-text-input" placeholder="2026" style="width:80px">' +
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

  function setField(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.value = value;
  }

  /* Extracts global metadata via FFmpeg's ffmetadata muxer and prefills
     the form. Failures are non-fatal — the user can still set new values. */
  async function readMetadata(file) {
    var U = window.TGVideoUtil;
    if (!U) return;
    var statusEl = document.getElementById('vme-status');
    var inName = 'metain.' + U.getExt(file.name);
    var ffmpeg = null;
    try {
      if (statusEl) statusEl.textContent = 'Reading existing metadata...';
      ffmpeg = await U.getFFmpeg(null);
      await U.writeFile(ffmpeg, inName, file);
      await U.exec(ffmpeg, ['-i', inName, '-f', 'ffmetadata', 'metadata.txt']);
      var text = new TextDecoder().decode(ffmpeg.FS('readFile', 'metadata.txt'));

      var meta = {};
      text.split('\n').forEach(function (line) {
        if (line.charAt(0) === ';' || line.charAt(0) === '#') return;
        var eq = line.indexOf('=');
        if (eq > 0) meta[line.slice(0, eq).trim().toLowerCase()] = line.slice(eq + 1).trim();
      });

      setField('vme-title', meta.title);
      setField('vme-artist', meta.artist || meta.author);
      setField('vme-album', meta.album);
      setField('vme-year', meta.date || meta.year);
      setField('vme-genre', meta.genre);
      setField('vme-comment', meta.comment || meta.description);

      var found = ['title', 'artist', 'album', 'date', 'genre', 'comment'].filter(function (k) { return meta[k]; });
      if (statusEl) {
        statusEl.textContent = found.length
          ? 'Existing metadata loaded (' + found.join(', ') + '). Edit the fields and process.'
          : 'No existing metadata found. Fill in the fields you want to set.';
      }
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Could not read existing metadata — you can still set new values below.';
    } finally {
      U.cleanup(ffmpeg, [inName, 'metadata.txt']);
    }
  }

  function onFileReady(file) {
    _readPromise = readMetadata(file);
  }

  function getOptions(el) {
    if (!el) return {};
    function val(sel) { var f = el.querySelector(sel); return f ? f.value.trim() : ''; }
    return {
      title: val('#vme-title'),
      artist: val('#vme-artist'),
      album: val('#vme-album'),
      year: val('#vme-year'),
      genre: val('#vme-genre'),
      comment: val('#vme-comment'),
      clearAll: !!(el.querySelector('#vme-clear') || {}).checked,
    };
  }

  async function run(file, options, onProgress) {
    var U = window.TGVideoUtil;
    if (!U) throw new Error('FFmpeg not loaded. Please refresh the page.');

    /* let a pending metadata read finish before starting our own exec */
    if (_readPromise) { try { await _readPromise; } catch (e) {} }

    var inName = 'input.' + U.getExt(file.name);
    var outName = 'output.mp4';
    var ffmpeg = null;

    try {
      onProgress && onProgress(0.02, 'Initializing...');
      ffmpeg = await U.getFFmpeg(onProgress);

      onProgress && onProgress(0.08, 'Loading video file...');
      await U.writeFile(ffmpeg, inName, file);

      var args = ['-i', inName];
      if (options.clearAll) args = args.concat(['-map_metadata', '-1']);

      var fields = {
        title: options.title, artist: options.artist, album: options.album,
        date: options.year, genre: options.genre, comment: options.comment,
      };
      Object.keys(fields).forEach(function (key) {
        if (fields[key]) args = args.concat(['-metadata', key + '=' + fields[key]]);
      });
      args = args.concat(['-c', 'copy', outName]);

      onProgress && onProgress(0.15, 'Updating metadata...');
      await U.exec(ffmpeg, args);

      onProgress && onProgress(0.92, 'Creating output file...');
      var data = U.readFile(ffmpeg, outName);
      var blob = U.makeBlob(data, 'video/mp4');
      onProgress && onProgress(1, 'Done!');
      return { blob: blob, filename: U.stripExt(file.name) + '-metadata.mp4' };
    } catch (e) {
      throw U.mapError(e);
    } finally {
      U.cleanup(ffmpeg, [inName, outName]);
    }
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, onFileReady: onFileReady, CONFIG: CONFIG };
})();
