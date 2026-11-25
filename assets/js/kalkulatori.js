/* Heat pump and air conditioner calculators, each on its own page: kalkulatori.html and kalkulatori-kondicionerit.html (and
   their en/ copies); the "Kalkulatori" menu in the top bar leads to both. The form is in the page; this file does the sums,
   updates the result as you type and lists models from our own product pages. Nothing is sent anywhere.
   Air conditioner (client request, 24 Nov 2026; rules of 25 Nov): one room, split only; the BTU class from the room area by the
   client's bands (AC_BANDS), the models from the tables of our split pages (see "the air conditioner" below).
   Heat pump sources: heat loss per m², tank sizes and the insulation questions from HVAC Education Hub's heat pump cheat sheet; interpolation,
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
   heating kW at -7°C outside where published, cooling kW with 18°C water where published, SCOP with 35°C water, SCOP with 55°C water,
   heating kW with 55°C water and 7°C outside where published]. With radiators the models are matched on that 55°C output
   (client's rule); Split Comfort publishes none, so with radiators it is not offered.
   Fujitsu pages give ηs, so SCOP = (ηs + 3) × 2.5 / 100; this reproduces Haier's published pairs (5.10 and 201%).
   The 3-phase versions of Split High Power have the same figures as the 1-phase ones and are the same page, so they are one entry.
   Monobloc Comfort shares its outdoor units across the three pages; the -7°C figures are published on the control box page. */
function fam(id,name,img,kind,tMin,tank,conf,sizes){return sizes.map(function(s){return {id:id,name:name,img:img,kind:kind,tMin:tMin,tank:tank,conf:conf,h:s[0],h7:s[1],c:s[2],scop:[s[3],s[4]],h55:s[5]||0}})}
var MONO_WALL=[[5,5.1,5.35,4.8,3.4,5],[8,8.18,7.69,4.95,3.55,8],[10,9.53,9.3,4.95,3.6,10]],
    SPLIT_HP=[[10.08,7.7,0,4.65,3.35,8.24],[12.55,9.2,0,4.65,3.45,9.16],[14.47,10.7,0,4.7,3.5,10.09]],
    SPLIT_C=[[4.5,4.4,0,4.45,3.2],[5.5,5,0,4.45,3.2],[7.5,5.7,0,4.5,3.28],[9.5,8.9,0,4.53,3.33]];
var PUMPS=[].concat(
  fam('fujitsu-monobloc-comfort-control-box',["Fujitsu Monobloc Comfort, kuti kontrolli","Fujitsu Monobloc Comfort, control box"],'atw/mono-controlbox.jpg','Monobloc',-20,0,1,[[5,5.1,5.45,5.08,3.65,5],[8,8.18,7.79,5.2,3.68,8],[10,9.53,9.4,5.23,3.73,10]]),
  fam('fujitsu-monobloc-comfort-wall-unit',["Fujitsu Monobloc Comfort, njësi në mur","Fujitsu Monobloc Comfort, wall unit"],'atw/mono-wall.jpg','Monobloc',-20,0,1,MONO_WALL),
  /* the tank volume of this indoor unit (WGEP100KR3-19) is not published on our page or Fujitsu's: 190 L is assumed only to decide
     when to offer it, as with the other "-19" units, and no litre figure is shown for it (conf = 0) */
  fam('fujitsu-monobloc-comfort-with-tank',["Fujitsu Monobloc Comfort me bojler","Fujitsu Monobloc Comfort with tank"],'atw/mono-dhw.jpg','Monobloc',-20,190,0,MONO_WALL),
  fam('haier-monobloc-r290',["Haier Monobloc R290","Haier Monobloc R290"],'haier/monobloc-r290.jpg','Monobloc',-25,0,1,[[4,0,4,5.1,3.85,4],[6,0,6,5.1,3.83,6],[8,0,7.5,5.2,3.85,8],[10,0,9.5,5.1,3.83,10],[12,0,11.5,4.82,3.85,11.5],[14,0,13.5,4.8,3.83,13.5],[16,0,15.5,4.8,3.85,15.5]]),
  fam('fujitsu-split-comfort-r32',["Fujitsu Split Comfort R32","Fujitsu Split Comfort R32"],'atw/split-comfort.jpg','Split',-20,0,1,SPLIT_C),
  fam('fujitsu-split-comfort-r32-with-tank',["Fujitsu Split Comfort R32 me bojler","Fujitsu Split Comfort R32 with tank"],'atw/split-comfort-dhw.jpg','Split',-20,190,1,SPLIT_C),
  fam('fujitsu-split-high-power-r32',["Fujitsu Split High Power R32","Fujitsu Split High Power R32"],'atw/split-hp.jpg','Split',-25,0,1,SPLIT_HP),
  fam('fujitsu-split-high-power-r32-with-tank',["Fujitsu Split High Power R32 me bojler","Fujitsu Split High Power R32 with tank"],'atw/split-hp-dhw.jpg','Split',-25,190,1,SPLIT_HP),
  fam('haier-commercial-heat-pump-r290',["Haier Pompë termike komerciale R290","Haier Commercial heat pump R290"],'haier/commercial-r290.jpg','Monobloc',-28,0,1,[[26,0,26,4.91,3.83,26],[30,0,30,4.73,3.68,30],[35,0,35,4.55,3.57,35],[40,0,39,4.46,3.56,40]])
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

/* AC-DATA: written by tools/geo/15-klima-data.ps1 from the technical tables of our product pages; do not edit by hand.
   Each size: [indoor unit, outdoor unit, cooling kW, heating kW, SEER, SCOP (0 = not published), lowest outdoor temperature for heating in degrees C (null = not published)] */
var AC_SPLIT=[
  {id:"fujitsu-designer-kj",n:["Fujitsu Designer KJ","Fujitsu Designer KJ"],img:"kjcal.jpg",t:"wall",s:[["ASEH07KJCAL","AOEH07KJCA",2,2.5,9.6,5.1,-20],["ASEH09KJCAL","AOEH09KJCA",2.5,2.8,9.2,5.1,-20],["ASEH12KJCAL","AOEH12KJCA",3.4,4,8.7,5.1,-20],["ASEH14KJCAL","AOEH14KJCA",4.2,5.2,7.9,4.6,-20]]},
  {id:"fujitsu-standard-kmcg",n:["Fujitsu Standard KMCG","Fujitsu Standard KMCG"],img:"kmcg.jpg",t:"wall",s:[["ASEH07KMCG","AOEH07KMCG",2,2.5,8.4,4.6,-15],["ASEH09KMCG","AOEH09KMCG",2.5,2.8,8.4,4.6,-15],["ASEH12KMCG","AOEH12KMCG",3.4,4,7.7,4.6,-15],["ASEH14KMCG","AOEH14KMCG",4.2,5.4,7.1,4.1,-15]]},
  {id:"fujitsu-standard-kmtgl",n:["Fujitsu Standard KMTGL","Fujitsu Standard KMTGL"],img:"kmtgl.jpg",t:"wall",s:[["ASEH18KMTGL","AOEH18KMTG",5.2,6.3,8,4.6,-15],["ASEH24KMTGL","AOEH24KMTG",7.1,8,7.3,4.3,-15]]},
  {id:"fujitsu-eco-knca",n:["Fujitsu ECO KNCA","Fujitsu ECO KNCA"],img:"knca.jpg",t:"wall",s:[["ASEH07KNCA","AOEH07KNCA",2,2.5,7.8,4.4,-15],["ASEH09KNCA","AOEH09KNCA",2.5,2.8,7.4,4.4,-15],["ASEH12KNCA","AOEH12KNCA",3.4,3.8,7,4.4,-15]]},
  {id:"fujitsu-eco-kltbl",n:["Fujitsu ECO KLTBL","Fujitsu ECO KLTBL"],img:"kltbl.jpg",t:"wall",s:[["ASEH07KLTBL","AOEH07KLTA",2,2.4,7.1,4.1,-15],["ASEH09KLTBL","AOEH09KLTA",2.5,2.5,6.8,4.1,-15],["ASEH12KLTBL","AOEH12KLTA",3.4,3.4,6.7,4.1,-15]]},
  {id:"fujitsu-eco-klcbl",n:["Fujitsu ECO KLCBL","Fujitsu ECO KLCBL"],img:"klcbl.jpg",t:"wall",s:[["ASEH18KLCBL","AOEH18KLCB",5.2,6.3,7.2,4.3,-15],["ASEH24KLCBL","AOEH24KLCB",7.1,8,7.1,4,-15]]},
  {id:"fujitsu-standard-kmtb",n:["Fujitsu Standard KMTB","Fujitsu Standard KMTB"],img:"kmtb.jpg",t:"wall",s:[["ASEH30KMTB","AOEH30KMTB",8,8.8,6.7,4.5,-15],["ASEH36KMTB","AOEH36KMTB",9.4,10.1,6.1,4.5,-15]]},
  {id:"fujitsu-floor-kvca",n:["Fujitsu Dysheme KVCA","Fujitsu Floor KVCA"],img:"kvca.jpg",t:"floor",s:[["AGEG09KVCA","AOEG09KVCA",2.5,3.5,8.5,4.3,-15],["AGEG12KVCA","AOEG12KVCA",3.5,4.5,8.2,4.1,-15],["AGEG14KVCA","AOEG14KVCA",4.2,5.2,8.1,4,-15]]},
  {id:"fujitsu-compact-cassette-kvla",n:["Fujitsu Kasetë kompakte KVLA","Fujitsu Compact cassette KVLA"],img:"kvla.jpg",t:"cassette",s:[["AUXG09KVLA","AOEG09KBTB",2.5,3.2,6.7,4.4,-15],["AUXG12KVLA","AOEG12KBTB",3.5,4.1,6.6,4.3,-15],["AUXG14KVLA","AOEG14KBTB",4.3,5,6.5,4.4,-15],["AUXG18KVLA","AOEG18KBTB",5.2,6,6.6,4.2,-15],["AUXG22KVLA","AOEG22KBTB",6,7,6.6,4.3,-15],["AUXG24KVLA","AOEG24KBTB",6.8,7.5,6.1,4,-15]]},
  {id:"fujitsu-circular-flow-cassette-krlb",n:["Fujitsu Kasetë rrethore KRLB","Fujitsu Circular flow cassette KRLB"],img:"krlb.jpg",t:"cassette",s:[["AUXG18KRLB","AOEG18KBTB",5.2,6,7,4.3,-15],["AUXG22KRLB","AOEG22KBTB",6,7,7,4.4,-15],["AUXG24KRLB","AOEG24KBTB",6.8,7.5,6.6,4.2,-15],["AUXG30KRLB","AOEG30KBTB",8.5,10,6.7,4.3,-15],["AUXG36KRLB","AOEG36KBTB",9.5,10.8,6.55,4.3,-15],["AUXG45KRLB","AOEG45KBTB",12.1,13.5,0,0,-15],["AUXG54KRLB","AOEG54KBTB",13.4,15.5,0,0,-15]]},
  {id:"fujitsu-ceiling-krta",n:["Fujitsu Tavan KRTA","Fujitsu Ceiling KRTA"],img:"krta.jpg",t:"ceiling",s:[["ABEG18KRTA","AOEG18KBTB",5.2,6,6.2,4.1,-15],["ABEG22KRTA","AOEG22KBTB",6,7,6.1,4,-15],["ABEG24KRTA","AOEG24KBTB",6.8,7.5,6.2,4.1,-15],["ABEG30KRTA","AOEG30KBTB",8.5,10,6.1,4,-15],["ABEG36KRTA","AOEG36KBTB",9.5,10.8,6.37,4.21,-15],["ABEG45KRTA","AOEG45KBTB",12.1,13.5,0,0,-15],["ABEG54KRTA","AOEG54KRTA",13.4,15.5,0,0,-15]]},
  {id:"fujitsu-slim-duct-kllap",n:["Fujitsu Njësi kanalizore me profil të hollë KLLAP","Fujitsu Slim duct KLLAP"],img:"kllap.jpg",t:"duct",s:[["ARXG09KLLAP","AOEG09KBTB",2.5,3.2,6.2,4.3,-15],["ARXG12KLLAP","AOEG12KBTB",3.5,4.1,6.1,4,-15],["ARXG14KLLAP","AOEG14KBTB",4.3,5,5.8,3.9,-15],["ARXG18KLLAP","AOEG18KBTB",5.2,6,6.2,4.1,-15]]},
  {id:"fujitsu-duct-kmtap",n:["Fujitsu Kanal KMTAP","Fujitsu Duct KMTAP"],img:"kmtap.jpg",t:"duct",s:[["ARXH12KMTAP","AOEG12KBTB",3.5,4.1,6.5,4.2,-15],["ARXH14KMTAP","AOEG14KBTB",4.3,5,6.1,4,-15],["ARXH18KMTAP","AOEG18KBTB",5.2,6,6.2,4.1,-15],["ARXH22KMTAP","AOEG22KBTB",6,7,6.5,4.2,-15],["ARXH24KMTAP","AOEG24KBTB",6.8,7.5,6.4,4.2,-15],["ARXH30KMTAP","AOEG30KBTB",8.5,10,6.23,4,-15],["ARXH36KMTAP","AOEG36KBTB",9.5,10.8,6.1,4.1,-15],["ARXH45KMTAP","AOEG45KBTB",12.1,13.5,0,0,-15],["ARXH54KMTAP","AOEG54KRTA",13.4,15.5,0,0,-15]]},
  {id:"fujitsu-duct-kmla",n:["Fujitsu Kanal KMLA","Fujitsu Duct KMLA"],img:"kmla.jpg",t:"duct",s:[["ARXG22KMLB","AOEG22KBTB",6,7,6.1,4.1,-15],["ARXG24KMLA","AOEG24KBTB",6.8,7.5,6.2,4.1,-15],["ARXG30KMLA","AOEG30KBTB",8.5,10,6.23,4,-15],["ARXG36KMLA","AOEG36KBTB",9.5,10.8,6.1,4,-15],["ARXG45KMLA","AOEG45KBTB",12.1,13.5,5.25,0,-15]]},
  {id:"fujitsu-high-static-pressure-duct",n:["Fujitsu Njësi kanalizore me presion të lartë","Fujitsu High static pressure duct"],img:"khtap.jpg",t:"duct",s:[["ARXG12KHTAP","AOEG12KBTB",3.5,4.1,6.3,4.1,-15],["ARXG14KHTAP","AOEG14KBTB",4.3,5,6.2,4,-15],["ARXG18KHTAP","AOEG18KBTB",5.2,6,6.5,4.1,-15],["ARXG22KHTAP","AOEG22KBTB",6,7,6.5,4.2,-15],["ARXG24KHTAP","AOEG24KBTB",6.8,7.5,6.5,4.1,-15],["ARXG30KHTAP","AOEG30KBTB",8.5,10,6.2,4,-15],["ARXG36KHTAP","AOEG36KBTB",9.5,10.8,6.1,4.2,-15],["ARXG45KHTAP","AOEG45KBTB",12.1,13.5,0,0,-15],["ARXG54KHTAP","AOEG54KBTB",13.4,15.5,0,0,-15],["ARXH60KHTA","AOEH60KRTA",15,18,0,0,-20],["ARXH72KHTA","AOEH72KRTA",19,22.4,0,0,-20],["ARXH90KHTA","AOEH90KRTA",22,25,0,0,-20]]},
  {id:"haier-serene",n:["Haier Serene","Haier Serene"],img:"haier/serene.jpg",t:"wall",s:[["AS25SBBHRA-MW","1U25DEBFRA-S",2.6,3,8.8,4.6,-20],["AS35SBBHRA-MW","1U35DEBFRA-S",3.5,3.7,8.51,4.6,-20],["AS50SDBHRA-MW","1U50KEBFRA-S",5.3,5.9,8.51,4.6,-20],["AS71SEPHRA-MW","1U71WEPFRA-S",7.1,7.4,8.5,4.6,-20]]},
  {id:"haier-expert",n:["Haier Expert","Haier Expert"],img:"haier/expert.jpg",t:"wall",s:[["AS25XCAHRA","1U25S2SM1FA-2",2.8,3.2,8.8,4.75,-20],["AS35XCAHRA","1U35S2SM1FA-2",3.5,4.2,8.5,4.75,-20],["AS42XCAHRA-1","1U42S2SM1FA",4.2,4.4,7,0,-20],["AS50XCAHRA","1U50S2SJ2FA-2",5,5.6,6.6,4.6,-20],["AS71XCAHRA","1U71S2ST1FA",6.2,6.8,6.8,4,-20]]},
  {id:"haier-pearl-premium",n:["Haier Pearl Premium","Haier Pearl Premium"],img:"haier/pearl-premium.jpg",t:"wall",s:[["AS25PBPHRA-PRE","1U25YEPFRA-PRE",2.7,3.1,8.5,0,-20],["AS35PBPHRA-PRE","1U35MEPFRA-PRE",3.6,3.9,8.5,4.6,-20],["AS50PDPHRA-PRE","1U50KEPFRA-PRE",5.3,5.8,8.5,4.6,-20],["AS71PEPHRA-PRE","1U71WEPFRA-PRE",7.1,7.4,8.5,4.6,-20]]},
  {id:"haier-pearl-r290",n:["Haier Pearl R290","Haier Pearl R290"],img:"haier/pearl-r290.jpg",t:"wall",s:[["AS25PBBHRA","1U25YEBGRA",2.6,2.8,6.8,4.6,-15],["AS35PBBHRA","1U35YEBGRA",3.5,3.5,6.2,4.6,-15]]},
  {id:"haier-flexis-plus",n:["Haier Flexis Plus","Haier Flexis Plus"],img:"haier/flexis-plus.jpg",t:"wall",s:[["AS25S2SF1FA-MW3","1U25S2SM1FA-2",2.6,3.2,8.5,4.6,-20],["AS35S2SF1FA-MW3","1U35S2SM1FA-2",3.5,4.2,8.5,4.6,-20],["AS42S2SF1FA-MW3","1U42S2SM1FA",4.2,4.4,7,4,-20],["AS50S2SF1FA-MW3","1U50S2SJ2FA-2",5.2,6,7.2,4.6,-20],["AS71S2SF1FA-MW3","1U71S2ST1FA",7,8,7.1,4,-20]]},
  {id:"haier-revive-plus",n:["Haier Revive Plus","Haier Revive Plus"],img:"haier/revive-plus.jpg",t:"wall",s:[["AS25RBAHRA-3","1U25YESFRA-3",2.7,2.9,6.5,4,-20],["AS35RBAHRA-4","1U35YESFRA-4",3.2,3.9,6.1,4,-20],["AS50RCBHRA-4","1U50MERFRA-4",4.8,4.8,6.3,4,-20],["AS68RDAHRA-4","1U68MRAFRA-4",6.2,6.3,6.7,4,-20]]},
  {id:"haier-expert-nordic",n:["Haier Expert Nordic","Haier Expert Nordic"],img:"haier/expert-nordic.jpg",t:"wall",s:[["AS25XCHHRA-NR","1U25KEHFRA-NR",2.6,3.2,8.5,5.1,-30],["AS35XCHHRA-NR","1U35KEHFRA-NR",3.5,4.2,8.5,5.1,-30]]},
  {id:"haier-pearl-nordic",n:["Haier Pearl Nordic","Haier Pearl Nordic"],img:"haier/pearl-nordic.jpg",t:"wall",s:[["AS25PCHHRA-NR","1U25KEFFRA-NR",2.6,3.6,7.8,4.6,-30],["AS35PCHHRA-NR","1U35KEFFRA-NR",3.5,4.2,7.7,4.6,-30],["AS50PDHHRA-NR","1U50WEFFRA-NR",5.2,6,7.5,4.6,-30]]},
  {id:"haier-flair",n:["Haier Flair","Haier Flair"],img:"haier/flair.jpg",t:"wall",s:[["AS105S2SF2FA-2","1U105S2SS2FA",9,9.5,6.1,4,-20]]},
  {id:"haier-console",n:["Haier Console","Haier Console"],img:"haier/console.jpg",t:"floor",s:[["AF25S2SD1FA(D)","1U25S2SM1FA-2",2.5,3,8,4.2,-20],["AF35S2SD1FA(D)","1U35S2SM1FA-2",3.4,3.5,7.5,4.2,-20],["AF50S2SD1FA(D)","1U50S2SJ2FA-2",5,5.4,6.3,4.05,-20]]},
  {id:"haier-one-way-cassette",n:["Haier Kasetë me një drejtim","Haier One-way cassette"],img:"haier/cassette-1way.jpg",t:"cassette",s:[["AB25S2SA1FA(H)","1U25S2SM1FA-2",2.6,3.2,6.2,4,-20],["AB35S2SA1FA(H)","1U35S2SM1FA-2",3.5,4,6.2,4.2,-20],["AB50S2SA1FA(H)","1U50S2SJ2FA-2",5,5.5,6.2,4,-20],["AB71S2SA1FA(H)","1U71S2ST1FA",6.9,7.6,6.1,4,-20]]},
  {id:"haier-ceiling-floor",n:["Haier Njësi tavani ose dyshemeje","Haier Ceiling-floor"],img:"haier/ceiling-floor.jpg",t:"ceiling",s:[["AC25S2SG2FA(H)","1U25S2SM1FA-2",2.5,3.1,0,4,-20],["AC35S2SG2FA(H)","1U35S2SM1FA-2",3.5,4,8.5,4.47,-20],["AC50S2SG2FA(H)","1U50S2SJ2FA-2",5,5.8,7.31,4.1,-20],["AC71S2SG2FA(H)","1U71S2ST1FA",7.1,7.8,7.15,4.25,-20],["AC105S2SH2FA(H)","1U105S2SS2FA",9.5,10.2,6.11,3.8,-20],["AC125S2SK2FA(H)","1U125S2SN2FA",12.3,12.7,5.86,3.97,-20],["AC140S2SK2FA(H)","1U140S2SN1FA",13.4,15,5.92,3.97,-20],["AC160S2SK2FA(H)","1U160S2SP1FB",16,17,6.1,4.06,-20]]},
  {id:"haier-slim-duct",n:["Haier Njësi kanalizore me profil të hollë","Haier Slim duct"],img:"haier/slim-duct.jpg",t:"duct",s:[["AD25S2SS1FA(H)","1U25S2SM1FA-2",2.5,3.1,6.1,4,-20],["AD35S2SS1FA(H)","1U35S2SM1FA-2",3.5,4,6.1,0,-20],["AD50S2SS1FA(H)","1U50S2SJ2FA-2",5,5.8,6.1,0,-20],["AD71S2SS1FA(H)","1U71S2ST1FA",6.8,7.5,6.1,4,-20],["AD71S2SS1FA(H)","1U71S2SR3FA",7.1,7.5,6.1,4,-20]]},
  {id:"hec-tide",n:["HEC Tide","HEC Tide"],img:"hec/tide.jpg",t:"wall",s:[["HEC25RECO-IN","HEC25RECO-OU",2.6,2.8,6.1,4,-20],["HEC35RECO-IN","HEC35RECO-OU",3.2,3.6,6.1,4,-20],["HEC50RECO-IN","HEC50RECO-OU",4.8,4.8,6.3,4,-20]]}
];
/* /AC-DATA */
/* The air conditioner class by room area, the client's rule (25 Nov 2026): up to 25 m² 9000 BTU, 25-40 m² 12000, 40-60 m² 14000,
   60-70 m² 18000, 70-80 m² 24000; above 80 m² no recommendation. Each band is [largest area, class in thousands of BTU]. */
var AC_BANDS=[[25,9],[40,12],[60,14],[70,18],[80,24]];
/* The class of a model from its name: Fujitsu writes it (ASEH09 = 9000 BTU); Haier and HEC write the cooling power in tenths of
   a kW (AS25 = 2.5 kW), sold as these classes. Haier's 4.2 kW size (42) is taken as the 14000 BTU class. */
var KW_CLASS={25:9,35:12,42:14,50:18,68:24,71:24};

/* ---------- texts ---------- */
var T={
  res:["Rezultati","Result"],
  base:["Humbja bazë e nxehtësisë","Base heat loss"],
  need:["Fuqia e nevojshme","Required power"],
  vol:["Vëllimi i bojlerit","Tank volume"],
  how:function(w,t,a,b){return EN?w+' W/m² at '+t+'°C × '+a+' m²'+' = '+b+' kW.':w+' W/m² në '+t+'°C × '+a+' m²'+' = '+b+' kW.'},
  howRad:[" Radiatorë: +15%. Modelet krahasohen me fuqinë e tyre me ujë 55°C."," Radiators: +15%. Models are compared at their output with 55°C water."],
  list:function(n){return EN?'Models for preliminary consideration ('+n+')':'Modele për shqyrtim paraprak ('+n+')'},
  best:["Për shqyrtim paraprak","For preliminary review"],
  heat:["Ngrohje","Heating"],heat55:["Ngrohje 55°C","Heating 55°C"],cool:["Ftohje","Cooling"],
  why:["Pse e rekomandojmë:","Why we recommend it:"],
  /* package wording (GEO, Nov 2026); with radiators the capacity is the 55°C water output, so the sentence says so */
  whyHeat:function(h,n,k){return k?(EN?'The output with 55°C water of '+h+' kW is compared with the estimated requirement of '+n+' kW. Output at the building’s operating conditions is checked during selection.':'Kapaciteti me ujë 55°C '+h+' kW krahasohet me nevojën e vlerësuar '+n+' kW. Kapaciteti në kushtet e objektit verifikohet gjatë përzgjedhjes.'):(EN?'The nominal capacity of '+h+' kW is compared with the estimated requirement of '+n+' kW. Output at the building’s operating conditions is checked during selection.':'Kapaciteti nominal '+h+' kW krahasohet me nevojën e vlerësuar '+n+' kW. Kapaciteti në kushtet e objektit verifikohet gjatë përzgjedhjes.')},
  whyPair:function(h,c,n,k){return k?(EN?'Two units giving '+h+' kW each with 55°C water provide '+c+' kW in total. Our team reviews the configuration and output for the building.':'Dy pajisje me nga '+h+' kW me ujë 55°C japin gjithsej '+c+' kW. Konfigurimi dhe kapaciteti për objektin shqyrtohen nga ekipi ynë.'):(EN?'Two units with a nominal capacity of '+h+' kW provide '+c+' kW in total at nominal conditions. Our team reviews the configuration and output for the building.':'Dy pajisje me kapacitet nominal '+h+' kW japin gjithsej '+c+' kW në kushtet nominale. Konfigurimi dhe kapaciteti për objektin shqyrtohen nga ekipi ynë.')},
  out55:function(c){return EN?'Heating with 55°C water (7°C outside): '+c+' kW':'Ngrohje me ujë 55°C (jashtë 7°C): '+c+' kW'},
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
  bigInt:function(v){return EN?'The indicative required volume is '+v+' L. The integrated cylinder must be assessed against the selected model and household demand.':'Vëllimi orientues i kërkuar është '+v+' L. Kapaciteti i bojlerit të integruar duhet shqyrtuar sipas modelit dhe konsumit të familjes.'},
  fan:function(){var h='<a class="text-link" href="fan-coil.html">'+(EN?'our fan coils from Aertesi':'fan coil-et tonë nga Aertesi')+'</a>';return (EN?'See ':'Shihni ')+h+'.'},
  noTemp:["Asnjë model nuk punon deri në këtë temperaturë. Na shkruani dhe e shohim bashkë.","No model works down to this temperature. Write to us and we look at it together."],
  tooBig:function(m){var h='<a class="text-link" href="chillers.html">'+(EN?'the chillers':'chillerët')+'</a>';return EN?'This is more than the models that match your choices can give (up to '+m+' kW). Write to us, or see '+h+'.':'Kjo fuqi kalon modelet që përputhen me zgjedhjet tuaja (deri '+m+' kW). Na shkruani, ose shihni '+h+'.'},
  tooSmall:function(m){var h='<a class="text-link" href="kondicionere-split.html">'+(EN?'split air conditioners':'kondicionerët split')+'</a>';return EN?'This is less than half of our smallest matching model ('+m+' kW), which would be too large. Write to us, or see '+h+'.':'Kjo fuqi është më pak se gjysma e modelit tonë më të vogël që përputhet ('+m+' kW), i cili do të ishte shumë i madh. Na shkruani, ose shihni '+h+'.'},
  noneFit:["Në konfigurimin e zgjedhur, kalkulatori nuk gjeti model të përshtatshëm në listën e tij. Na dërgoni kërkesën për shqyrtim teknik.","The calculator found no suitable model in its list for the selected configuration. Send us your requirements for technical review."],
  bad:["Plotësoni fushat e shënuara me të kuqe për të parë rezultatin.","Fill in the fields marked in red to see the result."],
  /* the package's disclaimer, then the two method facts it does not cover (capacity conditions, SCOP source) */
  disc:["Ky vlerësim orientues bazohet në të dhënat e deklaruara dhe në supozimet e metodës së llogaritjes. Përzgjedhja përfundimtare kërkon verifikimin e humbjeve të nxehtësisë dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë. Fuqitë e modeleve janë me ujë 35°C (me radiatorë 55°C) dhe 7°C jashtë, si në tabelat e produkteve. SCOP-i i modeleve Fujitsu është llogaritur nga ηs në tabelat e produkteve.","This indicative estimate is based on the information entered and the calculation method’s assumptions. Final selection requires verification of building heat loss and equipment output at the relevant operating conditions. Contact our team for technical selection or system design. Model capacities are with 35°C water (55°C with radiators) and 7°C outside, as in the product tables. SCOP for the Fujitsu models is worked out from ηs in the product tables."],
  src:['Vlerat orientuese për m²: <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.','Guide values per m²: <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.'],
  livNeed:function(n,c){return EN?'Required power '+n+' kW. '+c+' models.':'Fuqia e nevojshme '+n+' kW. '+c+' modele.'},
  assess:function(n){return EN?'From your answers: '+n+'.':'Sipas përgjigjeve: '+n+'.'},
  winWarn:["Dritaret janë më të dobëta se muret, prandaj humbjet mund të jenë më të larta. Mund të zgjidhni një nivel izolimi më të ulët.","The windows are weaker than the walls, so the losses may be higher. You can choose one insulation level lower."],
  pickHelp:["Zgjidhni modelin që dëshironi të shqyrtojmë. Ai do të përfshihet në kërkesën për ofertë bashkë me të dhënat që keni vendosur.","Choose the model you would like us to review. It will be included in your quotation request together with the details you entered."],
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
  /* PDF notice: the package's disclaimer (client decision, 16 Nov 2026) */
  pdfNote:[["Ky vlerësim orientues bazohet në të dhënat e deklaruara dhe në supozimet e metodës së llogaritjes. Përzgjedhja përfundimtare kërkon verifikimin e humbjeve të nxehtësisë dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë."],["This indicative estimate is based on the information entered and the calculation method’s assumptions. Final selection requires verification of building heat loss and equipment output at the relevant operating conditions. Contact our team for technical selection or system design."]],
  pdfDate:["Data","Date"],
  pdfFile:["comfort-clima-kerkese-per-oferte","comfort-clima-quote-request"],
  pdfAddr:["Rruga Ukë Mavriqi 23, Shkabaj, Prishtinë 10000, Kosovë","Rruga Ukë Mavriqi 23, Shkabaj, Prishtina 10000, Kosovo"],
  /* the air conditioner */
  kClass:["Klasa e rekomanduar","Recommended class"],
  /* "9000 BTU" on Albanian pages, "9,000 BTU" on English ones */
  btu:function(k){return k+(EN?',000':'000')+' BTU'},
  band:function(lo,hi){return lo?(EN?lo+' to '+hi+' m²':lo+' deri '+hi+' m²'):(EN?'up to '+hi+' m²':'deri '+hi+' m²')},
  kHow:function(a,band,btu){return EN?'Your room is '+a+' m²: for rooms of '+band+' we recommend '+btu+' models. The recommendation is based on the room area; our team takes the number of people and the room’s other conditions into account in the quotation.':'Dhoma juaj ka '+a+' m²: për dhoma '+band+' rekomandojmë modele '+btu+'. Rekomandimi bazohet në sipërfaqen e dhomës; numrin e personave dhe kushtet e tjera të dhomës i shqyrton ekipi ynë në ofertë.'},
  kWhyClass:function(btu,band){return EN?'A '+btu+' model, the class we recommend for rooms of '+band:'Model '+btu+', klasa që rekomandojmë për dhoma '+band},
  kWhySeer:function(s){return 'SEER '+s+(EN?' in cooling':' në ftohje')},
  kWhyScop:function(s){return 'SCOP '+s+(EN?' in heating (average climate)':' në ngrohje (klimë mesatare)')},
  kWhyLow:function(t){return EN?'Heats down to '+t+'°C outside, as in the product table':'Ngroh deri në '+t+'°C jashtë, sipas tabelës së produktit'},
  kTooBig:function(){
    var vrf='<a class="text-link" href="vrf.html">'+(EN?'the VRF systems':'sistemet VRF')+'</a>';
    return EN?'For rooms over 80 m² we have no ready recommendation. Write to us and we help you choose, or see '+vrf+'.':'Për dhoma mbi 80 m² nuk kemi rekomandim të gatshëm. Na shkruani dhe ju ndihmojmë me zgjedhjen, ose shihni '+vrf+'.';
  },
  kNoType:function(btu){return EN?'We have no '+btu+' model of the type you chose. Try another unit type, or write to us.':'Nuk kemi model '+btu+' të llojit që keni zgjedhur. Provoni një lloj tjetër njësie, ose na shkruani.'},
  kDisc:["Ky rekomandim orientues bazohet në sipërfaqen e dhomës. Përzgjedhja përfundimtare kërkon verifikimin e nevojës për ftohje dhe ngrohje të dhomës dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë. Fuqitë e modeleve janë nominale, si në tabelat e produkteve.","This indicative recommendation is based on the room area. Final selection requires verification of the room’s cooling and heating demand and equipment output at the relevant operating conditions. Contact our team for technical selection or system design. Model capacities are nominal, as in the product tables."],
  kLiv:function(btu,n){return EN?'Recommended class '+btu+'. '+n+' models.':'Klasa e rekomanduar '+btu+'. '+n+' modele.'},
  kPdfNeed:function(btu,a){return EN?'Recommended class from the calculator: '+btu+' (room of '+a+' m²)':'Klasa e rekomanduar sipas kalkulatorit: '+btu+' (dhomë '+a+' m²)'},
  kPdfNote:[["Ky rekomandim orientues bazohet në sipërfaqen e dhomës. Përzgjedhja përfundimtare kërkon verifikimin e nevojës për ftohje dhe ngrohje të dhomës dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë."],["This indicative recommendation is based on the room area. Final selection requires verification of the room’s cooling and heating demand and equipment output at the relevant operating conditions. Contact our team for technical selection or system design."]]
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
/* the output a model is matched on: with 35°C water for underfloor heating, with 55°C water for radiators (k = 1) */
function heatOf(p,k){return k?p.h55:p.h}
function maxHeat(list,k){return Math.max.apply(null,list.map(function(p){return heatOf(p,k)}).concat(0))}
/* same match as the reference calculator: enough capacity, less than double, closest first, then the higher SCOP.
   Added: a model whose published -7°C output falls short of the need (when the design temperature is that cold) goes after those that cover it.
   The client's rules: Fujitsu first, except that above 20 kW a Haier commercial model that suits the need (not 1.5 times it) goes before it.
   Places stay for the other Haier models when they fit, so Fujitsu does not hide them.
   Each group (Fujitsu, Haier home, Haier commercial) offers two of the same model together once its own largest model is too small, so
   15 kW shows both 2 × Fujitsu and Haier 16 kW. A need above our largest tank still gets that tank (the page says so).
   With radiators every capacity here is the 55°C one; no -7°C output with 55°C water is published, so that check is for underfloor only. */
function pick(a,R){
  var k=a.emit==='rad'?1:0,need=R.need;
  var pool=PUMPS.filter(function(p){return a.t>=p.tMin&&(a.tank==='int'?p.tank>0:p.tank===0)&&(a.cool!=='yes'||p.c>0)&&(!k||p.h55>0)});
  function isFj(p){return p.id.indexOf('fujitsu')===0}
  function sameGroup(p){return function(q){return isCommercial(p)?isCommercial(q):isFj(p)?isFj(q):!isFj(q)&&!isCommercial(q)}}
  var list=[];
  function add(p,n){
    var cap=heatOf(p,k)*n;
    if(cap>=need&&cap<need*2)list.push({p:p,n:n,cap:cap,low:(!k&&a.t<=-7&&p.h7&&p.h7*n<need)?p.h7*n:0});
  }
  pool.forEach(function(p){
    add(p,1);
    if(need>maxHeat(pool.filter(sameGroup(p)),k))add(p,2);
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
  var k=a.emit==='rad'?1:0,max=maxHeat(P.pool,k),min=Math.min.apply(null,P.pool.map(function(p){return heatOf(p,k)}));
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
  /* the title keeps the model's own size (as on its page); the output it is matched on shows in the specs and the reasons.
     The buffer tank follows the pump's size, as the client's rule says. */
  var p=it.p,two=it.n===2,k=a.emit==='rad'?1:0,need=num(R.need),h=num(heatOf(p,k)),cap=num(it.cap),name=(two?'2 × ':'')+L(p.name),page=p.id+'.html',t=P.tank,b=bufferFor(p.h*it.n,it.n,a.area),
      why=[two?T.whyPair(h,cap,need,k):T.whyHeat(h,need,k),T.whyScop[k](num(p.scop[k]))];
  if(a.tank==='int')why.push(!p.conf?L(T.whyIntNo):two?T.whyIntPair(p.tank):T.whyInt(p.tank,Math.round(p.tank/45)));
  if(t)why.push(T.whyExt(t.l,Math.round(t.l/45)));
  var specs='<div><dt>'+L(k?T.heat55:T.heat)+'</dt><dd>'+cap+' kW</dd></div>';
  if(p.c)specs+='<div><dt>'+L(T.cool)+'</dt><dd>'+num(p.c*it.n)+' kW</dd></div>';
  specs+='<div><dt>SCOP</dt><dd>'+num(p.scop[k])+'</dd></div>';
  return '<li class="rp" data-key="'+esc(keyOf(it))+'"><a class="rp-img" href="'+page+'" tabindex="-1" aria-hidden="true"><img src="'+ROOT+'assets/products/'+p.img+'" width="840" height="560" loading="lazy" alt=""></a><div class="rp-body">'+
    '<p class="rp-top"><span class="pkick">'+p.kind+'</span>'+(i===0&&!it.low&&it.cap<R.need*1.5?'<span class="rp-best">'+L(T.best)+'</span>':'')+'<button class="rp-pick" type="button" aria-pressed="false">'+L(T.pick)+'</button></p>'+
    '<h4 class="rp-name"><a href="'+page+'">'+esc(name)+', '+num(p.h)+' kW</a></h4>'+
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
/* the model the visitor chooses: one at a time for each calculator, kept while it stays in the list; it goes into the PDF and the email */
var mode='hp',chosen={hp:'',ac:''};
function keyOf(it){return it.p.id+'|'+it.p.h+'|'+it.n}
function showChosen(valid){
  var found=null;
  [].forEach.call(out.querySelectorAll('.rp'),function(li){
    var on=li.getAttribute('data-key')===chosen[mode],b=li.querySelector('.rp-pick');
    li.classList.toggle('is-picked',on);
    b.setAttribute('aria-pressed',String(on));
    b.textContent=L(on?T.picked:T.pick);
    if(on)found=li;
  });
  if(valid&&chosen[mode]&&!found)chosen[mode]='';
}
var lastHtml='';
function render(){
  var M=MODES[mode],a=M.read();
  M.show(a);
  syncZones(a.t);
  var html,msg,valid=M.validate(a);
  if(!valid){html='<p class="res-alert">'+L(T.bad)+'</p>';msg=L(T.bad)}
  else{var r=M.result(a);html=r.html;msg=r.msg}
  if(html!==lastHtml){out.innerHTML=html;lastHtml=html}
  showChosen(valid);
  if(live&&live.textContent!==msg)live.textContent=msg;
}
/* the heat pump's questions: the tank size only with a tank; radiators cannot cool, so with them the cooling question goes away */
function hpShow(a){
  $id('tankMore').hidden=a.tank==='none';
  $id('coolQ').hidden=a.emit==='rad';
}
function hpResult(a){
  var R=compute(a),P=pick(a,R),how=T.how(num(Math.round(R.w*10)/10),deg(a.t),num(a.area),num(R.base));
  if(a.emit==='rad')how+=L(T.howRad);
  var html='<h2 class="res-title">'+L(T.res)+'</h2><div class="res-nums">'+
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
  return {html:html,msg:T.livNeed(num(R.need),P.list.length)};
}

/* ---------- the air conditioner ---------- */
/* one room, split only (client, 25 Nov 2026: no multi-split, no heating question, no outdoor temperature). The class comes from the
   room area alone (AC_BANDS); the number of people is still asked, so that our team has it for the quotation (insulation and
   sun were removed at the client's request, 25 Nov 2026). */
function acRead(){
  return {area:parseFloat($id('c-karea').value),n:parseInt($id('c-kpeople').value,10),type:radio('ktype')};
}
function acValidate(a){
  var ok=mark('karea',inRange(a.area,5,Infinity));
  return mark('kpeople',inRange(a.n,1,20))&&ok;
}
/* every question on the air conditioner page always shows */
function acShow(){}
/* the room's band: its class and the areas it runs between; no class above the last band (80 m²) */
function acCompute(a){
  for(var i=0;i<AC_BANDS.length;i++)if(a.area<=AC_BANDS[i][0])return {area:a.area,cls:AC_BANDS[i][1],lo:i?AC_BANDS[i-1][0]:0,hi:AC_BANDS[i][0]};
  return {area:a.area,cls:0};
}
/* the class in a model's name (KW_CLASS, above) */
function acClass(it){
  var m;
  if(isFujitsu(it)){m=/^[A-Z]{4}(\d\d)/.exec(it.s[0]);return m?+m[1]:0}
  m=/^[A-Z]+(\d{2,3})/.exec(it.s[0]);
  return m?KW_CLASS[+m[1]]||0:0;
}
/* every model of the chosen unit type in the room's class, one per family, the higher SEER first.
   The client's rule from the heat pumps: Fujitsu first, with one of the five places kept for another brand when one fits. */
function acPick(a,R){
  var fits=[],seen={};
  if(R.cls)AC_SPLIT.forEach(function(f){
    if(f.t!==a.type)return;
    f.s.forEach(function(s){
      var it={p:f,s:s,c:s[2],h:s[3]};
      if(!seen[f.id]&&acClass(it)===R.cls){seen[f.id]=1;fits.push(it)}
    });
  });
  fits.sort(function(x,y){return y.s[4]-x.s[4]});
  var fj=fits.filter(isFujitsu),oth=fits.filter(function(it){return !isFujitsu(it)}),fjTake=fj.slice(0,5-Math.min(1,oth.length));
  return {list:fjTake.concat(oth.slice(0,5-fjTake.length))};
}
function labelText(id){var l=form.querySelector('label[for="'+id+'"]');return l?l.textContent.trim():''}
function acKey(it){return it.p.id+'|'+it.s[0]+'|'+it.s[1]}
function acName(it){return L(it.p.n)+', '+num(it.c)+' kW'}
function acCodes(s){return s[0]+' + '+s[1]}
function acCard(it,i,a,R){
  var page=it.p.id+'.html',why=[T.kWhyClass(T.btu(R.cls),T.band(R.lo,R.hi))];
  if(it.s[4])why.push(T.kWhySeer(num(it.s[4])));
  if(it.s[5])why.push(T.kWhyScop(num(it.s[5])));
  if(it.s[6]!==null)why.push(T.kWhyLow(deg(it.s[6])));
  var specs='<div><dt>'+L(T.cool)+'</dt><dd>'+num(it.c)+' kW</dd></div><div><dt>'+L(T.heat)+'</dt><dd>'+num(it.h)+' kW</dd></div>'+
    (it.s[4]?'<div><dt>SEER</dt><dd>'+num(it.s[4])+'</dd></div>':'');
  return '<li class="rp" data-key="'+esc(acKey(it))+'"><a class="rp-img" href="'+page+'" tabindex="-1" aria-hidden="true"><img src="'+ROOT+'assets/products/'+it.p.img+'" width="840" height="560" loading="lazy" alt=""></a><div class="rp-body">'+
    '<p class="rp-top"><span class="pkick">'+esc(labelText('c-ktype-'+a.type))+'</span>'+(i===0?'<span class="rp-best">'+L(T.best)+'</span>':'')+'<button class="rp-pick" type="button" aria-pressed="false">'+L(T.pick)+'</button></p>'+
    '<h4 class="rp-name"><a href="'+page+'">'+esc(acName(it))+'</a></h4>'+
    '<p class="rp-tank">'+esc(acCodes(it.s))+'</p>'+
    '<dl class="pspecs">'+specs+'</dl>'+
    '<p class="rp-whyh">'+L(T.why)+'</p><ul class="rp-why"><li>'+why.map(esc).join('</li><li>')+'</li></ul>'+
    '<div class="rp-cta"><a class="text-link" href="'+page+'">'+L(T.view)+'</a></div>'+
    '</div></li>';
}
function acResult(a){
  var R=acCompute(a),html='<h2 class="res-title">'+L(T.res)+'</h2>',disc='<p class="res-disc">'+esc(L(T.kDisc))+'</p>';
  if(!R.cls)return {html:html+'<p class="res-alert">'+T.kTooBig()+'</p>'+disc,msg:T.kTooBig().replace(/<[^>]+>/g,'')};
  var P=acPick(a,R),btu=T.btu(R.cls);
  html+='<div class="res-nums"><div class="res-num"><p class="res-nl">'+L(T.kClass)+'</p><p class="res-kw">'+R.cls+(EN?',000':'000')+'<small>BTU</small></p></div></div>'+
    '<p class="res-how">'+esc(T.kHow(num(a.area),T.band(R.lo,R.hi),btu))+'</p>'+
    '<h3 class="res-lt">'+T.list(P.list.length)+'</h3>';
  if(P.list.length)html+='<p class="res-pick-help">'+esc(L(T.pickHelp))+'</p><ul class="rp-list">'+P.list.map(function(it,i){return acCard(it,i,a,R)}).join('')+'</ul>';
  else html+='<p class="res-alert">'+esc(T.kNoType(btu))+'</p>';
  return {html:html+disc,msg:T.kLiv(btu,P.list.length)};
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
function tempRow(a){
  var zone=zones.filter(function(b){return parseFloat(b.getAttribute('data-t'))===a.t})[0];
  return [fieldLabel('c-temp'),deg(a.t)+'°C'+(zone?', '+zone.querySelector('span').textContent:'')];
}
function insHelpRows(rows){['c-year','c-facade','c-win'].forEach(function(id){if($id(id).value!=='')rows.push([fieldLabel(id),optionText(id)])});return rows}
function pdfAnswers(a){
  var rows=[[fieldLabel('c-area'),num(a.area)+' m²'],tempRow(a),[fieldLabel('c-ins'),optionText('c-ins')],choiceRow('emit')];
  if(a.emit!=='rad')rows.push(choiceRow('cool'));
  rows.push([fieldLabel('c-tank'),optionText('c-tank')]);
  if(a.tank!=='none')rows.push([fieldLabel('c-people'),String(a.n)]);
  return insHelpRows(rows);
}
/* the air conditioner answers, in the order of the form */
function acAnswers(a){
  return [[fieldLabel('c-karea'),num(a.area)+' m²'],[fieldLabel('c-kpeople'),String(a.n)],choiceRow('ktype')];
}
function chosenName(it){return (it.n===2?'2 × ':'')+L(it.p.name)+', '+num(it.p.h)+' kW'}
function chosenExtras(a,P,it){
  var b=bufferFor(it.p.h*it.n,it.n,a.area),more=[];
  if(P.tank)more.push(T.plus(P.tank.n,P.tank.l));
  if(b)more.push(T.plusBuf(b.n,num(b.l)));
  return more;
}
/* K is the calculator the request comes from (MODES.hp or MODES.ac): it gives the answers, the chosen product and the need line */
function pdfPages(a,R,P,it,logo,photo,name,phone,mail,K){
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
  rows(K.answers(a),2);
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
    var more=K.more(a,P,it);
    /* the width table is for the regular font; the bold one runs a little wider */
    pdfWrap(K.name(it),12,W*.93).forEach(function(l){c+=pdfText(X,y,12,'F2',l,0);y-=15});
    if(more.length)pdfWrap(more.join(' '),9.5,W).forEach(function(m){c+=pdfText(X,y,9.5,'F1',m,.35);y-=13});
  }else{c+=pdfText(M,y,11,'F1',L(T.pdfNoPick),.35);y-=15}
  if(it)K.after(a,it).forEach(function(s){pdfWrap(s,9.5,W).forEach(function(l){c+=pdfText(X,y,9.5,'F1',l,.35);y-=13})});
  pdfWrap(K.need(R),9.5,W).forEach(function(l){c+=pdfText(X,y,9.5,'F1',l,.35);y-=13});
  y+=4;
  if(it&&photo)y=Math.min(y,photoEnd-8);
  c+=pdfRule(M,M+CW,y,.75);
  y-=12;
  /* the client's notice stands out: what the estimate is and who verifies the final selection */
  var noteLines=[];
  L(K.note).forEach(function(par,i){if(i)noteLines.push('');noteLines=noteLines.concat(pdfWrap(par,8.5,CW-30))});
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
function chosenItem(P){var K=MODES[mode];return P.list.filter(function(x){return K.key(x)===chosen[mode]})[0]}
/* a click on a recommended model chooses it, a second click clears it; its links keep working */
out.addEventListener('click',function(e){
  var card=e.target.closest('.rp');
  if(!card||e.target.closest('a'))return;
  var key=card.getAttribute('data-key'),K=MODES[mode],a=K.read();
  chosen[mode]=chosen[mode]===key?'':key;
  showChosen(true);
  /* its photo is fetched now, so the PDF is ready at once when it is asked for */
  var it=chosen[mode]&&K.validate(a)?chosenItem(K.calc(a).P):null;
  if(it)pdfPhoto(it);
});
['cname','cphone'].forEach(function(id){$id('c-'+id).addEventListener('input',function(){if(this.value.trim())mark(id,true)})});
/* the client's own email is needed to send by email and optional for the PDF; when written it has to be one we can answer */
function mailOk(v){return !v||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
$id('c-cmail').addEventListener('input',function(){if(mailOk(this.value.trim()))mark('cmail',true)});
/* what both ways of sending need. Nothing goes out without a name and phone, or with answers the calculator refuses:
   the first field to fix gets the focus. */
function requestData(needMail){
  var K=MODES[mode],name=$id('c-cname').value.trim(),phone=$id('c-cphone').value.trim(),mail=$id('c-cmail').value.trim(),a=K.read();
  mark('cname',!!name);mark('cphone',!!phone);
  $id('e-cmail').textContent=L(needMail?T.mailNeed:T.mailBad);
  mark('cmail',mailOk(mail)&&(!needMail||!!mail));
  K.validate(a);
  /* only the fields of the calculator in view count: the other one's may still carry an old mark */
  var bad=[].filter.call(form.querySelectorAll('[aria-invalid="true"]'),function(el){return !el.closest('[hidden]')})[0];
  if(bad){bad.focus();return null}
  var X=K.calc(a);
  return {K:K,name:name,phone:phone,mail:mail,a:a,R:X.R,P:X.P,it:chosenItem(X.P)};
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
    var logo=pics[0],photo=pics[1],url=URL.createObjectURL(new Blob([pdfFile(pdfPages(q.a,q.R,q.P,q.it,logo,photo,q.name,q.phone,q.mail,q.K),logo,photo)],{type:'application/pdf'})),link=document.createElement('a');
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
    .concat(q.mail?[rowText([fieldLabel('c-cmail'),q.mail])]:[],['',L(T.pdfObj)],q.K.answers(q.a).map(rowText),['',L(T.pdfChosen)],q.it?[q.K.name(q.it)].concat(q.K.more(q.a,q.P,q.it),q.K.after(q.a,q.it)):[L(T.mailNoPick)],[q.K.need(q.R)]);
  this.href='mailto:info@comfort-clima.com?subject='+encodeURIComponent(L(T.pdfTitle)+' · '+q.name)+'&body='+encodeURIComponent(body.join('\r\n'));
});

form.addEventListener('submit',function(e){e.preventDefault()});
form.addEventListener('input',schedule);
form.addEventListener('change',schedule);
/* the logo is fetched when the name and phone are reached, so the PDF is ready at once when it is asked for */
$id('calcPdfBox').addEventListener('focusin',function(){pdfLogo()},{once:true});
/* the insulation helper is on the heat pump page only */
['c-year','c-facade','c-win'].forEach(function(id){if($id(id))$id(id).addEventListener('change',assess)});

/* ---------- which calculator: heat pump or air conditioner ---------- */
/* each one's sums, answers and chosen product, behind the same names, so the page, the PDF and the email work the same for both */
var MODES={
  hp:{read:read,validate:validate,show:hpShow,result:hpResult,key:keyOf,answers:pdfAnswers,name:chosenName,more:chosenExtras,
      calc:function(a){var R=compute(a);return {R:R,P:pick(a,R)}},
      after:function(a,it){return a.emit==='rad'?[T.out55(num(it.cap))]:[]},
      need:function(R){return T.pdfNeed(num(R.need))},note:T.pdfNote},
  ac:{read:acRead,validate:acValidate,show:acShow,result:acResult,key:acKey,answers:acAnswers,name:acName,
      more:function(a,P,it){return [acCodes(it.s)]},
      calc:function(a){var R=acCompute(a);return {R:R,P:acPick(a,R)}},
      after:function(){return []},
      need:function(R){return R.cls?T.kPdfNeed(T.btu(R.cls),num(R.area)):T.kTooBig().replace(/<[^>]+>/g,'')},note:T.kPdfNote}
};
/* Each calculator has its own page since 25 Nov 2026 (client request): the air conditioner page is the one with a room area.
   For one day the air conditioner sat on this page behind #kondicioner / #air-conditioner: such a link goes to its page. */
if(!$id('c-karea')&&/^#(kondicioner|klima|air-conditioner)$/i.test(location.hash)){location.replace('kalkulatori-kondicionerit.html');return}
mode=$id('c-karea')?'ac':'hp';
render();
})();
