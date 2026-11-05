/* Heat pump calculator. The form is in the page (kalkulatori.html, en/kalkulatori.html); this file does the sums, updates
   the result as you type and lists models from our own product pages. Nothing is sent anywhere.
   Sources: heat loss per m², tank sizes and the insulation questions from HVAC Education Hub's heat pump cheat sheet; interpolation,
   +15% for radiators, 45 L per person and product matching from the calculator at kalkulator-dizalice-topline.com (Marin Bašić);
   design temperatures from ASHRAE Climatic Design Conditions 2025. Fujitsu first and the buffer tank sizes are the client's rules. */
(function(){
'use strict';
var form=document.getElementById('calcForm'),out=document.getElementById('calcOut'),live=document.getElementById('calcLive');
if(!form||!out)return;
var EN=document.documentElement.lang==='en',LI=EN?1:0,ROOT=EN?'../':'';
function L(p){return p[LI]}
function $id(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
/* numbers: up to two decimals, a comma on Albanian pages, a true minus sign */
function num(v){var s=String(Math.round(v*100)/100);return EN?s:s.replace('.',',')}
function deg(v){return (v<0?'−':'')+num(Math.abs(v))}

/* ---------- data ---------- */
/* specific heat loss in W/m² at these outdoor design temperatures, by insulation level */
var TEMPS=[-15,-10,-5,0];
var LOSS={none:[120,102,84,66],poor:[95,81,67,53],mid:[55,47,39,31],good:[40,34,28,22],passive:[22,19,16,13]};
var INS_NAME={none:["Pa izolim","No insulation"],poor:["Izolim i dobët","Poor insulation"],mid:["Izolim mesatar","Medium insulation"],good:["Izolim i mirë","Good insulation"],passive:["Shtëpi pasive","Passive house"]};

/* Every size from the technical tables on our product pages. Each size: [heating kW with 35°C water and 7°C outside,
   heating kW at -7°C outside where published, cooling kW with 18°C water where published, SCOP with 35°C water, SCOP with 55°C water].
   Fujitsu pages give ηs, so SCOP = (ηs + 3) × 2.5 / 100; this reproduces Haier's published pairs (5.10 and 201%).
   The 3-phase versions of Split High Power have the same figures as the 1-phase ones and are the same page, so they are one entry.
   Monobloc Comfort shares its outdoor units across the three pages; the -7°C figures are published on the control box page. */
function fam(id,name,img,kind,tMin,tank,conf,sizes){return sizes.map(function(s){return {id:id,name:name,img:img,kind:kind,tMin:tMin,tank:tank,conf:conf,h:s[0],h7:s[1],c:s[2],scop:[s[3],s[4]]}})}
var MONO_WALL=[[5,5.1,5.35,4.8,3.4],[8,8.18,7.69,4.95,3.55],[10,9.53,9.3,4.95,3.6]],
    SPLIT_HP=[[10.08,7.7,0,4.65,3.35],[12.55,9.2,0,4.65,3.45],[14.47,10.7,0,4.7,3.5]],
    SPLIT_C=[[4.5,4.4,0,4.45,3.2],[5.5,5,0,4.45,3.2],[7.5,5.7,0,4.5,3.28],[9.5,8.9,0,4.53,3.33]];
var PUMPS=[].concat(
  fam('fujitsu-monobloc-comfort-control-box',["Fujitsu Monobloc Comfort, kuti kontrolli","Fujitsu Monobloc Comfort, control box"],'atw/mono-controlbox.jpg','Monobloc',-20,0,1,[[5,5.1,5.45,5.08,3.65],[8,8.18,7.79,5.2,3.68],[10,9.53,9.4,5.23,3.73]]),
  fam('fujitsu-monobloc-comfort-wall-unit',["Fujitsu Monobloc Comfort, njësi në mur","Fujitsu Monobloc Comfort, wall unit"],'atw/mono-wall.jpg','Monobloc',-20,0,1,MONO_WALL),
  /* the tank volume of this indoor unit (WGEP100KR3-19) is not published on our page or Fujitsu's: 190 L is assumed only to decide
     when to offer it, as with the other "-19" units, and no litre figure is shown for it (conf = 0) */
  fam('fujitsu-monobloc-comfort-with-tank',["Fujitsu Monobloc Comfort me bojler","Fujitsu Monobloc Comfort with tank"],'atw/mono-dhw.jpg','Monobloc',-20,190,0,MONO_WALL),
  fam('haier-monobloc-r290',["Haier Monobloc R290","Haier Monobloc R290"],'haier/monobloc-r290.jpg','Monobloc',-25,0,1,[[4,0,4,5.1,3.85],[6,0,6,5.1,3.83],[8,0,7.5,5.2,3.85],[10,0,9.5,5.1,3.83],[12,0,11.5,4.82,3.85],[14,0,13.5,4.8,3.83],[16,0,15.5,4.8,3.85]]),
  fam('fujitsu-split-comfort-r32',["Fujitsu Split Comfort R32","Fujitsu Split Comfort R32"],'atw/split-comfort.jpg','Split',-20,0,1,SPLIT_C),
  fam('fujitsu-split-comfort-r32-with-tank',["Fujitsu Split Comfort R32 me bojler","Fujitsu Split Comfort R32 with tank"],'atw/split-comfort-dhw.jpg','Split',-20,190,1,SPLIT_C),
  fam('fujitsu-split-high-power-r32',["Fujitsu Split High Power R32","Fujitsu Split High Power R32"],'atw/split-hp.jpg','Split',-25,0,1,SPLIT_HP),
  fam('fujitsu-split-high-power-r32-with-tank',["Fujitsu Split High Power R32 me bojler","Fujitsu Split High Power R32 with tank"],'atw/split-hp-dhw.jpg','Split',-25,190,1,SPLIT_HP),
  fam('haier-commercial-heat-pump-r290',["Haier Pompë termike komerciale R290","Haier Commercial heat pump R290"],'haier/commercial-r290.jpg','Monobloc',-28,0,1,[[26,0,26,4.91,3.83],[30,0,30,4.73,3.68],[35,0,35,4.55,3.57],[40,0,39,4.46,3.56]])
);
/* the domestic hot water tanks on our pages that take a heat pump's coil */
var TANKS=[{id:'tiki-space-200-s2',n:'Tiki Space 200-S2.0',l:180},{id:'tiki-space-300-s4',n:'Tiki Space 300-S4.0',l:249}];
/* buffer tanks; the litres are the real volumes on their pages */
var BUFFERS=[{id:'tiki-buffer-50',n:'Tiki Buffer 50',l:50.9},{id:'tiki-buffer-100',n:'Tiki Buffer 100',l:102},{id:'tiki-buffer-200',n:'Tiki Buffer 200',l:200},{id:'tiki-buffer-300',n:'Tiki Buffer 300',l:285}];
/* the client's rule, by the pump's capacity: 5-8 kW 50 L, 8-10 kW 100 L, over 10 kW 200 L, over 15 kW 200 L or 300 L above 350 m²;
   two pumps together always 300 L. Above 32 kW none at all: at that size it is a technical matter for the project. No rule below 5 kW.
   Fujitsu's 10 kW High Power is rated 10.08 kW, so it still counts as 10 kW. */
function bufferFor(cap,n,area){
  if(cap>32||cap<5)return null;
  if(n===2)return BUFFERS[3];
  if(cap<=8)return BUFFERS[0];
  if(cap<=10.1)return BUFFERS[1];
  return cap>15&&area>350?BUFFERS[3]:BUFFERS[2];
}

/* ---------- texts ---------- */
var T={
  res:["Rezultati","Result"],
  base:["Humbja bazë e nxehtësisë","Base heat loss"],
  need:["Fuqia e nevojshme","Required power"],
  vol:["Vëllimi i bojlerit","Tank volume"],
  how:function(w,t,a,b){return EN?w+' W/m² at '+t+'°C × '+a+' m²'+' = '+b+' kW.':w+' W/m² në '+t+'°C × '+a+' m²'+' = '+b+' kW.'},
  howRad:[" Radiatorë: +15%."," Radiators: +15%."],
  list:function(n){return EN?'Recommended heat pumps ('+n+')':'Pompat termike që ju rekomandojmë ('+n+')'},
  best:["Rekomandimi ynë","Our recommendation"],
  heat:["Ngrohje","Heating"],cool:["Ftohje","Cooling"],
  why:["Pse e rekomandojmë:","Why we recommend it:"],
  whyHeat:function(h,n){return EN?'Heating capacity ('+h+' kW) covers the need ('+n+' kW)':'Fuqia e ngrohjes ('+h+' kW) e mbulon nevojën ('+n+' kW)'},
  whyPair:function(h,c,n){return EN?'Two '+h+' kW heat pumps give '+c+' kW and cover the need ('+n+' kW)':'Dy pompa nga '+h+' kW japin '+c+' kW dhe e mbulojnë nevojën ('+n+' kW)'},
  whyIntPair:function(l){return EN?'A built-in '+l+' L tank in each heat pump':'Bojler i integruar '+l+' L te secila pompë'},
  pair:["Për këtë fuqi mund të përdoren edhe dy pompa termike bashkë.","For this power, two heat pumps can also work together."],
  whyScop:[function(s){return EN?'SCOP '+s+' for underfloor heating (35°C water)':'SCOP '+s+' për ngrohje në dysheme (ujë 35°C)'},function(s){return EN?'SCOP '+s+' with radiators (55°C water)':'SCOP '+s+' me radiatorë (ujë 55°C)'}],
  whyInt:function(l,p){return EN?'Built-in '+l+' L tank, enough for about '+p+' people':'Bojler i integruar '+l+' L, mjafton për rreth '+p+' persona'},
  whyIntNo:["Bojler i integruar; vëllimin e konfirmojmë në ofertë","Built-in tank; we confirm its volume in the quote"],
  whyExt:function(l,p){return EN?'External '+l+' L tank, enough for about '+p+' people':'Bojler i jashtëm '+l+' L, mjafton për rreth '+p+' persona'},
  plus:function(n,l){return EN?'+ '+n+', '+l+' L domestic hot water tank':'+ '+n+', bojler '+l+' L'},
  plusBuf:function(n,l){return EN?'+ '+n+', '+l+' L buffer tank':'+ '+n+', akumulues '+l+' L'},
  low:function(k,n,two){return EN?'At −7°C outside '+(two?'they give ':'it gives ')+k+' kW, less than the '+n+' kW you need. '+(two?'They':'It')+' may need a backup heater; we check this in the quote.':'Në −7°C jashtë '+(two?'japin ':'jep ')+k+' kW, më pak se '+n+' kW që ju duhen. Mund të kërkojë ngrohës shtesë; e kontrollojmë në ofertë.'},
  over:["Shumë më i madh se nevoja: mund të ndizet e fiket shpesh. Flisni me ne para se ta zgjidhni.","Much larger than the need: it may switch on and off often. Talk to us before choosing it."],
  view:["Shiko produktin","View product"],
  quote:["Kërko ofertë","Request a quote"],
  ask:function(a,n){return EN?'a heat pump of about '+n+' kW for '+a+' m²':'pompë termike rreth '+n+' kW për '+a+' m²'},
  askPump:function(name,h,extras,n){return name+', '+h+' kW'+extras+(EN?' (calculated need: '+n+' kW)':' (nevoja e llogaritur: '+n+' kW)')},
  askAll:["Kërko ofertë për këtë llogaritje","Request a quote for this calculation"],
  bigExt:function(max,v){return EN?'You need about '+v+' L and our largest tank is '+max+' L, so we propose that one. For more, write to us.':'Ju duhen rreth '+v+' L, ndërsa bojleri ynë më i madh është '+max+' L, prandaj po e propozojmë atë. Për më shumë, na shkruani.'},
  bigInt:function(v){return EN?'You need about '+v+' L and our largest built-in tanks have about 190 L, so we propose those. An external tank goes up to 249 L.':'Ju duhen rreth '+v+' L, ndërsa bojlerët tanë të integruar më të mëdhenj kanë rreth 190 L, prandaj po i propozojmë ata. Bojleri i jashtëm shkon deri 249 L.'},
  fan:function(){var h='<a class="text-link" href="fan-coil.html">'+(EN?'our fan coils from Aertesi':'fan coil-et tonë nga Aertesi')+'</a>';return (EN?'See ':'Shihni ')+h+'.'},
  noTemp:["Asnjë model nuk punon deri në këtë temperaturë. Na shkruani dhe e shohim bashkë.","No model works down to this temperature. Write to us and we look at it together."],
  tooBig:function(m){var h='<a class="text-link" href="chillers.html">'+(EN?'the chillers':'chillerët')+'</a>';return EN?'This is more than the models that match your choices can give (up to '+m+' kW). Write to us, or see '+h+'.':'Kjo fuqi kalon modelet që përputhen me zgjedhjet tuaja (deri '+m+' kW). Na shkruani, ose shihni '+h+'.'},
  tooSmall:function(m){var h='<a class="text-link" href="kondicionere-split.html">'+(EN?'split air conditioners':'kondicionerët split')+'</a>';return EN?'This is less than half of our smallest matching model ('+m+' kW), which would be too large. Write to us, or see '+h+'.':'Kjo fuqi është më pak se gjysma e modelit tonë më të vogël që përputhet ('+m+' kW), i cili do të ishte shumë i madh. Na shkruani, ose shihni '+h+'.'},
  noneFit:["Asnjë model nuk përputhet me këto zgjedhje. Provoni t'i ndryshoni, ose na shkruani.","No model matches these choices. Try changing them, or write to us."],
  bad:["Plotësoni fushat e shënuara me të kuqe për të parë rezultatin.","Fill in the fields marked in red to see the result."],
  disc:["Është vlerësim për një shtëpi mesatare. Forma e shtëpisë, cilësia e ndërtimit, dritaret dhe orientimi mund ta ndryshojnë shumë rezultatin; masën e saktë e jep llogaritja e humbjeve dhomë për dhomë sipas EN 12831-1. Fuqitë e modeleve janë me ujë 35°C dhe 7°C jashtë, si në tabelat e produkteve: në të ftohtë japin më pak, prandaj i kontrollojmë në ofertë. SCOP-i i modeleve Fujitsu është llogaritur nga ηs në tabelat e produkteve.","This is an estimate for an average house. The shape of the house, the build quality, the windows and the orientation can change the result a lot; the exact size comes from a room-by-room heat loss calculation to EN 12831-1. Model capacities are with 35°C water and 7°C outside, as in the product tables: they give less in the cold, so we check them in the quote. SCOP for the Fujitsu models is worked out from ηs in the product tables."],
  src:['Vlerat orientuese për m²: <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.','Guide values per m²: <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.'],
  livNeed:function(n,c){return EN?'Required power '+n+' kW. '+c+' models.':'Fuqia e nevojshme '+n+' kW. '+c+' modele.'},
  assess:function(n){return EN?'From your answers: '+n+'.':'Sipas përgjigjeve: '+n+'.'},
  winWarn:["Dritaret janë më të dobëta se muret, prandaj humbjet mund të jenë më të larta. Mund të zgjidhni një nivel izolimi më të ulët.","The windows are weaker than the walls, so the losses may be higher. You can choose one insulation level lower."],
  copied:["Linku u kopjua!","Link copied!"]
};

/* ---------- the sums ---------- */
/* linear between the table's temperatures; below -15°C the first slope continues; from 0°C up the 0°C value holds */
function lossAt(row,t){
  if(t<TEMPS[0])return row[0]+(row[1]-row[0])/(TEMPS[1]-TEMPS[0])*(t-TEMPS[0]);
  if(t>=TEMPS[3])return row[3];
  for(var i=0;i<3;i++)if(t>=TEMPS[i]&&t<=TEMPS[i+1])return row[i]+(t-TEMPS[i])/(TEMPS[i+1]-TEMPS[i])*(row[i+1]-row[i]);
  return row[0];
}
/* 45 L per person, held inside the guide's range for that household size */
function tankLitres(n){
  var r=n<=2?[120,150]:n<=4?[150,200]:n<=6?[200,300]:[300,Infinity];
  return Math.min(r[1],Math.max(r[0],n*45));
}
function compute(a){
  var w=lossAt(LOSS[a.ins],a.t),
      base=w*a.area/1000,
      need=base*(a.emit==='rad'?1.15:1);
  return {w:w,base:Math.round(base*100)/100,need:Math.round(need*100)/100,vol:a.tank==='none'?0:tankLitres(a.n)};
}
function isFujitsu(it){return it.p.id.indexOf('fujitsu')===0}
function isCommercial(p){return p.id==='haier-commercial-heat-pump-r290'}
function maxHeat(list){return Math.max.apply(null,list.map(function(p){return p.h}).concat(0))}
/* same match as the reference calculator: enough capacity, less than double, closest first, then the higher SCOP.
   Added: a model whose published -7°C output falls short of the need (when the design temperature is that cold) goes after those that cover it.
   The client's rules: Fujitsu first, except that above 20 kW a Haier commercial model that suits the need (not 1.5 times it) goes before it.
   Places stay for the other Haier models when they fit, so Fujitsu does not hide them.
   Each group (Fujitsu, Haier home, Haier commercial) offers two of the same model together once its own largest model is too small, so
   15 kW shows both 2 × Fujitsu and Haier 16 kW. A need above our largest tank still gets that tank (the page says so). */
function pick(a,R){
  var k=a.emit==='rad'?1:0,need=R.need;
  var pool=PUMPS.filter(function(p){return a.t>=p.tMin&&(a.tank==='int'?p.tank>0:p.tank===0)&&(a.cool!=='yes'||p.c>0)});
  function isFj(p){return p.id.indexOf('fujitsu')===0}
  function sameGroup(p){return function(q){return isCommercial(p)?isCommercial(q):isFj(p)?isFj(q):!isFj(q)&&!isCommercial(q)}}
  var list=[];
  function add(p,n){
    var cap=p.h*n;
    if(cap>=need&&cap<need*2)list.push({p:p,n:n,cap:cap,low:(a.t<=-7&&p.h7&&p.h7*n<need)?p.h7*n:0});
  }
  pool.forEach(function(p){
    add(p,1);
    if(need>maxHeat(pool.filter(sameGroup(p))))add(p,2);
  });
  list.sort(function(x,y){
    if(!!x.low!==!!y.low)return x.low?1:-1;
    var dx=Math.abs(x.cap-need),dy=Math.abs(y.cap-need);
    if(Math.abs(dx-dy)>1e-9)return dx-dy;
    return y.p.scop[k]-x.p.scop[k];
  });
  function suits(it){return it.n===1&&it.cap<need*1.5}
  var first=need>20?list.filter(function(it){return isCommercial(it.p)&&suits(it)}).slice(0,2):[];
  var left=list.filter(function(it){return first.indexOf(it)<0});
  var fj=left.filter(isFujitsu),home=left.filter(function(it){return !isFujitsu(it)&&!isCommercial(it.p)}),com=left.filter(function(it){return isCommercial(it.p)});
  /* places kept after Fujitsu: one for Haier home, and one for a commercial model that suits the need if none leads the list */
  var keepCom=!first.length&&com.some(suits)?1:0,room=5-first.length,fjTake=fj.slice(0,room-keepCom-(home.length?1:0));
  var tank=null;
  if(a.tank==='ext'){tank=TANKS[TANKS.length-1];for(var i=0;i<TANKS.length;i++)if(TANKS[i].l>=R.vol){tank=TANKS[i];break}}
  return {list:first.concat(fjTake,home.slice(0,room-fjTake.length-keepCom),com).slice(0,5),pool:pool,tank:tank};
}
function emptyText(a,R,P){
  if(!P.pool.length)return L(T.noTemp);
  var max=maxHeat(P.pool),min=Math.min.apply(null,P.pool.map(function(p){return p.h}));
  if(R.need>max*2)return T.tooBig(num(max*2));
  if(R.need*2<=min)return T.tooSmall(num(min));
  return L(T.noneFit);
}

/* ---------- reading the form ---------- */
function radio(n){var c=form.querySelector('input[name="'+n+'"]:checked');return c?c.value:''}
function read(){
  return {area:parseFloat($id('c-area').value),ins:$id('c-ins').value,t:parseFloat($id('c-temp').value),emit:radio('emit'),cool:radio('emit')==='rad'?'no':radio('cool'),tank:$id('c-tank').value,n:parseInt($id('c-people').value,10)};
}
function inRange(v,lo,hi){return typeof v==='number'&&!isNaN(v)&&v>=lo&&v<=hi}
function mark(id,ok){var i=$id('c-'+id),e=$id('e-'+id);if(ok)i.removeAttribute('aria-invalid');else i.setAttribute('aria-invalid','true');e.hidden=ok;return ok}
function validate(a){
  var ok=mark('area',inRange(a.area,20,Infinity));
  ok=mark('temp',inRange(a.t,-30,0))&&ok;
  ok=mark('people',a.tank==='none'||inRange(a.n,1,10))&&ok;
  return ok;
}

/* ---------- the result ---------- */
function prodHtml(it,i,a,R,P){
  var p=it.p,two=it.n===2,k=a.emit==='rad'?1:0,need=num(R.need),h=num(p.h),cap=num(it.cap),name=(two?'2 × ':'')+L(p.name),page=p.id+'.html',t=P.tank,b=bufferFor(it.cap,it.n,a.area),
      why=[two?T.whyPair(h,cap,need):T.whyHeat(h,need),T.whyScop[k](num(p.scop[k]))];
  if(a.tank==='int')why.push(!p.conf?L(T.whyIntNo):two?T.whyIntPair(p.tank):T.whyInt(p.tank,Math.round(p.tank/45)));
  if(t)why.push(T.whyExt(t.l,Math.round(t.l/45)));
  var title=T.askPump(name,h,(t?' + '+t.n:'')+(b?' + '+b.n:''),need),specs='<div><dt>'+L(T.heat)+'</dt><dd>'+cap+' kW</dd></div>';
  if(p.c)specs+='<div><dt>'+L(T.cool)+'</dt><dd>'+num(p.c*it.n)+' kW</dd></div>';
  specs+='<div><dt>SCOP</dt><dd>'+num(p.scop[k])+'</dd></div>';
  return '<li class="rp"><a class="rp-img" href="'+page+'" tabindex="-1" aria-hidden="true"><img src="'+ROOT+'assets/products/'+p.img+'" width="840" height="560" loading="lazy" alt=""></a><div class="rp-body">'+
    '<p class="rp-top"><span class="pkick">'+p.kind+'</span>'+(i===0&&!it.low&&it.cap<R.need*1.5?'<span class="rp-best">'+L(T.best)+'</span>':'')+'</p>'+
    '<h4 class="rp-name"><a href="'+page+'">'+esc(name)+', '+h+' kW</a></h4>'+
    (t?'<p class="rp-tank"><a href="'+t.id+'.html">'+esc(T.plus(t.n,t.l))+'</a></p>':'')+
    (b?'<p class="rp-tank"><a href="'+b.id+'.html">'+esc(T.plusBuf(b.n,num(b.l)))+'</a></p>':'')+
    '<dl class="pspecs">'+specs+'</dl>'+
    '<p class="rp-whyh">'+L(T.why)+'</p><ul class="rp-why"><li>'+why.map(esc).join('</li><li>')+'</li></ul>'+
    (it.low?'<p class="rp-warn">'+esc(T.low(num(it.low),need,two))+'</p>':'')+
    (it.cap>=R.need*1.5?'<p class="rp-warn">'+esc(L(T.over))+'</p>':'')+
    '<div class="rp-cta"><a class="btn btn-ghost btn-sm" href="#kontakt" data-product="'+esc(title)+'" data-need="pompe">'+L(T.quote)+' <span class="arr" aria-hidden="true">→</span></a><a class="text-link" href="'+page+'">'+L(T.view)+'</a></div>'+
    '</div></li>';
}
/* the suggested temperature that matches the field shows as chosen */
var zones=[].slice.call(form.querySelectorAll('.zone-t'));
function syncZones(t){zones.forEach(function(b){b.setAttribute('aria-pressed',String(parseFloat(b.getAttribute('data-t'))===t))})}
zones.forEach(function(b){b.addEventListener('click',function(){
  var i=$id('c-temp');i.value=b.getAttribute('data-t');i.dispatchEvent(new Event('input',{bubbles:true}));
})});
var lastHtml='';
function render(){
  var a=read();
  $id('tankMore').hidden=a.tank==='none';
  /* radiators cannot cool, so with them the cooling question goes away */
  $id('coolQ').hidden=a.emit==='rad';
  syncZones(a.t);
  var html,msg;
  if(!validate(a)){html='<p class="res-alert">'+L(T.bad)+'</p>';msg=L(T.bad)}
  else{
    var R=compute(a),P=pick(a,R),how=T.how(num(Math.round(R.w*10)/10),deg(a.t),num(a.area),num(R.base));
    if(a.emit==='rad')how+=L(T.howRad);
    html='<h2 class="res-title">'+L(T.res)+'</h2><div class="res-nums">'+
      '<div class="res-num"><p class="res-nl">'+L(T.base)+'</p><p class="res-kw">'+num(R.base)+'<small>kW</small></p></div>'+
      '<div class="res-num"><p class="res-nl">'+L(T.need)+'</p><p class="res-kw">'+num(R.need)+'<small>kW</small></p></div>'+
      (R.vol?'<div class="res-num"><p class="res-nl">'+L(T.vol)+'</p><p class="res-kw">'+R.vol+'<small>L</small></p></div>':'')+
      '</div><p class="res-how">'+esc(how)+'</p>';
    var notes='';
    if(a.tank==='ext'&&R.vol>P.tank.l)notes+='<p class="res-alert">'+esc(T.bigExt(P.tank.l,R.vol))+'</p>';
    var twoInList=P.list.some(function(it){return it.n===2});
    if(a.tank==='int'&&R.vol>(twoInList?380:190))notes+='<p class="res-alert">'+esc(T.bigInt(R.vol))+'</p>';
    if(twoInList)notes+='<p class="res-alert">'+esc(L(T.pair))+'</p>';
    if(a.cool==='yes')notes+='<p class="res-alert">'+T.fan()+'</p>';
    html+=notes+'<h3 class="res-lt">'+T.list(P.list.length)+'</h3>';
    if(P.list.length){
      html+='<ul class="rp-list">'+P.list.map(function(it,i){return prodHtml(it,i,a,R,P)}).join('')+'</ul>';
    }else html+='<p class="res-alert">'+emptyText(a,R,P)+'</p>';
    html+='<a class="btn btn-primary res-ask" href="#kontakt" data-product="'+esc(T.ask(num(a.area),num(R.need)))+'" data-need="pompe">'+L(T.askAll)+' <span class="arr" aria-hidden="true">→</span></a>'+
      '<p class="res-disc">'+esc(L(T.disc))+' '+L(T.src)+'</p>';
    msg=T.livNeed(num(R.need),P.list.length);
  }
  if(html!==lastHtml){out.innerHTML=html;lastHtml=html}
  if(live&&live.textContent!==msg)live.textContent=msg;
}
var raf=0;
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;render()})}

/* ---------- not sure about the insulation: year, facade, windows ---------- */
var LEVELS=['none','poor','mid','good','passive'];
function assess(){
  var y=$id('c-year').value,f=$id('c-facade').value,w=$id('c-win').value,o=$id('insOut');
  var lv=f&&f!=='no'?f:y;
  if(!lv){o.hidden=true;return}
  $id('c-ins').value=lv;
  $id('c-ins').dispatchEvent(new Event('change',{bubbles:true}));
  var txt=T.assess(L(INS_NAME[lv]));
  if(w!==''&&parseInt(w,10)<LEVELS.indexOf(lv))txt+=' '+L(T.winWarn);
  o.textContent=txt;o.hidden=false;
}

/* ---------- share: the answers sit after # in the address ---------- */
function shareUrl(){
  var a=read(),p={a:$id('c-area').value,i:a.ins,t:$id('c-temp').value,e:a.emit,c:a.cool,w:a.tank,n:$id('c-people').value};
  return location.href.split('#')[0]+'#'+Object.keys(p).map(function(k){return k+'='+encodeURIComponent(p[k])}).join('&');
}
function setRadio(n,v){var c=form.querySelector('input[name="'+n+'"][value="'+String(v).replace(/[^\w-]/g,'')+'"]');if(c)c.checked=true}
function setSelect(id,v){var s=$id(id);for(var i=0;i<s.options.length;i++)if(s.options[i].value===v){s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));return}}
function fromHash(){
  var h=location.hash.slice(1);
  if(h.indexOf('a=')!==0)return;
  var p={};h.split('&').forEach(function(x){var i=x.indexOf('=');if(i>0)p[x.slice(0,i)]=decodeURIComponent(x.slice(i+1))});
  if(p.a!=null)$id('c-area').value=p.a;
  if(p.t!=null)$id('c-temp').value=p.t;
  if(p.n!=null)$id('c-people').value=p.n;
  if(p.i)setSelect('c-ins',p.i);
  if(p.w)setSelect('c-tank',p.w);
  if(p.e)setRadio('emit',p.e);
  if(p.c)setRadio('cool',p.c);
  schedule();
}
var share=$id('calcShare'),shareLbl=share.querySelector('.cs-t'),shareIdle=shareLbl.textContent,shareTimer=0;
share.addEventListener('click',function(){
  var url=shareUrl(),box=$id('calcShareUrl');
  function done(){shareLbl.textContent=L(T.copied);clearTimeout(shareTimer);shareTimer=setTimeout(function(){shareLbl.textContent=shareIdle},2000)}
  function fallback(){box.value=url;box.hidden=false;box.focus();box.select()}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,fallback);else fallback();
});

form.addEventListener('submit',function(e){e.preventDefault()});
form.addEventListener('input',schedule);
form.addEventListener('change',schedule);
['c-year','c-facade','c-win'].forEach(function(id){$id(id).addEventListener('change',assess)});
addEventListener('hashchange',fromHash);
fromHash();
render();
})();
