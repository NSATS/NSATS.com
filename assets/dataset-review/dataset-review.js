function datasetEscape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function datasetNumber(n){const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':a>=1e3?(n/1e3).toFixed(1).replace(/\.0$/,'')+'K':Number(n.toFixed(2)).toLocaleString('en-GB');}
function datasetPlot(id,title,points,xLabel,yLabel,kind='scatter',width=720){
 const W=Math.max(280,Math.min(720,width)),small=W<500,H=small?340:360,L=small?52:86,R=small?22:42,T=54,B=62;
 let xmin=Infinity,xmax=-Infinity,ymin=0,ymax=0;
 for(const p of points){xmin=Math.min(xmin,p.x);xmax=Math.max(xmax,p.x2??p.x);ymin=Math.min(ymin,p.low??p.y,p.y);ymax=Math.max(ymax,p.y);}
 if(!points.length)return '<p>No rows in this selection.</p>';
 if(xmax===xmin){xmin-=.5;xmax+=.5;}if(ymax===ymin)ymax=ymin+1;
 const px=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),py=y=>H-B-(y-ymin)/(ymax-ymin)*(H-T-B);
 let s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="'+id+'-title '+id+'-desc"><title id="'+id+'-title">'+datasetEscape(title)+'</title><desc id="'+id+'-desc">'+datasetEscape(xLabel+' against '+yLabel+'. '+points.length+' plotted items. Summary and inspection controls accompany this chart.')+'</desc><rect width="'+W+'" height="'+H+'" fill="white"/><g font-family="Arial,sans-serif" font-size="'+(small?13:18)+'" fill="#26333d">';
 for(let i=0;i<=4;i++){
  const y=ymin+(ymax-ymin)*i/4;
  s+='<path d="M'+L+' '+py(y)+'H'+(W-R)+'" stroke="#dce2e6"/><text text-anchor="end" x="'+(L-12)+'" y="'+(py(y)+6)+'">'+datasetNumber(y)+'</text>';
 }
 const xticks=kind==='category'?points.map(p=>(p.x+p.x2)/2):Array.from({length:small?3:5},(_,i)=>kind==='bar'?xmin+(xmax-xmin)*i/(small?2:4):Math.round(xmin+(xmax-xmin)*i/(small?2:4)));
 for(const x of xticks)s+='<text text-anchor="middle" x="'+px(x)+'" y="'+(H-B+30)+'">'+datasetNumber(x)+'</text>';
 s+='<text x="'+L+'" y="22" font-size="'+(small?12:16)+'">'+datasetEscape(yLabel)+'</text><text x="'+(L+(W-L-R)/2)+'" y="'+(H-10)+'" text-anchor="middle" font-size="'+(small?12:16)+'">'+datasetEscape(xLabel)+'</text></g><g fill="#2457f5" stroke="#2457f5">';
 for(const p of points){const tip='<title>'+datasetEscape(p.label)+'</title>';
  if(kind==='bar'||kind==='category'){const x=px(p.x),w=Math.max(1,px(p.x2)-x-1);s+='<rect x="'+x+'" y="'+py(p.y)+'" width="'+w+'" height="'+Math.max(0,py(0)-py(p.y))+'" stroke="none" fill-opacity=".8">'+tip+'</rect>';}
  else if(kind==='range')s+='<path d="M'+px(p.x)+' '+py(p.low)+'V'+py(p.y)+'" stroke-opacity=".55" stroke-width="1">'+tip+'</path>';
  else s+='<circle cx="'+px(p.x)+'" cy="'+py(p.y)+'" r="2.5" fill-opacity=".55" stroke="none">'+tip+'</circle>';
 }
 return labelQuantumChart(s+'</g></svg>',id);
}
function buildDatasetCharts(d,options={}){
 const out={};const add=(id,title,points,x,y,kind,caption)=>out[id]={svg:datasetPlot(id,title,points,x,y,kind,options.width||720),caption};
 const histogram=(id,title,bins,x,unit)=>add(id,title,bins.map(b=>({x:b[0],x2:b[1],y:b[2],label:b[0].toFixed(2)+' ≤ value < '+b[1].toFixed(2)+': '+b[2].toLocaleString('en-GB')+' '+unit})),x,unit,'bar',bins.reduce((a,b)=>a+b[2],0).toLocaleString('en-GB')+' '+unit+' represented. Each bin includes its lower bound and excludes its upper bound.');
 if(d.kind==='quantum'){
  const metric=options.metric||'compression',labels={compression:'Compression (%)',duration:'Duration (s)',stored:'Stored size (bits)'};
  add('tc-tests','Whole-test values',d.tests.map(t=>({x:t.n,y:t[metric],label:'Test '+t.n+': '+t[metric]+' '+labels[metric]})),'Test number',labels[metric],'scatter',d.tests.length+' tests represented. Each point is one test; no averaging or smoothing.');
  const rr=d.rounds.filter(r=>!options.round||options.round==='all'||String(r[1])===options.round);
  add('tc-rounds','Compression after each round',rr.map(r=>({x:r[0],y:r[2],label:'Test '+r[0]+', round '+r[1]+': '+r[2]+'% cumulative compression'})),'Test number','Cumulative compression (%)','scatter',rr.length.toLocaleString('en-GB')+' rounds represented.');
  histogram('tc-hist','Rotation compression distribution',!options.histRound||options.histRound==='all'?d.histogram:d.histByRound[options.histRound],'Compression (%)','rotations');
 }else{
  const selected=d.runs.filter(r=>!options.sensors||options.sensors==='all'||String(r.sensors)===options.sensors);
  add('geo-runs','Deviation range for each run',selected.map(r=>({x:Number(r.id.slice(-7)),low:r.min,y:r.max,label:r.id+': '+r.min+' to '+r.max+' m; '+r.rows.toLocaleString('en-GB')+' point/sensor rows; '+r.sensors+' sensors'})),'Run number','Horizontal deviation (m)','range',selected.length.toLocaleString('en-GB')+' runs and '+selected.reduce((n,r)=>n+r.rows,0).toLocaleString('en-GB')+' point/sensor rows represented. Each vertical line spans the supplied minimum to maximum.');
  histogram('geo-hist','Point deviation distribution',!options.sensors||options.sensors==='all'?d.histogram:d.histBySensors[options.sensors],'Deviation (m)','point/sensor rows');
  add('geo-registry','Sensor configurations in the register',Object.entries(d.sensorCounts).map(([k,v])=>({x:Number(k)-.35,x2:Number(k)+.35,y:v,label:k+' sensors: '+v.toLocaleString('en-GB')+' run entries'})),'Sensors per run','Run entries','category',d.registerCount.toLocaleString('en-GB')+' register entries represented. This chart is independent of the point-data filter.');
 }
 return out;
}
document.addEventListener('DOMContentLoaded',()=>{
 const node=document.getElementById('dataset-chart-data');if(!node)return;const d=JSON.parse(node.textContent);
 const get=id=>document.getElementById(id)?.value;
 function redraw(){const width=Math.min(...Array.from(document.querySelectorAll('[data-chart]'),el=>el.clientWidth));const charts=buildDatasetCharts(d,{width,metric:get('tc-metric'),round:get('tc-round'),histRound:get('tc-hist-round'),sensors:get('geo-sensors')});for(const [id,c]of Object.entries(charts)){document.querySelector('[data-chart="'+id+'"]').innerHTML=c.svg;document.querySelector('[data-caption="'+id+'"]').textContent=c.caption;}}
 document.querySelectorAll('.chart-control select').forEach(el=>el.addEventListener('change',redraw));redraw();document.querySelector('.dataset-review').classList.add('dataset-enhanced');let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(redraw,120);});
 const input=document.getElementById('inspect-number'),output=document.getElementById('inspect-result');
 function inspect(){if(!input.reportValidity())return;const n=Number(input.value);
  if(d.kind==='quantum'){const t=d.tests.find(t=>t.n===n);output.textContent='Test '+n+': '+t.input.toLocaleString('en-GB')+' original bits; '+t.stored.toLocaleString('en-GB')+' stored bits; '+t.compression+'% compression; '+t.duration+' s; '+t.rounds+' rounds; '+t.rotations.toLocaleString('en-GB')+' rotations.';}
  else{const r=d.runs[n-1];output.textContent=r.id+': '+r.sensors+' sensors; '+r.rows.toLocaleString('en-GB')+' point/sensor rows; minimum '+r.min.toFixed(3)+' m; maximum '+r.max.toFixed(3)+' m. Start-point zeros included.';}
 }
 document.querySelector('[data-inspect]').addEventListener('click',inspect);input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inspect();}});inspect();
});

function labelQuantumChart(svg,id){
 if(!['tc-tests','tc-rounds','tc-hist'].includes(id))return svg;
 const match=svg.match(/viewBox="0 0 ([0-9.]+) ([0-9.]+)"/);if(!match)return svg;
 const width=Number(match[1]),height=Number(match[2]),small=width<500,left=small?52:86,extra=small?52:38;
 const label='Generated demonstration data — not measurements';
 let out=svg.replace(match[0],'viewBox="0 0 '+width+' '+(height+extra)+'"');
 out=out.replace(/(<title[^>]*>)([\s\S]*?)(<\/title>)/,(all,a,b,c)=>a+b+' — '+label+c);
 out=out.replace(/(<desc[^>]*>)([\s\S]*?)(<\/desc>)/,(all,a,b,c)=>a+label+'. '+b+c);
 const text=small?'<text x="'+left+'" y="'+(height+20)+'">Generated demonstration data</text><text x="'+left+'" y="'+(height+39)+'">— not measurements</text>':'<text x="'+left+'" y="'+(height+24)+'">'+label+'</text>';
 return out.replace('</svg>','<g data-quantum-generated-label="true"><rect x="0" y="'+height+'" width="'+width+'" height="'+extra+'" fill="white"/><g font-family="Arial,sans-serif" font-size="'+(small?13:14)+'" fill="#26333d">'+text+'</g></g></svg>');
}
