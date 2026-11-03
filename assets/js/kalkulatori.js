/* The home calculator (kalkulatori.html and en/kalkulatori.html).
   Five short steps of questions, then a preliminary estimate: which kinds of system suit the home, a capacity range
   from transparent rule-of-thumb figures (not a load calculation), and products from our own range with links.
   Nothing is sent anywhere: answers stay in the browser, and the optional request opens the visitor's email app,
   the same way the contact form does. Every text is given in Albanian and English: [sq, en]. */
(function(){
'use strict';
var box=document.getElementById('calc');
if(!box)return;
var EN=(document.documentElement.lang||'').slice(0,2).toLowerCase()==='en',LI=EN?1:0;
var BIZ={email:'info@comfort-clima.com',phone:'+383 48 77 22 88',tel:'+38348772288'};
function $(s,c){return (c||document).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function L(a){return a[LI]}
function has(arr,v){return Array.isArray(arr)&&arr.indexOf(v)>-1}

/* numbers: Albanian pages use a decimal comma and a dot between thousands */
function fmt(v,dec){var s=v.toFixed(dec);if(!EN)s=s.replace('.',',');return s}
function fmtInt(v){return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g,EN?',':'.')}
function fmtKw(v){return Math.abs(v-Math.round(v))<.01?fmt(v,0):fmt(v,1)}
function num(v){if(v==null||v==='')return NaN;v=String(v).replace(/\s/g,'').replace(',','.');return /^\d+(\.\d+)?$/.test(v)?parseFloat(v):NaN}

/* ---------- texts ---------- */
var T={
  optional:["(jo e detyrueshme)","(optional)"],
  stepOf:function(i,n){return EN?'Step '+i+' of '+n:'Hapi '+i+' nga '+n},
  steps:[["Vendndodhja","Location"],["Shtëpia","Your home"],["Ndërtesa","The building"],["Sistemi","Heating and cooling"],["Preferencat","Preferences"],["Vlerësimi","Your estimate"]],
  next:["Vazhdo","Continue"],see:["Shihni vlerësimin","See the estimate"],back:["Prapa","Back"],
  busy:["Po përgatitet vlerësimi…","Preparing your estimate…"],
  ready:["Vlerësimi është gati.","Your estimate is ready."],
  errTitle:function(n){return EN?'Please check '+(n===1?'1 answer':n+' answers')+' before you continue:':'Kontrolloni '+(n===1?'1 përgjigje':n+' përgjigje')+' para se të vazhdoni:'},
  errChoose:["Zgjidhni një përgjigje.","Please choose an answer."],
  errFill:["Plotësoni këtë fushë.","Please fill in this field."],
  errPlace:["Shkruani qytetin ose kodin postar.","Enter the town or the postal code."],
  errPostal:function(c){var d={KS:5,AL:4,MK:4,ME:5,RS:5}[c],ex={KS:'10000',AL:'1001',MK:'1000',ME:'81000',RS:'11000'}[c];
    if(!d)return EN?'Check the postal code.':'Kontrolloni kodin postar.';
    return EN?'This postal code should have '+d+' digits, for example '+ex+'.':'Ky kod postar duhet të ketë '+d+' shifra, p.sh. '+ex+'.'},
  errArea:function(a,b,u){return EN?'Enter an area from '+fmtInt(a)+' to '+fmtInt(b)+' '+u+'.':'Shkruani një sipërfaqe nga '+fmtInt(a)+' deri '+fmtInt(b)+' '+u+'.'},
  errInt:function(a,b){return EN?'Enter a whole number from '+a+' to '+b+'.':'Shkruani një numër të plotë nga '+a+' deri '+b+'.'},
  unit:{m2:'m²',ft2:'ft²'},
  /* result */
  kicker:["Vlerësimi paraprak","Preliminary estimate"],
  title:["Çfarë i shkon shtëpisë suaj","What suits your home"],
  sumFor:function(area,place,needs,rooms){return EN?'For about '+area+(place?' in '+place:'')+': '+needs+', '+rooms+(rooms==='1'?' space.':' spaces.'):'Për rreth '+area+(place?' në '+place:'')+': '+needs+', '+rooms+(rooms==='1'?' hapësirë.':' hapësira.')},
  needsTxt:{heat:["ngrohje","heating"],cool:["ftohje","cooling"],both:["ngrohje dhe ftohje","heating and cooling"]},
  heatL:["Ngrohja","Heating"],coolL:["Ftohja","Cooling"],
  heatSub:["Fuqia e përafërt për ditët më të ftohta","Rough output needed on the coldest days"],
  coolSub:["Fuqia e përafërt për ditët më të nxehta","Rough output needed on the hottest days"],
  to:[" deri "," to "],about:["rreth ","about "],
  btu:function(lo,hi){return (EN?'about ':'rreth ')+fmtInt(lo)+(EN?' to ':' deri ')+fmtInt(hi)+' BTU/h'},
  noNum:["Nuk japim fuqi në kW, sepse mungojnë të dhënat kryesore për ndërtesën: viti i ndërtimit, izolimi dhe dritaret. Llojin e sistemit e sugjerojmë më poshtë; masën e caktojmë pasi ta shohim shtëpinë.",
    "We are not giving a capacity in kW, because the key facts about the building are missing: its age, insulation and windows. The kind of system is suggested below; the size is set once we have seen the home."],
  tooBig:["Për një shtëpi mbi 600 m² një vlerësim nga pyetësori nuk është i besueshëm. Ju sugjerojmë llojin e sistemit; fuqinë e llogarit ekipi ynë sipas planimetrisë.",
    "For a home over 600 m² an estimate from a questionnaire is not reliable. The kind of system is suggested below; our team works out the capacity from the floor plan."],
  primaryH:["Sistemi që sugjerojmë","Our suggestion"],altH:["Mundësi të tjera","Other options"],extraH:["Mund t'ju interesojë edhe","You may also want"],
  prodH:["Nga produktet tona","From our range"],
  seeAll:function(t){return (EN?'All ':'Të gjitha: ')+t},
  factorsH:["Çfarë ndikoi në vlerësim","What shaped the estimate"],checksH:["Çfarë duhet verifikuar në vend","What needs checking on site"],
  methodH:["Si u llogarit","How it was worked out"],answersH:["Përgjigjet tuaja","Your answers"],
  disc:["Ky është një vlerësim paraprak nga një pyetësor, jo projektim. Zgjedhja përfundimtare e sistemit dhe e fuqisë kërkon një instalues ose inxhinier të kualifikuar dhe një llogaritje të ngarkesës termike dhomë për dhomë, p.sh. sipas EN 12831 për ngrohjen (ose ACCA Manual J, ku zbatohet). Nuk garantojmë kursim energjie, madhësi të saktë, përputhje me rregullat apo përshtatshmëri vetëm nga këto përgjigje.",
    "This is a preliminary estimate from a questionnaire, not a design. The final choice of system and capacity needs a qualified installer or engineer and a room-by-room heat load calculation, for example to EN 12831 for heating (or ACCA Manual J where it applies). We do not guarantee energy savings, exact sizing, compliance or suitability from these answers alone."],
  ask:["Kërkoni vlerësim nga ekipi ynë","Ask our team for an assessment"],print:["Printoni","Print"],share:["Ndani lidhjen","Share the link"],
  edit:["Ndryshoni përgjigjet","Change your answers"],restart:["Nisni nga fillimi","Start again"],
  copied:["Lidhja u kopjua.","Link copied."],copyFail:["Kopjojeni lidhjen më poshtë:","Copy the link below:"],shareTitle:["Vlerësimi im nga Comfort Clima","My estimate from Comfort Clima"],
  shared:["Ky vlerësim u hap nga një lidhje e ndarë. Mund t'i ndryshoni përgjigjet kur të doni.","This estimate was opened from a shared link. You can change the answers at any time."],
  fail:["Diçka nuk shkoi gjatë llogaritjes. Provoni përsëri, ose na telefononi në ","Something went wrong while working out the estimate. Please try again, or call us on "],
  /* the request form */
  askH:["Doni ta shohim shtëpinë?","Would you like us to look at the home?"],
  askP:["Na lini emrin dhe një mënyrë kontakti. Butoni hap aplikacionin tuaj të emailit me kërkesën dhe vlerësimin të shkruar; ju vetëm shtypni Dërgo.","Leave your name and a way to reach you. The button opens your email app with the request and this estimate written out; you just press Send."],
  fName:["Emri dhe mbiemri","Full name"],fPhone:["Telefoni","Phone"],fEmail:["Emaili","Email"],
  fMethod:["Si t'ju kontaktojmë?","How should we contact you?"],fTime:["Koha më e mirë për t'ju kontaktuar","Best time to contact you"],fMsg:["Mesazhi","Message"],
  methods:[['phone',"Telefon","Phone"],['email',"Email","Email"],['viber',"Viber","Viber"],['whatsapp',"WhatsApp","WhatsApp"]],
  times:[['',"Kurdo","Any time"],['am',"Paradite, 08:00 deri 12:00","Morning, 08:00 to 12:00"],['pm',"Pasdite, 12:00 deri 17:00","Afternoon, 12:00 to 17:00"],['eve',"Pas orës 17:00","After 17:00"]],
  consent:["Pajtohem që Comfort Clima t'i përdorë këto të dhëna vetëm për t'u lidhur me mua për këtë kërkesë.","I agree that Comfort Clima may use these details only to contact me about this request."],
  privacy:["Asgjë nuk dërgohet nga kjo faqe: kërkesa niset vetëm kur e dërgoni vetë nga emaili juaj.","Nothing is sent from this page: the request only goes when you send it yourself from your email."],
  send:["Hapni emailin me kërkesën","Open the email with the request"],
  eName:["Shkruani emrin.","Enter your name."],eContact:["Shkruani telefonin ose emailin.","Enter a phone number or an email."],
  ePhone:["Kontrolloni numrin e telefonit.","Check the phone number."],eEmail:["Kontrolloni adresën e emailit.","Check the email address."],
  eNeedPhone:["Për këtë mënyrë kontakti na duhet telefoni.","We need a phone number for this way of contact."],eNeedEmail:["Për këtë mënyrë kontakti na duhet emaili.","We need an email address for this way of contact."],
  eConsent:["Na duhet pëlqimi juaj për t'ju kontaktuar.","We need your agreement to contact you."],
  doneH:["Kërkesa juaj është gati.","Your request is ready."],
  doneP:["Duhet të jetë hapur aplikacioni i emailit me kërkesën. Shtypni Dërgo atje dhe ne ju kontaktojmë. Nëse nuk u hap asgjë, na telefononi në ","Your email app should have opened with the request. Press Send there and we will get back to you. If nothing opened, call us on "],
  mailAgain:["Hapni emailin përsëri","Open the email again"],editReq:["Ndryshoni kërkesën","Edit the request"],
  subject:["Kërkesë për vlerësim nga kalkulatori","Assessment request from the calculator"],
  mailEst:["VLERËSIMI PARAPRAK","PRELIMINARY ESTIMATE"],mailAns:["PËRGJIGJET","ANSWERS"],mailLink:["Lidhja e vlerësimit","Link to the estimate"],
  mailSys:["Sistemi i sugjeruar","Suggested system"],mailAlt:["Mundësi të tjera","Other options"],mailProd:["Produkte","Products"],mailNo:["nuk u dha fuqi","no capacity given"]
};

/* ---------- the questions, step by step ---------- */
/* type: radio, check, text, num (decimal), int, select. req: required. show: when the question applies,
   "name=a|b&name2!=c" (and), several groups joined with ";" (or). half: half width. */
var UNSURE=['unsure',"Nuk e di","Not sure"];
var Q=[
 {t:T.steps[0],h:["Vendndodhja na tregon klimën. Faqja nuk e nxjerr dot klimën me saktësi nga adresa, prandaj ju pyesim për të më poshtë.","Location tells us about the climate. The page cannot reliably work out the climate from an address, so we ask about it below."],q:[
  {n:'country',type:'select',l:["Shteti","Country"],def:'KS',half:1,o:[['KS',"Kosova","Kosovo"],['AL',"Shqipëria","Albania"],['MK',"Maqedonia e Veriut","North Macedonia"],['ME',"Mali i Zi","Montenegro"],['RS',"Serbia","Serbia"],['XX',"Tjetër","Other"]]},
  {n:'city',type:'text',l:["Qyteti ose fshati","Town or village"],ph:["P.sh. Prizren","For example Prizren"],ac:'address-level2',half:1,h:["Shkruani qytetin, kodin postar ose të dyja.","Enter the town, the postal code or both."],max:60},
  {n:'postal',type:'text',l:["Kodi postar","Postal code"],opt:1,ph:["P.sh. 10000","For example 10000"],ac:'postal-code',half:1,max:10},
  {n:'clim',type:'radio',req:1,l:["Si është klima në zonën tuaj?","What is the climate like where you live?"],h:["Vlerësimi nis nga një klimë kontinentale me dimra të ftohtë dhe vera të nxehta, si në pjesën më të madhe të Kosovës.","The estimate starts from a continental climate with cold winters and hot summers, as in most of Kosovo."],
   o:[['norm',"E zakonshme","Typical"],['cold',"Dimër shumë i ftohtë, p.sh. zonë malore","Very cold winters, for example in the mountains"],['hot',"Verë shumë e nxehtë","Very hot summers"],['both',"Të dyja","Both"],UNSURE]},
  {n:'humid',type:'check',opt:1,l:["Zona juaj ka edhe:","Your area also has:"],o:[['humid',"Lagështi të lartë, ose është pranë detit","High humidity, or it is near the sea"]]},
  {n:'utility',type:'text',opt:1,l:["Furnizuesi i energjisë","Energy supplier"],ph:["P.sh. KESCO ose Termokos","For example KESCO or Termokos"],max:60}
 ]},
 {t:T.steps[1],h:["Na duhen vetëm hapësirat që do t'i ngrohni ose ftohni.","We only need the spaces you want to heat or cool."],q:[
  {n:'hometype',type:'radio',req:1,l:["Çfarë lloj banimi është?","What kind of home is it?"],o:[['house',"Shtëpi e veçantë","Detached house"],['row',"Shtëpi në rresht ose dyshe","Terraced or semi-detached house"],['apt',"Banesë në ndërtesë","Apartment"]]},
  {n:'aptpos',type:'radio',req:1,show:'hometype=apt',l:["Në cilin kat është banesa?","Which floor is the apartment on?"],o:[['top',"Kati i fundit, nën çati","Top floor, under the roof"],['mid',"Kat i ndërmjetëm","A middle floor"],['ground',"Përdhese ose mbi garazh","Ground floor or above a garage"]]},
  {n:'area',type:'num',req:1,half:1,l:["Sipërfaqja që do të ngrohni ose ftohni","Area you want to heat or cool"],ph:["P.sh. 110","For example 110"],unit:1,
   tip:[["Çfarë llogaritet?","What counts?"],["Sipërfaqja e ngrohur ose e ftohur: dhomat ku jetoni, pa garazhin, depon, bodrumin e pashfrytëzuar dhe ballkonet e hapura. Mjafton një vlerë e përafërt.","The conditioned area: the rooms you live in, without the garage, storage, an unused basement or open balconies. A rough figure is enough."]]},
  {n:'unit',type:'radio',half:1,small:1,l:["Njësia","Unit"],def:'m2',o:[['m2',"m²","m²"],['ft2',"ft²","ft²"]]},
  {n:'floors',type:'select',req:1,half:1,show:'hometype=house|row',l:["Sa kate ka shtëpia?","How many floors?"],def:'2',o:[['1',"1","1"],['2',"2","2"],['3',"3","3"],['4',"4 ose më shumë","4 or more"]]},
  {n:'bedrooms',type:'int',req:1,half:1,l:["Dhoma gjumi","Bedrooms"],ph:["P.sh. 2","For example 2"]},
  {n:'bathrooms',type:'int',req:1,half:1,l:["Banjo","Bathrooms"],ph:["P.sh. 1","For example 1"]},
  {n:'extra',type:'check',opt:1,l:["A përdorni rregullisht edhe këto hapësira?","Do you also use any of these regularly?"],h:["Shënoni vetëm ato që nuk i keni përfshirë në sipërfaqen më sipër.","Tick only those not included in the area above."],
   o:[['basement',"Bodrum i rregulluar","Finished basement"],['attic',"Papafingo ose nënkulm","Attic room"],['ext',"Shtesë","Extension"]]},
  {n:'extraArea',type:'num',req:1,half:1,unit:1,show:'extra=basement|attic|ext',l:["Sa është sipërfaqja e tyre gjithsej?","What is their total area?"],ph:["P.sh. 25","For example 25"]},
  {n:'rooms',type:'int',req:1,half:1,l:["Sa hapësira të veçanta doni të ngrohni ose ftohni?","How many separate spaces do you want to heat or cool?"],ph:["P.sh. 3","For example 3"],
   h:["Sallon me kuzhinë të hapur llogaritet një. P.sh. sallon dhe dy dhoma gjumi: 3.","An open living room and kitchen counts as one. For example a living room and two bedrooms: 3."]},
  {n:'problem',type:'radio',req:1,l:["A keni dhoma që janë shpesh shumë të nxehta ose shumë të ftohta?","Are some rooms often too hot or too cold?"],o:[['no',"Jo","No"],['hot',"Po, shumë të nxehta","Yes, too hot"],['cold',"Po, shumë të ftohta","Yes, too cold"],['both',"Të dyja","Both"],UNSURE]}
 ]},
 {t:T.steps[2],h:["Nuk ju duhen matje. Zgjidhni atë që i përngjan më shumë, ose “Nuk e di”: vlerësimi e merr parasysh.","No measurements needed. Pick the closest answer, or “Not sure”: the estimate allows for it."],q:[
  {n:'age',type:'radio',req:1,l:["Kur është ndërtuar?","When was it built?"],o:[['pre80',"Para 1980","Before 1980"],['y80',"1980 deri 1999","1980 to 1999"],['y00',"2000 deri 2014","2000 to 2014"],['y15',"2015 ose më vonë","2015 or later"],UNSURE]},
  {n:'walls',type:'radio',req:1,l:["Si janë të izoluar muret?","How well are the walls insulated?"],h:["P.sh. fasadë me stiropor ose lesh guri.","For example a facade with polystyrene or mineral wool."],o:[['good',"Mirë, fasadë e izoluar","Well, insulated facade"],['some',"Pak, ose izolim i vjetër","A little, or old insulation"],['none',"Pa izolim","No insulation"],UNSURE]},
  {n:'glazing',type:'radio',req:1,l:["Çfarë dritaresh keni?","What windows do you have?"],o:[['single',"Me një xham","Single glazed"],['double',"Me dy xhama","Double glazed"],['triple',"Me tre xhama","Triple glazed"],UNSURE]},
  {n:'winage',type:'radio',req:1,l:["Sa të vjetra janë dritaret?","How old are the windows?"],o:[['new',"Më pak se 15 vjet","Under 15 years"],['old',"Më shumë se 15 vjet","Over 15 years"],UNSURE]},
  {n:'drafts',type:'radio',req:1,l:["A hyn ajër i ftohtë nga dritaret, dyert ose çarjet?","Do you feel cold draughts from windows, doors or gaps?"],o:[['drafty',"Po, ndihet","Yes, noticeably"],['tight',"Jo shumë","Not really"],['sealed',"Janë mbyllur ose izoluar kohët e fundit","They were sealed recently"],UNSURE]},
  {n:'roof',type:'radio',req:1,show:'hometype=house|row;aptpos=top',l:["Si është izoluar çatia ose tavani i fundit?","How is the roof or top ceiling insulated?"],o:[['good',"Mirë","Well"],['poor',"Pak ose aspak","Little or not at all"],UNSURE]},
  {n:'feat',type:'check',opt:1,l:["A ka shtëpia ndonjë nga këto?","Does the home have any of these?"],o:[['highceil',"Tavane të larta, mbi rreth 3 m","High ceilings, over about 3 m"],['glass',"Xhama të mëdhenj ose mure me xham","Large windows or glass walls"]]},
  {n:'sun',type:'radio',req:1,l:["Sa diell merr shtëpia në verë?","How much sun does the home get in summer?"],o:[['shade',"Kryesisht hije","Mostly shaded"],['normal',"Mesatarisht","Average"],['strong',"Diell i fortë pasdite","Strong afternoon sun"],UNSURE]}
 ]},
 {t:T.steps[3],h:["Çfarë keni sot dhe çfarë doni të ndryshojë.","What you have today and what you want to change."],q:[
  {n:'needs',type:'radio',req:1,l:["Çfarë ju duhet?","What do you need?"],o:[['heat',"Ngrohje","Heating"],['cool',"Ftohje","Cooling"],['both',"Të dyja","Both"]]},
  {n:'project',type:'radio',req:1,l:["Çfarë lloj pune është?","What kind of project is it?"],o:[['replace',"Ndërrim i sistemit që kemi","Replacing what we have"],['add',"Shtëpia ekziston, por pa sistem të tillë","Existing home without such a system"],['newbuild',"Shtëpi në ndërtim","A home being built"],['ext',"Shtesë ose rinovim","Extension or renovation"]]},
  {n:'current',type:'check',req:1,show:'project!=newbuild',l:["Çfarë keni tani?","What do you have now?"],h:["Shënoni gjithçka që keni.","Tick everything you have."],
   o:[['boiler',"Kaldajë me radiatorë","Boiler with radiators"],['district',"Ngrohje qendrore e qytetit","District heating"],['splits',"Kondicionerë split","Split air conditioners"],['hp',"Pompë termike","Heat pump"],['elec',"Ngrohës elektrikë","Electric heaters"],['stove',"Sobë me dru","Wood stove"],['none',"Asgjë","Nothing"],UNSURE]},
  {n:'fuel',type:'radio',req:1,show:'needs=heat|both&project!=newbuild',l:["Me çfarë ngrohet shtëpia sot?","What heats the home today?"],
   o:[['elec',"Rrymë","Electricity"],['wood',"Dru ose pelet","Wood or pellets"],['oil',"Naftë","Heating oil"],['lpg',"Gaz i lëngshëm (LPG)","Bottled gas (LPG)"],['gas',"Gaz natyror","Natural gas"],['district',"Ngrohje qendrore","District heating"],['coal',"Qymyr","Coal"],['other',"Tjetër","Other"],UNSURE]},
  {n:'dist',type:'radio',req:1,l:["Si shpërndahet (ose do të shpërndahet) nxehtësia në shtëpi?","How is heat (or will heat be) distributed in the home?"],
   tip:[["Çfarë janë kanalet?","What is ductwork?"],["Kanalet janë tuba të mëdhenj ajri, zakonisht të fshehur në tavan, që e çojnë ajrin e ngrohtë ose të freskët te grilat në çdo dhomë. Radiatorët dhe ngrohja në dysheme punojnë me ujë.","Ductwork is a set of large air pipes, usually hidden in the ceiling, that carries warm or cool air to grilles in each room. Radiators and underfloor heating work with water."]],
   o:[['radiators',"Radiatorë me ujë","Radiators (hot water)"],['underfloor',"Ngrohje në dysheme","Underfloor heating"],['ducts',"Kanale ajri me grila","Air ducts with grilles"],['none',"Asnjë, çdo dhomë veç","None, each room on its own"],UNSURE]},
  {n:'radok',type:'radio',req:1,show:'dist=radiators&needs=heat|both',l:["A ngrohen mirë të gjitha dhomat me radiatorët në ditët më të ftohta?","Do the radiators keep every room warm on the coldest days?"],o:[['yes',"Po","Yes"],['no',"Jo, disa dhoma mbeten të ftohta","No, some rooms stay cold"],UNSURE]},
  {n:'ductage',type:'radio',req:1,show:'dist=ducts',l:["Në çfarë gjendje janë kanalet?","What condition are the ducts in?"],o:[['good',"Mirë, pa probleme","Good, no problems"],['issues',"Të vjetra, me zhurmë, pak ajër ose rrjedhje","Old, noisy, weak airflow or leaks"],UNSURE]},
  {n:'ductreuse',type:'radio',req:1,show:'dist=ducts',l:["Doni t'i përdorni kanalet që keni?","Would you like to reuse the ducts?"],o:[['yes',"Po, nëse janë në rregull","Yes, if they are fine"],['open',"Jam i hapur edhe për njësi pa kanale","I am also open to ductless units"],UNSURE]},
  {n:'ductless',type:'radio',req:1,show:'dist=none|unsure',l:["A ju shkojnë njësi në mur ose në dysheme nëpër dhoma?","Are wall or floor units in the rooms acceptable?"],o:[['yes',"Po","Yes"],['hidden',"Preferoj që të mos duken","I would rather not see them"],UNSURE]}
 ]},
 {t:T.steps[4],h:["Na tregoni çfarë ka më shumë rëndësi për ju.","Tell us what matters most to you."],q:[
  {n:'priority',type:'radio',req:1,l:["Çfarë ka më shumë rëndësi?","What matters most?"],o:[['upfront',"Kosto më e ulët në fillim","Lower upfront cost"],['running',"Shpenzime më të ulëta mujore","Lower running costs"],['comfort',"Rehati","Comfort"],['quiet',"Punë e qetë","Quiet operation"],['iaq',"Ajër i pastër brenda","Clean indoor air"],['env',"Më pak ndikim në ambient","Lower environmental impact"]]},
  {n:'pref',type:'radio',req:1,def:'rec',l:["A keni ndonjë sistem në mendje?","Do you have a system in mind?"],
   o:[['rec',"Më rekomandoni","Recommend what fits"],['ductless',"Kondicionerë pa kanale (split, multi-split)","Ductless units (split, multi-split)"],['ducted',"Sistem me kanale","Ducted system"],['atw',"Pompë termike për radiatorë ose dysheme","Heat pump for radiators or underfloor"],['keep',"Mbaj kaldajën ose ngrohjen qendrore dhe shtoj kondicionerë","Keep the boiler or district heating and add air conditioners"]]},
  {n:'dhw',type:'radio',req:1,show:'needs=heat|both',l:["Doni edhe ujë të ngrohtë sanitar nga i njëjti sistem?","Should the same system also make hot water?"],o:[['yes',"Po","Yes"],['no',"Jo","No"],UNSURE]},
  {n:'people',type:'int',opt:1,half:1,l:["Sa persona jetojnë zakonisht në shtëpi?","How many people usually live there?"],ph:["P.sh. 4","For example 4"]},
  {n:'special',type:'text',opt:1,half:1,l:["Dhoma me nevoja të veçanta","Rooms with special needs"],ph:["P.sh. dhoma e foshnjës, zyrë në shtëpi","For example a baby's room or a home office"],max:120},
  {n:'budget',type:'radio',opt:1,l:["Buxheti i përafërt","Approximate budget"],o:[['b1',"Deri 2.000 €","Up to €2,000"],['b2',"2.000 deri 6.000 €","€2,000 to €6,000"],['b3',"6.000 deri 12.000 €","€6,000 to €12,000"],['b4',"Mbi 12.000 €","Over €12,000"],['skip',"Preferoj të mos e them","Prefer not to say"]]},
  {n:'extras',type:'check',opt:1,l:["Ju interesojnë edhe:","Are you also interested in:"],o:[['wifi',"Kontroll nga telefoni","Control from your phone"],['filter',"Filtrim i ajrit","Air filtration"],['humidity',"Kontroll i lagështisë","Humidity control"],['vent',"Ventilim me rikuperim nxehtësie","Ventilation with heat recovery"]]}
 ]}
];
var TOTAL=Q.length+1,QBYN={};
Q.forEach(function(s){s.q.forEach(function(q){QBYN[q.n]=q})});

/* ---------- our products: names, sizes (kW: cooling for air units, heating for heat pumps), facts from their pages ---------- */
var PR={
 'fujitsu-eco-knca':{n:["Fujitsu ECO KNCA","Fujitsu ECO KNCA"],k:[2,3.4],f:["Kompakt dhe kursyes, për dhoma të vogla dhe mesatare. 2,0 deri 3,4 kW.","Compact and economical, for small and medium rooms. 2.0 to 3.4 kW."]},
 'fujitsu-standard-kmcg':{n:["Fujitsu Standard KMCG","Fujitsu Standard KMCG"],k:[2,4.2],f:["A++ në ftohje dhe ngrohje, i qetë për dhoma gjumi. 2,0 deri 4,2 kW.","A++ for cooling and heating, quiet for bedrooms. 2.0 to 4.2 kW."]},
 'fujitsu-designer-kj':{n:["Fujitsu Designer KJ","Fujitsu Designer KJ"],k:[2,4.2],f:["A+++ në ftohje dhe ngrohje, nga 19 dB. 2,0 deri 4,2 kW.","A+++ for cooling and heating, from 19 dB. 2.0 to 4.2 kW."]},
 'fujitsu-eco-kltbl':{n:["Fujitsu ECO KLTBL","Fujitsu ECO KLTBL"],k:[2,3.4],f:["Ftoh edhe kur jashtë janë 52°C. 2,0 deri 3,4 kW.","Cools even at 52°C outside. 2.0 to 3.4 kW."]},
 'fujitsu-standard-kmtgl':{n:["Fujitsu Standard KMTGL","Fujitsu Standard KMTGL"],k:[5.2,7.1],f:["Për dhoma të mëdha dhe sallone. 5,2 dhe 7,1 kW.","For large rooms and living rooms. 5.2 and 7.1 kW."]},
 'fujitsu-eco-klcbl':{n:["Fujitsu ECO KLCBL","Fujitsu ECO KLCBL"],k:[5.2,7.1],f:["Për dhoma të mëdha me buxhet më të vogël. 5,2 dhe 7,1 kW.","For large rooms on a smaller budget. 5.2 and 7.1 kW."]},
 'fujitsu-standard-kmtb':{n:["Fujitsu Standard KMTB","Fujitsu Standard KMTB"],k:[8,9.4],f:["Fuqi e madhe për sallone. 8,0 dhe 9,4 kW.","High output for large living rooms. 8.0 and 9.4 kW."]},
 'fujitsu-floor-kvca':{n:["Fujitsu Dysheme KVCA","Fujitsu Floor KVCA"],k:[2.5,4.2],f:["Montohet poshtë, ideal nën dritare dhe në papafingo. 2,5 deri 4,2 kW.","Mounted low, ideal under windows and in attic rooms. 2.5 to 4.2 kW."]},
 'haier-flexis-plus':{n:["Haier Flexis Plus","Haier Flexis Plus"],k:[2.5,7.1],f:["Wi-Fi standard dhe sterilizim me dritë UVC. 2,5 deri 7,1 kW.","Wi-Fi as standard and UVC sterilisation. 2.5 to 7.1 kW."]},
 'haier-expert':{n:["Haier Expert","Haier Expert"],k:[2.5,7.1],f:["A+++ në ftohje, me sensor Eco dhe kontroll me hOn. 2,5 deri 7,1 kW.","A+++ for cooling, with an Eco sensor and hOn control. 2.5 to 7.1 kW."]},
 'haier-pearl-premium':{n:["Haier Pearl Premium","Haier Pearl Premium"],k:[2.5,7.1],f:["Linja A+++ e Haier, me Wi-Fi të integruar dhe UVC Pro. 2,5 deri 7,1 kW.","Haier's A+++ line, with built-in Wi-Fi and UVC Pro. 2.5 to 7.1 kW."]},
 'haier-serene':{n:["Haier Serene","Haier Serene"],k:[2.5,7.1],f:["Pastrohet vetë me nxehtësi 56°C dhe me dritë UVC. 2,5 deri 7,1 kW.","Cleans itself with 56°C heat and UVC light. 2.5 to 7.1 kW."]},
 'haier-expert-nordic':{n:["Haier Expert Nordic","Haier Expert Nordic"],k:[2.5,3.5],f:["Për dimra të ftohtë: ngroh deri në -30°C. 2,5 dhe 3,5 kW.","For cold winters: heats down to -30°C. 2.5 and 3.5 kW."]},
 'haier-pearl-nordic':{n:["Haier Pearl Nordic","Haier Pearl Nordic"],k:[2.5,5],f:["Ngroh deri në -30°C, me mbrojtje nga ngrirja. 2,5 deri 5,0 kW.","Heats down to -30°C, with frost protection. 2.5 to 5.0 kW."]},
 'haier-console':{n:["Haier Console","Haier Console"],k:[2.5,5],f:["Montohet poshtë, me Wi-Fi të integruar. 2,5 deri 5,0 kW.","Mounted low, with built-in Wi-Fi. 2.5 to 5.0 kW."]},
 'haier-flair':{n:["Haier Flair","Haier Flair"],k:[10.5,10.5],f:["Fuqi e madhe në mur, për sallone dhe dyqane. 10,5 kW.","High output wall unit for large living rooms. 10.5 kW."]},
 'hec-tide':{n:["HEC Tide","HEC Tide"],k:[2.5,5],f:["I thjeshtë, me Wi-Fi të integruar dhe vetëpastrim Frost Clean. 2,5 deri 5,0 kW.","Simple, with built-in Wi-Fi and Frost Clean self-cleaning. 2.5 to 5.0 kW."]},
 'fujitsu-multi-aoeg14kbca2':{n:["Fujitsu Multi R32 për 2 dhoma","Fujitsu Multi R32 for 2 rooms"],r:2,c:4,h:4.4,f:["4,0 kW ftohje dhe 4,4 kW ngrohje, A+++ në ftohje.","4.0 kW cooling and 4.4 kW heating, A+++ for cooling."]},
 'fujitsu-multi-aoeg18kbca2':{n:["Fujitsu Multi R32 për 2 dhoma, më e fuqishme","Fujitsu Multi R32 for 2 rooms, higher output"],r:2,c:5,h:5.6,f:["5,0 kW ftohje dhe 5,6 kW ngrohje.","5.0 kW cooling and 5.6 kW heating."]},
 'fujitsu-multi-aoeg18kbca3':{n:["Fujitsu Multi R32 për 3 dhoma","Fujitsu Multi R32 for 3 rooms"],r:3,c:5.4,h:6.8,f:["5,4 kW ftohje dhe 6,8 kW ngrohje.","5.4 kW cooling and 6.8 kW heating."]},
 'fujitsu-multi-aoeg24kbca3':{n:["Fujitsu Multi R32 për 3 dhoma, më e fuqishme","Fujitsu Multi R32 for 3 rooms, higher output"],r:3,c:6.8,h:8,f:["6,8 kW ftohje dhe 8,0 kW ngrohje.","6.8 kW cooling and 8.0 kW heating."]},
 'fujitsu-multi-aoeg30kbta4':{n:["Fujitsu Multi R32 për 4 dhoma","Fujitsu Multi R32 for 4 rooms"],r:4,c:8,h:9.6,f:["8,0 kW ftohje dhe 9,6 kW ngrohje.","8.0 kW cooling and 9.6 kW heating."]},
 'fujitsu-multi-aoeg36kbta5':{n:["Fujitsu Multi R32 për 5 dhoma","Fujitsu Multi R32 for 5 rooms"],r:5,c:9.5,h:10.6,f:["9,5 kW ftohje dhe 10,6 kW ngrohje.","9.5 kW cooling and 10.6 kW heating."]},
 'fujitsu-multi-aoeh14kacb2':{n:["Fujitsu Multi ECO për 2 dhoma","Fujitsu Multi ECO for 2 rooms"],r:2,c:4,h:4.2,eco:1,f:["Seria ECO, 4,0 kW ftohje dhe 4,2 kW ngrohje.","ECO series, 4.0 kW cooling and 4.2 kW heating."]},
 'fujitsu-multi-aoeh18kacb2':{n:["Fujitsu Multi ECO për 2 dhoma, më e fuqishme","Fujitsu Multi ECO for 2 rooms, higher output"],r:2,c:5,h:5.3,eco:1,f:["Seria ECO, 5,0 kW ftohje dhe 5,3 kW ngrohje.","ECO series, 5.0 kW cooling and 5.3 kW heating."]},
 'fujitsu-multi-aoeh18kacb3':{n:["Fujitsu Multi ECO për 3 dhoma","Fujitsu Multi ECO for 3 rooms"],r:3,c:5.3,h:6.4,eco:1,f:["Seria ECO, 5,3 kW ftohje dhe 6,4 kW ngrohje.","ECO series, 5.3 kW cooling and 6.4 kW heating."]},
 'fujitsu-slim-duct-kllap':{n:["Fujitsu Kanal i hollë KLLAP","Fujitsu Slim duct KLLAP"],k:[2.5,5.2],f:["Fshihet në tavan edhe kur ka pak vend. 2,5 deri 5,2 kW.","Hides in the ceiling even where space is tight. 2.5 to 5.2 kW."]},
 'haier-slim-duct':{n:["Haier Kanal i hollë","Haier Slim duct"],k:[2.5,7.1],f:["I hollë, me pompë drenazhi të përfshirë. 2,5 deri 7,1 kW.","Slim, with a condensate pump included. 2.5 to 7.1 kW."]},
 'fujitsu-duct-kmtap':{n:["Fujitsu Kanal KMTAP","Fujitsu Duct KMTAP"],k:[3.5,13.4],f:["Një njësi për disa dhoma, përmes kanaleve. 3,5 deri 13,4 kW.","One unit for several rooms, through ducts. 3.5 to 13.4 kW."]},
 'fujitsu-high-static-pressure-duct':{n:["Fujitsu Kanal me presion të lartë","Fujitsu High static pressure duct"],k:[3.5,22],f:["Për kanale të gjata, deri 22 kW.","For long duct runs, up to 22 kW."]},
 'fujitsu-monobloc-comfort-control-box':{n:["Fujitsu Monobloc Comfort","Fujitsu Monobloc Comfort"],k:[5,10],f:["I gjithë qarku i gazit është jashtë. 5, 8 dhe 10 kW, ngroh deri në -20°C.","The whole refrigerant circuit stays outside. 5, 8 and 10 kW, heats down to -20°C."]},
 'fujitsu-monobloc-comfort-with-tank':{n:["Fujitsu Monobloc Comfort me bojler","Fujitsu Monobloc Comfort with tank"],k:[5,10],tank:1,f:["Ngrohje dhe ujë sanitar nga një sistem, me bojler të integruar. 5, 8 dhe 10 kW.","Heating and hot water from one system, with a built-in tank. 5, 8 and 10 kW."]},
 'fujitsu-split-comfort-r32':{n:["Fujitsu Split Comfort R32","Fujitsu Split Comfort R32"],k:[4.5,9.5],f:["Njësi e brendshme e vogël në mur. 4,5 deri 9,5 kW, ujë deri 55°C.","A small indoor wall unit. 4.5 to 9.5 kW, water up to 55°C."]},
 'fujitsu-split-comfort-r32-with-tank':{n:["Fujitsu Split Comfort R32 me bojler","Fujitsu Split Comfort R32 with tank"],k:[4.5,9.5],tank:1,f:["Me bojler 190 litra për ujin sanitar. 4,5 deri 9,5 kW.","With a 190-litre hot water tank. 4.5 to 9.5 kW."]},
 'fujitsu-split-high-power-r32':{n:["Fujitsu Split High Power R32","Fujitsu Split High Power R32"],k:[10,14],f:["Fuqi e madhe për shtëpi të mëdha dhe radiatorë. 10, 12 dhe 14 kW, ngroh deri në -25°C.","High output for large homes and radiators. 10, 12 and 14 kW, heats down to -25°C."]},
 'fujitsu-split-high-power-r32-with-tank':{n:["Fujitsu Split High Power R32 me bojler","Fujitsu Split High Power R32 with tank"],k:[10,14],tank:1,f:["Me bojler 190 litra. 10, 12 dhe 14 kW.","With a 190-litre tank. 10, 12 and 14 kW."]},
 'haier-monobloc-r290':{n:["Haier Monobloc R290","Haier Monobloc R290"],k:[4,16],f:["Me gazin natyral R290, ujë deri në 80°C, ftoh edhe në verë. 4 deri 16 kW.","Natural refrigerant R290, water up to 80°C, also cools in summer. 4 to 16 kW."]},
 'tiki-space-200-s2':{n:["Tiki Space 200-S2.0","Tiki Space 200-S2.0"],f:["Bojler 180 litra me serpentinë, lidhet me pompën termike.","180-litre hot water tank with a coil, connects to the heat pump."]},
 'tiki-space-300-s4':{n:["Tiki Space 300-S4.0","Tiki Space 300-S4.0"],f:["Bojler 249 litra me serpentinë të madhe 4,0 m².","249-litre hot water tank with a large 4.0 m² coil."]},
 'tiki-buffer-100':{n:["Tiki Buffer 100","Tiki Buffer 100"],f:["Rezervuar buffer 102 litra: mban ujin në temperaturë të njëtrajtshme.","102-litre buffer tank: keeps the water at an even temperature."]},
 'aertesi-aer-slim-evo':{n:["Aertesi AER SLIM EVO","Aertesi AER SLIM EVO"],f:["Fan coil i hollë me motor EC, i qetë për banesa. Ftohje 0,37 deri 3,28 kW.","Slim fan coil with an EC motor, quiet for homes. 0.37 to 3.28 kW cooling."]},
 'dogu-home-epp-home':{n:["Dogu HOME / EPP HOME","Dogu HOME / EPP HOME"],f:["Rikuperator me kanale për shtëpi, rikuperim deri 94%.","Ducted heat recovery unit for homes, up to 94% heat recovery."]},
 'oerre-ghost-u':{n:["O.erre GHOST-U","O.erre GHOST-U"],f:["Në mur, pa kanale, rikuperim deri 93%. Ndihmon kundër lagështisë dhe mykut.","On the wall, no ducts, up to 93% heat recovery. Helps against damp and mould."]},
 'dogu-home-hw':{n:["Dogu HOME HW","Dogu HOME HW"],f:["Ajër i freskët, ngrohje, ftohje dhe ujë i ngrohtë, me rezervuar 200 litra, për 4 deri 5 persona.","Fresh air, heating, cooling and hot water, with a 200-litre tank, for 4 to 5 people."]},
 'fujitsu-airstage-j-vs':{n:["Fujitsu AIRSTAGE J-VS","Fujitsu AIRSTAGE J-VS"],f:["Mini VRF për shtëpi të mëdha, deri në 13 njësi të brendshme.","Mini VRF for large homes, up to 13 indoor units."]}
};
var PAGE={split:['kondicionere-split.html',["kondicionerët split","split air conditioners"]],multi:['multi-split.html',["multi-split","multi-split"]],
  atw:['pompa-termike.html',["pompat termike","heat pumps"]],fancoil:['fan-coil.html',["fan coil-at","fan coils"]],vrf:['vrf.html',["sistemet VRF","VRF systems"]],
  vent:['rikuperator.html',["rikuperatorët","heat recovery units"]],tank:['rezervuare.html',["rezervuarët dhe bojlerët","tanks"]]};

/* ---------- the wizard ---------- */
var form=$('#calcForm'),stepsEl=$('#calcSteps'),prog=$('#calcProg'),errBox=$('#calcErr'),live=$('#calcLive');
var startEl=$('#calcStart'),navEl=$('#calcNav'),nextBtn=$('#calcNext'),backBtn=$('#calcBack'),resEl=$('#calcResult');
var cur=0,maxReached=0,inResult=false,fromLink=false;

function optId(n,v){return 'c-'+n+'-'+v}
function renderQ(q){
  var lab=L(q.l)+(q.opt?' <span class="opt">'+L(T.optional)+'</span>':'');
  var help=q.h?'<p class="q-help" id="h-'+q.n+'">'+L(q.h)+'</p>':'';
  var tip=q.tip?'<details class="q-tip"><summary>'+L(q.tip[0])+'</summary><p>'+L(q.tip[1])+'</p></details>':'';
  var attrs=' id="q-'+q.n+'"'+(q.show?' data-show="'+q.show+'" hidden':'')+(q.req?' data-req':'');
  var cls=(q.half?' q-half':'')+(q.small?' q-small':'');
  var desc=(q.h?'h-'+q.n+' ':'')+'e-'+q.n;
  var err='<p class="err" id="e-'+q.n+'" hidden></p>';
  if(q.type==='radio'||q.type==='check'){
    var t=q.type==='radio'?'radio':'checkbox';
    var chips=q.o.map(function(o){var id=optId(q.n,o[0]);
      return '<span class="chip chip-'+t+'"><input type="'+t+'" name="'+q.n+'" id="'+id+'" value="'+o[0]+'"'+(q.def===o[0]?' checked':'')+'><label for="'+id+'">'+o[LI+1]+'</label></span>'}).join('');
    return '<fieldset class="cq q-choice'+cls+'"'+attrs+' aria-describedby="'+desc+'"><legend>'+lab+'</legend>'+help+'<div class="chips">'+chips+'</div>'+tip+err+'</fieldset>';
  }
  var input;
  if(q.type==='select')input='<select id="'+q.n+'" name="'+q.n+'" aria-describedby="'+desc+'">'+q.o.map(function(o){return '<option value="'+o[0]+'"'+(q.def===o[0]?' selected':'')+'>'+o[LI+1]+'</option>'}).join('')+'</select>';
  else input='<input id="'+q.n+'" name="'+q.n+'" type="text"'+(q.type==='num'?' inputmode="decimal"':q.type==='int'?' inputmode="numeric"':'')+
    ' autocomplete="'+(q.ac||'off')+'"'+(q.ph?' placeholder="'+esc(L(q.ph))+'"':'')+' maxlength="'+(q.max||8)+'" aria-describedby="'+desc+'">';
  var unit=q.unit?'<span class="f-unit" aria-hidden="true">m²</span>':'';
  return '<div class="f cq'+cls+'"'+attrs+'><label for="'+q.n+'">'+lab+'</label><div class="f-in">'+input+unit+'</div>'+help+tip+err+'</div>';
}
stepsEl.innerHTML=Q.map(function(s,i){
  return '<section class="calc-step" data-step="'+i+'" aria-labelledby="st-'+i+'" hidden><p class="kicker">'+T.stepOf(i+1,TOTAL)+'</p>'+
    '<h2 class="calc-h" id="st-'+i+'" tabindex="-1">'+L(s.t)+'</h2><p class="calc-lead">'+L(s.h)+'</p><div class="q-grid">'+s.q.map(renderQ).join('')+'</div></section>'}).join('');
prog.innerHTML=T.steps.map(function(s,i){
  return '<li><button type="button" data-go="'+i+'" disabled><span class="pn">'+(i<9?'0':'')+(i+1)+'</span><span class="pt">'+L(s)+'</span></button></li>'}).join('');
var secs=$$('.calc-step',stepsEl),progBtns=$$('button',prog);

/* reading and writing answers: hidden questions are disabled, so they count as unanswered */
function ctrls(n){return $$('[name="'+n+'"]',stepsEl).filter(function(e){return !e.disabled})}
function get(n){var c=ctrls(n);if(!c.length)return '';var t=c[0].type;
  if(t==='radio'){for(var i=0;i<c.length;i++)if(c[i].checked)return c[i].value;return ''}
  if(t==='checkbox')return c.filter(function(e){return e.checked}).map(function(e){return e.value});
  return c[0].value.trim()}
function setVal(n,v){var c=$$('[name="'+n+'"]',stepsEl);if(!c.length)return;var t=c[0].type;
  if(t==='radio')c.forEach(function(e){e.checked=e.value===v});
  else if(t==='checkbox'){var vs=v?v.split(','):[];c.forEach(function(e){e.checked=vs.indexOf(e.value)>-1})}
  else c[0].value=v}
function answers(){var a={};Object.keys(QBYN).forEach(function(n){a[n]=get(n)});return a}

/* conditional questions */
function test(expr){
  return expr.split(';').some(function(grp){
    return grp.split('&').every(function(term){
      var m=term.match(/^(\w+)(!?=)(.*)$/);if(!m)return true;
      var v=get(m[1]),list=m[3].split('|'),hit=Array.isArray(v)?v.some(function(x){return list.indexOf(x)>-1}):list.indexOf(v)>-1;
      return m[2]==='='?hit:!hit})})}
function applyConds(){
  for(var pass=0;pass<4;pass++){
    var changed=false;
    $$('[data-show]',stepsEl).forEach(function(el){
      var on=test(el.getAttribute('data-show'));
      if(el.hidden===on){el.hidden=!on;changed=true}
      $$('input,select,textarea',el).forEach(function(i){i.disabled=!on});
    });
    if(!changed)break;
  }
}
/* the unit label follows the m² / ft² choice; the room count starts from the bedrooms until it is typed in */
function syncUnit(){var u=T.unit[get('unit')||'m2'];$$('.f-unit',stepsEl).forEach(function(s){s.textContent=u})}
var roomsTouched=false;
stepsEl.addEventListener('input',function(e){
  if(e.target.name==='rooms')roomsTouched=true;
  if(e.target.name==='bedrooms'&&!roomsTouched){var b=num(e.target.value);$('#rooms').value=isNaN(b)?'':String(Math.min(30,Math.round(b)+1))}
  clearErr(e.target);
});
stepsEl.addEventListener('change',function(e){
  /* "Nothing" and "Not sure" stand alone among the current systems */
  if(e.target.name==='current'&&e.target.checked){
    var solo=e.target.value==='none'||e.target.value==='unsure';
    ctrls('current').forEach(function(c){if(c!==e.target&&(solo||c.value==='none'||c.value==='unsure'))c.checked=false});
  }
  applyConds();syncUnit();clearErr(e.target);
});

/* validation */
function postalOk(c,v){var r={KS:/^\d{5}$/,AL:/^\d{4}$/,MK:/^\d{4}$/,ME:/^\d{5}$/,RS:/^\d{5}$/}[c]||/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/;return r.test(v)}
function visible(n){var q=$('#q-'+n);return q&&!q.hidden}
function add(errs,n,m){for(var i=0;i<errs.length;i++)if(errs[i][0]===n)return;errs.push([n,m])}
function intCheck(errs,n,a,b){var v=get(n);if(v==='')return;var x=num(v);if(!(x>=a&&x<=b&&Math.round(x)===x))add(errs,n,T.errInt(a,b))}
var CHECK=[
  function(e){var c=get('city'),p=get('postal');if(!c&&!p)add(e,'city',L(T.errPlace));if(p&&!postalOk(get('country'),p))add(e,'postal',T.errPostal(get('country')))},
  function(e){var u=get('unit')||'m2',ft=u==='ft2',lim=ft?[160,16000]:[15,1500],xl=ft?[20,10800]:[2,1000];
    var v=get('area');if(v!==''){var a=num(v);if(!(a>=lim[0]&&a<=lim[1]))add(e,'area',T.errArea(lim[0],lim[1],T.unit[u]))}
    if(visible('extraArea')){v=get('extraArea');if(v!==''){var x=num(v);if(!(x>=xl[0]&&x<=xl[1]))add(e,'extraArea',T.errArea(xl[0],xl[1],T.unit[u]))}}
    intCheck(e,'bedrooms',0,20);intCheck(e,'bathrooms',0,10);intCheck(e,'rooms',1,30)},
  null,null,
  function(e){intCheck(e,'people',1,30)}
];
function validate(i){
  var errs=[];
  $$('[data-req]',secs[i]).forEach(function(q){if(q.hidden)return;var n=q.id.slice(2),v=get(n);
    if(v===''||(Array.isArray(v)&&!v.length))add(errs,n,L(q.classList.contains('q-choice')?T.errChoose:T.errFill))});
  if(CHECK[i])CHECK[i](errs);
  /* keep the order of the questions on the page */
  var order=$$('.cq',secs[i]).map(function(q){return q.id.slice(2)});
  errs.sort(function(x,y){return order.indexOf(x[0])-order.indexOf(y[0])});
  return errs;
}
function qLabel(n){var q=QBYN[n];return q?L(q.l).replace(/[?:]$/,''):n}
function showErrs(i,errs){
  $$('.cq',secs[i]).forEach(function(q){
    var n=q.id.slice(2),m=null;errs.forEach(function(x){if(x[0]===n&&m===null)m=x[1]});
    var p=$('#e-'+n);if(p){p.hidden=!m;p.textContent=m||''}
    q.classList.toggle('q-bad',!!m);
    $$('input[type=text],select',q).forEach(function(inp){inp.setAttribute('aria-invalid',String(!!m))});
  });
  if(errs.length){
    errBox.innerHTML='<p>'+T.errTitle(errs.length)+'</p><ul>'+errs.map(function(x){return '<li><a href="#q-'+x[0]+'" data-q="'+x[0]+'">'+esc(qLabel(x[0]))+'</a>: '+esc(x[1])+'</li>'}).join('')+'</ul>';
    errBox.hidden=false;errBox.focus();
  }else{errBox.hidden=true;errBox.innerHTML=''}
}
function clearErr(el){var q=el.closest&&el.closest('.cq');if(!q||!q.classList.contains('q-bad'))return;
  q.classList.remove('q-bad');var p=$('#e-'+q.id.slice(2));if(p)p.hidden=true;$$('[aria-invalid]',q).forEach(function(i){i.setAttribute('aria-invalid','false')})}
errBox.addEventListener('click',function(e){var a=e.target.closest('a[data-q]');if(!a)return;e.preventDefault();
  var q=$('#q-'+a.getAttribute('data-q')),f=q&&$('input:not([disabled]),select',q);if(f){f.focus();q.scrollIntoView({block:'center'})}});

/* moving between steps */
function setProg(i){
  progBtns.forEach(function(b,k){var li=b.parentNode;
    li.classList.toggle('now',k===i);li.classList.toggle('done',k<i||(k<=maxReached&&k!==i));
    b.disabled=k>maxReached||k===i;
    if(k===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
}
function scrollTop(){var top=box.getBoundingClientRect().top+window.pageYOffset-90;if(window.pageYOffset>top||top-window.pageYOffset>window.innerHeight*.5)window.scrollTo({top:top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function go(i,focus){
  inResult=false;cur=i;maxReached=Math.max(maxReached,i);
  startEl.hidden=true;form.hidden=false;resEl.hidden=true;
  secs.forEach(function(s,k){s.hidden=k!==i});
  errBox.hidden=true;
  backBtn.hidden=i===0;
  nextBtn.firstChild.nodeValue=(i===Q.length-1?L(T.see):L(T.next))+' ';
  setProg(i);
  live.textContent=T.stepOf(i+1,TOTAL)+': '+L(Q[i].t);
  if(focus!==false){scrollTop();var h=$('#st-'+i);try{h.focus({preventScroll:true})}catch(e){h.focus()}}
}
function nextStep(){
  var errs=validate(cur);showErrs(cur,errs);
  if(errs.length)return;
  if(cur<Q.length-1)go(cur+1);else tryResult();
}
/* an answer changed on an earlier step can bring in a new question: every step is checked before the estimate */
function tryResult(){
  for(var i=0;i<Q.length;i++){var errs=validate(i);if(errs.length){go(i);showErrs(i,errs);return}}
  showResult();
}
form.addEventListener('submit',function(e){e.preventDefault();if(!inResult)nextStep()});
backBtn.addEventListener('click',function(){if(cur>0)go(cur-1)});
prog.addEventListener('click',function(e){var b=e.target.closest('button[data-go]');if(!b||b.disabled)return;var k=+b.getAttribute('data-go');if(k===Q.length)tryResult();else go(k)});
$('#calcGo').addEventListener('click',function(){go(0)});

/* ---------- the estimate ---------- */
/* Heating: W per m² of heated area from about 35-55 (new, well insulated) to about 105-140 (old, no insulation), on a
   0-4 score for the building; then the home type, a colder climate, high ceilings and big windows. Cooling: about
   60-80 to 90-125 W/m² on the same score, then sun, glass, ceilings, a hotter or more humid climate and extra people.
   Each "not sure" widens the range by 5% each way. These are rule-of-thumb figures used for first estimates, not EN 12831. */
function compute(a){
  var ft=a.unit==='ft2',k=ft?.09290304:1;
  var main=num(a.area)*k,ex=(has(a.extra,'basement')||has(a.extra,'attic')||has(a.extra,'ext'))&&a.extraArea!==''?num(a.extraArea)*k:0;
  var area=main+ex;
  var S={pre80:3,y80:2,y00:1,y15:0,unsure:2}[a.age];
  S+={good:-1,some:0,none:1,unsure:0}[a.walls]||0;
  S+={single:1,double:0,triple:-.5,unsure:0}[a.glazing]||0;
  if(a.winage==='old')S+=.25;
  S+={drafty:.5,tight:0,sealed:-.5,unsure:0}[a.drafts]||0;
  if(a.roof==='poor')S+=.5;
  S=Math.max(0,Math.min(4,S));
  var hw=[35+17.5*S,55+21.25*S],cw=[60+7.5*S,80+11*S],mh=1,mc=1;
  if(a.hometype==='row')mh*=.9;
  if(a.hometype==='apt'){if(a.aptpos==='mid'){mh*=.8;mc*=.9}else mh*=.9}
  var cold=a.clim==='cold'||a.clim==='both',hot=a.clim==='hot'||a.clim==='both',humid=has(a.humid,'humid');
  if(cold)mh*=1.15;if(hot)mc*=1.1;if(humid)mc*=1.05;
  if(has(a.feat,'highceil')){mh*=1.15;mc*=1.1}
  if(has(a.feat,'glass')){mh*=1.1;mc*=1.15}
  mc*={shade:.9,normal:1,strong:1.15,unsure:1}[a.sun]||1;
  var unsure=['clim','age','walls','glazing','winage','drafts','roof','sun'].filter(function(n){return a[n]==='unsure'});
  var wid=Math.min(.25,.05*unsure.length),ppl=num(a.people),pp=ppl>4?(ppl-4)*.12:0;
  /* the cooling figures are for one room at its sunniest; rooms do not all peak at the same hour, so a whole home needs less in total */
  var rooms=Math.max(1,Math.round(num(a.rooms))||1),dv=rooms===1?1:rooms<=3?.85:.75;
  mc*=dv;
  function rr(lo,hi){return [Math.max(.5,Math.floor(lo*2)/2),Math.max(1,Math.ceil(hi*2)/2)]}
  var heat=rr(area*hw[0]*mh/1000*(1-wid),area*hw[1]*mh/1000*(1+wid));
  var cool=rr(area*cw[0]*mc/1000*(1-wid)+pp,area*cw[1]*mc/1000*(1+wid)+pp);
  return {ft:ft,k:k,main:main,ex:ex,area:area,S:S,hw:hw,cw:cw,mh:mh,mc:mc,dv:dv,wid:wid,unsure:unsure,pp:pp,heat:heat,cool:cool,cold:cold,hot:hot,humid:humid,
    noNum:a.age==='unsure'&&a.walls==='unsure'&&a.glazing==='unsure',tooBig:area>600};
}

/* which products fit a size: the range must reach the need and not start far above it */
function fits(id,kw){var p=PR[id];if(kw==null||!p.k)return true;return p.k[1]>=kw*.95&&p.k[0]<=kw*1.4}
function uniq(list){var o=[];list.forEach(function(x){if(x&&o.indexOf(x)<0)o.push(x)});return o}
function pickSplit(kw,a,R,heatOnly){
  var q=a.priority,want=[];
  if(R.cold&&a.needs!=='cool')want.push(kw!=null&&kw>3.5?'haier-pearl-nordic':'haier-expert-nordic');
  if(R.hot&&!heatOnly)want.push('fujitsu-eco-kltbl');
  if(q==='quiet')want.push('fujitsu-designer-kj');
  if(q==='iaq'||has(a.extras,'filter'))want.push('haier-serene','haier-pearl-premium');
  if(q==='running'||q==='env')want.push('fujitsu-designer-kj','haier-pearl-premium');
  if(q==='upfront')want.push('fujitsu-eco-knca','hec-tide','fujitsu-eco-klcbl');
  if(has(a.extras,'wifi'))want.push('haier-flexis-plus','haier-expert');
  if(has(a.extra,'attic'))want.push('fujitsu-floor-kvca','haier-console');
  var base=kw==null||kw<=3.4?['fujitsu-standard-kmcg','fujitsu-eco-knca','haier-flexis-plus']:kw<=4.4?['fujitsu-standard-kmcg','haier-flexis-plus','haier-expert']:
    kw<=7.4?['fujitsu-standard-kmtgl','haier-flexis-plus','fujitsu-eco-klcbl']:kw<=9.8?['fujitsu-standard-kmtb']:['haier-flair'];
  var list=uniq(want.concat(base)).filter(function(id){return fits(id,kw)});
  /* in a very cold area, heating stays with the models made for it (down to -30°C) whenever one fits */
  if(R.cold&&a.needs!=='cool'){var nord=list.filter(function(id){return id.indexOf('nordic')>-1});if(nord.length)list=nord}
  return {list:list.slice(0,3),over:kw!=null&&kw>11};
}
function pickMulti(rooms,a,R){
  var basis=R.n?null:(a.needs==='heat'?R.hMid:R.cMid),key=a.needs==='heat'?'h':'c';
  var std=Object.keys(PR).filter(function(id){return PR[id].r===rooms&&!PR[id].eco}).sort(function(x,y){return PR[x][key]-PR[y][key]});
  var eco=Object.keys(PR).filter(function(id){return PR[id].r===rooms&&PR[id].eco}).sort(function(x,y){return PR[x][key]-PR[y][key]});
  if(basis==null)return {list:(a.priority==='upfront'&&eco.length?eco.slice(0,1):[]).concat(std).slice(0,3),over:false};
  var okStd=std.filter(function(id){return PR[id][key]>=basis*.9}),okEco=eco.filter(function(id){return PR[id][key]>=basis*.9});
  if(!okStd.length)return {list:std.slice(-1),over:true};
  var list=okStd.slice(0,1);
  if(okEco.length)(a.priority==='upfront'?list.unshift(okEco[0]):list.push(okEco[0]));
  return {list:list,over:false};
}
function pickDuct(kw,zones){
  if(kw==null)return {list:['fujitsu-duct-kmtap','fujitsu-slim-duct-kllap','haier-slim-duct'],over:false};
  var per=kw/zones;
  if(per<=5.2)return {list:['fujitsu-slim-duct-kllap','haier-slim-duct'],over:false};
  if(per<=7.1)return {list:['haier-slim-duct','fujitsu-duct-kmtap'],over:false};
  if(per<=13.4)return {list:['fujitsu-duct-kmtap'],over:false};
  if(per<=22)return {list:['fujitsu-high-static-pressure-duct'],over:false};
  return {list:['fujitsu-high-static-pressure-duct'],over:true};
}
function pickAtw(h,a,hotRad){
  var dhw=a.dhw==='yes',list,over=false;
  if(h==null)list=dhw?['fujitsu-monobloc-comfort-with-tank','fujitsu-split-comfort-r32-with-tank','haier-monobloc-r290']:['fujitsu-monobloc-comfort-control-box','fujitsu-split-comfort-r32','haier-monobloc-r290'];
  else if(h<=10)list=(dhw?['fujitsu-monobloc-comfort-with-tank','fujitsu-split-comfort-r32-with-tank']:['fujitsu-monobloc-comfort-control-box','fujitsu-split-comfort-r32']).concat('haier-monobloc-r290');
  else if(h<=14)list=[dhw?'fujitsu-split-high-power-r32-with-tank':'fujitsu-split-high-power-r32','haier-monobloc-r290'];
  else{list=['haier-monobloc-r290'];over=h>16}
  /* older radiators may need hotter water: the R290 model goes up to 80°C */
  if(hotRad)list=['haier-monobloc-r290'].concat(list.filter(function(x){return x!=='haier-monobloc-r290'}));
  /* hot water from a separate tank where the chosen heat pump has none built in */
  if(dhw&&!PR[list[0]].tank)list.push(num(a.people)>4?'tiki-space-300-s4':'tiki-space-200-s2');
  return {list:uniq(list).slice(0,4),over:over};
}

/* the kinds of system, scored on the answers; the best one leads, up to two more are shown as options */
function decide(a,R){
  var needH=a.needs!=='cool',needC=a.needs!=='heat',both=a.needs==='both';
  var water=a.dist==='radiators'||a.dist==='underfloor',newb=a.project==='newbuild';
  var ductsOk=a.dist==='ducts'&&a.ductage==='good'&&a.ductreuse!=='open';
  var noDist=a.dist==='none'||a.dist==='unsure',hide=noDist&&a.ductless==='hidden';
  var rooms=Math.max(1,Math.round(num(a.rooms))||1);
  var heatSrc=has(a.current,'boiler')||has(a.current,'district');
  var zones=a.hometype==='apt'?1:Math.max(1,+a.floors||1);
  var hotRad=a.dist==='radiators'&&(a.radok==='no'||a.radok==='unsure'||a.age==='pre80');
  var big=rooms>5||R.area>250;
  var airKind=ductsOk||a.pref==='ducted'||hide?'ducted':big?'vrf':rooms>=2?'multi':'split';
  var basis=R.n?null:(needC?R.cMid:R.hMid);
  function airOpt(kind,forCool){
    var o={kind:kind,page:kind==='multi'?'multi':kind==='vrf'?'vrf':'split',warn:[]},p;
    if(kind==='split'){p=pickSplit(forCool?(R.n?null:R.cMid):basis,a,R,!needC);o.title=T.oSplit();if(p.over){o.warn.push(L(T.wOverSplit));o.over=1}}
    else if(kind==='multi'){p=pickMulti(rooms,a,R);o.title=T.oMulti(rooms);if(p.over){o.warn.push(L(T.wOverMulti));o.over=1}}
    else if(kind==='vrf'){p={list:['fujitsu-airstage-j-vs']};o.title=L(T.oVrf)}
    else{p=pickDuct(forCool?(R.n?null:R.cMid):basis,zones);o.title=L(T.oDuct);if(p.over){o.warn.push(L(T.wOverDuct));o.over=1}
      if(a.dist!=='ducts')o.warn.push(L(T.wNewDucts));else if(a.ductage!=='good')o.warn.push(L(T.wOldDucts))}
    o.text=T.tAir(kind,a,forCool);o.groups=[{list:p.list}];return o}
  function atwOpt(withCool){
    var p=pickAtw(R.n?null:R.hMid,a,hotRad),o={kind:'atw',page:'atw',title:L(water||newb?T.oAtw:T.oAtwNew),text:T.tAtw(a,water,newb),groups:[{list:p.list}],warn:[]};
    if(p.over){o.warn.push(L(T.wOverAtw));o.over=1}
    if(withCool==='air'){var c=airOpt(airKind==='ducted'&&!ductsOk?(big?'vrf':rooms>=2?'multi':'split'):airKind,true);
      o.kind='atw+air';o.title=L(T.oAtwAir).replace('{air}',c.title.charAt(0).toLowerCase()+c.title.slice(1));o.text+=' '+L(T.tAtwAir);o.groups.push({h:c.title,list:c.groups[0].list,page:c.page});o.warn=o.warn.concat(c.warn);if(c.over)o.over=1}
    if(withCool==='fc'){o.kind='atw+fc';o.title=L(T.oAtwFc);o.text=L(T.tAtwFc);
      o.groups=[{list:['haier-monobloc-r290']},{h:L(T.fcH),list:['aertesi-aer-slim-evo'],page:'fancoil'}];if(R.hMid>16)o.warn.push(L(T.wOverAtw))}
    return o}
  function keepOpt(){var c=airOpt(airKind==='ducted'&&!ductsOk?(big?'vrf':rooms>=2?'multi':'split'):airKind,true);
    c.kind='keep';c.title=L(T.oKeep);c.text=L(T.tKeep)+' '+c.text;return c}
  function eachOpt(){var per=R.n?null:R.cMid/rooms,p=pickSplit(needC?per:(R.n?null:R.hMid/rooms),a,R,!needC);
    return {kind:'each',page:'split',title:L(T.oEach),text:L(T.tEach),groups:[{list:p.list}],warn:[]}}

  var c=[];
  function opt(o,s){o.score=s;c.push(o)}
  if(R.tooBig){opt({kind:'project',title:L(T.oProject),text:L(T.tProject),groups:[{list:['fujitsu-airstage-j-vs','haier-monobloc-r290']}],page:'vrf',warn:[]},20)}
  else{
    if(a.needs==='cool'){
      opt(airOpt(airKind),10);
      if(airKind==='multi')opt(eachOpt(),5);
      if(airKind==='ducted'&&!ductsOk)opt(airOpt(big?'vrf':rooms>=2?'multi':'split'),7);
      if(airKind==='vrf')opt(airOpt('multi'),5);
    }else if(a.needs==='heat'){
      if(water||newb)opt(atwOpt(),10);else{opt(airOpt(airKind),8);if(airKind==='multi')opt(eachOpt(),6);opt(atwOpt(),5)}
      if(water)opt(airOpt(rooms>=2&&!big?'multi':big?'vrf':'split'),3);
    }else{
      if(water){opt(atwOpt('air'),9);opt(atwOpt('fc'),6);if(heatSrc)opt(keepOpt(),7);opt(airOpt(airKind),4)}
      else if(newb){opt(atwOpt('fc'),8);opt(airOpt(airKind),8);opt(atwOpt('air'),7)}
      else{opt(airOpt(airKind),10);opt(atwOpt('fc'),hide?6:4)}
    }
    c.forEach(function(o){
      var k=o.kind,s=0;
      if(a.pref==='ductless'&&(k==='split'||k==='multi'||k==='vrf'||k==='each'||k==='keep'))s+=6;
      if(a.pref==='ducted'&&k==='ducted')s+=6;
      if(a.pref==='atw'&&k.indexOf('atw')===0)s+=6;
      if(a.pref==='keep'&&k==='keep')s+=8;
      if(a.priority==='upfront'){if(k==='keep')s+=3;if(k==='split'||k==='multi'||k==='each')s+=2;if(k.indexOf('atw')===0)s-=1}
      if((a.priority==='running'||a.priority==='env')&&k.indexOf('atw')===0)s+=2;
      if(a.priority==='comfort'&&k==='atw+fc')s+=2;
      /* an option that one unit cannot cover drops behind the ones that can */
      if(o.over)s-=3;
      o.score+=s});
    c.sort(function(x,y){return y.score-x.score});
  }
  var main=c[0],alts=c.slice(1).filter(function(o){return o.score>=4}).slice(0,2);
  /* extras: fresh air with heat recovery, and a note on humidity */
  var extra=[];
  var tight=a.age==='y15'&&(a.drafts==='tight'||a.drafts==='sealed');
  if(has(a.extras,'vent')||a.priority==='iaq'||R.humid||has(a.extras,'humidity')||tight){
    var vl=(a.dist==='ducts'||newb)?['dogu-home-epp-home','oerre-ghost-u']:['oerre-ghost-u','dogu-home-epp-home'];
    if(newb&&a.dhw==='yes'&&has(a.extras,'vent'))vl.push('dogu-home-hw');
    extra.push({kind:'vent',page:'vent',title:L(T.oVent),text:L(T.tVent)+(R.humid||has(a.extras,'humidity')?' '+L(T.tHumid):''),groups:[{list:vl}],warn:[]});
  }
  return {main:main,alts:alts,extra:extra,rooms:rooms,hotRad:hotRad,water:water,ductsOk:ductsOk,heatSrc:heatSrc,airKind:airKind,big:big};
}

/* system texts */
T.oSplit=function(){return EN?'A split air conditioner':'Kondicioner split'};
T.oMulti=function(n){return EN?'Multi-split for '+n+' rooms':'Multi-split për '+n+' dhoma'};
T.oVrf=["Sistem VRF për shumë dhoma","A VRF system for many rooms"];
T.oDuct=["Njësi me kanale","A ducted unit"];
T.oAtw=["Pompë termike ajër-ujë","An air-to-water heat pump"];
T.oAtwNew=["Pompë termike ajër-ujë me radiatorë, dysheme ose fan coil të rinj","An air-to-water heat pump with new radiators, underfloor heating or fan coils"];
T.oAtwAir=["Pompë termike ajër-ujë për ngrohje, {air} për ftohje","An air-to-water heat pump for heating, {air} for cooling"];
T.oAtwFc=["Pompë termike me fan coil: ngrohje dhe ftohje me ujë","A heat pump with fan coils: heating and cooling with water"];
T.oKeep=["Ruani ngrohjen që keni dhe shtoni kondicionerë","Keep your heating and add air conditioners"];
T.oEach=["Një split më vete në çdo dhomë","A separate split in each room"];
T.oVent=["Ventilim me rikuperim nxehtësie","Ventilation with heat recovery"];
T.oProject=["Projekt për shtëpi të madhe","A project for a large home"];
T.tAir=function(kind,a,forCool){
  var heatToo=!forCool&&a.needs!=='cool';
  var s={split:["Një njësi në mur dhe një jashtë, për një hapësirë.","One unit on the wall and one outside, for one space."],
    multi:["Një njësi e jashtme dhe një njësi e brendshme në çdo dhomë. Çdo dhomë mban temperaturën e vet.","One outdoor unit and an indoor unit in each room. Every room keeps its own temperature."],
    vrf:["Për shtëpi të mëdha me shumë dhoma: një njësi e jashtme lidh shumë njësi të brendshme. Kërkon projekt.","For large homes with many rooms: one outdoor unit serves many indoor units. It needs a design."],
    ducted:["Njësia fshihet në tavan dhe ajri shkon nëpër kanale te grilat; në dhoma shihen vetëm grilat. Zakonisht një njësi për çdo kat.","The unit hides in the ceiling and the air runs through ducts to the grilles; only the grilles show. Usually one unit per floor."]}[kind];
  return L(s)+(heatToo?' '+L(["Si pompë termike ajër-ajër, ngroh edhe në dimër.","As an air-to-air heat pump it also heats in winter."]):'');
};
T.tAtw=function(a,water,newb){
  var t=water?["Ngroh ujin e radiatorëve ose të ngrohjes në dysheme, në vend të kaldajës.","It heats the water for your radiators or underfloor heating, in place of a boiler."]:
    newb?["Për shtëpi në ndërtim: ngroh me ujë, më mirë me ngrohje në dysheme ose radiatorë të përmasuar për ujë më pak të nxehtë.","For a home being built: it heats with water, ideally through underfloor heating or radiators sized for cooler water."]:
    ["Projekt më i madh: kërkon shpërndarje të re me ujë në shtëpi, por ngroh gjithë shtëpinë nga një sistem.","A bigger project: it needs new water distribution in the home, but heats the whole home from one system."];
  var s=L(t);
  if(a.dist==='underfloor')s+=' '+L(["Ngrohja në dysheme punon me ujë më pak të nxehtë, ku pompa termike punon me efikasitet më të mirë.","Underfloor heating runs on cooler water, where a heat pump works most efficiently."]);
  if(a.dhw==='yes')s+=' '+L(["Me bojler jep edhe ujë të ngrohtë sanitar.","With a tank it also makes hot water."]);
  return s;
};
T.tAtwAir=["Për ftohje në verë shtohen kondicionerë në dhomat që i duan.","For summer cooling, air conditioners are added in the rooms that need them."];
T.tAtwFc=["Pompa termike Haier Monobloc R290 ftoh edhe në verë. Me fan coil Aertesi në dhoma, i njëjti sistem uji ngroh në dimër dhe ftoh në verë.","The Haier Monobloc R290 heat pump also cools in summer. With Aertesi fan coils in the rooms, the same water system heats in winter and cools in summer."];
T.fcH=["Fan coil për dhomat","Fan coils for the rooms"];
T.tKeep=["Kaldaja ose ngrohja qendrore mbetet për dimër; kondicionerët ftohin në verë. Zakonisht kërkon më pak punime se një sistem i ri ngrohjeje.","Your boiler or district heating stays for winter; the air conditioners cool in summer. It usually means less work than a new heating system."];
T.tEach=["Më shumë njësi jashtë, por secila punon më vete dhe mund të shtohen një nga një.","More outdoor units, but each one works on its own and they can be added one at a time."];
T.tVent=["Sjell ajër të freskët dhe nxjerr ajrin e ndenjur, duke e kthyer pjesën më të madhe të nxehtësisë. I dobishëm në shtëpi të mbyllura mirë.","It brings in fresh air and takes out stale air while keeping most of the heat. Useful in well-sealed homes."];
T.tHumid=["Ndihmon edhe kundër lagështisë; kondicionerët e thajnë ajrin kur ftohin.","It also helps against damp; air conditioners dry the air when they cool."];
T.tProject=["Për këtë madhësi sistemi projektohet sipas planimetrisë: zakonisht VRF ose disa pompa termike, ndonjëherë të kombinuara.","At this size the system is designed from the floor plan: usually VRF or several heat pumps, sometimes combined."];
T.wOverSplit=["Për një hapësirë kaq të madhe zakonisht duhen dy njësi.","A space this large usually needs two units."];
T.wOverMulti=["Fuqia kalon atë të një multi-split-i: zakonisht ndahet në dy sisteme.","The need is more than one multi-split covers: it is usually split into two systems."];
T.wOverDuct=["Fuqia kalon atë të një njësie me kanale: duhen disa njësi ose projekt.","The need is more than one ducted unit covers: several units or a design are needed."];
T.wOverAtw=["Fuqia kalon atë të një pompe termike për shtëpi: duhen dy njësi ose projekt.","The need is more than one home heat pump covers: two units or a design are needed."];
T.wNewDucts=["Kërkon kanale të reja dhe hapësirë në tavan.","It needs new ducts and room in the ceiling."];
T.wOldDucts=["Kanalet duhen kontrolluar para se të ripërdoren.","The ducts need checking before they are reused."];

/* what shaped the estimate, and what needs checking */
function factors(a,R,D){
  var f=[],u=T.unit;
  var areaTxt=fmtInt(R.area)+' m²'+(R.ft?' ('+fmtInt(R.area/R.k)+' ft²)':'');
  f.push((EN?'Area worked out: ':'Sipërfaqja e llogaritur: ')+areaTxt+(R.ex?(EN?', including '+fmtInt(R.ex)+' m² of basement, attic or extension':', përfshirë '+fmtInt(R.ex)+' m² bodrum, papafingo ose shtesë'):'')+'.');
  var cls=R.S<=1.25?["Ndërtesa duket e izoluar mirë, prandaj nevoja për ngrohje është më e ulët.","The building looks well insulated, so the heating need is lower."]:
    R.S<=3?["Ndërtesa duket me izolim mesatar.","The building looks averagely insulated."]:
    ["Ndërtesa humb shumë nxehtësi, prandaj nevoja për ngrohje është më e lartë.","The building loses a lot of heat, so the heating need is higher."];
  var why=[];
  var W={age:{pre80:["ndërtuar para 1980","built before 1980"],y15:["ndërtuar pas 2015","built after 2015"]},walls:{good:["fasadë e izoluar","insulated facade"],none:["mure pa izolim","uninsulated walls"]},
    glazing:{single:["dritare me një xham","single glazing"],triple:["dritare me tre xhama","triple glazing"]},drafts:{drafty:["rryma ajri","draughts"],sealed:["e mbyllur mirë kohët e fundit","sealed recently"]},roof:{poor:["çati pa izolim të mirë","a poorly insulated roof"]}};
  Object.keys(W).forEach(function(n){var w=W[n][a[n]];if(w)why.push(L(w))});
  /* for cooling only, the sentence stops before what it means for heating */
  var cs=L(cls);if(a.needs==='cool')cs=cs.replace(/, (prandaj|so) .*$/,'.');
  f.push(cs+(why.length?' ('+why.join(', ')+')':''));
  var ht={house:["Shtëpi e veçantë: të gjitha muret janë nga jashtë.","Detached house: every wall faces outside."],row:["Shtëpi në rresht: muret e përbashkëta e ulin nevojën për ngrohje.","Terraced house: shared walls lower the heating need."],
    top:["Banesë në katin e fundit: çatia e rrit nevojën krahasuar me katet e ndërmjetme.","Top-floor apartment: the roof raises the need compared with middle floors."],mid:["Banesë në kat të ndërmjetëm: fqinjët sipër dhe poshtë e ulin nevojën.","Middle-floor apartment: neighbours above and below lower the need."],
    ground:["Banesë përdhese ose mbi garazh: dyshemeja humb pak më shumë nxehtësi.","Ground-floor apartment: the floor loses a little more heat."]};
  var hk=a.hometype==='apt'?a.aptpos:a.hometype;if(ht[hk])f.push(L(ht[hk]));
  var fh=a.needs!=='cool',fc=a.needs!=='heat';
  if(R.cold&&fh)f.push(L(["Dimër më i ftohtë se zakonisht: +15% për ngrohjen.","Colder winters than usual: +15% for heating."]));
  if(R.hot&&fc)f.push(L(["Verë më e nxehtë se zakonisht: +10% për ftohjen.","Hotter summers than usual: +10% for cooling."]));
  if(R.humid&&fc)f.push(L(["Lagështi e lartë: kondicioneri duhet ta thajë edhe ajrin, +5% për ftohjen.","High humidity: the unit also has to dry the air, +5% for cooling."]));
  if(a.sun==='strong'&&fc)f.push(L(["Diell i fortë pasdite: +15% për ftohjen.","Strong afternoon sun: +15% for cooling."]));
  if(a.sun==='shade'&&fc)f.push(L(["Shtëpi kryesisht në hije: -10% për ftohjen.","Mostly shaded home: -10% for cooling."]));
  if(has(a.feat,'glass'))f.push(fh&&fc?L(["Xhama të mëdhenj: +10% për ngrohjen dhe +15% për ftohjen.","Large windows: +10% for heating and +15% for cooling."]):fh?L(["Xhama të mëdhenj: +10% për ngrohjen.","Large windows: +10% for heating."]):L(["Xhama të mëdhenj: +15% për ftohjen.","Large windows: +15% for cooling."]));
  if(has(a.feat,'highceil'))f.push(fh&&fc?L(["Tavane të larta: +15% për ngrohjen dhe +10% për ftohjen.","High ceilings: +15% for heating and +10% for cooling."]):fh?L(["Tavane të larta: +15% për ngrohjen.","High ceilings: +15% for heating."]):L(["Tavane të larta: +10% për ftohjen.","High ceilings: +10% for cooling."]));
  if(R.pp&&fc)f.push(L(["Më shumë se 4 persona: pak më shumë ftohje.","More than 4 people: a little more cooling."]));
  if(R.dv<1&&a.needs!=='heat')f.push(EN?'Several rooms do not all need full cooling at the same hour: '+Math.round((1-R.dv)*100)+'% less in total than for single rooms.':'Dhomat nuk kanë nevojë për ftohje të plotë në të njëjtën orë: '+Math.round((1-R.dv)*100)+'% më pak gjithsej se për dhoma të veçanta.');
  var dt={radiators:["Keni radiatorë me ujë: një pompë termike ajër-ujë mund t'i përdorë.","You have water radiators: an air-to-water heat pump can use them."],underfloor:["Keni ngrohje në dysheme: e përshtatshme për pompë termike.","You have underfloor heating: a good match for a heat pump."],
    ducts:["Keni kanale ajri.","You have air ducts."],none:["Nuk keni shpërndarje qendrore: njësitë pa kanale montohen më thjesht.","There is no central distribution: ductless units are the simplest to fit."]};
  if(dt[a.dist]&&(a.needs!=='cool'||a.dist==='ducts'||a.dist==='none'))f.push(L(dt[a.dist]));
  f.push((EN?'Spaces to heat or cool: ':'Hapësira për ngrohje ose ftohje: ')+D.rooms+'.');
  var pr={upfront:["kosto më e ulët në fillim","lower upfront cost"],running:["shpenzime më të ulëta mujore","lower running costs"],comfort:["rehati","comfort"],quiet:["punë e qetë","quiet operation"],iaq:["ajër i pastër brenda","clean indoor air"],env:["më pak ndikim në ambient","lower environmental impact"]}[a.priority];
  if(pr)f.push((EN?'Your priority: ':'Përparësia juaj: ')+L(pr)+'.');
  if(a.pref&&a.pref!=='rec'){var o=QBYN.pref.o.filter(function(x){return x[0]===a.pref})[0];f.push((EN?'System you had in mind: ':'Sistemi që keni në mendje: ')+o[LI+1]+'.')}
  if(a.budget&&a.budget!=='skip')f.push(L(["Buxheti që shënuat merret parasysh në ofertë.","The budget you gave is taken into account in the quote."]));
  return f;
}
function checks(a,R,D){
  var c=[],names={clim:["klima e zonës","the local climate"],age:["viti i ndërtimit","the building's age"],walls:["izolimi i mureve","wall insulation"],glazing:["lloji i dritareve","the windows"],winage:["mosha e dritareve","the windows' age"],
    drafts:["rrymat e ajrit","draughts"],roof:["izolimi i çatisë","roof insulation"],sun:["dielli në verë","summer sun"]};
  if(R.unsure.length)c.push((EN?'You were not sure about: ':'Nuk ishit të sigurt për: ')+R.unsure.map(function(n){return L(names[n])}).join(', ')+(EN?'. We check these on site.':'. I shohim në vend.'));
  c.push(L(["Sipërfaqja: e matim në vend; edhe 10% ndryshim e ndryshon fuqinë.","The area: we measure it on site; even 10% makes a difference to the size."]));
  if(D.hotRad)c.push(L(["Radiatorët: duhet parë nëse mjaftojnë me ujë më pak të nxehtë, para se të zgjidhet pompa termike.","The radiators: whether they are big enough for cooler water, before the heat pump is chosen."]));
  if(a.dist==='unsure')c.push(L(["Si shpërndahet nxehtësia sot: e shohim në vend, sepse ndikon te lloji i sistemit.","How heat is distributed today: we check it on site, because it decides the kind of system."]));
  if(a.dist==='ducts'&&a.ductage!=='good')c.push(L(["Kanalet: rrjedhjet, madhësia dhe izolimi kontrollohen para se të ripërdoren.","The ducts: leaks, size and insulation are checked before they are reused."]));
  if(a.problem&&a.problem!=='no'&&a.problem!=='unsure')c.push(L(["Dhomat shumë të nxehta ose të ftohta duhen parë veç e veç: shpesh kanë më shumë xham, diell ose humbje.","Rooms that run too hot or too cold need a look of their own: they often have more glass, sun or heat loss."]));
  if(has(a.feat,'glass')||has(a.feat,'highceil'))c.push(L(["Xhamat e mëdhenj dhe tavanet e larta llogariten dhomë për dhomë.","Large windows and high ceilings are worked out room by room."]));
  if(a.special)c.push((EN?'Special needs you mentioned: ':'Nevojat e veçanta që përmendët: ')+'“'+a.special+'”.');
  if(D.main&&(D.main.kind.indexOf('atw')===0)){
    if(R.n||R.hMid>10)c.push(L(["Lidhja elektrike: modelet më të mëdha vijnë me 1 ose 3 fazorë; e kontrollojmë në vend.","The power supply: the larger models come for single or three-phase power; we check it on site."]));
    c.push(L(["Nëse duhet rezervuar buffer (p.sh. Tiki Buffer 100) varet nga instalimi.","Whether a buffer tank is needed (for example the Tiki Buffer 100) depends on the installation."]));
    if(a.dhw==='yes')c.push(L(["Sasia e ujit të ngrohtë, sipas personave dhe banjove.","How much hot water you need, from the number of people and bathrooms."]));
  }
  c.push(L(a.hometype==='apt'?["Vendi i njësisë së jashtme, tubat, drenazhi dhe leja e ndërtesës.","Where the outdoor unit goes, the pipes, the drain and the building's permission."]:["Vendi i njësisë së jashtme, tubat dhe drenazhi.","Where the outdoor unit goes, the pipes and the drain."]));
  return c;
}
function method(a,R){
  var m=[];
  var hl=R.hw.map(function(x){return fmtInt(x)}),cl=R.cw.map(function(x){return fmtInt(x)});
  m.push((EN?'Building score ':'Pikët e ndërtesës ')+fmt(R.S,2).replace(/[.,]?0+$/,'')+(EN?' on a scale from 0 (new, well insulated) to 4 (old, no insulation).':' në një shkallë nga 0 (e re, e izoluar mirë) deri 4 (e vjetër, pa izolim).'));
  if(a.needs!=='cool')m.push((EN?'Heating: ':'Ngrohja: ')+fmtInt(R.area)+' m² × '+hl[0]+L(T.to)+hl[1]+' W/m²'+(Math.abs(R.mh-1)>.001?' × '+fmt(R.mh,2):'')+'.');
  if(a.needs!=='heat')m.push((EN?'Cooling: ':'Ftohja: ')+fmtInt(R.area)+' m² × '+cl[0]+L(T.to)+cl[1]+' W/m²'+(Math.abs(R.mc-1)>.001?' × '+fmt(R.mc,2):'')+(R.pp?' + '+fmt(R.pp,2)+' kW':'')+'.');
  if(R.wid)m.push(EN?'With '+R.unsure.length+' “not sure” answers the range was widened by '+Math.round(R.wid*100)+'% each way.':'Me '+R.unsure.length+' përgjigje “Nuk e di” intervali u zgjerua me '+Math.round(R.wid*100)+'% në të dyja anët.');
  m.push(L(["Vlerat rrumbullakohen në gjysmë kW: poshtë për fundin e ulët, lart për fundin e lartë.","Rounded to half a kW: down at the low end, up at the high end."]));
  m.push(L(["Vlerat W/m² janë vlera orientuese që përdoren shpesh për një vlerësim të parë në klimë kontinentale, jo llogaritje sipas standardit. Fuqia e njësive të multi-split-it dhe e pompave termike krahasohet me mesin e intervalit.","The W/m² values are rule-of-thumb figures often used for a first estimate in a continental climate, not a calculation to a standard. Multi-split and heat pump outputs are compared with the middle of the range."]));
  return m;
}

/* the answers as label: value lines, for the result, the print and the email */
function answerLines(){
  var out=[];
  secs.forEach(function(sec){$$('.cq',sec).forEach(function(q){
    if(q.hidden)return;var n=q.id.slice(2),qq=QBYN[n],v=get(n);if(!qq||v===''||(Array.isArray(v)&&!v.length))return;
    if(n==='unit')return;
    var txt;
    if(qq.o){var vs=Array.isArray(v)?v:[v];txt=qq.o.filter(function(o){return vs.indexOf(o[0])>-1}).map(function(o){return o[LI+1]}).join(', ')}
    else txt=v+(qq.unit?' '+T.unit[get('unit')||'m2']:'');
    out.push([L(qq.l),txt]);
  })});
  return out;
}
function prodLi(id){var p=PR[id];return '<li><a href="'+id+'.html"><span class="rp-n">'+esc(L(p.n))+'</span><span class="rp-f">'+esc(L(p.f))+'</span><span class="arr" aria-hidden="true">→</span></a></li>'}
function optHtml(o,lead){
  var h='<div class="res-opt'+(lead?' res-lead':'')+'">';
  h+='<h3 class="res-oh">'+esc(o.title)+'</h3><p class="res-ot">'+esc(o.text)+'</p>';
  o.warn.forEach(function(w){h+='<p class="res-warn">'+esc(w)+'</p>'});
  o.groups.forEach(function(g){
    if(!g.list.length)return;
    h+=(g.h?'<p class="res-gh">'+esc(g.h)+'</p>':'')+'<ul class="res-prods" aria-label="'+esc(L(T.prodH))+'">'+g.list.map(prodLi).join('')+'</ul>';
    var pg=PAGE[g.page||o.page];if(pg)h+='<a class="text-link res-all" href="'+pg[0]+'">'+esc(T.seeAll(L(pg[1])))+' <span class="arr" aria-hidden="true">→</span></a>';
  });
  return h+'</div>';
}
function numHtml(label,r,sub,btu){
  return '<div class="res-num"><p class="res-nl">'+label+'</p><p class="res-kw">'+fmtKw(r[0])+'<span class="res-to">'+L(T.to)+'</span>'+fmtKw(r[1])+'<small>kW</small></p>'+
    '<p class="res-ns">'+sub+(btu?'<br>'+T.btu(Math.round(r[0]*3.412)*1000,Math.round(r[1]*3.412)*1000):'')+'</p></div>';
}
var last=null;
function showResult(){
  inResult=true;maxReached=Q.length;
  startEl.hidden=true;form.hidden=true;errBox.hidden=true;resEl.hidden=false;
  setProg(Q.length);
  resEl.setAttribute('aria-busy','true');resEl.innerHTML='<p class="res-busy">'+L(T.busy)+'</p>';
  live.textContent=L(T.busy);
  scrollTop();
  setTimeout(function(){
    try{renderResult()}
    catch(err){resEl.innerHTML='<div class="res-fail" role="alert"><p>'+L(T.fail)+'<a href="tel:'+BIZ.tel+'">'+BIZ.phone+'</a>.</p><button class="btn btn-ghost btn-sm" type="button" data-act="edit">'+L(T.edit)+'</button></div>';
      if(window.console)console.error(err)}
    resEl.removeAttribute('aria-busy');
    var h=$('#resTitle')||resEl;try{h.focus({preventScroll:true})}catch(e){h.focus()}
    live.textContent=L(T.ready);
  },RM()?0:280);
}
function RM(){return matchMedia('(prefers-reduced-motion: reduce)').matches}
function renderResult(){
  var a=answers(),R=compute(a);R.n=R.noNum||R.tooBig;R.hMid=(R.heat[0]+R.heat[1])/2;R.cMid=(R.cool[0]+R.cool[1])/2;
  var D=decide(a,R),F=factors(a,R,D),C=checks(a,R,D),M=method(a,R),A=answerLines();
  var place=[a.city,a.postal].filter(Boolean).join(' ');
  var areaTxt=fmtInt(R.area)+' m²'+(R.ft?' ('+fmtInt(R.area/R.k)+' ft²)':'');
  last={a:a,R:R,D:D,A:A,place:place,areaTxt:areaTxt};
  var h='';
  if(fromLink)h+='<p class="res-note">'+L(T.shared)+'</p>';
  h+='<div class="res-head"><p class="kicker">'+L(T.kicker)+'</p><h2 class="res-title" id="resTitle" tabindex="-1">'+L(T.title)+'</h2>'+
    '<p class="res-sum">'+esc(T.sumFor(areaTxt,place,L(T.needsTxt[a.needs]),String(D.rooms)))+'</p></div>';
  if(R.tooBig)h+='<p class="res-alert">'+L(T.tooBig)+'</p>';
  else if(R.noNum)h+='<p class="res-alert">'+L(T.noNum)+'</p>';
  else{
    h+='<div class="res-nums">';
    if(a.needs!=='cool')h+=numHtml(L(T.heatL),R.heat,L(T.heatSub),R.ft);
    if(a.needs!=='heat')h+=numHtml(L(T.coolL),R.cool,L(T.coolSub),true);
    h+='</div>';
  }
  h+='<section class="res-sec" aria-labelledby="rh-main"><p class="kicker" id="rh-main">'+L(T.primaryH)+'</p>'+optHtml(D.main,true)+'</section>';
  if(D.alts.length)h+='<section class="res-sec" aria-labelledby="rh-alt"><p class="kicker" id="rh-alt">'+L(T.altH)+'</p><div class="res-alts">'+D.alts.map(function(o){return optHtml(o)}).join('')+'</div></section>';
  if(D.extra.length)h+='<section class="res-sec" aria-labelledby="rh-ex"><p class="kicker" id="rh-ex">'+L(T.extraH)+'</p>'+D.extra.map(function(o){return optHtml(o)}).join('')+'</section>';
  h+='<div class="res-cols"><section aria-labelledby="rh-f"><h3 class="res-ch" id="rh-f">'+L(T.factorsH)+'</h3><ul class="res-list">'+F.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></section>'+
    '<section aria-labelledby="rh-c"><h3 class="res-ch" id="rh-c">'+L(T.checksH)+'</h3><ul class="res-list">'+C.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></section></div>';
  h+='<details class="res-more"><summary>'+L(T.methodH)+'</summary><ul class="res-list">'+M.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul></details>';
  h+='<details class="res-more"><summary>'+L(T.answersH)+'</summary><dl class="res-ans">'+A.map(function(x){return '<div><dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd></div>'}).join('')+'</dl></details>';
  h+='<p class="res-disc">'+L(T.disc)+'</p>';
  h+='<div class="res-actions"><a class="btn btn-primary" href="#vleresim" data-act="ask">'+L(T.ask)+' <span class="arr" aria-hidden="true">→</span></a>'+
    '<button class="btn btn-ghost btn-sm" type="button" data-act="print">'+L(T.print)+'</button><button class="btn btn-ghost btn-sm" type="button" data-act="share">'+L(T.share)+'</button>'+
    '<button class="btn btn-ghost btn-sm" type="button" data-act="edit">'+L(T.edit)+'</button><button class="res-restart" type="button" data-act="restart">'+L(T.restart)+'</button></div>'+
    '<p class="res-share" id="resShare" role="status"></p>';
  h+=askHtml();
  resEl.innerHTML=h;
  wireAsk();
}

/* ---------- print, share, edit ---------- */
function shareUrl(){
  var p=[];Object.keys(QBYN).forEach(function(n){var v=get(n);if(Array.isArray(v))v=v.join(',');if(v!=='')p.push(encodeURIComponent(n)+'='+encodeURIComponent(v))});
  return location.href.split('#')[0]+'#v=1&'+p.join('&');
}
resEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');if(!b)return;var act=b.getAttribute('data-act');
  if(act==='print'){window.print()}
  else if(act==='edit'){fromLink=false;go(0)}
  else if(act==='restart'){form.reset();$$('input[type=text]',stepsEl).forEach(function(i){i.value=''});roomsTouched=false;applyConds();syncUnit();maxReached=0;fromLink=false;history.replaceState(null,'',location.pathname+location.search);go(0)}
  else if(act==='ask'){e.preventDefault();var s=$('#vleresim');s.scrollIntoView({behavior:RM()?'auto':'smooth',block:'start'});setTimeout(function(){var f=$('#a-name');if(f)f.focus({preventScroll:true})},RM()?0:500)}
  else if(act==='share'){
    var url=shareUrl(),st=$('#resShare');
    var manual=function(){st.innerHTML=L(T.copyFail)+' <input class="res-url" type="text" readonly value="'+esc(url)+'" aria-label="'+esc(L(T.share))+'">';var i=$('.res-url',st);i.focus();i.select()};
    if(navigator.share){navigator.share({title:L(T.shareTitle),url:url}).catch(function(){})}
    else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){st.textContent=L(T.copied)},manual)}
    else manual();
  }
});
/* everything folded away opens for the print */
var openedForPrint=[];
window.addEventListener('beforeprint',function(){openedForPrint=$$('details:not([open])',resEl);openedForPrint.forEach(function(d){d.open=true})});
window.addEventListener('afterprint',function(){openedForPrint.forEach(function(d){d.open=false});openedForPrint=[]});

/* ---------- the optional request ---------- */
function askHtml(){
  var m=T.methods.map(function(o,i){return '<span class="chip chip-radio"><input type="radio" name="a-method" id="a-m-'+o[0]+'" value="'+o[0]+'"'+(i===0?' checked':'')+'><label for="a-m-'+o[0]+'">'+o[LI+1]+'</label></span>'}).join('');
  var t=T.times.map(function(o){return '<option value="'+o[0]+'">'+o[LI+1]+'</option>'}).join('');
  return '<section class="res-ask" id="vleresim" aria-labelledby="ask-h"><div class="res-ask-in">'+
    '<form id="askForm" novalidate><h3 class="h3 form-title" id="ask-h">'+L(T.askH)+'</h3><p class="res-ask-p">'+L(T.askP)+'</p>'+
    '<div class="f-grid">'+
    '<div class="f f-wide"><label for="a-name">'+L(T.fName)+'</label><input id="a-name" name="a-name" autocomplete="name" aria-describedby="ae-name" maxlength="80"><p class="err" id="ae-name" hidden></p></div>'+
    '<div class="f"><label for="a-phone">'+L(T.fPhone)+'</label><input id="a-phone" name="a-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+383 4X XXX XXX" aria-describedby="ae-phone" maxlength="24"><p class="err" id="ae-phone" hidden></p></div>'+
    '<div class="f"><label for="a-email">'+L(T.fEmail)+'</label><input id="a-email" name="a-email" type="email" autocomplete="email" aria-describedby="ae-email" maxlength="120"><p class="err" id="ae-email" hidden></p></div>'+
    '<fieldset class="cq q-choice f-wide" id="aq-method"><legend>'+L(T.fMethod)+'</legend><div class="chips">'+m+'</div></fieldset>'+
    '<div class="f"><label for="a-time">'+L(T.fTime)+' <span class="opt">'+L(T.optional)+'</span></label><select id="a-time" name="a-time">'+t+'</select></div>'+
    '<div class="f f-wide"><label for="a-msg">'+L(T.fMsg)+' <span class="opt">'+L(T.optional)+'</span></label><textarea id="a-msg" name="a-msg" rows="3" maxlength="1000"></textarea></div>'+
    '<div class="f-wide f-check"><input type="checkbox" id="a-consent" name="a-consent" aria-describedby="ae-consent"><label for="a-consent">'+L(T.consent)+'</label><p class="err" id="ae-consent" hidden></p></div>'+
    '</div><div class="f-submit"><button class="btn btn-primary" type="submit">'+L(T.send)+' <span class="arr" aria-hidden="true">→</span></button><p class="f-hint">'+L(T.privacy)+'</p></div></form>'+
    '<div class="form-done" id="askDone" hidden tabindex="-1"><div class="done-ic" aria-hidden="true"><svg viewBox="0 0 28 28" class="ic"><path class="s" d="M5 14.5L11.5 21L23 8.5"/></svg></div>'+
    '<h3 class="h3">'+L(T.doneH)+'</h3><p>'+L(T.doneP)+'<a href="tel:'+BIZ.tel+'">'+BIZ.phone+'</a>.</p>'+
    '<div class="row"><a class="btn btn-primary btn-sm" id="askAgain" href="mailto:'+BIZ.email+'">'+L(T.mailAgain)+'</a><button class="btn btn-ghost btn-sm" id="askEdit" type="button">'+L(T.editReq)+'</button></div></div>'+
    '</div></section>';
}
function wireAsk(){
  var f=$('#askForm'),done=$('#askDone');if(!f)return;
  function err(id,m){var el=$('#ae-'+id),inp=$('#a-'+id);el.hidden=!m;el.textContent=m||'';if(inp)inp.setAttribute('aria-invalid',String(!!m))}
  f.addEventListener('input',function(e){var id=(e.target.id||'').slice(2);if($('#ae-'+id))err(id,null)});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var name=$('#a-name').value.trim(),phone=$('#a-phone').value.trim(),email=$('#a-email').value.trim(),meth=$('input[name="a-method"]:checked',f).value,ok=true,first=null;
    var digits=phone.replace(/[^\d]/g,'');
    function bad(id,m){err(id,m);ok=false;if(!first)first=$('#a-'+id)}
    ['name','phone','email','consent'].forEach(function(id){err(id,null)});
    if(!name)bad('name',L(T.eName));
    if(!phone&&!email)bad('phone',L(T.eContact));
    if(phone&&(digits.length<8||digits.length>15||!/^[+\d][\d\s()./-]*$/.test(phone)))bad('phone',L(T.ePhone));
    if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))bad('email',L(T.eEmail));
    if(meth==='email'&&!email)bad('email',L(T.eNeedEmail));
    if(meth!=='email'&&!phone&&email)bad('phone',L(T.eNeedPhone));
    if(!$('#a-consent').checked)bad('consent',L(T.eConsent));
    if(!ok){first.focus();return}
    var mo=T.methods.filter(function(o){return o[0]===meth})[0],ts=$('#a-time'),tm=ts.options[ts.selectedIndex].text;
    var body=[L(T.fName)+': '+name,L(T.fPhone)+': '+(phone||'-'),L(T.fEmail)+': '+(email||'-'),L(T.fMethod)+' '+mo[LI+1],L(T.fTime)+': '+tm];
    var msg=$('#a-msg').value.trim();if(msg)body.push('',msg);
    body.push('','--- '+L(T.mailEst)+' ---');
    var R=last.R,D=last.D;
    if(R.n)body.push(L(T.heatL)+' / '+L(T.coolL)+': '+L(T.mailNo));
    else{if(last.a.needs!=='cool')body.push(L(T.heatL)+': '+fmtKw(R.heat[0])+L(T.to)+fmtKw(R.heat[1])+' kW');
      if(last.a.needs!=='heat')body.push(L(T.coolL)+': '+fmtKw(R.cool[0])+L(T.to)+fmtKw(R.cool[1])+' kW');}
    body.push(L(T.mailSys)+': '+D.main.title);
    var prods=[];D.main.groups.forEach(function(g){g.list.forEach(function(id){prods.push(L(PR[id].n))})});
    if(prods.length)body.push(L(T.mailProd)+': '+prods.join(', '));
    if(D.alts.length)body.push(L(T.mailAlt)+': '+D.alts.map(function(o){return o.title}).join('; '));
    body.push('','--- '+L(T.mailAns)+' ---');
    last.A.forEach(function(x){body.push(x[0]+': '+x[1])});
    body.push('',L(T.mailLink)+': '+shareUrl());
    var subject=L(T.subject)+' · '+name;
    /* the same "consent" line goes in, so the email itself records the agreement */
    body.push('',L(T.consent));
    var href='mailto:'+BIZ.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body.join('\n'));
    $('#askAgain').setAttribute('href',href);
    window.location.href=href;
    f.hidden=true;done.hidden=false;done.classList.add('show');done.focus();
  });
  $('#askEdit').addEventListener('click',function(){done.hidden=true;done.classList.remove('show');f.hidden=false;$('#a-name').focus()});
}

/* ---------- start: fresh, or from a shared link ---------- */
applyConds();syncUnit();
function fromHash(){
  var hash=location.hash.replace(/^#/,'');
  if(hash.indexOf('v=1&')!==0)return;
  form.reset();$$('input[type=text]',stepsEl).forEach(function(i){i.value=''});
  hash.slice(4).split('&').forEach(function(kv){var i=kv.indexOf('=');if(i<1)return;
    try{var n=decodeURIComponent(kv.slice(0,i)),v=decodeURIComponent(kv.slice(i+1))}catch(e){return}
    if(QBYN[n])setVal(n,v)});
  roomsTouched=true;
  for(var p=0;p<3;p++)applyConds();syncUnit();
  var bad=-1;for(var i=0;i<Q.length;i++){if(validate(i).length){bad=i;break}}
  fromLink=true;
  if(bad<0){startEl.hidden=true;showResult()}else{maxReached=bad;go(bad,false)}
}
fromHash();
window.addEventListener('hashchange',fromHash);
})();
