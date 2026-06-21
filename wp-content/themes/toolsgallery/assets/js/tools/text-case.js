/* Text Case Converter — Phase 8 Tool 6 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'text-case', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.tc-wrap{display:flex;flex-direction:column;gap:12px}
.tc-textareas{display:flex;gap:12px;flex-wrap:wrap}
.tc-textarea-wrap{flex:1;min-width:240px}
.tc-textarea-wrap label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.tc-textarea{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;resize:vertical;min-height:140px;box-sizing:border-box;font-family:inherit}
.tc-stats{font-size:12px;color:#888;margin-top:4px}
.tc-buttons{display:flex;flex-wrap:wrap;gap:6px}
.tc-btn{padding:6px 14px;background:#f0f0f0;color:#333;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:13px}
.tc-btn:hover{background:#0073aa;color:#fff;border-color:#0073aa}
.tc-actions{display:flex;gap:8px;flex-wrap:wrap}
.tc-action-btn{padding:7px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
.tc-action-btn:hover{background:#005f8a}
.tc-action-swap{background:#6c757d}
.tc-action-swap:hover{background:#545b62}
</style>
<div class="tc-wrap">
  <div class="tc-textareas">
    <div class="tc-textarea-wrap">
      <label>Input Text</label>
      <textarea id="tc-input" class="tc-textarea" placeholder="Type or paste text here…"></textarea>
      <div class="tc-stats" id="tc-in-stats">0 chars · 0 words</div>
    </div>
    <div class="tc-textarea-wrap">
      <label>Output Text</label>
      <textarea id="tc-output" class="tc-textarea" readonly></textarea>
      <div class="tc-stats" id="tc-out-stats">0 chars · 0 words</div>
    </div>
  </div>
  <div class="tc-buttons" id="tc-btns"></div>
  <div class="tc-actions">
    <button class="tc-action-btn" onclick="tcCopy()">Copy Result</button>
    <button class="tc-action-btn tc-action-swap" onclick="tcSwap()">Swap</button>
  </div>
</div>`;

    const conversions = [
      {label:'UPPERCASE', fn:t=>t.toUpperCase()},
      {label:'lowercase', fn:t=>t.toLowerCase()},
      {label:'Title Case', fn:t=>t.replace(/\w\S*/g,w=>w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())},
      {label:'Sentence case', fn:t=>t.replace(/(^\s*\w|[.!?]\s*\w)/g,c=>c.toUpperCase()).replace(/(^\s*[A-Z]|[.!?]\s*[A-Z])(.)/g,(_,a,b)=>a+b.toLowerCase())},
      {label:'camelCase', fn:t=>t.replace(/[^a-zA-Z0-9]+(.)/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toLowerCase()).replace(/[^a-zA-Z0-9]/g,'')},
      {label:'PascalCase', fn:t=>t.replace(/[^a-zA-Z0-9]+(.)/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase()).replace(/[^a-zA-Z0-9]/g,'')},
      {label:'snake_case', fn:t=>t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'')},
      {label:'kebab-case', fn:t=>t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'')},
      {label:'SCREAMING_SNAKE', fn:t=>t.toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_|_$/g,'')},
      {label:'dot.case', fn:t=>t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'.').replace(/^\.|\.$/g,'')},
      {label:'path/case', fn:t=>t.toLowerCase().replace(/[^a-zA-Z0-9]+/g,'/').replace(/^\/|\/$/g,'')},
      {label:'Toggle Case', fn:t=>t.split('').map(c=>c===c.toUpperCase()?c.toLowerCase():c.toUpperCase()).join('')},
      {label:'aLtErNaTiNg', fn:t=>t.split('').map((c,i)=>i%2===0?c.toLowerCase():c.toUpperCase()).join('')},
      {label:'Remove Extra Spaces', fn:t=>t.replace(/[ \t]+/g,' ').trim()},
      {label:'Remove Line Breaks', fn:t=>t.replace(/\r?\n/g,' ').replace(/  +/g,' ').trim()},
      {label:'Remove Numbers', fn:t=>t.replace(/[0-9]/g,'')},
      {label:'Remove Special Chars', fn:t=>t.replace(/[^a-zA-Z0-9\s]/g,'')},
    ];

    function wordCount(t){return t.trim()?t.trim().split(/\s+/).length:0;}
    function updateStats(id,statId){
      const t=document.getElementById(id).value;
      document.getElementById(statId).textContent=`${t.length} chars · ${wordCount(t)} words`;
    }

    document.getElementById('tc-input').addEventListener('input',()=>updateStats('tc-input','tc-in-stats'));

    document.getElementById('tc-btns').innerHTML=conversions.map((c,i)=>`<button class="tc-btn" onclick="tcConvert(${i})">${c.label}</button>`).join('');

    window.tcConvert = function(i) {
      const input=document.getElementById('tc-input').value;
      const out=conversions[i].fn(input);
      document.getElementById('tc-output').value=out;
      updateStats('tc-output','tc-out-stats');
    };
    window.tcCopy = function() {
      const out=document.getElementById('tc-output').value;
      navigator.clipboard.writeText(out);
    };
    window.tcSwap = function() {
      const inp=document.getElementById('tc-input');
      const out=document.getElementById('tc-output');
      const tmp=inp.value;
      inp.value=out.value;
      out.value=tmp;
      updateStats('tc-input','tc-in-stats');
      updateStats('tc-output','tc-out-stats');
    };
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
