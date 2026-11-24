/* Heat pump and air conditioner calculator. The form is in the page (kalkulatori.html, en/kalkulatori.html); a switch above it
   chooses the calculator, and #kondicioner or #air-conditioner in the address opens the air conditioner one. This file does the
   sums, updates the result as you type and lists models from our own product pages. Nothing is sent anywhere.
   Air conditioner (client request, 24 Nov 2026): cooling from Daikin's sizing guide, heating from the same heat loss table as the
   heat pump, the models from the tables of our split and multi-split pages (see "the air conditioner" below).
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
var AC_MULTI=[
  {id:"fujitsu-multi-aoeg14kbca2",n:["Fujitsu multi-split R32 për 2 dhoma","Fujitsu multi-split R32 for 2 rooms"],img:"multi/r32-2.jpg",r:[2,2],s:["","AOEG14KBCA2",4,4.4,0,0,null]},
  {id:"fujitsu-multi-aoeg18kbca2",n:["Fujitsu multi-split R32 për 2 dhoma","Fujitsu multi-split R32 for 2 rooms"],img:"multi/r32-2b.jpg",r:[2,2],s:["","AOEG18KBCA2",5,5.6,0,0,null]},
  {id:"fujitsu-multi-aoeg18kbca3",n:["Fujitsu multi-split R32 për 3 dhoma","Fujitsu multi-split R32 for 3 rooms"],img:"multi/r32-3.jpg",r:[3,3],s:["","AOEG18KBCA3",5.4,6.8,0,0,-15]},
  {id:"fujitsu-multi-aoeg24kbca3",n:["Fujitsu multi-split R32 për 3 dhoma","Fujitsu multi-split R32 for 3 rooms"],img:"multi/r32-3.jpg",r:[3,3],s:["","AOEG24KBCA3",6.8,8,0,0,-15]},
  {id:"fujitsu-multi-aoeg30kbta4",n:["Fujitsu multi-split R32 për 4 dhoma","Fujitsu multi-split R32 for 4 rooms"],img:"multi/r32-45.jpg",r:[4,4],s:["","AOEG30KBTA4",8,9.6,0,0,-15]},
  {id:"fujitsu-multi-aoeg36kbta5",n:["Fujitsu multi-split R32 për 5 dhoma","Fujitsu multi-split R32 for 5 rooms"],img:"multi/r32-45.jpg",r:[5,5],s:["","AOEG36KBTA5",9.5,10.6,0,0,-15]},
  {id:"fujitsu-multi-aoeh14kacb2",n:["Fujitsu multi-split ECO për 2 dhoma","Fujitsu multi-split ECO for 2 rooms"],img:"multi/eco-2.jpg",r:[2,2],s:["","AOEH14KACB2",4,4.2,0,0,-15]},
  {id:"fujitsu-multi-aoeh18kacb2",n:["Fujitsu multi-split ECO për 2 dhoma","Fujitsu multi-split ECO for 2 rooms"],img:"multi/eco-2.jpg",r:[2,2],s:["","AOEH18KACB2",5,5.3,0,0,-10]},
  {id:"fujitsu-multi-aoeh18kacb3",n:["Fujitsu multi-split ECO për 3 dhoma","Fujitsu multi-split ECO for 3 rooms"],img:"multi/eco-3.jpg",r:[2,3],s:["","AOEH18KACB3",5.3,6.4,0,0,-15]},
  {id:"hec-tide#multi",n:["HEC Tide dual për 2 dhoma","HEC Tide dual for 2 rooms"],img:"hec/tide.jpg",r:[2,2],s:["2 × HEC25RECO-IN","2HEC35RECO-OUM",3.6,4,6.5,4,-15]},
  {id:"hec-tide#multi",n:["HEC Tide dual për 2 dhoma","HEC Tide dual for 2 rooms"],img:"hec/tide.jpg",r:[2,2],s:["HEC25RECO-IN + HEC35RECO-IN","2HEC50RECO-OUM",4.7,4.8,6.1,4,-15]}
];
/* /AC-DATA */
/* Air conditioner cooling, from Daikin's guide "What size air conditioner do I need?" (daikin.co.uk, read 24 Nov 2026): about 0.1 kW
   per m² for average ceiling heights (2.4 m) and insulation; large south- or west-facing windows 10 to 20% more (we take the middle,
   15%); 0.18 kW for each person above two. Uninsulated or poorly insulated rooms get 10% more, so that the guide's own example comes
   out: a well-insulated 20 m² room needs 2 kW, a poorly insulated sun-facing one 2.5 kW (20 × 0.1 × 1.1 × 1.15 = 2.53). */
var AC_KW=0.1,AC_SUN=0.15,AC_INS=0.1,AC_PERSON=0.18,
    DAIKIN='https://www.daikin.co.uk/en_gb/residential/inspiration/articles/air-conditioner-size-guide.html';

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
  kCool:["Fuqia ftohëse e nevojshme","Required cooling"],
  kHeat:["Ngrohja e nevojshme","Required heating"],
  kHow:function(a,b,parts){return num(AC_KW)+' kW/m² × '+a+' m² = '+b+' kW'+(parts.length?'; '+parts.join('; '):'')+'.'},
  kMultiHow:function(c,ins){return EN?'Each room: '+num(AC_KW)+' kW/m² × its area, plus the sun allowance where you ticked it'+(ins?'; '+ins:'')+'; all rooms together '+c+' kW.':'Çdo dhomë: '+num(AC_KW)+' kW/m² × sipërfaqja, me shtesën për diell aty ku e keni shënuar'+(ins?'; '+ins:'')+'; dhomat bashkë '+c+' kW.'},
  kSun:function(){return (EN?'a lot of sun +':'shumë diell +')+Math.round(AC_SUN*100)+'%'},
  kIns:function(lv){return L(INS_NAME[lv]).toLowerCase()+' +'+Math.round(AC_INS*100)+'%'},
  kPeople:function(n,kw){return n+(EN?' people +':' persona +')+kw+' kW'},
  kHeatHow:function(w,t,a,h){return EN?' Heating: '+w+' W/m² at '+t+'°C × '+a+' m² = '+h+' kW.':' Ngrohje: '+w+' W/m² në '+t+'°C × '+a+' m² = '+h+' kW.'},
  kRoom:function(lab,a,sun,c,h){return lab+': '+a+' m²'+(sun?', '+sun.toLowerCase():'')+(EN?', cooling ':', ftohje ')+c+' kW'+(h?(EN?', heating ':', ngrohje ')+h+' kW':'')},
  kWhyCool:function(c,n){return EN?'The nominal cooling capacity of '+c+' kW is compared with the estimated requirement of '+n+' kW.':'Fuqia ftohëse nominale '+c+' kW krahasohet me nevojën e vlerësuar '+n+' kW.'},
  kWhyHeat:function(h,n){return EN?'The nominal heating capacity of '+h+' kW is compared with the heating requirement of '+n+' kW. Output at the outdoor design temperature is checked during selection.':'Fuqia ngrohëse nominale '+h+' kW krahasohet me nevojën për ngrohje '+n+' kW. Kapaciteti në temperaturën e jashtme të llogaritjes verifikohet gjatë përzgjedhjes.'},
  kWhySeer:function(s){return 'SEER '+s+(EN?' in cooling':' në ftohje')},
  kWhyScop:function(s){return 'SCOP '+s+(EN?' in heating (average climate)':' në ngrohje (klimë mesatare)')},
  kWhyLow:function(t){return EN?'Heats down to '+t+'°C outside, as in the product table':'Ngroh deri në '+t+'°C jashtë, sipas tabelës së produktit'},
  kWhyLowNo:["Kufiri i temperaturës së jashtme për ngrohje nuk është i publikuar; e konfirmojmë në ofertë","The lowest outdoor temperature for heating is not published; we confirm it in the quotation"],
  kWhyRooms:function(r){return EN?'Connects '+r+' indoor units; we choose them with you, room by room':'Lidh '+r+' njësi të brendshme; i zgjedhim bashkë me ju, sipas dhomave'},
  kWith:function(o,i){return o+(EN?', with indoor units ':', me njësitë e brendshme ')+i},
  kRooms:["Dhoma","Rooms"],
  kNoTemp:["Asnjë model i këtij lloji në gamën tonë nuk ngroh deri në këtë temperaturë. Na shkruani dhe e shohim bashkë.","None of our models of this type heats down to this temperature. Write to us and we look at it together."],
  kTooBig:function(c,h,multi,n){
    var vrf='<a class="text-link" href="vrf.html">'+(EN?'the VRF systems':'sistemet VRF')+'</a>',up=EN?'up to '+c+' kW cooling'+(h?', '+h+' kW heating':''):'deri '+c+' kW ftohje'+(h?', '+h+' kW ngrohje':'');
    if(multi)return EN?'This is more than our multi-split units for '+n+' rooms can give ('+up+'). See '+vrf+', or write to us.':'Kjo nevojë kalon njësitë tona multi-split për '+n+' dhoma ('+up+'). Shihni '+vrf+', ose na shkruani.';
    return EN?'This is more than our models of this type can give ('+up+'). Try another unit type, see '+vrf+', or write to us.':'Kjo nevojë kalon modelet e këtij lloji në gamën tonë ('+up+'). Provoni një lloj tjetër njësie, shihni '+vrf+', ose na shkruani.';
  },
  kDisc:["Ky vlerësim orientues bazohet në të dhënat e deklaruara dhe në supozimet e metodës së llogaritjes. Përzgjedhja përfundimtare kërkon verifikimin e nevojës për ftohje dhe ngrohje të dhomave dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë. Udhëzuesi supozon tavan 2,4 m: për tavan më të lartë nevoja për ftohje rritet në përpjesëtim. Fuqitë e modeleve janë nominale, si në tabelat e produkteve; kur jashtë është ftohtë, fuqia ngrohëse është më e ulët.","This indicative estimate is based on the information entered and the calculation method’s assumptions. Final selection requires verification of the rooms’ cooling and heating demand and equipment output at the relevant operating conditions. Contact our team for technical selection or system design. The guide assumes a 2.4 m ceiling: a higher ceiling needs proportionally more cooling. Model capacities are nominal, as in the product tables; in cold weather the heating output is lower."],
  kSrc:['Ftohja: <a class="text-link" href="'+DAIKIN+'" target="_blank" rel="noopener">udhëzuesi i Daikin</a>. Ngrohja: vlerat orientuese për m² nga <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.','Cooling: <a class="text-link" href="'+DAIKIN+'" target="_blank" rel="noopener">Daikin’s sizing guide</a>. Heating: guide values per m² from <a class="text-link" href="https://www.hvaceduhub.com/resources" target="_blank" rel="noopener">HVAC Education Hub</a>.'],
  kLiv:function(c,n){return EN?'Required cooling '+c+' kW. '+n+' models.':'Fuqia ftohëse e nevojshme '+c+' kW. '+n+' modele.'},
  kPerRoom:function(s){return (EN?'; cooling by room: ':'; ftohja sipas dhomave: ')+s},
  kPdfNeed:function(c,h){return (EN?'Required power from the calculator: cooling '+c+' kW':'Fuqia e nevojshme sipas kalkulatorit: ftohje '+c+' kW')+(h?(EN?', heating ':', ngrohje ')+h+' kW':'')},
  kPdfNote:[["Ky vlerësim orientues bazohet në të dhënat e deklaruara dhe në supozimet e metodës së llogaritjes. Përzgjedhja përfundimtare kërkon verifikimin e nevojës për ftohje dhe ngrohje të dhomave dhe të kapacitetit të pajisjes në kushtet e objektit. Për përzgjedhje teknike ose projektimin e sistemit, kontaktoni ekipin tonë."],["This indicative estimate is based on the information entered and the calculation method’s assumptions. Final selection requires verification of the rooms’ cooling and heating demand and equipment output at the relevant operating conditions. Contact our team for technical selection or system design."]]
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
  $id('tempF').hidden=$id('h-temp').hidden=false;
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
/* one room (split) or two to five rooms (multi-split); with multi-split each room has its own area and sun, and the unit type and
   the number of people are not asked (the indoor units are chosen with our team, as the multi-split page says) */
function acRead(){
  var multi=radio('ksys')==='multi',nr=parseInt(radio('knum'),10)||2,rooms=[];
  if(multi)for(var i=1;i<=nr;i++)rooms.push({i:i,area:parseFloat($id('c-kr'+i).value),sun:$id('c-ks'+i).checked,n:0});
  else rooms.push({i:0,area:parseFloat($id('c-karea').value),sun:radio('ksun')==='yes',n:parseInt($id('c-kpeople').value,10)});
  return {multi:multi,nr:nr,rooms:rooms,heat:radio('kheat')!=='no',t:parseFloat($id('c-temp').value),ins:$id('c-ins').value,type:radio('ktype')};
}
function acValidate(a){
  var ok=true;
  a.rooms.forEach(function(r){ok=mark(a.multi?'kr'+r.i:'karea',inRange(r.area,5,Infinity))&&ok});
  if(!a.multi)ok=mark('kpeople',inRange(a.rooms[0].n,1,20))&&ok;
  /* the outdoor temperature counts only for heating */
  if(a.heat)ok=mark('temp',inRange(a.t,-30,0))&&ok;
  return ok;
}
function acShow(a){
  $id('kOne').hidden=a.multi;
  $id('kRooms').hidden=!a.multi;
  [].forEach.call(form.querySelectorAll('.k-room'),function(el,i){el.hidden=i>=a.nr});
  $id('kSunQ').hidden=$id('kPeopleQ').hidden=$id('kTypeQ').hidden=a.multi;
  $id('tempF').hidden=$id('h-temp').hidden=!a.heat;
}
function r2(v){return Math.round(v*100)/100}
/* cooling per room from Daikin's guide (AC_KW and the rest, above); heating with the heat pump's heat loss table, room by room */
function acCompute(a){
  var w=lossAt(LOSS[a.ins],a.t),weak=a.ins==='none'||a.ins==='poor',c=0,h=0,area=0;
  var rooms=a.rooms.map(function(r){
    var base=r.area*AC_KW,cool=base*(r.sun?1+AC_SUN:1)*(weak?1+AC_INS:1)+(r.n>2?(r.n-2)*AC_PERSON:0),heat=a.heat?w*r.area/1000:0;
    c+=cool;h+=heat;area+=r.area;
    return {i:r.i,area:r.area,sun:r.sun,n:r.n,base:r2(base),cool:r2(cool),heat:r2(heat)};
  });
  return {w:w,weak:weak,rooms:rooms,area:area,cool:r2(c),heat:a.heat?r2(h):0};
}
/* the sizes the answers allow: split, every size of the chosen unit type; multi-split, every outdoor unit for that many rooms.
   For heating, a model whose published heating range stops above the outdoor temperature is left out. */
function acPool(a,R){
  var list=[];
  if(a.multi)AC_MULTI.forEach(function(u){if(a.nr>=u.r[0]&&a.nr<=u.r[1])list.push({p:u,s:u.s})});
  else AC_SPLIT.forEach(function(f){if(f.t===a.type)f.s.forEach(function(s){list.push({p:f,s:s})})});
  return list.filter(function(it){return !R.heat||it.s[6]===null||it.s[6]<=a.t});
}
/* the same match as the heat pump: enough cooling (and heating, when asked), less than double, closest first, then the higher SEER.
   Here the need that the model covers most tightly counts. Our smallest size of the type stays allowed even above double, because
   nothing smaller exists for a small room (it then carries the "much larger" note). Split shows the smallest fitting size of each
   family. The client's rule from the heat pumps: Fujitsu first, with one of the five places kept for another brand when one fits. */
function acPick(a,R){
  var C=R.cool,H=R.heat,pool=acPool(a,R),small=Math.min.apply(null,pool.map(function(it){return it.s[2]})),fits=[];
  pool.forEach(function(it){
    var c=it.s[2],h=it.s[3],k;
    if(c<C||(H&&h<H))return;
    k=Math.min(c/C,H?h/H:Infinity);
    if(k>=2&&c>small)return;
    fits.push({p:it.p,s:it.s,c:c,h:h,k:k});
  });
  if(!a.multi){
    var seen={};
    fits.sort(function(x,y){return x.c-y.c});
    fits=fits.filter(function(it){if(seen[it.p.id])return false;seen[it.p.id]=1;return true});
  }
  fits.sort(function(x,y){return Math.abs(x.k-y.k)>1e-9?x.k-y.k:y.s[4]-x.s[4]});
  var fj=fits.filter(isFujitsu),oth=fits.filter(function(it){return !isFujitsu(it)}),fjTake=fj.slice(0,5-Math.min(1,oth.length));
  return {list:fjTake.concat(oth.slice(0,5-fjTake.length)),pool:pool};
}
function acEmpty(a,R,P){
  if(!P.pool.length)return L(T.kNoTemp);
  var mc=Math.max.apply(null,P.pool.map(function(it){return it.s[2]})),mh=Math.max.apply(null,P.pool.map(function(it){return it.s[3]}));
  if(R.cool>mc||(R.heat&&R.heat>mh))return T.kTooBig(num(mc),R.heat?num(mh):'',a.multi,a.nr);
  return L(T.noneFit);
}
function labelText(id){var l=form.querySelector('label[for="'+id+'"]');return l?l.textContent.trim():''}
function acKey(it){return it.p.id+'|'+it.s[0]+'|'+it.s[1]}
function acName(it){return L(it.p.n)+', '+num(it.c)+' kW'}
/* split: indoor + outdoor model; multi-split: the outdoor model, with its indoor units when the table names them (HEC Tide dual) */
function acCodes(s,multi){return !multi?s[0]+' + '+s[1]:s[0]?T.kWith(s[1],s[0]):s[1]}
function acRoomsText(r){return r[0]===r[1]?String(r[0]):r[0]+(EN?' to ':' deri ')+r[1]}
function acCard(it,i,a,R){
  var page=it.p.id.replace(/^([^#]*)/,'$1.html'),H=R.heat,
      why=[T.kWhyCool(num(it.c),num(R.cool))];
  if(H)why.push(T.kWhyHeat(num(it.h),num(H)));
  if(it.s[4])why.push(T.kWhySeer(num(it.s[4])));
  if(H&&it.s[5])why.push(T.kWhyScop(num(it.s[5])));
  if(H)why.push(it.s[6]===null?L(T.kWhyLowNo):T.kWhyLow(deg(it.s[6])));
  if(a.multi&&!it.s[0])why.push(T.kWhyRooms(acRoomsText(it.p.r)));
  var specs='<div><dt>'+L(T.cool)+'</dt><dd>'+num(it.c)+' kW</dd></div><div><dt>'+L(T.heat)+'</dt><dd>'+num(it.h)+' kW</dd></div>'+
    (it.s[4]?'<div><dt>SEER</dt><dd>'+num(it.s[4])+'</dd></div>':a.multi?'<div><dt>'+L(T.kRooms)+'</dt><dd>'+acRoomsText(it.p.r)+'</dd></div>':'');
  return '<li class="rp" data-key="'+esc(acKey(it))+'"><a class="rp-img" href="'+page+'" tabindex="-1" aria-hidden="true"><img src="'+ROOT+'assets/products/'+it.p.img+'" width="840" height="560" loading="lazy" alt=""></a><div class="rp-body">'+
    '<p class="rp-top"><span class="pkick">'+esc(a.multi?'Multi-split':labelText('c-ktype-'+a.type))+'</span>'+(i===0&&it.k<1.5?'<span class="rp-best">'+L(T.best)+'</span>':'')+'<button class="rp-pick" type="button" aria-pressed="false">'+L(T.pick)+'</button></p>'+
    '<h4 class="rp-name"><a href="'+page+'">'+esc(acName(it))+'</a></h4>'+
    '<p class="rp-tank">'+esc(acCodes(it.s,a.multi))+'</p>'+
    '<dl class="pspecs">'+specs+'</dl>'+
    '<p class="rp-whyh">'+L(T.why)+'</p><ul class="rp-why"><li>'+why.map(esc).join('</li><li>')+'</li></ul>'+
    (it.k>=1.5?'<p class="rp-warn">'+esc(L(T.over))+'</p>':'')+
    '<div class="rp-cta"><a class="text-link" href="'+page+'">'+L(T.view)+'</a></div>'+
    '</div></li>';
}
function acResult(a){
  var R=acCompute(a),P=acPick(a,R),how;
  if(a.multi)how=T.kMultiHow(num(R.cool),R.weak?T.kIns(a.ins):'');
  else{
    var r=R.rooms[0],parts=[];
    if(r.sun)parts.push(T.kSun());
    if(R.weak)parts.push(T.kIns(a.ins));
    if(r.n>2)parts.push(T.kPeople(r.n,num(r2((r.n-2)*AC_PERSON))));
    how=T.kHow(num(r.area),num(r.base),parts);
  }
  if(a.heat)how+=T.kHeatHow(num(Math.round(R.w*10)/10),deg(a.t),num(R.area),num(R.heat));
  var html='<h2 class="res-title">'+L(T.res)+'</h2><div class="res-nums">'+
    '<div class="res-num"><p class="res-nl">'+L(T.kCool)+'</p><p class="res-kw">'+num(R.cool)+'<small>kW</small></p></div>'+
    (a.heat?'<div class="res-num"><p class="res-nl">'+L(T.kHeat)+'</p><p class="res-kw">'+num(R.heat)+'<small>kW</small></p></div>':'')+
    '</div><p class="res-how">'+esc(how)+'</p>';
  if(a.multi)html+='<ul class="res-rooms">'+R.rooms.map(function(r){return '<li>'+esc(T.kRoom(fieldLabel('c-kr'+r.i),num(r.area),r.sun?labelText('c-ks'+r.i):'',num(r.cool),a.heat?num(r.heat):''))+'</li>'}).join('')+'</ul>';
  html+='<h3 class="res-lt">'+T.list(P.list.length)+'</h3>';
  if(P.list.length)html+='<p class="res-pick-help">'+esc(L(T.pickHelp))+'</p><ul class="rp-list">'+P.list.map(function(it,i){return acCard(it,i,a,R)}).join('')+'</ul>';
  else html+='<p class="res-alert">'+acEmpty(a,R,P)+'</p>';
  html+='<p class="res-disc">'+esc(L(T.kDisc))+' '+L(T.kSrc)+'</p>';
  return {html:html,msg:T.kLiv(num(R.cool),P.list.length)};
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
  var rows=[choiceRow('ksys'),choiceRow('kheat')];
  if(a.multi){
    rows.push(choiceRow('knum'));
    a.rooms.forEach(function(r){rows.push([fieldLabel('c-kr'+r.i),num(r.area)+' m²'+(r.sun?', '+labelText('c-ks'+r.i).toLowerCase():'')])});
  }else rows.push([fieldLabel('c-karea'),num(a.rooms[0].area)+' m²']);
  if(a.heat)rows.push(tempRow(a));
  rows.push([fieldLabel('c-ins'),optionText('c-ins')]);
  if(!a.multi)rows.push(choiceRow('ksun'),[fieldLabel('c-kpeople'),String(a.rooms[0].n)],choiceRow('ktype'));
  return insHelpRows(rows);
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
['c-year','c-facade','c-win'].forEach(function(id){$id(id).addEventListener('change',assess)});

/* ---------- which calculator: heat pump or air conditioner ---------- */
/* each one's sums, answers and chosen product, behind the same names, so the page, the PDF and the email work the same for both */
var MODES={
  hp:{read:read,validate:validate,show:hpShow,result:hpResult,key:keyOf,answers:pdfAnswers,name:chosenName,more:chosenExtras,
      calc:function(a){var R=compute(a);return {R:R,P:pick(a,R)}},
      after:function(a,it){return a.emit==='rad'?[T.out55(num(it.cap))]:[]},
      need:function(R){return T.pdfNeed(num(R.need))},note:T.pdfNote},
  ac:{read:acRead,validate:acValidate,show:acShow,result:acResult,key:acKey,answers:acAnswers,name:acName,
      more:function(a,P,it){return [acCodes(it.s,a.multi)]},
      calc:function(a){var R=acCompute(a);return {R:R,P:acPick(a,R)}},
      after:function(){return []},
      /* with multi-split the team also sees each room's cooling, since the indoor units are chosen room by room */
      need:function(R){
        var s=T.kPdfNeed(num(R.cool),R.heat?num(R.heat):'');
        if(R.rooms.length>1)s+=T.kPerRoom(R.rooms.map(function(r){return fieldLabel('c-kr'+r.i)+' '+num(r.cool)+' kW'}).join(', '));
        return s;
      },note:T.kPdfNote}
};
/* the switch: tabs that also answer the arrow keys; the address keeps the choice (#kondicioner, #air-conditioner),
   and so does the language link */
var tabs=[].slice.call(document.querySelectorAll('.mode-tab')),AC_HASH=/^#(kondicioner|klima|air-conditioner)$/i;
function setMode(m){
  if(!MODES[m])return;
  mode=m;
  var sw=document.querySelector('.calc-switch'),lang=document.querySelector('.lang-sw');
  if(sw)sw.setAttribute('data-on',m);
  tabs.forEach(function(t){var on=t.getAttribute('data-mode')===m;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});
  $id('calc').setAttribute('aria-labelledby','tab-'+m);
  [].forEach.call(document.querySelectorAll('.calc-mode,.calc-how'),function(el){el.hidden=el.getAttribute('data-mode')!==m});
  if(lang)lang.hash=m==='ac'?(EN?'kondicioner':'air-conditioner'):'';
  lastHtml='';
  render();
}
tabs.forEach(function(t,i){
  t.addEventListener('click',function(){
    var m=t.getAttribute('data-mode');
    if(m===mode)return;
    setMode(m);
    try{history.replaceState(null,'',m==='ac'?'#'+(EN?'air-conditioner':'kondicioner'):location.pathname+location.search)}catch(err){}
  });
  t.addEventListener('keydown',function(e){
    var k=e.key,j=k==='Home'?0:k==='End'?tabs.length-1:k==='ArrowRight'?(i+1)%tabs.length:k==='ArrowLeft'?(i+tabs.length-1)%tabs.length:-1;
    if(j<0)return;
    e.preventDefault();tabs[j].click();tabs[j].focus();
  });
});
addEventListener('hashchange',function(){if(AC_HASH.test(location.hash))setMode('ac')});
setMode(AC_HASH.test(location.hash)?'ac':'hp');
})();
