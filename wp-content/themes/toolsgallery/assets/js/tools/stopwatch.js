/* Stopwatch — Phase 8 Tool 4 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'stopwatch', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.sw-display{font-family:'Courier New',monospace;font-size:52px;font-weight:700;color:#e67e00;text-align:center;padding:16px;background:#1a1a1a;border-radius:8px;letter-spacing:2px;margin-bottom:12px}
.sw-ms{font-size:28px;color:#aaa}
.sw-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;justify-content:center}
.sw-btn{padding:10px 20px;border:none;border-radius:4px;cursor:pointer;font-size:15px;font-weight:600}
.sw-btn-start{background:#27ae60;color:#fff}
.sw-btn-pause{background:#e67e00;color:#fff}
.sw-btn-lap{background:#0073aa;color:#fff}
.sw-btn-reset{background:#c0392b;color:#fff}
.sw-stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:13px;color:#555}
.sw-stat{background:#f5f5f5;padding:6px 12px;border-radius:4px}
.sw-stat strong{color:#333}
.sw-table-wrap{overflow-x:auto;margin-bottom:12px}
.sw-table{width:100%;border-collapse:collapse;font-size:13px}
.sw-table th{background:#f5f5f5;padding:8px 10px;text-align:left;border:1px solid #e0e0e0;font-weight:600}
.sw-table td{padding:7px 10px;border:1px solid #e0e0e0;font-family:monospace}
.sw-fastest{background:#d4edda}
.sw-slowest{background:#f8d7da}
.sw-export{display:flex;gap:8px}
.sw-export-btn{padding:6px 14px;background:#f0f0f0;color:#333;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:13px}
.sw-export-btn:hover{background:#e0e0e0}
</style>
<div class="sw-display"><span id="sw-main">00:00:00</span><span class="sw-ms">.<span id="sw-ms">00</span></span></div>
<div class="sw-controls">
  <button class="sw-btn sw-btn-start" id="sw-start-btn" onclick="swStart()">Start</button>
  <button class="sw-btn sw-btn-pause" id="sw-pause-btn" onclick="swPause()" style="display:none">Pause</button>
  <button class="sw-btn sw-btn-lap" onclick="swLap()">Lap</button>
  <button class="sw-btn sw-btn-reset" onclick="swReset()">Reset</button>
</div>
<div class="sw-stats" id="sw-stats"></div>
<div class="sw-table-wrap">
  <table class="sw-table" id="sw-table" style="display:none">
    <thead><tr><th>#</th><th>Lap Time</th><th>Split</th><th>+/- Prev</th></tr></thead>
    <tbody id="sw-tbody"></tbody>
  </table>
</div>
<div class="sw-export">
  <button class="sw-export-btn" onclick="swExportText()">Copy as Text</button>
  <button class="sw-export-btn" onclick="swExportCsv()">Download CSV</button>
</div>`;

    let startTime = null, elapsedTime = 0, lapTimes = [], animFrameId = null;
    const originalTitle = document.title;

    function pad(n,w=2){return String(n).padStart(w,'0');}
    function formatFull(ms) {
      const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000), cs=Math.floor((ms%1000)/10);
      return {main:`${pad(h)}:${pad(m)}:${pad(s)}`,ms:pad(cs)};
    }
    function formatShort(ms){const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000),cs=Math.floor((ms%1000)/10);return`${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;}

    function update() {
      elapsedTime = performance.now() - startTime;
      const f = formatFull(elapsedTime);
      document.getElementById('sw-main').textContent = f.main;
      document.getElementById('sw-ms').textContent = f.ms;
      document.title = `${f.main}.${f.ms} — Stopwatch`;
      animFrameId = requestAnimationFrame(update);
    }

    window.swStart = function() {
      if (animFrameId) return;
      startTime = performance.now() - elapsedTime;
      animFrameId = requestAnimationFrame(update);
      document.getElementById('sw-start-btn').style.display = 'none';
      document.getElementById('sw-pause-btn').style.display = '';
    };
    window.swPause = function() {
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      document.getElementById('sw-start-btn').style.display = '';
      document.getElementById('sw-start-btn').textContent = 'Resume';
      document.getElementById('sw-pause-btn').style.display = 'none';
    };
    window.swLap = function() {
      if (!animFrameId && elapsedTime === 0) return;
      const total = elapsedTime;
      const prev = lapTimes.length ? lapTimes[lapTimes.length-1].split : 0;
      const lapMs = total - prev;
      lapTimes.push({lap: lapMs, split: total});
      renderLaps();
    };
    window.swReset = function() {
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
      elapsedTime = 0; startTime = null; lapTimes = [];
      document.getElementById('sw-main').textContent = '00:00:00';
      document.getElementById('sw-ms').textContent = '00';
      document.getElementById('sw-start-btn').style.display = '';
      document.getElementById('sw-start-btn').textContent = 'Start';
      document.getElementById('sw-pause-btn').style.display = 'none';
      document.getElementById('sw-table').style.display = 'none';
      document.getElementById('sw-tbody').innerHTML = '';
      document.getElementById('sw-stats').innerHTML = '';
      document.title = originalTitle;
    };

    function renderLaps() {
      const tbody = document.getElementById('sw-tbody');
      const table = document.getElementById('sw-table');
      if (!lapTimes.length) { table.style.display = 'none'; return; }
      table.style.display = '';
      const laps = lapTimes.map(l=>l.lap);
      const minLap = Math.min(...laps), maxLap = Math.max(...laps);
      tbody.innerHTML = lapTimes.map((entry,i) => {
        const prev = i>0?lapTimes[i-1].lap:entry.lap;
        const diff = entry.lap - prev;
        const cls = entry.lap===minLap?'sw-fastest':entry.lap===maxLap?'sw-slowest':'';
        return `<tr class="${cls}"><td>${i+1}</td><td>${formatShort(entry.lap)}</td><td>${formatShort(entry.split)}</td><td>${i===0?'—':(diff>=0?'+':'')+formatShort(Math.abs(diff))}</td></tr>`;
      }).reverse().join('');
      updateStats();
    }

    function updateStats() {
      if (!lapTimes.length) { document.getElementById('sw-stats').innerHTML = ''; return; }
      const laps = lapTimes.map(l=>l.lap);
      const avg = laps.reduce((a,b)=>a+b,0)/laps.length;
      document.getElementById('sw-stats').innerHTML = `
        <div class="sw-stat">Laps: <strong>${laps.length}</strong></div>
        <div class="sw-stat">Fastest: <strong>${formatShort(Math.min(...laps))}</strong></div>
        <div class="sw-stat">Slowest: <strong>${formatShort(Math.max(...laps))}</strong></div>
        <div class="sw-stat">Average: <strong>${formatShort(Math.round(avg))}</strong></div>
        <div class="sw-stat">Total: <strong>${formatShort(elapsedTime)}</strong></div>`;
    }

    window.swExportText = function() {
      const lines = lapTimes.map((e,i)=>`Lap ${i+1}: ${formatShort(e.lap)}  Split: ${formatShort(e.split)}`);
      navigator.clipboard.writeText(lines.join('\n'));
    };
    window.swExportCsv = function() {
      const rows = [['Lap','Lap Time','Split Time','Diff from Prev']];
      lapTimes.forEach((e,i)=>{
        const prev=i>0?lapTimes[i-1].lap:e.lap;
        const diff=e.lap-prev;
        rows.push([i+1,formatShort(e.lap),formatShort(e.split),i===0?'—':(diff>=0?'+':'')+formatShort(Math.abs(diff))]);
      });
      const csv=rows.map(r=>r.join(',')).join('\n');
      const blob=new Blob([csv],{type:'text/csv'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='stopwatch.csv';
      a.click();
    };

    document.addEventListener('keydown', function(e) {
      if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
      if (e.code==='Space'){e.preventDefault();animFrameId?swPause():swStart();}
      else if(e.code==='KeyL') swLap();
      else if(e.code==='KeyR'&&!animFrameId) swReset();
    });
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
