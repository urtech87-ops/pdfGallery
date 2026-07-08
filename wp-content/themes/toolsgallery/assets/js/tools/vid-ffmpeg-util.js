/* ToolsGallery — vid-ffmpeg-util.js
   Shared FFmpeg utilities for video tools.
   Keeps a single FFmpeg.wasm (0.11) instance for the whole page so the
   ~25MB core is downloaded and compiled only once, no matter how many
   times a tool runs.
*/
(function () {
  'use strict';

  var _ffmpeg = null;
  var _progressCb = null;   /* rebound on every getFFmpeg() call */
  var _fontLoaded = false;

  var FONT_URL = 'https://unpkg.com/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';
  var FONT_FS_NAME = 'font.ttf';

  window.TGVideoUtil = {

    FONT_FS_NAME: FONT_FS_NAME,
    FONT_NAME: 'DejaVu Sans',

    noticeHTML: function (extra) {
      return '<div class="tg-video-notice" style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#5d4037">' +
        '&#9888;&#65039; <strong>Note:</strong> Video processing happens in your browser — files never leave your device. ' +
        'First use downloads the FFmpeg engine (~25MB). Files over 100MB may be slow; processing time depends on your device speed.' +
        (extra ? ' ' + extra : '') +
        '</div>';
    },

    getFFmpeg: async function (onProgress) {
      if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg !== 'function') {
        throw new Error('FFmpeg not loaded. Please refresh the page.');
      }

      if (!_ffmpeg) {
        _ffmpeg = FFmpeg.createFFmpeg({
          corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
          log: false,
          progress: function (p) {
            if (_progressCb && p && typeof p.ratio === 'number' && p.ratio > 0) {
              var r = Math.min(p.ratio, 1);
              _progressCb(0.15 + r * 0.75, 'Processing... ' + Math.round(r * 100) + '%');
            }
          },
        });
      }
      _progressCb = onProgress || null;

      if (!_ffmpeg.isLoaded()) {
        onProgress && onProgress(0.05, 'Loading FFmpeg engine (~25MB, first time only)...');
        await _ffmpeg.load();
      }

      return _ffmpeg;
    },

    /* Runs an ffmpeg command from an args array. */
    exec: function (ffmpeg, args) {
      return ffmpeg.run.apply(ffmpeg, args);
    },

    writeFile: async function (ffmpeg, name, file) {
      ffmpeg.FS('writeFile', name, await FFmpeg.fetchFile(file));
    },

    writeText: function (ffmpeg, name, text) {
      ffmpeg.FS('writeFile', name, new TextEncoder().encode(text));
    },

    /* Reads an output file; a missing file means the command produced
       nothing, which is the usual failure mode in ffmpeg.wasm 0.11
       (run() resolves even when ffmpeg exits with an error). */
    readFile: function (ffmpeg, name) {
      var data;
      try {
        data = ffmpeg.FS('readFile', name);
      } catch (e) {
        throw new Error('Processing produced no output. The file may be corrupt or use an unsupported codec.');
      }
      if (!data || !data.length) {
        throw new Error('Processing produced no output. The file may be corrupt or use an unsupported codec.');
      }
      return data;
    },

    unlinkFile: function (ffmpeg, name) {
      try {
        ffmpeg.FS('unlink', name);
      } catch (e) {
        /* ignore if file does not exist */
      }
    },

    cleanup: function (ffmpeg, names) {
      if (!ffmpeg) return;
      for (var i = 0; i < names.length; i++) {
        this.unlinkFile(ffmpeg, names[i]);
      }
    },

    /* drawtext / subtitles need a real font file inside the FFmpeg
       virtual filesystem — the wasm build ships without fonts. */
    loadFont: async function (ffmpeg, onProgress) {
      if (_fontLoaded) return FONT_FS_NAME;
      onProgress && onProgress(0.12, 'Loading font...');
      try {
        ffmpeg.FS('writeFile', FONT_FS_NAME, await FFmpeg.fetchFile(FONT_URL));
      } catch (e) {
        throw new Error('Could not load the text font. Please check your connection and try again.');
      }
      _fontLoaded = true;
      return FONT_FS_NAME;
    },

    makeBlob: function (data, mimeType) {
      return new Blob([data.buffer], { type: mimeType });
    },

    getExt: function (filename) {
      var m = /\.([^.\/]+)$/.exec(filename || '');
      return m ? m[1].toLowerCase() : 'mp4';
    },

    stripExt: function (filename) {
      return (filename || 'video').replace(/\.[^.]+$/, '');
    },

    mimeForExt: function (ext) {
      var mimes = {
        mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo',
        mov: 'video/quicktime', mkv: 'video/x-matroska', gif: 'image/gif',
        mp3: 'audio/mpeg', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg',
      };
      return mimes[ext] || 'video/mp4';
    },

    /* "1:23" / "01:02:03" / "45" → seconds */
    parseTime: function (str) {
      var parts = String(str || '').trim().split(':');
      var secs = 0;
      for (var i = 0; i < parts.length; i++) {
        secs = secs * 60 + (parseFloat(parts[i]) || 0);
      }
      return secs;
    },

    toHHMMSS: function (secs) {
      secs = Math.max(0, Math.floor(secs));
      var h = Math.floor(secs / 3600);
      var m = Math.floor((secs % 3600) / 60);
      var s = secs % 60;
      function p(n) { return String(n).padStart(2, '0'); }
      return p(h) + ':' + p(m) + ':' + p(s);
    },

    mapError: function (e) {
      var msg = (e && e.message) ? e.message : String(e);
      if (/SharedArrayBuffer/i.test(msg)) {
        return new Error('Video processing requires a secure context. Please ensure you are using HTTPS or localhost, then refresh the page.');
      }
      if (/out of memory|OOM|allocate|memory access/i.test(msg)) {
        return new Error('Video file is too large for browser processing. Try a smaller file or a lower resolution.');
      }
      if (/FFmpeg not loaded|no output|Could not load the text font|Please (select|enter|upload|add|draw|provide)/i.test(msg)) {
        return e; /* already user-friendly */
      }
      return new Error('Video processing failed: ' + msg);
    },
  };

})();
