/* Random Number Generator — Phase 8 Tool 5 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'random-number', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.rng-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
.rng-tab{padding:8px 16px;border:none;background:#f0f0f0;color:#333;cursor:pointer;border-radius:4px 4px 0 0;font-size:14px}
.rng-tab.active{background:#0073aa;color:#fff}
.rng-panel{display:none}.rng-panel.active{display:block}
.rng-field{margin-bottom:12px}
.rng-field label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.rng-field input,.rng-field textarea,.rng-field select{width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:4px;font-size:14px;box-sizing:border-box}
.rng-row{display:flex;gap:12px}
.rng-row .rng-field{flex:1}
.rng-result{font-family:'Courier New',monospace;font-size:42px;font-weight:700;color:#e67e00;text-align:center;padding:16px;background:#1a1a1a;border-radius:8px;margin:12px 0;min-height:70px;display:flex;align-items:center;justify-content:center;word-break:break-all}
.rng-btn{padding:8px 20px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:600;margin-right:8px}
.rng-btn:hover{background:#005f8a}
.rng-history{margin-top:12px;font-size:13px;color:#555}
.rng-history-list{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.rng-history-item{padding:3px 8px;background:#f0f0f0;border-radius:3px;font-family:monospace;font-size:12px}
.rng-multi-results{font-family:monospace;font-size:14px;background:#f5f5f5;padding:10px;border-radius:4px;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;margin-top:8px}
.rng-dice-wrap{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}
.rng-die{width:60px;height:60px;background:#fff;border:2px solid #ddd;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#333;box-shadow:2px 2px 6px rgba(0,0,0,.15)}
.rng-coin-result{font-size:80px;text-align:center;margin:12px 0;cursor:pointer;transition:transform .3s}
.rng-coin-hist{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}
.rng-coin-item{padding:2px 8px;border-radius:3px;font-size:12px;font-weight:600}
.rng-coin-h{background:#ffd700;color:#333}
.rng-coin-t{background:#c0c0c0;color:#333}
.rng-checkbox label{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;cursor:pointer}
</style>
<div class="rng-tabs">
  <button class="rng-tab active" onclick="rngTab('single')">Single Number</button>
  <button class="rng-tab" onclick="rngTab('multi')">Multiple Numbers</button>
  <button class="rng-tab" onclick="rngTab('list')">Random from List</button>
  <button class="rng-tab" onclick="rngTab('dice')">Dice Roller</button>
  <button class="rng-tab" onclick="rngTab('coin')">Coin Flip</button>
</div>

<div id="rng-panel-single" class="rng-panel active">
  <div class="rng-row">
    <div class="rng-field"><label>Min</label><input type="number" id="rng-min" value="1"></div>
    <div class="rng-field"><label>Max</label><input type="number" id="rng-max" value="100"></div>
  </div>
  <div class="rng-checkbox"><label><input type="checkbox" id="rng-decimal"> Include decimals</label></div>
  <div class="rng-result" id="rng-single-result">—</div>
  <button class="rng-btn" onclick="rngSingle()">Generate</button>
  <button class="rng-btn" onclick="navigator.clipboard.writeText(document.getElementById('rng-single-result').textContent)" style="background:#6c757d">Copy</button>
  <div class="rng-history"><strong>History:</strong> <div class="rng-history-list" id="rng-single-hist"></div></div>
</div>

<div id="rng-panel-multi" class="rng-panel">
  <div class="rng-row">
    <div class="rng-field"><label>Min</label><input type="number" id="rng-multi-min" value="1"></div>
    <div class="rng-field"><label>Max</label><input type="number" id="rng-multi-max" value="100"></div>
    <div class="rng-field"><label>Count</label><input type="number" id="rng-multi-count" value="10" min="1" max="1000"></div>
  </div>
  <div class="rng-row">
    <div class="rng-checkbox"><label><input type="checkbox" id="rng-multi-dupes" checked> Allow duplicates</label></div>
    <div class="rng-field"><label>Sort</label><select id="rng-multi-sort"><option value="none">No sort</option><option value="asc">Ascending</option><option value="desc">Descending</option></select></div>
  </div>
  <button class="rng-btn" onclick="rngMulti()">Generate</button>
  <div class="rng-multi-results" id="rng-multi-results"></div>
  <button class="rng-btn" onclick="navigator.clipboard.writeText(document.getElementById('rng-multi-results').textContent)" style="background:#6c757d;margin-top:8px">Copy All</button>
</div>

<div id="rng-panel-list" class="rng-panel">
  <div class="rng-field"><label>Items (one per line)</label><textarea id="rng-list-input" rows="6" placeholder="Apple&#10;Banana&#10;Cherry"></textarea></div>
  <div class="rng-row">
    <div class="rng-field"><label>Pick count</label><input type="number" id="rng-list-count" value="1" min="1"></div>
    <div class="rng-checkbox" style="align-self:flex-end;padding-bottom:12px"><label><input type="checkbox" id="rng-list-dupes"> Allow duplicates</label></div>
  </div>
  <button class="rng-btn" onclick="rngFromList()">Pick Random</button>
  <div class="rng-multi-results" id="rng-list-results"></div>
</div>

<div id="rng-panel-dice" class="rng-panel">
  <div class="rng-row">
    <div class="rng-field"><label>Dice Type</label><select id="rng-dice-type"><option value="4">d4</option><option value="6" selected>d6</option><option value="8">d8</option><option value="10">d10</option><option value="12">d12</option><option value="20">d20</option><option value="100">d100</option></select></div>
    <div class="rng-field"><label>Number of Dice</label><input type="number" id="rng-dice-count" value="2" min="1" max="10"></div>
  </div>
  <button class="rng-btn" onclick="rngDice()">Roll Dice</button>
  <div class="rng-dice-wrap" id="rng-dice-result"></div>
  <div id="rng-dice-total" style="font-size:18px;font-weight:600;color:#333;margin-top:8px"></div>
</div>

<div id="rng-panel-coin" class="rng-panel">
  <div class="rng-coin-result" id="rng-coin-display" onclick="rngCoin()">🪙</div>
  <div style="text-align:center"><button class="rng-btn" onclick="rngCoin()">Flip Coin</button></div>
  <div class="rng-history" style="margin-top:12px"><strong>History (last 20):</strong>
    <div class="rng-coin-hist" id="rng-coin-hist"></div>
  </div>
  <div id="rng-coin-stats" style="font-size:13px;color:#555;margin-top:8px"></div>
</div>`;

    function secureRandom(min,max){const range=max-min+1;const randomBytes=new Uint32Array(1);crypto.getRandomValues(randomBytes);return min+(randomBytes[0]%range);}
    function secureFloat(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/0xFFFFFFFF;}

    window.rngTab = function(tab) {
      document.querySelectorAll('.rng-tab').forEach((b,i)=>b.classList.remove('active'));
      document.querySelectorAll('.rng-panel').forEach(p=>p.classList.remove('active'));
      const tabs=['single','multi','list','dice','coin'];
      const idx=tabs.indexOf(tab);
      document.querySelectorAll('.rng-tab')[idx].classList.add('active');
      document.getElementById(`rng-panel-${tab}`).classList.add('active');
    };

    const singleHistory=[];
    window.rngSingle = function() {
      const min=parseInt(document.getElementById('rng-min').value)||0;
      const max=parseInt(document.getElementById('rng-max').value)||100;
      const decimal=document.getElementById('rng-decimal').checked;
      let result;
      if(decimal){result=(min+secureFloat()*(max-min)).toFixed(4);}
      else{result=secureRandom(min,max);}
      document.getElementById('rng-single-result').textContent=result;
      singleHistory.unshift(result);
      if(singleHistory.length>10)singleHistory.pop();
      document.getElementById('rng-single-hist').innerHTML=singleHistory.map(v=>`<span class="rng-history-item">${v}</span>`).join('');
    };

    window.rngMulti = function() {
      const min=parseInt(document.getElementById('rng-multi-min').value)||0;
      const max=parseInt(document.getElementById('rng-multi-max').value)||100;
      const count=Math.min(1000,parseInt(document.getElementById('rng-multi-count').value)||10);
      const dupes=document.getElementById('rng-multi-dupes').checked;
      const sort=document.getElementById('rng-multi-sort').value;
      let nums=[];
      if(dupes){
        for(let i=0;i<count;i++) nums.push(secureRandom(min,max));
      } else {
        const pool=[];for(let i=min;i<=max;i++)pool.push(i);
        const pick=Math.min(count,pool.length);
        for(let i=0;i<pick;i++){const j=secureRandom(i,pool.length-1);[pool[i],pool[j]]=[pool[j],pool[i]];nums.push(pool[i]);}
      }
      if(sort==='asc') nums.sort((a,b)=>a-b);
      else if(sort==='desc') nums.sort((a,b)=>b-a);
      document.getElementById('rng-multi-results').textContent=nums.join(', ');
    };

    window.rngFromList = function() {
      const items=document.getElementById('rng-list-input').value.split('\n').map(s=>s.trim()).filter(Boolean);
      if(!items.length) return;
      const count=Math.min(parseInt(document.getElementById('rng-list-count').value)||1,items.length);
      const dupes=document.getElementById('rng-list-dupes').checked;
      let picked=[];
      if(dupes){for(let i=0;i<count;i++) picked.push(items[secureRandom(0,items.length-1)]);}
      else{const pool=[...items];for(let i=0;i<Math.min(count,pool.length);i++){const j=secureRandom(i,pool.length-1);[pool[i],pool[j]]=[pool[j],pool[i]];picked.push(pool[i]);}}
      document.getElementById('rng-list-results').textContent=picked.join('\n');
    };

    window.rngDice = function() {
      const sides=parseInt(document.getElementById('rng-dice-type').value);
      const count=Math.min(10,parseInt(document.getElementById('rng-dice-count').value)||1);
      const results=Array.from({length:count},()=>secureRandom(1,sides));
      const total=results.reduce((a,b)=>a+b,0);
      const wrap=document.getElementById('rng-dice-result');
      wrap.innerHTML=results.map(v=>`<div class="rng-die">${v}</div>`).join('');
      document.getElementById('rng-dice-total').textContent=count>1?`Total: ${total}`:'';
      // animate
      wrap.querySelectorAll('.rng-die').forEach((d,i)=>{
        d.style.transition='transform .3s';
        d.style.transform='rotateY(360deg)';
        setTimeout(()=>d.style.transform='',400);
      });
    };

    const coinHistory=[];
    window.rngCoin = function() {
      const coin=document.getElementById('rng-coin-display');
      coin.style.transform='rotateY(360deg)';
      setTimeout(()=>{
        coin.style.transform='';
        const isH=secureRandom(0,1)===0;
        coin.textContent=isH?'🪙':'🔘';
        coinHistory.unshift(isH?'H':'T');
        if(coinHistory.length>20)coinHistory.pop();
        document.getElementById('rng-coin-hist').innerHTML=coinHistory.map(v=>`<span class="rng-coin-item ${v==='H'?'rng-coin-h':'rng-coin-t'}">${v}</span>`).join('');
        const heads=coinHistory.filter(v=>v==='H').length;
        document.getElementById('rng-coin-stats').textContent=`Heads: ${heads} (${Math.round(heads/coinHistory.length*100)}%)  Tails: ${coinHistory.length-heads} (${Math.round((coinHistory.length-heads)/coinHistory.length*100)}%)`;
      },300);
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
