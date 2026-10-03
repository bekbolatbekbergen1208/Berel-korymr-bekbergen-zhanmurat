import {berelSite,berelMounds} from './data.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={NORMAL:'#98b585',RECHECK:'#cab471',ANOMALY:'#cd7e66'};
let map,liveLayer,liveMeasurements=[],activeFilter='ALL';
export function mountResearchMap(){
  const original=document.querySelector('.map-dashboard');original.id='demo-measurement-map';
  const block=document.createElement('div');block.className='berel-map-block';
  block.innerHTML=`<div class="map-tabs" role="tablist" aria-label="Карта көрінісі"><button role="tab" aria-selected="true" aria-controls="geographic-pane" id="geo-tab" data-map-view="geographic-pane" class="selected">⌖ Аумақ картасы</button><button role="tab" aria-selected="false" aria-controls="mound-pane" id="mound-tab" data-map-view="mound-pane">◉ Қорғандар сызбасы</button><button role="tab" aria-selected="false" aria-controls="demo-measurement-map" id="demo-map-tab" data-map-view="demo-measurement-map">∿ Демо нүктелер</button></div><div id="geographic-pane" role="tabpanel" aria-labelledby="geo-tab"><div class="geo-controls"><p>Берел қорымы · жуық орналасуы</p><button id="map-reset">Берелге оралу ↗</button></div><div id="berel-geo-map" aria-label="Берел қорымының географиялық картасы"></div><div id="map-network-message" role="status"></div><p class="muted">Кешеннің жуық орны: 49°20′ N, 86°22′ E. Шеңбер — бағдарлық аумақ. Жеке қорғандардың шекарасы мен нақты орны белгіленбеген. <a href="${esc(berelSite.source)}" target="_blank" rel="noopener">Дереккөз ↗</a></p></div><div id="mound-pane" role="tabpanel" aria-labelledby="mound-tab" hidden><div class="mound-layout"><div class="mound-schematic"><div class="mound-schematic-title">БЕРЕЛ ҚОРҒАНДАРЫ<small>Ақпараттық сызба · нақты орналасу жоспары емес</small></div><svg viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true"><path d="M 50 360 Q 300 240 750 40" fill="none" stroke="#bda17530" stroke-width="70"/><path d="M 50 360 Q 300 240 750 40" fill="none" stroke="#bda17570" stroke-dasharray="5 9"/></svg>${berelMounds.map(m=>`<button class="mound-marker" data-mound="${m.id}" style="left:${m.x}%;top:${m.y}%" aria-label="${m.name}"><i></i><span>${m.name}</span></button>`).join('')}<span class="mound-disclaimer">Масштаб пен орындар шартты</span></div><aside id="mound-details" class="point-panel"></aside></div><p class="muted">№2, №10, №11 — дереккөздерде сипатталған қорғандар. Сызбадағы арақашықтық пен бағыт дәл геодезиялық жоспарды көрсетпейді.</p></div>`;
  original.before(block);original.hidden=true;original.setAttribute('role','tabpanel');original.setAttribute('aria-labelledby','demo-map-tab');
  function selectMound(id){const m=berelMounds.find(x=>x.id===id);document.querySelectorAll('[data-mound]').forEach(b=>b.classList.toggle('selected',b.dataset.mound===id));document.querySelector('#mound-details').innerHTML=`<span class="card-kicker">БЕРЕЛ / ҚОРҒАН</span><h3>${m.name}</h3><p>${m.description}</p><div class="detail-row"><span>GPS орны</span><b>Расталмаған</b></div><p>Нақты GPS дерегі енгізілгенде, қорғанды аумақ картасында көрсетуге болады.</p><a class="mound-source" href="${esc(m.source)}" target="_blank" rel="noopener">Ғылыми дереккөз ↗</a>`;}
  selectMound('K-11');document.querySelectorAll('[data-mound]').forEach(b=>b.onclick=()=>selectMound(b.dataset.mound));
  document.querySelectorAll('[data-map-view]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-map-view]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-selected',String(selected));document.getElementById(b.dataset.mapView).hidden=!selected;});if(button.dataset.mapView==='geographic-pane')map?.invalidateSize();});
  if(!window.L){document.querySelector('#map-network-message').textContent='Карта модулі жүктелмеді. Қорғандар сызбасы мен өлшемдер қолжетімді.';return;}
  map=L.map('berel-geo-map',{scrollWheelZoom:false}).setView([berelSite.lat,berelSite.lng],berelSite.zoom);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  tiles.on('tileerror',()=>{document.querySelector('#map-network-message').textContent='Карта қабаты жүктелмеді. Интернет байланысын тексеріңіз. Өлшемдер мен қорғандар сызбасы қолжетімді.';});
  tiles.on('load',()=>{if(document.querySelector('#berel-geo-map .leaflet-tile-loaded'))document.querySelector('#map-network-message').textContent='';});
  L.circle([berelSite.lat,berelSite.lng],{radius:600,color:'#c1a174',fillOpacity:.12,dashArray:'6 7'}).addTo(map).bindTooltip('Берел қорымы · жуық аумақ').bindPopup('Берел қорымы. Кешен деңгейіндегі жуық координата; жеке қорғанның орны емес.');
  liveLayer=L.layerGroup().addTo(map);
  document.querySelector('#map-reset').onclick=()=>map.setView([berelSite.lat,berelSite.lng],berelSite.zoom);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;renderLiveMap();}));
}
function renderLiveMap(){
  liveLayer?.clearLayers();const latestPoints=new Map();for(const m of liveMeasurements)latestPoints.set(m.pointId,m);
  for(const m of latestPoints.values()){
    if(m.lat==null||m.lng==null||(activeFilter!=='ALL'&&m.status!==activeFilter)||!liveLayer)continue;
    const marker=L.circleMarker([m.lat,m.lng],{radius:8,color:colors[m.status],fillColor:colors[m.status],fillOpacity:.85}).addTo(liveLayer);
    marker.bindTooltip(esc(m.pointId));marker.bindPopup(`<b>${esc(m.pointId)}</b><br>ESP32 · ${esc(m.status)}<br>Сигнал: ${m.signal}%<br>Ауытқу: ${m.deviation} п.п.<br>${esc(new Date(m.receivedAt).toLocaleString('kk-KZ',{timeZone:'Asia/Aqtau'}))}`);
  }
}
export function mountLiveConnection(){
  const simulator=document.querySelector('.simulator');const controls=document.createElement('div');controls.className='connection-controls';
  controls.innerHTML=`<div class="data-modes" role="group" aria-label="Дерек режимі"><button id="mode-live" class="selected" aria-pressed="true">ESP32 · Тікелей</button><button id="mode-demo" aria-pressed="false">Демо</button></div><div class="connection-state"><i id="connection-dot"></i><span id="connection-text" role="status">Серверге қосылуда…</span></div><p id="last-received">Құрылғы дерегі әлі келген жоқ.</p>`;
  simulator.before(controls);simulator.parentNode.style.alignItems='start';
  // Keep controls with the device in one column of the existing layout.
  const wrapper=document.createElement('div');controls.before(wrapper);wrapper.append(controls,simulator);
  const screenMode=document.querySelector('.screen-top>span:last-child');
  const historyPanel=document.createElement('div');historyPanel.className='live-history';
  historyPanel.innerHTML=`<div class="history-heading"><h3>ESP32 өлшеулер журналы</h3><button id="export-measurements">CSV жүктеу ↓</button></div><p class="muted">Өлшемдер автоматты сақталады. GPS координаталары бар нүктелер аумақ картасында көрсетіледі.</p><div class="table-scroll"><table><thead><tr><th>Нүкте / қорған</th><th>Сигнал</th><th>Ауытқу</th><th>Күй</th><th>GPS</th><th>Уақыт (Ақтау)</th></tr></thead><tbody id="measurement-history"></tbody></table></div><p id="history-empty">ESP32-ден алғашқы өлшемді күтеміз.</p>`;document.querySelector('#map').append(historyPanel);
  let mode='live',latest=null,streamUp=false,tokenConfigured=false,apiReady=false,stream;
  const originalHandlers={};['calibrate','measure','save'].forEach(id=>{const button=document.getElementById(id);originalHandlers[id]=button.onclick;button.onclick=()=>{if(mode==='demo')originalHandlers[id]();};});
  function displayLive(){
    document.querySelector('#signal').innerHTML=latest?`${latest.signal}<span>%</span>`:'—';document.querySelector('#deviation').innerHTML=latest?`${latest.deviation}<span>%</span>`:'—';
    document.querySelector('#sim-status').textContent=latest?latest.status:'WAITING';document.querySelector('#point-label').textContent=latest?`POINT: ${latest.pointId}`:'POINT: —';document.querySelector('#led').className='led '+(latest?latest.status.toLowerCase():'waiting');
    document.querySelector('#sim-message').textContent=latest?`Базалық мән: ${latest.baseline}% · Өлшем серверде сақталды.`:'Құрылғыда калибровка жасаңыз. Өлшемдер автоматты қабылданады.';
  }
  function connectionStatus(){
    const fresh=latest&&Date.now()-Date.parse(latest.receivedAt)<15000;
    const text=!apiReady?'Бұл бетте ESP32 сервері қолжетімсіз.':!tokenConfigured?'Қосылымды баптау қажет.':!streamUp?'Сервермен байланыс үзілді.':fresh?'ESP32 қосылған · өлшем қабылдануда':latest?'ESP32-ден жаңа дерек келмеді.':'ESP32 дерегін күтеміз.';
    document.querySelector('#connection-text').textContent=text;document.querySelector('#connection-dot').className=fresh&&streamUp?'online':'offline';document.querySelector('.sim-head .status-dot').style.background=mode==='demo'?'#b1926e':fresh&&streamUp?'#98b585':'#67715d';
    document.querySelector('#last-received').textContent=latest?`Соңғы қабылдау: ${new Date(latest.receivedAt).toLocaleString('kk-KZ',{timeZone:'Asia/Aqtau'})}`:'Құрылғы дерегі әлі келген жоқ.';
    if(mode==='live'&&latest&&!fresh)document.querySelector('#sim-message').textContent='Соңғы сақталған өлшем көрсетіліп тұр. Құрылғыдан жаңа дерек келмеді.';
  }
  let demoValues={signal:'74',deviation:'28',status:'ANOMALY',message:'Демо режимі · бұл нақты құрылғы өлшемі емес.',led:'led anomaly'};
  function chooseMode(next){if(document.querySelector('#measure').disabled&&mode==='demo')return;if(mode==='demo'&&next==='live')demoValues={signal:document.querySelector('#signal').textContent.replace('%',''),deviation:document.querySelector('#deviation').textContent.replace('%',''),status:document.querySelector('#sim-status').textContent,message:document.querySelector('#sim-message').textContent,led:document.querySelector('#led').className};mode=next;document.querySelector('#mode-live').classList.toggle('selected',mode==='live');document.querySelector('#mode-demo').classList.toggle('selected',mode==='demo');document.querySelector('#mode-live').setAttribute('aria-pressed',String(mode==='live'));document.querySelector('#mode-demo').setAttribute('aria-pressed',String(mode==='demo'));document.querySelector('.sim-buttons').hidden=mode==='live';screenMode.textContent=mode==='live'?'ESP32 LIVE':'DEMO MODE';if(mode==='live')displayLive();else{document.querySelector('#point-label').textContent='POINT: B-07';document.querySelector('#signal').innerHTML=demoValues.signal+'<span>%</span>';document.querySelector('#deviation').innerHTML=demoValues.deviation+'<span>%</span>';document.querySelector('#sim-status').textContent=demoValues.status;document.querySelector('#led').className=demoValues.led;document.querySelector('#sim-message').textContent=demoValues.message;}connectionStatus();}
  document.querySelector('#mode-live').onclick=()=>chooseMode('live');document.querySelector('#mode-demo').onclick=()=>chooseMode('demo');chooseMode('live');
  function renderHistory(){
    document.querySelector('#history-empty').hidden=liveMeasurements.length>0;document.querySelector('#export-measurements').disabled=liveMeasurements.length===0;
    document.querySelector('#measurement-history').innerHTML=liveMeasurements.slice(-25).reverse().map(m=>`<tr><td><b>${esc(m.pointId)}</b>${m.moundId?`<small>${esc(m.moundId)}</small>`:''}</td><td>${m.signal}%</td><td>${m.deviation} п.п.</td><td style="color:${colors[m.status]}">${esc(m.status)}</td><td>${m.lat==null?'GPS жоқ':`${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}`}</td><td>${esc(new Date(m.receivedAt).toLocaleString('kk-KZ',{timeZone:'Asia/Aqtau'}))}</td></tr>`).join('');renderLiveMap();
  }
  function applySnapshot(data){apiReady=true;tokenConfigured=data.tokenConfigured;liveMeasurements=data.measurements;latest=data.latest;renderHistory();if(mode==='live')displayLive();connectionStatus();}
  document.querySelector('#export-measurements').onclick=()=>{const fields=['pointId','moundId','signal','baseline','deviation','status','lat','lng','receivedAt'];const csv='\uFEFF'+[fields.join(','),...liveMeasurements.map(m=>fields.map(f=>`"${String(m[f]??'').replace(/^[=+@-]/,c=>"'"+c).replace(/"/g,'""')}"`).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='berel-esp32-measurements.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  renderHistory();
  fetch('/api/measurements').then(async response=>{if(!response.ok)throw new Error('API unavailable');return response.json();}).then(data=>{
    applySnapshot(data);stream=new EventSource('/api/events');stream.onopen=()=>{streamUp=true;connectionStatus();};stream.onerror=()=>{streamUp=false;connectionStatus();};
    stream.addEventListener('snapshot',event=>applySnapshot(JSON.parse(event.data)));
    stream.addEventListener('measurement',event=>{const m=JSON.parse(event.data);latest=m;liveMeasurements=[...liveMeasurements,m].slice(-1000);if(mode==='live')displayLive();renderHistory();connectionStatus();});
  }).catch(()=>{apiReady=false;connectionStatus();});
  setInterval(connectionStatus,2000);window.addEventListener('pagehide',()=>stream?.close(),{once:true});
}
