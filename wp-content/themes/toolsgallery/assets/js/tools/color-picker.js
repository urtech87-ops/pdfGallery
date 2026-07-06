/* Color Picker — Phase 8 Tool 1 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'color-picker', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.cp-wrap{display:flex;flex-wrap:wrap;gap:20px}
.cp-left{flex:0 0 220px}
.cp-right{flex:1;min-width:260px}
.cp-color-input{width:200px;height:200px;border:none;padding:0;cursor:pointer;border-radius:8px;display:block}
.cp-hex-row{display:flex;gap:8px;margin-top:10px;align-items:center}
.cp-hex-input{flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:14px}
.cp-alpha-wrap{margin-top:10px}
.cp-alpha-wrap label{font-size:13px;color:#555;display:block;margin-bottom:4px}
.cp-alpha{width:200px;accent-color:#0073aa}
.cp-formats{width:100%}
.cp-format-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px}
.cp-format-label{width:60px;font-weight:600;color:#555}
.cp-format-value{flex:1;font-family:monospace;background:#f5f5f5;padding:4px 8px;border-radius:3px;word-break:break-all}
.cp-copy-btn{padding:3px 10px;background:#0073aa;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap}
.cp-copy-btn:hover{background:#005f8a}
.cp-section{margin-top:16px}
.cp-section-title{font-size:13px;font-weight:600;color:#333;margin-bottom:8px}
.cp-named{font-size:13px;color:#555;padding:6px 10px;background:#f9f9f9;border-radius:4px;border:1px solid #eee}
.cp-swatches{display:flex;flex-wrap:wrap;gap:4px}
.cp-swatch{width:28px;height:28px;border-radius:3px;cursor:pointer;border:1px solid rgba(0,0,0,.1);transition:transform .1s}
.cp-swatch:hover{transform:scale(1.15)}
.cp-harmony-row{display:flex;gap:6px;flex-wrap:wrap}
.cp-harmony-item{text-align:center;font-size:11px}
.cp-harmony-swatch{width:36px;height:36px;border-radius:4px;margin-bottom:2px;border:1px solid rgba(0,0,0,.1);cursor:pointer}
</style>
<div class="cp-wrap">
  <div class="cp-left">
    <input type="color" id="cp-color" class="cp-color-input" value="#3d9bf0">
    <div class="cp-hex-row">
      <input type="text" id="cp-hex-input" class="cp-hex-input" value="#3d9bf0" maxlength="7" placeholder="#RRGGBB">
      <button class="cp-copy-btn" onclick="cpCopy('cp-hex-val')">Copy</button>
    </div>
    <div class="cp-alpha-wrap">
      <label>Opacity: <span id="cp-alpha-val">100</span>%</label>
      <input type="range" id="cp-alpha" class="cp-alpha" min="0" max="100" value="100">
    </div>
  </div>
  <div class="cp-right">
    <div class="cp-formats" id="cp-formats"></div>
    <div class="cp-section">
      <div class="cp-section-title">Nearest CSS Named Color</div>
      <div class="cp-named" id="cp-named">—</div>
    </div>
  </div>
</div>
<div class="cp-section">
  <div class="cp-section-title">Tints (lighter)</div>
  <div class="cp-swatches" id="cp-tints"></div>
</div>
<div class="cp-section">
  <div class="cp-section-title">Shades (darker)</div>
  <div class="cp-swatches" id="cp-shades"></div>
</div>
<div class="cp-section">
  <div class="cp-section-title">Color Harmonies</div>
  <div id="cp-harmonies"></div>
</div>
<div class="cp-section">
  <div class="cp-section-title">Recently Used</div>
  <div class="cp-swatches" id="cp-recent"></div>
</div>`;

    const CSS_COLORS = {
      aliceblue:'#f0f8ff',antiquewhite:'#faebd7',aqua:'#00ffff',aquamarine:'#7fffd4',azure:'#f0ffff',
      beige:'#f5f5dc',bisque:'#ffe4c4',black:'#000000',blanchedalmond:'#ffebcd',blue:'#0000ff',
      blueviolet:'#8a2be2',brown:'#a52a2a',burlywood:'#deb887',cadetblue:'#5f9ea0',chartreuse:'#7fff00',
      chocolate:'#d2691e',coral:'#ff7f50',cornflowerblue:'#6495ed',cornsilk:'#fff8dc',crimson:'#dc143c',
      cyan:'#00ffff',darkblue:'#00008b',darkcyan:'#008b8b',darkgoldenrod:'#b8860b',darkgray:'#a9a9a9',
      darkgreen:'#006400',darkkhaki:'#bdb76b',darkmagenta:'#8b008b',darkolivegreen:'#556b2f',
      darkorange:'#ff8c00',darkorchid:'#9932cc',darkred:'#8b0000',darksalmon:'#e9967a',
      darkseagreen:'#8fbc8f',darkslateblue:'#483d8b',darkslategray:'#2f4f4f',darkturquoise:'#00ced1',
      darkviolet:'#9400d3',deeppink:'#ff1493',deepskyblue:'#00bfff',dimgray:'#696969',
      dodgerblue:'#1e90ff',firebrick:'#b22222',floralwhite:'#fffaf0',forestgreen:'#228b22',
      fuchsia:'#ff00ff',gainsboro:'#dcdcdc',ghostwhite:'#f8f8ff',gold:'#ffd700',goldenrod:'#daa520',
      gray:'#808080',green:'#008000',greenyellow:'#adff2f',honeydew:'#f0fff0',hotpink:'#ff69b4',
      indianred:'#cd5c5c',indigo:'#4b0082',ivory:'#fffff0',khaki:'#f0e68c',lavender:'#e6e6fa',
      lavenderblush:'#fff0f5',lawngreen:'#7cfc00',lemonchiffon:'#fffacd',lightblue:'#add8e6',
      lightcoral:'#f08080',lightcyan:'#e0ffff',lightgoldenrodyellow:'#fafad2',lightgray:'#d3d3d3',
      lightgreen:'#90ee90',lightpink:'#ffb6c1',lightsalmon:'#ffa07a',lightseagreen:'#20b2aa',
      lightskyblue:'#87cefa',lightslategray:'#778899',lightsteelblue:'#b0c4de',lightyellow:'#ffffe0',
      lime:'#00ff00',limegreen:'#32cd32',linen:'#faf0e6',magenta:'#ff00ff',maroon:'#800000',
      mediumaquamarine:'#66cdaa',mediumblue:'#0000cd',mediumorchid:'#ba55d3',mediumpurple:'#9370db',
      mediumseagreen:'#3cb371',mediumslateblue:'#7b68ee',mediumspringgreen:'#00fa9a',
      mediumturquoise:'#48d1cc',mediumvioletred:'#c71585',midnightblue:'#191970',mintcream:'#f5fffa',
      mistyrose:'#ffe4e1',moccasin:'#ffe4b5',navajowhite:'#ffdead',navy:'#000080',oldlace:'#fdf5e6',
      olive:'#808000',olivedrab:'#6b8e23',orange:'#ffa500',orangered:'#ff4500',orchid:'#da70d6',
      palegoldenrod:'#eee8aa',palegreen:'#98fb98',paleturquoise:'#afeeee',palevioletred:'#db7093',
      papayawhip:'#ffefd5',peachpuff:'#ffdab9',peru:'#cd853f',pink:'#ffc0cb',plum:'#dda0dd',
      powderblue:'#b0e0e6',purple:'#800080',red:'#ff0000',rosybrown:'#bc8f8f',royalblue:'#4169e1',
      saddlebrown:'#8b4513',salmon:'#fa8072',sandybrown:'#f4a460',seagreen:'#2e8b57',seashell:'#fff5ee',
      sienna:'#a0522d',silver:'#c0c0c0',skyblue:'#87ceeb',slateblue:'#6a5acd',slategray:'#708090',
      snow:'#fffafa',springgreen:'#00ff7f',steelblue:'#4682b4',tan:'#d2b48c',teal:'#008080',
      thistle:'#d8bfd8',tomato:'#ff6347',turquoise:'#40e0d0',violet:'#ee82ee',wheat:'#f5deb3',
      white:'#ffffff',whitesmoke:'#f5f5f5',yellow:'#ffff00',yellowgreen:'#9acd32'
    };

    function hexToRgb(hex) {
      const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      return {r,g,b};
    }
    function rgbToHex(r,g,b) {
      return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
    }
    function rgbToHsl(r,g,b) {
      r/=255; g/=255; b/=255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b);
      let h,s,l=(max+min)/2;
      if(max===min){h=s=0;}else{
        const d=max-min;
        s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}
        h/=6;
      }
      return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
    }
    function rgbToHsv(r,g,b) {
      r/=255; g/=255; b/=255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
      let h,s=max===0?0:d/max,v=max;
      if(max===min){h=0;}else{
        switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}
        h/=6;
      }
      return {h:Math.round(h*360),s:Math.round(s*100),v:Math.round(v*100)};
    }
    function rgbToCmyk(r,g,b) {
      r/=255; g/=255; b/=255;
      const k=1-Math.max(r,g,b);
      if(k===1) return {c:0,m:0,y:0,k:100};
      return {c:Math.round((1-r-k)/(1-k)*100),m:Math.round((1-g-k)/(1-k)*100),y:Math.round((1-b-k)/(1-k)*100),k:Math.round(k*100)};
    }
    function hslToRgb(h,s,l) {
      h/=360; s/=100; l/=100;
      let r,g,b;
      if(s===0){r=g=b=l;}else{
        function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
        const q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
        r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
      }
      return {r:Math.round(r*255),g:Math.round(g*255),b:Math.round(b*255)};
    }

    function nearestNamed(r,g,b) {
      let best=null, bestDist=Infinity;
      const threshold=255*0.2*Math.sqrt(3);
      for(const [name,hex] of Object.entries(CSS_COLORS)){
        const c=hexToRgb(hex);
        const d=Math.sqrt((r-c.r)**2+(g-c.g)**2+(b-c.b)**2);
        if(d<bestDist){bestDist=d;best=name;}
      }
      return bestDist<threshold?best:null;
    }

    function buildFormats(r,g,b,a) {
      const hsl=rgbToHsl(r,g,b);
      const hsv=rgbToHsv(r,g,b);
      const cmyk=rgbToCmyk(r,g,b);
      const alpha=(a/100).toFixed(2);
      const formats=[
        {label:'HEX', value:rgbToHex(r,g,b), id:'cp-hex-val'},
        {label:'RGB', value:`rgb(${r}, ${g}, ${b})`, id:'cp-rgb-val'},
        {label:'RGBA', value:`rgba(${r}, ${g}, ${b}, ${alpha})`, id:'cp-rgba-val'},
        {label:'HSL', value:`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, id:'cp-hsl-val'},
        {label:'HSLA', value:`hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`, id:'cp-hsla-val'},
        {label:'HSV', value:`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`, id:'cp-hsv-val'},
        {label:'CMYK', value:`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, id:'cp-cmyk-val'},
      ];
      return formats.map(f=>`<div class="cp-format-row">
        <span class="cp-format-label">${f.label}</span>
        <span class="cp-format-value" id="${f.id}">${f.value}</span>
        <button class="cp-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('${f.id}').textContent)">Copy</button>
      </div>`).join('');
    }

    function buildSwatches(colors, containerId) {
      const el=document.getElementById(containerId);
      if(!el) return;
      el.innerHTML=colors.map(c=>`<div class="cp-swatch" style="background:${c}" title="${c}" onclick="cpSetColor('${c}')"></div>`).join('');
    }

    window.cpSetColor = function(hex) {
      document.getElementById('cp-color').value=hex;
      document.getElementById('cp-hex-input').value=hex;
      updateAll();
    };

    window.cpCopy = function(id) {
      const el=document.getElementById(id);
      if(el) navigator.clipboard.writeText(el.textContent);
    };

    function getTints(r,g,b) {
      return Array.from({length:10},(_,i)=>{
        const t=(i+1)/10;
        return rgbToHex(Math.round(r+(255-r)*t),Math.round(g+(255-g)*t),Math.round(b+(255-b)*t));
      });
    }
    function getShades(r,g,b) {
      return Array.from({length:10},(_,i)=>{
        const t=(i+1)/10;
        return rgbToHex(Math.round(r*(1-t)),Math.round(g*(1-t)),Math.round(b*(1-t)));
      });
    }
    function getHarmonies(h,s,l) {
      function makeHex(hh){const {r,g,b}=hslToRgb(((hh%360)+360)%360,s,l);return rgbToHex(r,g,b);}
      return {
        'Complementary':[makeHex(h),makeHex(h+180)],
        'Analogous':[makeHex(h-30),makeHex(h),makeHex(h+30)],
        'Triadic':[makeHex(h),makeHex(h+120),makeHex(h+240)],
        'Tetradic':[makeHex(h),makeHex(h+90),makeHex(h+180),makeHex(h+270)],
      };
    }

    function updateAll() {
      const hex=document.getElementById('cp-color').value;
      const alpha=parseInt(document.getElementById('cp-alpha').value);
      document.getElementById('cp-alpha-val').textContent=alpha;
      document.getElementById('cp-hex-input').value=hex;
      const {r,g,b}=hexToRgb(hex);
      document.getElementById('cp-formats').innerHTML=buildFormats(r,g,b,alpha);
      const named=nearestNamed(r,g,b);
      document.getElementById('cp-named').textContent=named?`${named} (${CSS_COLORS[named]})`:'No close match';
      buildSwatches(getTints(r,g,b),'cp-tints');
      buildSwatches(getShades(r,g,b),'cp-shades');
      const hsl=rgbToHsl(r,g,b);
      const harmonies=getHarmonies(hsl.h,hsl.s,hsl.l);
      document.getElementById('cp-harmonies').innerHTML=Object.entries(harmonies).map(([name,colors])=>`
        <div style="margin-bottom:10px"><strong style="font-size:12px;color:#555">${name}</strong>
        <div class="cp-harmony-row">${colors.map(c=>`<div class="cp-harmony-item"><div class="cp-harmony-swatch" style="background:${c}" onclick="cpSetColor('${c}')"></div><div>${c}</div></div>`).join('')}</div></div>`).join('');
      try{
        let recent=JSON.parse(localStorage.getItem('cp-recent')||'[]');
        recent=recent.filter(c=>c!==hex);
        recent.unshift(hex);
        recent=recent.slice(0,10);
        localStorage.setItem('cp-recent',JSON.stringify(recent));
        buildSwatches(recent,'cp-recent');
      }catch(e){/* localStorage unavailable (privacy mode) — skip recent colors */}
    }

    document.getElementById('cp-color').addEventListener('input',updateAll);
    document.getElementById('cp-alpha').addEventListener('input',updateAll);
    document.getElementById('cp-hex-input').addEventListener('input',function(){
      const v=this.value.trim();
      if(/^#[0-9a-fA-F]{6}$/.test(v)){document.getElementById('cp-color').value=v;updateAll();}
    });
    updateAll();
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
