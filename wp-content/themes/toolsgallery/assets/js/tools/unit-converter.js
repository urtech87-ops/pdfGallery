/* Unit Converter — Phase 8 Tool 10 (data-input) */
(function () {
  'use strict';
  var CONFIG = { handler: 'unit-converter', dataInput: true };

  function init(container) {
    container.innerHTML = `
<style>
.uc-wrap{max-width:700px}
.uc-cat-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px}
.uc-cat-btn{padding:6px 12px;border:1px solid #ddd;background:#f5f5f5;color:#333;border-radius:4px;cursor:pointer;font-size:12px}
.uc-cat-btn.active{background:#0073aa;color:#fff;border-color:#0073aa}
.uc-inputs{display:flex;gap:10px;align-items:flex-end;margin-bottom:12px;flex-wrap:wrap}
.uc-inputs label{font-size:13px;color:#555;display:flex;flex-direction:column;gap:4px;font-weight:500}
.uc-inputs input{padding:8px 10px;border:1px solid #ddd;border-radius:4px;font-size:16px;width:160px;box-sizing:border-box}
.uc-inputs select{padding:8px 10px;border:1px solid #ddd;border-radius:4px;font-size:14px;width:160px}
.uc-table-wrap{overflow-x:auto}
.uc-table{width:100%;border-collapse:collapse;font-size:14px}
.uc-table th{background:#f5f5f5;padding:8px 12px;text-align:left;border:1px solid #e0e0e0;font-weight:600}
.uc-table td{padding:8px 12px;border:1px solid #e0e0e0;font-family:monospace}
.uc-table tr.uc-from{background:#fff3cd}
.uc-copy-btn{padding:3px 10px;background:#0073aa;color:#fff;border:none;border-radius:3px;cursor:pointer;font-size:12px}
.uc-copy-btn:hover{background:#005f8a}
</style>
<div class="uc-wrap">
  <div class="uc-cat-tabs" id="uc-cats"></div>
  <div class="uc-inputs">
    <label>Value <input type="number" id="uc-value" value="1" step="any" oninput="ucConvert()"></label>
    <label>From Unit <select id="uc-from" onchange="ucConvert()"></select></label>
    <button style="padding:8px 16px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px" onclick="ucConvert()">Convert</button>
  </div>
  <div class="uc-table-wrap">
    <table class="uc-table"><thead><tr><th>Unit</th><th>Value</th><th></th></tr></thead>
    <tbody id="uc-tbody"></tbody></table>
  </div>
</div>`;

    const UNITS = {
      Length: {
        units: ['mm','cm','m','km','inch','foot','yard','mile','nautical mile','light year'],
        // base: meter
        toBase: {mm:0.001,cm:0.01,m:1,km:1000,inch:0.0254,foot:0.3048,yard:0.9144,mile:1609.344,'nautical mile':1852,'light year':9.461e15},
      },
      Weight: {
        units: ['mg','g','kg','metric ton','lb','oz','stone','US ton','UK ton'],
        // base: kg
        toBase: {mg:1e-6,g:0.001,kg:1,'metric ton':1000,lb:0.453592,oz:0.0283495,stone:6.35029,'US ton':907.185,'UK ton':1016.05},
      },
      Temperature: {
        units: ['Celsius','Fahrenheit','Kelvin','Rankine'],
        special: true,
      },
      Area: {
        units: ['mm²','cm²','m²','km²','in²','ft²','yd²','acre','hectare','mi²'],
        toBase: {'mm²':1e-6,'cm²':1e-4,'m²':1,'km²':1e6,'in²':6.4516e-4,'ft²':0.0929030,'yd²':0.836127,'acre':4046.86,'hectare':10000,'mi²':2.59e6},
      },
      Volume: {
        units: ['ml','l','m³','tsp','tbsp','fl oz','cup','pint','quart','US gal','UK gal'],
        // base: liter
        toBase: {ml:0.001,l:1,'m³':1000,tsp:0.00492892,tbsp:0.0147868,'fl oz':0.0295735,cup:0.236588,pint:0.473176,quart:0.946353,'US gal':3.78541,'UK gal':4.54609},
      },
      Speed: {
        units: ['m/s','km/h','mph','knot','ft/s','Mach'],
        toBase: {'m/s':1,'km/h':1/3.6,'mph':0.44704,'knot':0.514444,'ft/s':0.3048,'Mach':343},
      },
      Time: {
        units: ['ms','s','min','hr','day','week','month','year'],
        toBase: {ms:0.001,s:1,min:60,hr:3600,day:86400,week:604800,month:2629800,year:31557600},
      },
      'Digital Storage': {
        units: ['bit','byte','KB','MB','GB','TB','PB'],
        toBase: {bit:0.125,byte:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776,PB:1125899906842624},
      },
      Energy: {
        units: ['J','kJ','cal','kcal','Wh','kWh','BTU'],
        toBase: {J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000,BTU:1055.06},
      },
      Pressure: {
        units: ['Pa','kPa','bar','psi','atm','mmHg','inHg'],
        toBase: {Pa:1,kPa:1000,bar:100000,psi:6894.76,atm:101325,mmHg:133.322,inHg:3386.39},
      },
      Angle: {
        units: ['degree','radian','gradian','turn','arcmin','arcsec'],
        toBase: {degree:1,radian:180/Math.PI,gradian:0.9,turn:360,arcmin:1/60,arcsec:1/3600},
      },
      'Fuel Economy': {
        units: ['mpg US','mpg UK','L/100km','km/L'],
        // base: mpg US
        toBase: {'mpg US':1,'mpg UK':0.832674,'L/100km':235.215,'km/L':2.35215},
        // L/100km and km/L are inverse — handled specially
        fuelSpecial: true,
      },
    };

    function tempConvert(val, from, to) {
      let celsius;
      switch(from){
        case 'Celsius':celsius=val;break;
        case 'Fahrenheit':celsius=(val-32)*5/9;break;
        case 'Kelvin':celsius=val-273.15;break;
        case 'Rankine':celsius=(val-491.67)*5/9;break;
        default:celsius=val;
      }
      switch(to){
        case 'Celsius':return celsius;
        case 'Fahrenheit':return celsius*9/5+32;
        case 'Kelvin':return celsius+273.15;
        case 'Rankine':return (celsius+273.15)*9/5;
        default:return celsius;
      }
    }

    function fuelConvert(val, from, to) {
      // convert everything to L/100km first for inversion
      let l100km;
      switch(from){
        case 'mpg US':l100km=235.215/val;break;
        case 'mpg UK':l100km=282.481/val;break;
        case 'L/100km':l100km=val;break;
        case 'km/L':l100km=100/val;break;
      }
      switch(to){
        case 'mpg US':return 235.215/l100km;
        case 'mpg UK':return 282.481/l100km;
        case 'L/100km':return l100km;
        case 'km/L':return 100/l100km;
      }
    }

    let currentCat = 'Length';

    function buildCatTabs() {
      document.getElementById('uc-cats').innerHTML = Object.keys(UNITS).map(cat=>`<button class="uc-cat-btn${cat===currentCat?' active':''}" onclick="ucSetCat('${cat}')">${cat}</button>`).join('');
    }

    function buildFromSelect() {
      const sel = document.getElementById('uc-from');
      const cat = UNITS[currentCat];
      sel.innerHTML = cat.units.map(u=>`<option value="${u}">${u}</option>`).join('');
    }

    window.ucSetCat = function(cat) {
      currentCat = cat;
      buildCatTabs();
      buildFromSelect();
      ucConvert();
    };

    function fmt(n) {
      if(Math.abs(n)>=1e10||Math.abs(n)<0.0001&&n!==0) return n.toExponential(6);
      return parseFloat(n.toPrecision(10)).toString();
    }

    window.ucConvert = function() {
      const val = parseFloat(document.getElementById('uc-value').value);
      const from = document.getElementById('uc-from').value;
      if(isNaN(val)){document.getElementById('uc-tbody').innerHTML='';return;}
      const cat = UNITS[currentCat];
      let rows = '';
      cat.units.forEach(unit => {
        let result;
        if(cat.special){result=tempConvert(val,from,unit);}
        else if(cat.fuelSpecial){result=fuelConvert(val,from,unit);}
        else{result=val*cat.toBase[from]/cat.toBase[unit];}
        const isFrom=unit===from;
        rows+=`<tr${isFrom?' class="uc-from"':''}><td>${unit}</td><td>${fmt(result)}</td><td><button class="uc-copy-btn" onclick="navigator.clipboard.writeText('${fmt(result)}')">Copy</button></td></tr>`;
      });
      document.getElementById('uc-tbody').innerHTML=rows;
    };

    buildCatTabs();
    buildFromSelect();
    ucConvert();
  }

  window.TGTools = window.TGTools || {};
  window.TGTools[CONFIG.handler] = { init, CONFIG };
})();
