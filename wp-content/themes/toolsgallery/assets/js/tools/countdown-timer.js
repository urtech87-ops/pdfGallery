/* Countdown Timer — Phase 8 Tool 3 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'countdown-timer', dataInput: true };

  function init(container) {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    container.innerHTML = `
<style>
.ct-wrap{max-width:600px}
.ct-mode-toggle{display:flex;gap:0;margin-bottom:16px;border:1px solid #ddd;border-radius:4px;overflow:hidden;width:fit-content}
.ct-mode-btn{padding:8px 20px;border:none;background:#f0f0f0;color:#333;cursor:pointer;font-size:14px}
.ct-mode-btn.active{background:#0073aa;color:#fff}
.ct-display{font-family:'Courier New',monospace;font-size:56px;font-weight:700;color:#e67e00;text-align:center;padding:16px;background:#1a1a1a;border-radius:8px;letter-spacing:4px;margin-bottom:12px}
.ct-progress-wrap{background:#e0e0e0;border-radius:4px;height:8px;margin-bottom:12px}
.ct-progress{height:8px;border-radius:4px;background:#e67e00;transition:width .5s,background .5s;width:100%}
.ct-inputs{display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.ct-inputs label{font-size:13px;color:#555}
.ct-inputs input[type=number]{width:70px;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:16px;text-align:center}
.ct-inputs input[type=datetime-local]{padding:6px;border:1px solid #ddd;border-radius:4px;font-size:14px}
.ct-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ct-btn{padding:8px 18px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:600}
.ct-btn-start{background:#27ae60;color:#fff}
.ct-btn-pause{background:#e67e00;color:#fff}
.ct-btn-reset{background:#c0392b;color:#fff}
.ct-btn-alert{background:#8e44ad;color:#fff}
.ct-presets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.ct-preset{padding:5px 12px;border:1px solid #ddd;background:#f9f9f9;border-radius:4px;cursor:pointer;font-size:13px}
.ct-preset:hover{background:#e0e0e0}
.ct-timers-list{margin-top:16px}
.ct-timer-item{border:1px solid #ddd;border-radius:6px;padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:10px}
.ct-timer-display{font-family:monospace;font-size:20px;color:#e67e00;flex:1}
.ct-timer-controls button{padding:4px 10px;border:none;border-radius:3px;cursor:pointer;font-size:12px;margin:0 2px}
.ct-add-timer{padding:6px 14px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;margin-top:8px}
</style>
<div class="ct-wrap">
  <div class="ct-mode-toggle">
    <button class="ct-mode-btn active" id="ct-mode-dur" onclick="ctSetMode('duration')">Duration</button>
    <button class="ct-mode-btn" id="ct-mode-tgt" onclick="ctSetMode('target')">Target Date</button>
  </div>

  <div class="ct-display" id="ct-display">00:00:00</div>
  <div class="ct-progress-wrap"><div class="ct-progress" id="ct-progress"></div></div>

  <div class="ct-inputs" id="ct-duration-inputs">
    <label>H <input type="number" id="ct-hours" min="0" max="99" value="0"></label>
    <label>M <input type="number" id="ct-minutes" min="0" max="59" value="5"></label>
    <label>S <input type="number" id="ct-seconds" min="0" max="59" value="0"></label>
  </div>
  <div class="ct-inputs" id="ct-target-inputs" style="display:none">
    <label>Target: <input type="datetime-local" id="ct-target-date"></label>
  </div>

  <div class="ct-controls">
    <button class="ct-btn ct-btn-start" id="ct-start-btn" onclick="ctStart()">Start</button>
    <button class="ct-btn ct-btn-pause" id="ct-pause-btn" onclick="ctPause()" style="display:none">Pause</button>
    <button class="ct-btn ct-btn-reset" onclick="ctReset()">Reset</button>
    <button class="ct-btn ct-btn-alert" onclick="ctTestAlert()">Test Alert</button>
  </div>

  <div class="ct-presets">
    <span style="font-size:13px;color:#555;align-self:center">Presets:</span>
    <button class="ct-preset" onclick="ctPreset(60)">1 min</button>
    <button class="ct-preset" onclick="ctPreset(300)">5 min</button>
    <button class="ct-preset" onclick="ctPreset(600)">10 min</button>
    <button class="ct-preset" onclick="ctPreset(900)">15 min</button>
    <button class="ct-preset" onclick="ctPreset(1500)">25 min</button>
    <button class="ct-preset" onclick="ctPreset(1800)">30 min</button>
    <button class="ct-preset" onclick="ctPreset(3600)">1 hour</button>
  </div>

  <button class="ct-add-timer" onclick="ctAddTimer()">+ Add Timer</button>
  <div class="ct-timers-list" id="ct-timers-list"></div>
</div>`;

    let interval = null;
    let remainingSeconds = 0;
    let totalSeconds = 0;
    let mode = 'duration';
    const originalTitle = document.title;
    const extraTimers = [];

    function pad(n){return String(n).padStart(2,'0');}
    function formatTime(s){return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`;}

    function updateDisplay() {
      document.getElementById('ct-display').textContent = formatTime(remainingSeconds);
      const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
      const bar = document.getElementById('ct-progress');
      bar.style.width = pct + '%';
      bar.style.background = pct <= 10 ? '#e74c3c' : pct <= 30 ? '#f39c12' : '#e67e00';
      document.title = `${formatTime(remainingSeconds)} — Timer`;
    }

    function playAlertSound() {
      try {
        const ctx = new AudioContext();
        [0, 0.3, 0.6].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.25);
        });
      } catch(e){}
    }

    function flashScreen() {
      const d = document.getElementById('ct-display');
      let count = 0;
      const flash = setInterval(() => {
        d.style.background = count % 2 === 0 ? '#c0392b' : '#1a1a1a';
        if (++count > 5) { clearInterval(flash); d.style.background = '#1a1a1a'; }
      }, 300);
    }

    function onTimerComplete() {
      clearInterval(interval); interval = null;
      playAlertSound();
      flashScreen();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Complete!', {body: 'Your countdown timer has finished.'});
      }
      document.getElementById('ct-start-btn').style.display = '';
      document.getElementById('ct-pause-btn').style.display = 'none';
      document.title = originalTitle;
    }

    function startTimer() {
      if (remainingSeconds <= 0) return;
      document.getElementById('ct-start-btn').style.display = 'none';
      document.getElementById('ct-pause-btn').style.display = '';
      interval = setInterval(() => {
        if (remainingSeconds <= 0) { onTimerComplete(); return; }
        remainingSeconds--;
        updateDisplay();
      }, 1000);
    }

    function getSecondsFromInputs() {
      const h = parseInt(document.getElementById('ct-hours').value) || 0;
      const m = parseInt(document.getElementById('ct-minutes').value) || 0;
      const s = parseInt(document.getElementById('ct-seconds').value) || 0;
      return h * 3600 + m * 60 + s;
    }

    function getSecondsFromTarget() {
      const val = document.getElementById('ct-target-date').value;
      if (!val) return 0;
      const diff = Math.floor((new Date(val) - Date.now()) / 1000);
      return Math.max(0, diff);
    }

    window.ctStart = function() {
      if (interval) return;
      if (remainingSeconds <= 0) {
        totalSeconds = remainingSeconds = mode === 'duration' ? getSecondsFromInputs() : getSecondsFromTarget();
      }
      if (remainingSeconds <= 0) return;
      startTimer();
    };
    window.ctPause = function() {
      clearInterval(interval); interval = null;
      document.getElementById('ct-start-btn').style.display = '';
      document.getElementById('ct-pause-btn').style.display = 'none';
      document.getElementById('ct-start-btn').textContent = 'Resume';
    };
    window.ctReset = function() {
      clearInterval(interval); interval = null;
      remainingSeconds = 0; totalSeconds = 0;
      document.getElementById('ct-display').textContent = '00:00:00';
      document.getElementById('ct-progress').style.width = '100%';
      document.getElementById('ct-start-btn').style.display = '';
      document.getElementById('ct-start-btn').textContent = 'Start';
      document.getElementById('ct-pause-btn').style.display = 'none';
      document.title = originalTitle;
    };
    window.ctPreset = function(secs) {
      ctReset();
      totalSeconds = remainingSeconds = secs;
      document.getElementById('ct-hours').value = Math.floor(secs/3600);
      document.getElementById('ct-minutes').value = Math.floor((secs%3600)/60);
      document.getElementById('ct-seconds').value = secs%60;
      updateDisplay();
    };
    window.ctSetMode = function(m) {
      mode = m;
      document.getElementById('ct-mode-dur').classList.toggle('active', m==='duration');
      document.getElementById('ct-mode-tgt').classList.toggle('active', m==='target');
      document.getElementById('ct-duration-inputs').style.display = m==='duration'?'':'none';
      document.getElementById('ct-target-inputs').style.display = m==='target'?'':'none';
    };
    window.ctTestAlert = function() { playAlertSound(); };

    let timerCount = 0;
    window.ctAddTimer = function() {
      if (timerCount >= 4) { alert('Max 5 timers (including main)'); return; }
      timerCount++;
      const id = timerCount;
      const obj = {id, secs: 300, remaining: 300, total: 300, interval: null};
      extraTimers.push(obj);
      const div = document.createElement('div');
      div.className = 'ct-timer-item';
      div.id = `ct-extra-${id}`;
      div.innerHTML = `<div class="ct-timer-display" id="ct-extra-disp-${id}">00:05:00</div>
        <div class="ct-timer-controls">
          <input type="number" id="ct-extra-min-${id}" value="5" min="0" max="99" style="width:50px;padding:3px;border:1px solid #ddd;border-radius:3px">
          <button style="background:#27ae60;color:#fff" onclick="ctExtraStart(${id})">Start</button>
          <button style="background:#e67e00;color:#fff" onclick="ctExtraPause(${id})">Pause</button>
          <button style="background:#c0392b;color:#fff" onclick="ctExtraRemove(${id})">Remove</button>
        </div>`;
      document.getElementById('ct-timers-list').appendChild(div);
    };

    window.ctExtraStart = function(id) {
      const obj = extraTimers.find(t=>t.id===id);
      if (!obj || obj.interval) return;
      const mins = parseInt(document.getElementById(`ct-extra-min-${id}`).value)||5;
      if (obj.remaining<=0){obj.total=obj.remaining=mins*60;}
      obj.interval = setInterval(()=>{
        if(obj.remaining<=0){clearInterval(obj.interval);obj.interval=null;playAlertSound();return;}
        obj.remaining--;
        document.getElementById(`ct-extra-disp-${id}`).textContent=formatTime(obj.remaining);
      },1000);
    };
    window.ctExtraPause = function(id) {
      const obj=extraTimers.find(t=>t.id===id);
      if(obj){clearInterval(obj.interval);obj.interval=null;}
    };
    window.ctExtraRemove = function(id) {
      const obj=extraTimers.find(t=>t.id===id);
      if(obj){clearInterval(obj.interval);}
      const idx=extraTimers.findIndex(t=>t.id===id);
      if(idx>-1)extraTimers.splice(idx,1);
      const el=document.getElementById(`ct-extra-${id}`);
      if(el)el.remove();
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
