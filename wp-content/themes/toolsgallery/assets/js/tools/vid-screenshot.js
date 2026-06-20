/**
 * ToolsGallery — Video Screenshot
 * Handler: vid-screenshot
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-screenshot' };
  var _screenshots = [];

  function getOptionsHTML() {
    return '<div id="vss-wrap">' +
      '<div id="vss-player-wrap" hidden>' +
        '<video id="vss-player" style="max-width:100%;border-radius:6px;background:#000" controls></video>' +
        '<div style="margin-top:8px;display:flex;gap:8px;align-items:center">' +
          '<select id="vss-fmt" class="tg-select" style="width:100px">' +
            '<option value="png">PNG</option><option value="jpeg">JPEG</option>' +
          '</select>' +
          '<input type="range" id="vss-quality" min="50" max="100" value="90" style="flex:1" title="Quality (JPEG)">' +
          '<button type="button" id="vss-capture-btn" class="tg-btn tg-btn--primary" style="white-space:nowrap">📸 Capture Frame</button>' +
        '</div>' +
      '</div>' +
      '<p id="vss-upload-hint" style="font-size:13px;color:#666">Upload a video to capture screenshot frames.</p>' +
      '<div id="vss-gallery" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>' +
      '<div id="vss-result-info" style="font-size:12px;color:#666;margin-top:8px"></div>' +
    '</div>' +
    '<script>(function(){' +
      'var playerWrap=document.getElementById("vss-player-wrap");' +
      'var hint=document.getElementById("vss-upload-hint");' +
      'var player=document.getElementById("vss-player");' +
      'var captureBtn=document.getElementById("vss-capture-btn");' +
      'var gallery=document.getElementById("vss-gallery");' +
      'var fmtSel=document.getElementById("vss-fmt");' +
      'var qualSlider=document.getElementById("vss-quality");' +
      'var shots=[];' +
      'window._vssFile=null;' +
      'function initPlayer(file){' +
        'window._vssFile=file;' +
        'var url=URL.createObjectURL(file);' +
        'player.src=url;' +
        'playerWrap.hidden=false;hint.hidden=true;' +
      '}' +
      'window._vssInitPlayer=initPlayer;' +
      'if(captureBtn)captureBtn.addEventListener("click",function(){' +
        'if(!player||!player.videoWidth)return;' +
        'var fmt=fmtSel?fmtSel.value:"png";' +
        'var quality=qualSlider?(parseInt(qualSlider.value)/100):0.9;' +
        'var canvas=document.createElement("canvas");' +
        'canvas.width=player.videoWidth;canvas.height=player.videoHeight;' +
        'var ctx=canvas.getContext("2d");ctx.drawImage(player,0,0);' +
        'canvas.toBlob(function(blob){' +
          'if(!blob)return;' +
          'shots.push({blob:blob,fmt:fmt,time:player.currentTime});' +
          'var url2=URL.createObjectURL(blob);' +
          'var idx=shots.length-1;' +
          'var div=document.createElement("div");div.style.cssText="position:relative;display:inline-block";' +
          'var img=document.createElement("img");img.src=url2;img.style.cssText="height:80px;border-radius:4px;border:1px solid #ddd";' +
          'var btn=document.createElement("button");btn.textContent="⬇";btn.title="Download";' +
          'btn.style.cssText="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:3px;cursor:pointer;padding:2px 5px;font-size:12px";' +
          'btn.addEventListener("click",function(){var a=document.createElement("a");a.href=url2;a.download="screenshot-"+(idx+1)+"."+fmt;a.click();});' +
          'div.appendChild(img);div.appendChild(btn);gallery.appendChild(div);' +
          'window._vssLastBlob=blob;window._vssLastFmt=fmt;' +
        '},"image/"+fmt,quality);' +
      '});' +
    '})();<\/script>';
  }

  function getOptions(el) {
    var fmt = el && el.querySelector('#vss-fmt');
    return { format: fmt ? fmt.value : 'png' };
  }

  async function run(file, options, onProgress) {
    // Initialize player
    var initFn = window._vssInitPlayer;
    if (initFn) initFn(file);

    onProgress && onProgress(100, 'Ready! Scrub the video and click "Capture Frame" to take screenshots.');

    // Return a placeholder — actual download is handled by in-UI buttons
    // We wait a bit to allow user interaction, then return the last captured screenshot if available
    await new Promise(function (resolve) {
      setTimeout(resolve, 500);
    });

    var blob = window._vssLastBlob;
    var fmt = window._vssLastFmt || options.format || 'png';
    if (blob) {
      return { blob: blob, filename: 'screenshot.' + fmt };
    }

    // No screenshot taken yet — return a 1x1 transparent PNG placeholder
    var canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) {
        resolve({ blob: b, filename: 'screenshot.png' });
      }, 'image/png');
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
