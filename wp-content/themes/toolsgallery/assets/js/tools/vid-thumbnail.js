/**
 * ToolsGallery — Video Thumbnail Maker
 * Handler: vid-thumbnail
 */
(function () {
  'use strict';
  var CONFIG = { handler: 'vid-thumbnail' };
  var _thumbnails = [];

  function getOptionsHTML() {
    return '<div id="vth-wrap">' +
      '<p id="vth-hint" style="font-size:13px;color:#666">Upload a video to generate thumbnails.</p>' +
      '<div id="vth-player-wrap" hidden>' +
        '<video id="vth-player" style="max-width:100%;border-radius:6px;background:#000" controls></video>' +
        '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
          '<label style="font-size:13px">Auto-generate:</label>' +
          '<select id="vth-count" class="tg-select" style="width:80px">' +
            '<option value="4">4</option><option value="8" selected>8</option>' +
            '<option value="12">12</option><option value="16">16</option>' +
          '</select>' +
          '<button type="button" id="vth-auto-btn" class="tg-btn-secondary">Generate All</button>' +
          '<button type="button" id="vth-capture-btn" class="tg-btn-secondary">📸 Capture Current Frame</button>' +
        '</div>' +
      '</div>' +
      '<div id="vth-grid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"></div>' +
    '</div>' +
    '<script>(function(){' +
      'var wrap=document.getElementById("vth-player-wrap");' +
      'var hint=document.getElementById("vth-hint");' +
      'var player=document.getElementById("vth-player");' +
      'var grid=document.getElementById("vth-grid");' +
      'var thumbs=[];' +
      'window._vthFile=null;' +
      'window._vthLastBlob=null;' +
      'function captureTo(blob,time){' +
        'thumbs.push({blob:blob,time:time});' +
        'var url=URL.createObjectURL(blob);' +
        'var div=document.createElement("div");div.style.cssText="position:relative;display:inline-block";' +
        'var img=document.createElement("img");img.src=url;img.style.cssText="height:80px;border-radius:4px;border:2px solid #ddd;cursor:pointer";' +
        'var btn=document.createElement("button");btn.textContent="⬇";btn.title="Download";' +
        'btn.style.cssText="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:3px;cursor:pointer;padding:2px 5px;font-size:12px";' +
        'btn.addEventListener("click",function(){var a=document.createElement("a");a.href=url;a.download="thumb-"+Math.round(time)+"s.jpg";a.click();});' +
        'div.appendChild(img);div.appendChild(btn);grid.appendChild(div);' +
        'window._vthLastBlob=blob;' +
      '}' +
      'function captureFrame(vid){' +
        'var canvas=document.createElement("canvas");canvas.width=vid.videoWidth;canvas.height=vid.videoHeight;' +
        'var ctx=canvas.getContext("2d");ctx.drawImage(vid,0,0);' +
        'var time=vid.currentTime;' +
        'canvas.toBlob(function(blob){if(blob)captureTo(blob,time);},"image/jpeg",0.9);' +
      '}' +
      'document.getElementById("vth-capture-btn").addEventListener("click",function(){if(player&&player.videoWidth)captureFrame(player);});' +
      'document.getElementById("vth-auto-btn").addEventListener("click",function(){' +
        'if(!player||!player.duration)return;' +
        'var count=parseInt(document.getElementById("vth-count").value)||8;' +
        'var interval=player.duration/(count+1);' +
        'var frames=[];for(var i=1;i<=count;i++)frames.push(i*interval);' +
        'var idx=0;' +
        'function nextFrame(){if(idx>=frames.length)return;player.currentTime=frames[idx];idx++;}' +
        'player.addEventListener("seeked",function onSeeked(){captureFrame(player);setTimeout(nextFrame,100);});' +
        'nextFrame();' +
      '});' +
      'window._vthInitPlayer=function(file){' +
        'window._vthFile=file;' +
        'player.src=URL.createObjectURL(file);' +
        'wrap.hidden=false;hint.hidden=true;' +
      '};' +
    '})();<\/script>';
  }

  function getOptions(el) { return {}; }

  async function run(file, options, onProgress) {
    if (window._vthInitPlayer) window._vthInitPlayer(file);

    onProgress && onProgress(100, 'Ready! Use "Generate All" or "Capture Current Frame" to create thumbnails.');

    await new Promise(function (r) { setTimeout(r, 300); });

    var blob = window._vthLastBlob;
    if (blob) return { blob: blob, filename: 'thumbnail.jpg' };

    var canvas = document.createElement('canvas');
    canvas.width = 1; canvas.height = 1;
    return new Promise(function (resolve) {
      canvas.toBlob(function (b) { resolve({ blob: b, filename: 'thumbnail.jpg' }); }, 'image/jpeg', 0.9);
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { run: run, getOptionsHTML: getOptionsHTML, getOptions: getOptions, CONFIG: CONFIG };
})();
