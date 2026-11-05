/* Heat pump calculator. The form is in the page (kalkulatori.html, en/kalkulatori.html); this file does the sums, updates
   the result as you type and lists models from our own product pages. Nothing is sent anywhere.
   Sources: heat loss per m², tank sizes and the insulation questions from HVAC Education Hub's heat pump cheat sheet; interpolation,
   +15% for radiators, 45 L per person and product matching from the calculator at kalkulator-dizalice-topline.com (Marin Bašić);
   design temperatures from ASHRAE Climatic Design Conditions 2025. Fujitsu first and the buffer tank sizes are the client's rules. */
(function(){
'use strict';
var form=document.getElementById('calcForm'),out=document.getElementById('calcOut'),live=document.getElementById('calcLive'),pdfBtn=document.getElementById('calcPdf');
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
  pickHelp:["Zgjidhni njërin nga modelet: klikoni mbi të dhe ai shënohet. Kështu në kërkesën tuaj shohim për cilin produkt e doni ofertën.","Choose one of the models: click it and it is marked. That way your request shows us which product you want a quote for."],
  pick:["Zgjidhe këtë model","Choose this model"],
  picked:["Zgjedhur","Chosen"],
  pdfTitle:["Kërkesë për ofertë","Quote request"],
  pdfSend:["Dërgojeni këtë PDF në WhatsApp te +383 48 77 22 88.","Send this PDF on WhatsApp to +383 48 77 22 88."],
  pdfClient:["Të dhënat e klientit","Client details"],
  pdfObj:["Të dhënat e objektit","Building details"],
  pdfChosen:["Produkti i zgjedhur","Chosen product"],
  pdfNoPick:["Klienti nuk ka zgjedhur model.","The client has not chosen a model."],
  mailNoPick:["Nuk kam zgjedhur model.","I have not chosen a model."],
  mailNeed:["Për ta dërguar me email, shkruani emailin tuaj të saktë.","To send by email, enter your correct email address."],
  mailBad:["Shkruani një email të saktë, ose lëreni bosh.","Enter a valid email, or leave it empty."],
  pdfNeed:function(n){return EN?'Required power from the calculator: '+n+' kW':'Fuqia e nevojshme sipas kalkulatorit: '+n+' kW'},
  pdfNote:[["Ky kalkulator ofron një vlerësim të përafërt dhe orientues të kapacitetit të nevojshëm, bazuar në të dhënat klimatike të përdorura, informacionin që keni deklaruar dhe supozimet e metodës së llogaritjes. Rezultati dhe modelet e sugjeruara shërbejnë për përzgjedhje paraprake dhe nuk zëvendësojnë llogaritjen e detajuar të humbjeve termike apo projektin e sistemit. Përzgjedhja përfundimtare duhet të verifikohet nga një profesionist, duke marrë parasysh kushtet reale të objektit, sistemin e ngrohjes dhe performancën e pajisjes në kushtet përkatëse të punës.","Për verifikimin e përzgjedhjes, na kontaktoni ose na vizitoni në showroom."],["This calculator gives an approximate, indicative estimate of the required capacity, based on the climate data used, the information you have provided and the assumptions of the calculation method. The result and the suggested models are for preliminary selection and do not replace a detailed heat loss calculation or a system design. The final selection must be verified by a professional, taking into account the real conditions of the building, the heating system and the performance of the equipment under the relevant operating conditions.","To verify your selection, contact us or visit us at our showroom."]],
  pdfDate:["Data","Date"],
  pdfFile:["comfort-clima-kerkese-per-oferte","comfort-clima-quote-request"],
  pdfAddr:["Rruga Ukë Mavriqi, 23, Shkabaj, Prishtinë 10000, Republika e Kosovës","Rruga Ukë Mavriqi 23, Shkabaj, Prishtina 10000, Republic of Kosovo"]
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
  var specs='<div><dt>'+L(T.heat)+'</dt><dd>'+cap+' kW</dd></div>';
  if(p.c)specs+='<div><dt>'+L(T.cool)+'</dt><dd>'+num(p.c*it.n)+' kW</dd></div>';
  specs+='<div><dt>SCOP</dt><dd>'+num(p.scop[k])+'</dd></div>';
  return '<li class="rp" data-key="'+esc(keyOf(it))+'"><a class="rp-img" href="'+page+'" tabindex="-1" aria-hidden="true"><img src="'+ROOT+'assets/products/'+p.img+'" width="840" height="560" loading="lazy" alt=""></a><div class="rp-body">'+
    '<p class="rp-top"><span class="pkick">'+p.kind+'</span>'+(i===0&&!it.low&&it.cap<R.need*1.5?'<span class="rp-best">'+L(T.best)+'</span>':'')+'<button class="rp-pick" type="button" aria-pressed="false">'+L(T.pick)+'</button></p>'+
    '<h4 class="rp-name"><a href="'+page+'">'+esc(name)+', '+h+' kW</a></h4>'+
    (t?'<p class="rp-tank"><a href="'+t.id+'.html">'+esc(T.plus(t.n,t.l))+'</a></p>':'')+
    (b?'<p class="rp-tank"><a href="'+b.id+'.html">'+esc(T.plusBuf(b.n,num(b.l)))+'</a></p>':'')+
    '<dl class="pspecs">'+specs+'</dl>'+
    '<p class="rp-whyh">'+L(T.why)+'</p><ul class="rp-why"><li>'+why.map(esc).join('</li><li>')+'</li></ul>'+
    (it.low?'<p class="rp-warn">'+esc(T.low(num(it.low),need,two))+'</p>':'')+
    (it.cap>=R.need*1.5?'<p class="rp-warn">'+esc(L(T.over))+'</p>':'')+
    '<div class="rp-cta"><a class="text-link" href="'+page+'">'+L(T.view)+'</a></div>'+
    '</div></li>';
}
/* the suggested temperature that matches the field shows as chosen */
var zones=[].slice.call(form.querySelectorAll('.zone-t'));
function syncZones(t){zones.forEach(function(b){b.setAttribute('aria-pressed',String(parseFloat(b.getAttribute('data-t'))===t))})}
zones.forEach(function(b){b.addEventListener('click',function(){
  var i=$id('c-temp');i.value=b.getAttribute('data-t');i.dispatchEvent(new Event('input',{bubbles:true}));
})});
/* the model the visitor chooses: one at a time, kept while it stays in the list; it goes into the PDF and the email */
var chosen='';
function keyOf(it){return it.p.id+'|'+it.p.h+'|'+it.n}
function showChosen(valid){
  var found=null;
  [].forEach.call(out.querySelectorAll('.rp'),function(li){
    var on=li.getAttribute('data-key')===chosen,b=li.querySelector('.rp-pick');
    li.classList.toggle('is-picked',on);
    b.setAttribute('aria-pressed',String(on));
    b.textContent=L(on?T.picked:T.pick);
    if(on)found=li;
  });
  if(valid&&chosen&&!found)chosen='';
}
var lastHtml='';
function render(){
  var a=read();
  $id('tankMore').hidden=a.tank==='none';
  /* radiators cannot cool, so with them the cooling question goes away */
  $id('coolQ').hidden=a.emit==='rad';
  syncZones(a.t);
  var html,msg,valid=validate(a);
  if(!valid){html='<p class="res-alert">'+L(T.bad)+'</p>';msg=L(T.bad)}
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
      html+='<p class="res-pick-help">'+esc(L(T.pickHelp))+'</p><ul class="rp-list">'+P.list.map(function(it,i){return prodHtml(it,i,a,R,P)}).join('')+'</ul>';
    }else html+='<p class="res-alert">'+emptyText(a,R,P)+'</p>';
    html+='<p class="res-disc">'+esc(L(T.disc))+' '+L(T.src)+'</p>';
    msg=T.livNeed(num(R.need),P.list.length);
  }
  if(html!==lastHtml){out.innerHTML=html;lastHtml=html}
  showChosen(valid);
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

/* ---------- the calculation as a PDF ---------- */
/* Made in the visitor's browser with no library, and nothing is sent anywhere: the visitor sends the file on WhatsApp when they like.
   The standard PDF fonts keep it small and carry the Albanian letters; a letter they lack is written without its accent,
   and other alphabets come out as "?". The answers come from the form itself, so the wording stays the same as on the page. */
var PDF_W=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
var PDF_1252=[0x20AC,0,0x201A,0x192,0x201E,0x2026,0x2020,0x2021,0x2C6,0x2030,0x160,0x2039,0x152,0,0x17D,0,0,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x2DC,0x2122,0x161,0x203A,0x153,0,0x17E,0x178];
function pdfBytes(s){
  return Array.from(String(s).normalize('NFC')).map(function(ch){
    var c=ch.codePointAt(0),i;
    if(c<32)return 32;
    if(c===0x2212)return 45;
    if(c<=126||(c>=160&&c<=255))return c;
    i=PDF_1252.indexOf(c);
    if(i>=0)return 128+i;
    c=(ch==='đ'?'d':ch==='Đ'?'D':ch.normalize('NFD').charAt(0)).charCodeAt(0);
    return c>=32&&c<=126?c:63;
  });
}
function pdfWidth(s,size){return pdfBytes(s).reduce(function(w,b){return w+(b>=32&&b<=126?PDF_W[b-32]:556)},0)*size/1000}
function pdfWrap(s,size,max){
  var lines=[],cur='';
  String(s).trim().split(/\s+/).forEach(function(w){
    var t=cur?cur+' '+w:w;
    if(pdfWidth(t,size)<=max){cur=t;return}
    if(cur)lines.push(cur);
    cur=w;
  });
  lines.push(cur);
  return lines;
}
function pdfText(x,y,size,font,s,gray,spacing){
  var hex=pdfBytes(s).map(function(b){return ('0'+b.toString(16)).slice(-2)}).join('');
  return 'BT /'+font+' '+size+' Tf '+gray+' g '+(spacing||0)+' Tc '+x.toFixed(2)+' '+y.toFixed(2)+' Td <'+hex+'> Tj ET\n';
}
function pdfRule(x1,x2,y,gray){return gray+' G .6 w '+x1.toFixed(2)+' '+y.toFixed(2)+' m '+x2.toFixed(2)+' '+y.toFixed(2)+' l S\n'}
function fieldLabel(id){return $id(id).closest('.f').querySelector('label').firstChild.textContent.replace(/\s*\(.*?\)/,'').trim()}
function optionText(id){var s=$id(id),o=s.options[s.selectedIndex];return o?o.text:''}
function choiceRow(name){
  var c=form.querySelector('input[name="'+name+'"]:checked');
  return [c.closest('fieldset').querySelector('legend').textContent.trim(),form.querySelector('label[for="'+c.id+'"]').textContent.trim()];
}
/* what the visitor told us about the building, as label and answer */
function pdfAnswers(a){
  var zone=zones.filter(function(b){return parseFloat(b.getAttribute('data-t'))===a.t})[0],
      rows=[[fieldLabel('c-area'),num(a.area)+' m²'],[fieldLabel('c-temp'),deg(a.t)+'°C'+(zone?', '+zone.querySelector('span').textContent:'')],[fieldLabel('c-ins'),optionText('c-ins')],choiceRow('emit')];
  if(a.emit!=='rad')rows.push(choiceRow('cool'));
  rows.push([fieldLabel('c-tank'),optionText('c-tank')]);
  if(a.tank!=='none')rows.push([fieldLabel('c-people'),String(a.n)]);
  ['c-year','c-facade','c-win'].forEach(function(id){if($id(id).value!=='')rows.push([fieldLabel(id),optionText(id)])});
  return rows;
}
function chosenName(it){return (it.n===2?'2 × ':'')+L(it.p.name)+', '+num(it.p.h)+' kW'}
function chosenExtras(a,P,it){
  var b=bufferFor(it.cap,it.n,a.area),more=[];
  if(P.tank)more.push(T.plus(P.tank.n,P.tank.l));
  if(b)more.push(T.plusBuf(b.n,num(b.l)));
  return more;
}
function pdfPages(a,R,P,it,logo,photo,name,phone,mail){
  var PH=841.89,M=56,CW=595.28-M*2,G=24,pages=[],c='',y=PH-M-26;
  function footer(){
    return pdfRule(M,M+CW,70,.8)+pdfText(M,56,8.5,'F1','Comfort Clima, '+L(T.pdfAddr),.4)+pdfText(M,44,8.5,'F1','+383 48 77 22 88  |  info@comfort-clima.com  |  comfort-clima.com',.4);
  }
  function room(h){if(y-h<90){pages.push(c+footer());c='';y=PH-M}}
  function section(s){room(70);c+=pdfText(M,y,12.5,'F2',s,0);y-=22}
  function rows(list,cols){
    var w=(CW-G*(cols-1))/cols;
    for(var r=0;r<list.length;r+=cols){
      var part=list.slice(r,r+cols),wrapped=part.map(function(p){return pdfWrap(p[1],12,w)}),n=Math.max.apply(null,wrapped.map(function(l){return l.length}));
      room(17+16*n+14);
      part.forEach(function(p,k){c+=pdfText(M+k*(w+G),y,7.5,'F1',p[0].toUpperCase(),.4,.9)});
      y-=17;
      for(var i=0;i<n;i++){
        wrapped.forEach(function(l,k){if(l[i])c+=pdfText(M+k*(w+G),y,12,'F1',l[i],0)});
        y-=16;
      }
      y+=8;
      part.forEach(function(p,k){c+=pdfRule(M+k*(w+G),M+k*(w+G)+w,y,.75)});
      y-=15;
    }
  }
  if(logo)c+='q 150 0 0 '+(150*logo.h/logo.w).toFixed(2)+' '+M+' '+y.toFixed(2)+' cm /Im1 Do Q\n';
  else c+=pdfText(M,y+6,16,'F2','Comfort Clima',0);
  var d=new Date(),date=L(T.pdfDate)+': '+('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear();
  c+=pdfText(M+CW-pdfWidth(date,9.5),y+8,9.5,'F1',date,.4);
  y-=46;
  c+=pdfText(M,y,26,'F2',L(T.pdfTitle),0);y-=21;
  pdfWrap(L(T.pdfSend),10.5,CW).forEach(function(l){c+=pdfText(M,y,10.5,'F1',l,.35);y-=15});
  y-=16;
  section(L(T.pdfClient));
  rows([[fieldLabel('c-cname'),name],[fieldLabel('c-cphone'),phone]],2);
  if(mail)rows([[fieldLabel('c-cmail'),mail]],1);
  y-=4;
  section(L(T.pdfObj));
  rows(pdfAnswers(a),2);
  y-=4;
  /* the chosen product: its photo on the left when we have it, the words beside it */
  var X=M,W=CW,photoEnd=y;
  if(it&&photo)room(150);
  section(L(T.pdfChosen));
  if(it&&photo){
    var pw=114,ph=pw*photo.h/photo.w;
    photoEnd=y+9-ph;
    c+='q '+pw+' 0 0 '+ph.toFixed(2)+' '+M+' '+photoEnd.toFixed(2)+' cm /Im2 Do Q\n';
    X=M+pw+16;W=CW-pw-16;
  }
  if(it){
    var more=chosenExtras(a,P,it);
    /* the width table is for the regular font; the bold one runs a little wider */
    pdfWrap(chosenName(it),12,W*.93).forEach(function(l){c+=pdfText(X,y,12,'F2',l,0);y-=15});
    if(more.length)pdfWrap(more.join(' '),9.5,W).forEach(function(m){c+=pdfText(X,y,9.5,'F1',m,.35);y-=13});
  }else{c+=pdfText(M,y,11,'F1',L(T.pdfNoPick),.35);y-=15}
  pdfWrap(T.pdfNeed(num(R.need)),9.5,W).forEach(function(l){c+=pdfText(X,y,9.5,'F1',l,.35);y-=13});
  y+=4;
  if(it&&photo)y=Math.min(y,photoEnd-8);
  c+=pdfRule(M,M+CW,y,.75);
  y-=12;
  /* the client's notice stands out: what the estimate is and who verifies the final selection */
  var noteLines=[];
  L(T.pdfNote).forEach(function(par,i){if(i)noteLines.push('');noteLines=noteLines.concat(pdfWrap(par,8.5,CW-30))});
  var noteH=noteLines.reduce(function(h,l){return h+(l?11.5:5)},18);
  room(noteH+6);
  var noteY=y-15;
  c+='.95 g '+M+' '+(y-noteH).toFixed(2)+' '+CW.toFixed(2)+' '+noteH.toFixed(2)+' re f\n.075 .286 .553 rg '+M+' '+(y-noteH).toFixed(2)+' 3 '+noteH.toFixed(2)+' re f\n';
  noteLines.forEach(function(l){if(l){c+=pdfText(M+15,noteY,8.5,'F1',l,.15);noteY-=11.5}else noteY-=5});
  y-=noteH+10;
  pages.push(c+footer());
  return pages;
}
function pdfFile(pages,logo,photo){
  var objs=[0,0,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'],
      res='<< /Font << /F1 3 0 R /F2 4 0 R >>',xobj='',kids=[],out='%PDF-1.4\n',off=[];
  function addImage(im,name){
    objs.push('<< /Type /XObject /Subtype /Image /Width '+im.w+' /Height '+im.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+im.data.length+' >>\nstream\n'+im.data+'\nendstream');
    xobj+=' /'+name+' '+objs.length+' 0 R';
  }
  if(logo)addImage(logo,'Im1');
  if(photo)addImage(photo,'Im2');
  if(xobj)res+=' /XObject <<'+xobj+' >>';
  res+=' >>';
  pages.forEach(function(s){
    objs.push('<< /Length '+s.length+' >>\nstream\n'+s+'endstream');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources '+res+' /Contents '+objs.length+' 0 R >>');
    kids.push(objs.length+' 0 R');
  });
  objs[0]='<< /Type /Catalog /Pages 2 0 R >>';
  objs[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+kids.length+' >>';
  objs.forEach(function(o,i){off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
  var xref=out.length;
  out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+off.map(function(o){return ('000000000'+o).slice(-10)+' 00000 n \n'}).join('')+'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  var bytes=new Uint8Array(out.length);
  for(var i=0;i<out.length;i++)bytes[i]=out.charCodeAt(i);
  return bytes;
}
/* a picture for the PDF as a white-backed JPEG, loaded once; a picture that fails leaves the PDF without it */
var pdfImages={};
function pdfImage(src,maxW){
  var url=new URL(src,location.href).href;
  if(!pdfImages[url])pdfImages[url]=new Promise(function(resolve){
    var img=new Image();
    img.onload=function(){
      try{
        var k=Math.min(1,maxW/img.naturalWidth),cv=document.createElement('canvas'),x=cv.getContext('2d');
        cv.width=Math.round(img.naturalWidth*k);cv.height=Math.round(img.naturalHeight*k);
        x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(img,0,0,cv.width,cv.height);
        resolve({w:cv.width,h:cv.height,data:atob(cv.toDataURL('image/jpeg',.92).split(',')[1])});
      }catch(err){resolve(null)}
    };
    img.onerror=function(){resolve(null)};
    img.src=url;
  });
  return pdfImages[url];
}
function pdfLogo(){var src=document.querySelector('.foot-brand .logo img');return src?pdfImage(src.src,900):Promise.resolve(null)}
function pdfPhoto(it){return pdfImage(ROOT+'assets/products/'+it.p.img,600)}
function chosenItem(P){return P.list.filter(function(x){return keyOf(x)===chosen})[0]}
/* a click on a recommended model chooses it, a second click clears it; its links keep working */
out.addEventListener('click',function(e){
  var card=e.target.closest('.rp');
  if(!card||e.target.closest('a'))return;
  var key=card.getAttribute('data-key'),a=read();
  chosen=chosen===key?'':key;
  showChosen(true);
  /* its photo is fetched now, so the PDF is ready at once when it is asked for */
  var it=chosen&&validate(a)?chosenItem(pick(a,compute(a))):null;
  if(it)pdfPhoto(it);
});
['cname','cphone'].forEach(function(id){$id('c-'+id).addEventListener('input',function(){if(this.value.trim())mark(id,true)})});
/* the client's own email is needed to send by email and optional for the PDF; when written it has to be one we can answer */
function mailOk(v){return !v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
$id('c-cmail').addEventListener('input',function(){if(mailOk(this.value.trim()))mark('cmail',true)});
/* what both ways of sending need. Nothing goes out without a name and phone, or with answers the calculator refuses:
   the first field to fix gets the focus. */
function requestData(needMail){
  var name=$id('c-cname').value.trim(),phone=$id('c-cphone').value.trim(),mail=$id('c-cmail').value.trim(),a=read();
  mark('cname',!!name);mark('cphone',!!phone);
  $id('e-cmail').textContent=L(needMail?T.mailNeed:T.mailBad);
  mark('cmail',mailOk(mail)&&(!needMail||!!mail));
  validate(a);
  var bad=form.querySelector('[aria-invalid="true"]');
  if(bad){bad.focus();return null}
  var R=compute(a),P=pick(a,R);
  return {name:name,phone:phone,mail:mail,a:a,R:R,P:P,it:chosenItem(P)};
}
/* the client's name for the file name, without accents or marks: "Arbër Çitaku" gives "arber-citaku" */
function fileName(name){
  var slug=name.replace(/[đĐ]/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,60).replace(/-+$/,'');
  return L(T.pdfFile)+(slug?'-'+slug:'')+'.pdf';
}
pdfBtn.addEventListener('click',function(){
  var q=requestData();
  if(!q)return;
  Promise.all([pdfLogo(),q.it?pdfPhoto(q.it):null]).then(function(pics){
    var logo=pics[0],photo=pics[1],url=URL.createObjectURL(new Blob([pdfFile(pdfPages(q.a,q.R,q.P,q.it,logo,photo,q.name,q.phone,q.mail),logo,photo)],{type:'application/pdf'})),link=document.createElement('a');
    link.href=url;link.download=fileName(q.name);
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},30000);
  });
});
/* the same request as the PDF, written out in the visitor's email app; a mailto link cannot attach a file, so it goes as text.
   The client's email address is required here and written into the text. */
function rowText(r){return r[0]+(/\?$/.test(r[0])?' ':': ')+r[1]}
$id('calcMail').addEventListener('click',function(e){
  var q=requestData(true);
  if(!q){e.preventDefault();return}
  var body=[rowText([fieldLabel('c-cname'),q.name]),rowText([fieldLabel('c-cphone'),q.phone])]
    .concat(q.mail?[rowText([fieldLabel('c-cmail'),q.mail])]:[],['',L(T.pdfObj)],pdfAnswers(q.a).map(rowText),['',L(T.pdfChosen)],q.it?[chosenName(q.it)].concat(chosenExtras(q.a,q.P,q.it)):[L(T.mailNoPick)],[T.pdfNeed(num(q.R.need))]);
  this.href='mailto:info@comfort-clima.com?subject='+encodeURIComponent(L(T.pdfTitle)+' · '+q.name)+'&body='+encodeURIComponent(body.join('\r\n'));
});

form.addEventListener('submit',function(e){e.preventDefault()});
form.addEventListener('input',schedule);
form.addEventListener('change',schedule);
/* the logo is fetched when the name and phone are reached, so the PDF is ready at once when it is asked for */
$id('calcPdfBox').addEventListener('focusin',function(){pdfLogo()},{once:true});
['c-year','c-facade','c-win'].forEach(function(id){$id(id).addEventListener('change',assess)});
render();
})();
