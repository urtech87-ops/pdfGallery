/* Duplicate Line Remover — Phase 8 Tool 8 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'duplicate-remover', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.dr-wrap{display:flex;flex-direction:column;gap:12px}
.dr-textareas{display:flex;gap:12px;flex-wrap:wrap}
.dr-ta-wrap{flex:1;min-width:240px}
.dr-ta-wrap label{display:block;font-size:13px;color:#555;margin-bottom:4px;font-weight:500}
.dr-ta{width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:14px;resize:vertical;min-height:160px;box-sizing:border-box;font-family:inherit}
.dr-options{display:flex;flex-wrap:wrap;gap:16px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #eee}
.dr-option-group{display:flex;flex-direction:column;gap:6px}
.dr-option-group strong{font-size:12px;color:#333;text-transform:uppercase;letter-spacing:.5px}
.dr-check label{display:flex;align-items:center;gap:6px;font-size:13px;color:#555;cursor:pointer}
.dr-select{padding:5px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;width:100%}
.dr-stats{font-size:13px;color:#555;padding:7px 12px;background:#f5f5f5;border-radius:4px;border-left:3px solid #0073aa}
.dr-actions{display:flex;gap:8px;flex-wrap:wrap}
.dr-btn{padding:7px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600}
.dr-btn:hover{background:#005f8a}
.dr-btn-sec{background:#6c757d}
.dr-btn-sec:hover{background:#545b62}
</style>
<div class="dr-wrap">
  <div class="dr-textareas">
    <div class="dr-ta-wrap">
      <label>Input (one item per line)</label>
      <textarea id="dr-input" class="dr-ta" placeholder="Paste lines here…"></textarea>
    </div>
    <div class="dr-ta-wrap">
      <label>Output</label>
      <textarea id="dr-output" class="dr-ta" readonly></textarea>
    </div>
  </div>

  <div class="dr-options">
    <div class="dr-option-group">
      <strong>Matching</strong>
      <div class="dr-check"><label><input type="checkbox" id="dr-case"> Case sensitive</label></div>
      <div class="dr-check"><label><input type="checkbox" id="dr-trim" checked> Trim whitespace</label></div>
      <div class="dr-check"><label><input type="checkbox" id="dr-fuzzy"> Fuzzy match (80%)</label></div>
    </div>
    <div class="dr-option-group">
      <strong>Keep</strong>
      <select id="dr-keep" class="dr-select">
        <option value="first">First occurrence</option>
        <option value="last">Last occurrence</option>
      </select>
    </div>
    <div class="dr-option-group">
      <strong>Sort Output</strong>
      <select id="dr-sort" class="dr-select">
        <option value="none">No sort</option>
        <option value="az">A-Z</option>
        <option value="za">Z-A</option>
        <option value="len">By length</option>
      </select>
    </div>
    <div class="dr-option-group">
      <strong>Show</strong>
      <select id="dr-show" class="dr-select">
        <option value="unique">Unique only</option>
        <option value="dupes">Duplicates only</option>
        <option value="both">Both with count</option>
      </select>
    </div>
  </div>

  <div class="dr-stats" id="dr-stats">Ready.</div>
  <div class="dr-actions">
    <button class="dr-btn" onclick="drProcess()">Remove Duplicates</button>
    <button class="dr-btn dr-btn-sec" onclick="drSwap()">Swap Input/Output</button>
    <button class="dr-btn dr-btn-sec" onclick="navigator.clipboard.writeText(document.getElementById('dr-output').value)">Copy Output</button>
  </div>
</div>`;

    function levenshtein(a,b){
      const m=a.length,n=b.length;
      const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));
      for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
      return dp[m][n];
    }
    function similarity(a,b){const maxLen=Math.max(a.length,b.length);if(maxLen===0)return 1;return 1-levenshtein(a,b)/maxLen;}
    function getKey(line,caseSen,trim){let k=trim?line.trim():line;return caseSen?k:k.toLowerCase();}

    function removeDuplicates(text,options){
      const lines=text.split('\n');
      const seen=[];
      const counts={};
      const result=[];
      for(const line of lines){
        const key=getKey(line,options.caseSensitive,options.trim);
        let isDupe=false;
        if(options.fuzzy){isDupe=seen.some(s=>similarity(key,s)>=0.8);}
        else{isDupe=seen.includes(key);}
        if(!isDupe){
          seen.push(key);counts[key]=1;
          if(options.keep==='first'||options.keep==='last') result.push(line);
        } else {
          counts[key]=(counts[key]||1)+1;
          if(options.keep==='last'){
            const prevIdx=result.findIndex(r=>getKey(r,options.caseSensitive,options.trim)===key);
            if(prevIdx!==-1) result.splice(prevIdx,1);
            result.push(line);
          }
        }
      }
      return {result,counts,total:lines.length};
    }

    window.drProcess = function() {
      const text=document.getElementById('dr-input').value;
      const caseSen=document.getElementById('dr-case').checked;
      const trim=document.getElementById('dr-trim').checked;
      const fuzzy=document.getElementById('dr-fuzzy').checked;
      const keep=document.getElementById('dr-keep').value;
      const sort=document.getElementById('dr-sort').value;
      const show=document.getElementById('dr-show').value;
      const {result,counts,total}=removeDuplicates(text,{caseSensitive:caseSen,trim,fuzzy,keep});
      const allLines=text.split('\n');
      let output=[];
      if(show==='unique'){output=result;}
      else if(show==='dupes'){
        const seen2=new Set();
        output=allLines.filter(l=>{const k=getKey(l,caseSen,trim);if(counts[k]>1){if(!seen2.has(k)){seen2.add(k);return true;}}return false;});
      }
      else{output=result.map(l=>{const k=getKey(l,caseSen,trim);return counts[k]>1?`${l}  [x${counts[k]}]`:l;});}
      if(sort==='az') output.sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
      else if(sort==='za') output.sort((a,b)=>b.toLowerCase().localeCompare(a.toLowerCase()));
      else if(sort==='len') output.sort((a,b)=>a.length-b.length);
      const removed=total-result.length;
      document.getElementById('dr-output').value=output.join('\n');
      document.getElementById('dr-stats').textContent=`Input: ${total} lines → Output: ${result.length} lines (${removed} duplicate${removed!==1?'s':''} removed)`;
    };

    window.drSwap = function() {
      const inp=document.getElementById('dr-input');
      const out=document.getElementById('dr-output');
      inp.value=out.value; out.value='';
      document.getElementById('dr-stats').textContent='Ready.';
    };

    document.getElementById('dr-input').addEventListener('input',drProcess);
    ['dr-case','dr-trim','dr-fuzzy','dr-keep','dr-sort','dr-show'].forEach(id=>document.getElementById(id).addEventListener('change',drProcess));
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
