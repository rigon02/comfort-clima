(function(){
'use strict';
/* the business email and phone used by the form */
var BIZ={email:'info@comfort-clima.com',phone:'+383 48 77 22 88'};

var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion: reduce)');
/* the page language: English pages (site/en) get English messages and number formats */
var EN=(document.documentElement.lang||'').toLowerCase().slice(0,2)==='en';
var TX=EN?{pause:'Pause animation',resume:'Resume animation',menuOpen:'Open menu',menuClose:'Close menu',
    twoUnits:'Two units or multi-split',need:'Calculated need: ',rec:'Recommended size: ',over7:'over 7 kW (two units or multi-split)',
    room:'Room',sun:'sun',ins:'insulation',suggested:'The calculator suggested',interest:'I am interested in: ',
    showing:function(n){return 'Showing '+n+(n===1?' model':' models')},
    subject:'Quote request',lName:'Name',lPhone:'Phone',lCo:'Company',lCity:'City',lType:'Client type',lNeed:'What I need'}
  :{pause:'Ndalo animacionin',resume:'Vazhdo animacionin',menuOpen:'Hap menunë',menuClose:'Mbyll menunë',
    twoUnits:'Dy njësi ose multi-split',need:'Nevoja e llogaritur: ',rec:'Masa e rekomanduar: ',over7:'mbi 7 kW (dy njësi ose multi-split)',
    room:'Dhoma',sun:'diell',ins:'izolim',suggested:'Kalkulatori sugjeroi',interest:'Më intereson: ',
    showing:function(n){return 'Po shfaqen '+n+(n===1?' model':' modele')},
    subject:'Kërkesë për ofertë',lName:'Emri',lPhone:'Telefoni',lCo:'Kompania',lCity:'Qyteti',lType:'Lloji i klientit',lNeed:'Çfarë më duhet'};
var NS='http://www.w3.org/2000/svg';
var root=document.documentElement;

/* page headline: split into words for the drift-down entrance */
var h1=$('.hero h1, .page-head h1');
if(h1&&!h1.querySelector('img')){   /* a logo used as the title keeps its image */
  var text=h1.textContent.trim();
  h1.textContent='';
  var sr=document.createElement('span');sr.className='sr';sr.textContent=text;
  var vis=document.createElement('span');vis.setAttribute('aria-hidden','true');
  text.split(' ').forEach(function(w,i,arr){
    var s=document.createElement('span');s.className='w';s.style.setProperty('--i',i);s.textContent=w;vis.appendChild(s);
    if(i<arr.length-1)vis.appendChild(document.createTextNode(' '));
  });
  h1.appendChild(sr);h1.appendChild(vis);
}

/* nav links: the label rolls up and a copy rolls in on hover */
$$('.nav-links > li > a').forEach(function(a){
  var s=document.createElement('span');s.className='t';
  while(a.firstChild)s.appendChild(a.firstChild);
  a.appendChild(s);
});

/* the background at the top of every page: ribbons of white dots that twist and flow like air, drawn over a
   CSS gradient between the logo's two blues (#13498D to #37ABE0). Each ribbon is a grid of points; the side of a
   ribbon that faces you gets bigger, brighter dots, and where a ribbon turns edge-on the dots crowd into a bright line.
   head: the shorter header of the other pages, where the text sits on the left */
var WBG=[[19,73,141],[55,171,224]];
function Waves(cv,head){
  var gl=null;
  try{gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power'})}catch(e){}
  if(!gl)return null;
  /* where the flow runs, in clip space: across from X0 to X1, the centre line starting at YA and turning by YB from S0 on,
     ribbons WS as wide. Homepage: above the headline and behind the product (phones: the top half, above the product).
     Other pages: along the top above the breadcrumbs, then down the right side, clear of the text (phones: along the top). */
  var small=matchMedia('(max-width:760px)').matches;
  var L=head?(small?[-1.2,1.2,.8,-.05,.7,.15]:[-1.2,1.3,.9,-1.75,.8,.5]):(small?[-1.2,1.2,.7,-.12,1,.15]:[-1.2,1.2,.72,-.7,1,.15]);
  var VS='attribute vec3 a;uniform float T;uniform float PS;uniform vec4 H;varying float vA;'+
    'const float X0='+L[0].toFixed(2)+',X1='+L[1].toFixed(2)+',YA='+L[2].toFixed(2)+',YB='+L[3].toFixed(2)+',WS='+L[4].toFixed(2)+',S0='+L[5].toFixed(2)+';'+
    'void main(){float u=a.x,v=a.y,k=a.z,ph=k*2.1,t=T;'+
    'float x=mix(X0,X1,u);'+
    'float yc=YA+YB*smoothstep(S0,1.,u)+.13*sin(u*4.2+t*.42+ph)+.06*sin(u*9.5-t*.58+ph*1.7);'+
    'float th=u*5.2+t*.45+ph*1.3+.7*sin(u*2.6-t*.33+k);'+
    'float w=WS*(.26+.09*sin(u*3.4+t*.29+k*1.9))*mix(.62,1.,smoothstep(.05,.55,u));'+
    'float s=sin(th),n=.5+.5*v*s,pz=1./(1.-v*w*s*1.3);'+
    'vec2 P=vec2(x+.06*v*cos(th+1.),yc+v*w*cos(th)*pz);'+
    'gl_Position=vec4(P,0.,1.);'+
    'gl_PointSize=PS*(.75+1.55*n*n);'+
    'float e=smoothstep(0.,.1,u)*smoothstep(1.,.9,u)*mix(.35,1.,smoothstep(.94,.74,P.y));'+   /* softer behind the menu bar */
    /* none behind the product (H: its centre and half size), so its cut-off edges and grille gaps show clean blue, not dots */
    'vec2 hq=abs(P-H.xy)/max(H.zw,vec2(.001));float hd=pow(pow(hq.x,4.)+pow(hq.y,4.),.25);'+
    'e*=mix(1.,smoothstep(.72,1.12,hd),step(.001,H.z));'+
    'vA=(.26+.74*n*n)*e;}';
  var FS='precision mediump float;varying float vA;'+
    'void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.16,d)*vA;gl_FragColor=vec4(vec3(.93,.97,1.)*a,a);}';
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
  if(!vs||!fs)return null;
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);
  /* three ribbons; fewer dots on small screens */
  var NU=small?170:280,NV=small?22:34,K=3,pts=new Float32Array(NU*NV*K*3),i=0;
  for(var k=0;k<K;k++)for(var iu=0;iu<NU;iu++)for(var iv=0;iv<NV;iv++){pts[i++]=iu/(NU-1);pts[i++]=iv/(NV-1)*2-1;pts[i++]=k}
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,pts,gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
  var uT=gl.getUniformLocation(pr,'T'),uPS=gl.getUniformLocation(pr,'PS'),uH=gl.getUniformLocation(pr,'H'),hole=[0,0,0,0];
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.clearColor(0,0,0,0);
  var w=0,h=0,dpr=1,dirty=true,lost=false,shown=false,count=NU*NV*K;
  if('ResizeObserver' in window)new ResizeObserver(function(){dirty=true}).observe(cv);
  else addEventListener('resize',function(){dirty=true});
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;cv.parentNode.classList.add('no-gl')});
  return {draw:function(t){
    if(lost)return;
    if(dirty){
      dirty=false;dpr=Math.min(1.75,window.devicePixelRatio||1);
      var nw=Math.max(2,Math.round((cv.clientWidth||1)*dpr)),nh=Math.max(2,Math.round((cv.clientHeight||1)*dpr));
      if(nw!==w||nh!==h){w=cv.width=nw;h=cv.height=nh;gl.viewport(0,0,w,h)}
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT,t);gl.uniform1f(uPS,(small?1.9:2.5)*dpr);gl.uniform4f(uH,hole[0],hole[1],hole[2],hole[3]);
    gl.drawArrays(gl.POINTS,0,count);
    if(!shown){shown=true;cv.classList.add('on')}
  },
  /* the area kept clear of dots, as a box in the canvas's CSS pixels: [left, top, width, height] */
  hole:function(b){
    var cw=cv.clientWidth||1,ch=cv.clientHeight||1;
    hole=[(b[0]+b[2]/2)/cw*2-1,1-(b[1]+b[3]/2)/ch*2,b[2]/cw,b[3]/ch];
  },
  /* the background colour at a few points (0..1 across, 0..1 down), for the light on the product's edges */
  read:function(pts){
    var out=[];
    for(var j=0;j<pts.length;j++){
      var f=Math.max(0,Math.min(1,(pts[j][0]+(1-pts[j][1]))/2));
      out.push([0,1,2].map(function(c){return (WBG[0][c]+(WBG[1][c]-WBG[0][c])*f)*.55}));
    }
    return out;
  }};
}

/* hero: the dotted ribbons behind the text, and on the right three products taking turns, floating
   (Fujitsu Airstage outdoor unit, Fujitsu monobloc heat pump, Dogu ventilation unit).
   The Airstage photo is the grille and casing (with see-through gaps where the fan shows); its fan turns on a canvas underneath.
   The other two are shown as photographed. All pick up the colours of the liquid around them as light on their edges. */
var hero0=$('.hero');
if(hero0&&$('.liquid',hero0)){
  var hBtn=$('.hero-pause',hero0),hCv=$('.liquid',hero0),hLiq=Waves(hCv);
  var hL=14,hF=0,hLast=0,hRaf=null,hVisible=true,hPaused=false,hCache={},hFrame=0;
  if(!hLiq)hero0.classList.add('no-gl');
  var prod=$('.prod-float',hero0),prodShadow=$('.prod-shadow',hero0),prodBox=$('.hero-product',hero0);
  /* the fan opening in each photo with a spinning fan: its centre and the matrix that turns a circle into the tilted ellipse, in photo pixels */
  var FANS=[
    {cx:277.1,cy:499.9,m:[243.3,-34.1,-34.1,304.71],rf:.86,photoW:926}    /* Airstage outdoor unit (the photo has 32 px rebuilt above the top); the monobloc (slide 2) has none */
  ];
  var FAN={speed:210,blur:3.4};
  var slides=$$('.prod-slide',hero0),slideOn=0,slideT=0,SLIDE_HOLD=5,slideOffTimer=null;
  slides.forEach(function(s,i){var c=$('.fan-spin',s);if(FANS[i]&&c){FANS[i].cv=c;FANS[i].ctx=c.getContext('2d')}});
  var fTex=null,fA=0;
  /* the fan, drawn once: three swept graphite blades on a dark well, and a hub */
  function fanTexture(size){
    var c=document.createElement('canvas');c.width=c.height=size;
    var g=c.getContext('2d'),R=size/2;
    g.translate(R,R);g.scale(R,R);
    var bg=g.createRadialGradient(0,0,.15,0,0,1);
    bg.addColorStop(0,'#1d1a17');bg.addColorStop(.75,'#110f0d');bg.addColorStop(1,'#0a0908');
    g.fillStyle=bg;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();
    var r0=.2,r1=.97,i,r,k,a;
    for(var b=0;b<3;b++){
      g.save();g.rotate(b*Math.PI*2/3);
      g.beginPath();
      for(i=0;i<=24;i++){r=r0+(r1-r0)*i/24;k=(r-r0)/(r1-r0);a=.58*Math.pow(k,1.35);g.lineTo(r*Math.cos(a),r*Math.sin(a))}
      g.arc(0,0,r1,.58,-.4,true);
      for(i=24;i>=0;i--){r=r0+(r1-r0)*i/24;k=(r-r0)/(r1-r0);a=-.4*Math.pow(k,.85)-.16*(1-k);g.lineTo(r*Math.cos(a),r*Math.sin(a))}
      g.closePath();
      var lg=g.createLinearGradient(.25,-.35,.7,.45);
      lg.addColorStop(0,'#77706a');lg.addColorStop(.42,'#3d3833');lg.addColorStop(1,'#1d1a17');
      g.fillStyle=lg;g.fill();
      g.lineWidth=.012;g.strokeStyle='rgba(226,216,200,.42)';g.stroke();
      g.restore();
    }
    var hub=g.createRadialGradient(-.05,-.06,.02,0,0,.23);
    hub.addColorStop(0,'#3d3833');hub.addColorStop(.7,'#1a1715');hub.addColorStop(1,'#0e0c0b');
    g.fillStyle=hub;g.beginPath();g.arc(0,0,.22,0,Math.PI*2);g.fill();
    g.lineWidth=.012;g.strokeStyle='rgba(214,204,190,.3)';g.beginPath();g.arc(0,0,.215,0,Math.PI*2);g.stroke();
    g.fillStyle='#4a443e';g.beginPath();g.arc(0,0,.035,0,Math.PI*2);g.fill();
    return c;
  }
  function fDrawOne(F){
    var fCv=F.cv,fCtx=F.ctx,k=fCv.width/F.photoW,m=F.m;
    fCtx.setTransform(1,0,0,1,0,0);fCtx.globalAlpha=1;fCtx.globalCompositeOperation='source-over';
    fCtx.clearRect(0,0,fCv.width,fCv.height);
    fCtx.setTransform(k,0,0,k,0,0);
    fCtx.translate(F.cx,F.cy);fCtx.transform(m[0],m[2],m[1],m[3],0,0);fCtx.scale(F.rf,F.rf);
    fCtx.save();
    fCtx.beginPath();fCtx.arc(0,0,1.03,0,Math.PI*2);fCtx.clip();
    fCtx.fillStyle='#0b0a09';fCtx.fill();
    /* three copies a few degrees apart, averaged: the soft blur of blades in motion */
    for(var j=0;j<3;j++){
      fCtx.globalAlpha=1/(j+1);
      fCtx.save();fCtx.rotate((fA-j*FAN.blur)*Math.PI/180);fCtx.drawImage(fTex,-1,-1,2,2);fCtx.restore();
    }
    /* light stays put while the blades pass through it */
    fCtx.globalAlpha=.75;fCtx.globalCompositeOperation='overlay';
    var lt=fCtx.createRadialGradient(.2,-.6,0,.2,-.6,1.1);
    lt.addColorStop(0,'rgba(255,248,236,1)');lt.addColorStop(1,'rgba(255,248,236,0)');
    fCtx.fillStyle=lt;fCtx.fillRect(-1.1,-1.1,2.2,2.2);
    fCtx.restore();
    fCtx.globalAlpha=1;fCtx.globalCompositeOperation='source-over';
  }
  /* only the fans you can see are drawn: the one on show, and the one leaving during a switch */
  function fDraw(){
    if(!fTex)return;
    FANS.forEach(function(F,i){var s=slides[i];if(F.ctx&&s&&(s.classList.contains('is-on')||s.classList.contains('is-off')))fDrawOne(F)});
  }
  if(FANS.some(function(F){return F.ctx})){fTex=fanTexture(512);FANS.forEach(function(F){if(F.cv)F.cv.classList.add('on')})}
  /* the products take turns: each stays SLIDE_HOLD seconds, then the next one drifts in (the pause button stops this too) */
  function hSwitch(){
    if(slides.length<2)return;
    var cur=slides[slideOn],nxt=slides[(slideOn+1)%slides.length];
    nxt.classList.add('no-tr');nxt.classList.remove('is-off');void nxt.offsetWidth;nxt.classList.remove('no-tr');
    cur.classList.remove('is-on');cur.classList.add('is-off');cur.setAttribute('aria-hidden','true');
    nxt.classList.add('is-on');nxt.removeAttribute('aria-hidden');
    clearTimeout(slideOffTimer);slideOffTimer=setTimeout(function(){cur.classList.remove('is-off')},1800);
    slideOn=(slideOn+1)%slides.length;
    if(prodBox)prodBox.setAttribute('data-slide',slideOn);
    hMeasure();
  }
  /* light from the background: sample the liquid beside, above and below the unit, ease toward it */
  var LK=[[.5,.5],[.8,.06],[.82,.94]],lk=[[40,110,190],[70,160,220],[20,50,110]],LKV=['--lk-l','--lk-t','--lk-b'];
  function hLight(){
    var s=hLiq?hLiq.read(LK):null;
    if(!s)return;
    for(var i=0;i<3;i++){
      /* brighten the sampled colour into light, but pull it a third of the way to grey so reds never turn pink */
      var sr=s[i][0]*2.4,sg=s[i][1]*2.4,sb=s[i][2]*2.4,lum=.3*sr+.59*sg+.11*sb,tg=[sr,sg,sb];
      for(var c=0;c<3;c++){var target=Math.min(235,tg[c]*.66+lum*.34);lk[i][c]+=(target-lk[i][c])*.25}
      var v=Math.round(lk[i][0])+','+Math.round(lk[i][1])+','+Math.round(lk[i][2]);
      if(hCache[LKV[i]]!==v){hCache[LKV[i]]=v;hero0.style.setProperty(LKV[i],v)}
    }
  }
  /* floating: a slow bob with a little sway; the shadow below breathes with it */
  function hFloat(){
    if(!prod)return;
    var y=Math.sin(hF*.85)*9+Math.sin(hF*.37+1.3)*4,r=Math.sin(hF*.55+.6)*.55;
    prod.style.transform='translate3d(0,'+y.toFixed(2)+'px,0) rotate('+r.toFixed(3)+'deg)';
    if(prodShadow){var u=(y+13)/26;prodShadow.style.transform='scale('+(1.04-.1*(1-u)).toFixed(3)+')';prodShadow.style.opacity=(.5+.35*u).toFixed(3)}
  }
  /* the dotted ribbons stay clear of the product on show (its layout box, measured on resize and at each switch);
     the clear area eases across to the next product */
  var hHole=null,hTarget=null;
  function hBox(el){var x=0,y=0,e=el;while(e&&e!==hero0){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}return [x,y,el.offsetWidth,el.offsetHeight]}
  function hMeasure(){if(slides[slideOn])hTarget=hBox(slides[slideOn])}
  function hRender(){
    if(hLiq){
      if(hTarget){if(!hHole)hHole=hTarget.slice();else for(var i=0;i<4;i++)hHole[i]+=(hTarget[i]-hHole[i])*.05;hLiq.hole(hHole)}
      hLiq.draw(hL);if(hFrame++%6===0)hLight();
    }
    fDraw();hFloat();
  }
  function hTick(now){
    var dt=Math.min(.1,(now-(hLast||now))/1000);hLast=now;
    var sp=RM.matches?.6:1;   /* calmer for visitors who prefer less motion, never frozen; the pause button stops it */
    hL+=dt*sp;hF+=dt*sp;fA=(fA+dt*sp*FAN.speed)%360;
    slideT+=dt;if(slideT>=SLIDE_HOLD){slideT=0;hSwitch()}
    hRender();
    hRaf=requestAnimationFrame(hTick);
  }
  function hSync(){
    var run=hVisible&&!hPaused&&!document.hidden;
    if(run&&hRaf===null){hLast=0;hRaf=requestAnimationFrame(hTick)}
    else if(!run&&hRaf!==null){cancelAnimationFrame(hRaf);hRaf=null}
  }
  new IntersectionObserver(function(es){hVisible=es[0].isIntersecting;hSync()}).observe(hero0);
  document.addEventListener('visibilitychange',hSync);
  if(hBtn)hBtn.addEventListener('click',function(){
    hPaused=!hPaused;
    var l=hPaused?TX.resume:TX.pause;
    hBtn.setAttribute('aria-pressed',String(hPaused));hBtn.setAttribute('aria-label',l);hBtn.title=l;
    hero0.classList.toggle('is-paused',hPaused);
    hSync();
  });
  hMeasure();addEventListener('resize',function(){hMeasure();hHole=null});
  hRender();hSync();
}

/* sub-pages: the same dotted ribbons behind the page header, with its own pause */
var pHead=$('.page-head'),pCv=pHead?$('.liquid',pHead):null;
if(pCv){
  var pLiq=Waves(pCv,true),pBtn=$('.hero-pause',pHead);
  var pT=9,pLast=0,pRaf=null,pVis=true,pPaused=false;
  if(!pLiq)pHead.classList.add('no-gl');
  else{
    var pTick=function(now){
      var dt=Math.min(.1,(now-(pLast||now))/1000);pLast=now;
      pT+=dt*(RM.matches?.6:1);pLiq.draw(pT);
      pRaf=requestAnimationFrame(pTick);
    };
    var pSync=function(){
      var run=pVis&&!pPaused&&!document.hidden;
      if(run&&pRaf===null){pLast=0;pRaf=requestAnimationFrame(pTick)}
      else if(!run&&pRaf!==null){cancelAnimationFrame(pRaf);pRaf=null}
    };
    new IntersectionObserver(function(es){pVis=es[0].isIntersecting;pSync()}).observe(pHead);
    document.addEventListener('visibilitychange',pSync);
    pLiq.draw(pT);pSync();
  }
  if(pBtn)pBtn.addEventListener('click',function(){
    pPaused=!pPaused;
    var l=pPaused?TX.resume:TX.pause;
    pBtn.setAttribute('aria-pressed',String(pPaused));pBtn.setAttribute('aria-label',l);pBtn.title=l;
    pHead.classList.toggle('is-paused',pPaused);
    if(pLiq)pSync();
  });
}

/* brand slider: arrows ease one logo at a time, loops endlessly, swipes on touch */
var bsTrack=$('#bsTrack');
if(bsTrack){
  var bsVp=bsTrack.parentNode,bsOrig=$$('.bs-tile',bsTrack),bsN=bsOrig.length;
  /* two cloned sets on each side: the faded edges show neighbours beyond the four main logos */
  var bsIdx=2*bsN,bsStep=0,bsBusy=false,bsT=null,bsDrag=null;
  function bsClone(t){var c=t.cloneNode(true);c.setAttribute('aria-hidden','true');c.classList.add('clone');$$('img',c).forEach(function(i){i.alt=''});$$('a',c).forEach(function(a){a.tabIndex=-1});return c}
  /* a brand tile can link to the brand's page; a drag must never count as a click on it */
  var bsSuppress=false;
  for(var bsK=0;bsK<2;bsK++){
    bsOrig.forEach(function(t){bsTrack.appendChild(bsClone(t))});
    bsOrig.slice().reverse().forEach(function(t){bsTrack.insertBefore(bsClone(t),bsTrack.firstChild)});
  }
  function bsPlace(anim,extra){
    bsTrack.classList.toggle('anim',!!anim);
    bsTrack.style.transform='translate3d('+(-bsIdx*bsStep+(extra||0)).toFixed(2)+'px,0,0)';
  }
  function bsMeasure(){
    var cs=getComputedStyle(bsTrack),pv=parseFloat(cs.getPropertyValue('--pv'))||4,gap=parseFloat(cs.columnGap);
    if(isNaN(gap))gap=0;
    var vs=getComputedStyle(bsVp),padL=parseFloat(vs.paddingLeft)||0,inner=bsVp.clientWidth-padL-(parseFloat(vs.paddingRight)||0);
    /* the side fade covers the page margin plus a little of the outer logos, measured in real pixels */
    bsVp.style.setProperty('--fz',Math.max(48,padL+32).toFixed(0)+'px');
    var tw=(inner-gap*(pv-1))/pv;
    bsTrack.style.setProperty('--tw',tw.toFixed(2)+'px');
    bsStep=tw+gap;bsPlace(false);
  }
  function bsNormalize(){
    var moved=false;
    while(bsIdx>=3*bsN){bsIdx-=bsN;moved=true}
    while(bsIdx<2*bsN){bsIdx+=bsN;moved=true}
    if(moved){bsPlace(false);void bsTrack.offsetWidth}
  }
  function bsDone(){
    if(!bsBusy)return;
    bsBusy=false;clearTimeout(bsT);bsNormalize();
  }
  function bsPerView(){return parseFloat(getComputedStyle(bsTrack).getPropertyValue('--pv'))||4}
  /* keep two spare logos on each side so the faded edges never show an empty gap */
  function bsClamp(i){return Math.max(2,Math.min(5*bsN-bsPerView()-2,i))}
  function bsAnimate(){
    bsBusy=true;bsPlace(true);
    clearTimeout(bsT);bsT=setTimeout(bsDone,1100);
  }
  function bsGo(d){
    /* every click counts: a click mid-move retargets the same eased glide, kept inside the cloned range */
    bsIdx=bsClamp(bsIdx+d);bsAnimate();
  }
  bsTrack.addEventListener('transitionend',function(e){if(e.target===bsTrack&&e.propertyName==='transform')bsDone()});
  $('.bs-prev').addEventListener('click',function(){bsGo(-1)});
  $('.bs-next').addEventListener('click',function(){bsGo(1)});
  function bsLight(tile){$$('.bs-tile.lit',bsTrack).forEach(function(x){if(x!==tile)x.classList.remove('lit')});if(tile)tile.classList.toggle('lit')}
  bsVp.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(bsBusy){bsDone()}
    bsDrag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,on:false};
  });
  bsVp.addEventListener('pointermove',function(e){
    if(!bsDrag||e.pointerId!==bsDrag.id)return;
    var dx=e.clientX-bsDrag.x,dy=e.clientY-bsDrag.y;
    if(!bsDrag.on){
      if(Math.abs(dx)<6)return;
      if(Math.abs(dy)>Math.abs(dx)){bsDrag=null;return}
      bsDrag.on=true;bsVp.classList.add('dragging');
      try{bsVp.setPointerCapture(e.pointerId)}catch(err){}
    }
    bsDrag.dx=dx;bsPlace(false,dx);
  });
  function bsEnd(e){
    if(!bsDrag||e.pointerId!==bsDrag.id)return;
    var g=bsDrag;bsDrag=null;bsVp.classList.remove('dragging');
    if(!g.on){if(e.type==='pointerup'&&e.pointerType!=='mouse')bsLight(e.target.closest('.bs-tile'));return}
    var steps=Math.round(-g.dx/bsStep);
    if(!steps&&Math.abs(g.dx)>40)steps=g.dx<0?1:-1;
    bsIdx=bsClamp(bsIdx+steps);bsAnimate();
    bsSuppress=true;setTimeout(function(){bsSuppress=false},0);
  }
  bsVp.addEventListener('click',function(e){if(bsSuppress){e.preventDefault();e.stopPropagation();bsSuppress=false}},true);
  bsVp.addEventListener('dragstart',function(e){e.preventDefault()});
  bsVp.addEventListener('pointerup',bsEnd);
  bsVp.addEventListener('pointercancel',bsEnd);
  bsVp.addEventListener('lostpointercapture',function(e){if(bsDrag&&bsDrag.on)bsEnd(e)});
  /* phones fire resize when the address bar slides while scrolling; only a new width needs a re-measure */
  var bsW=-1;
  addEventListener('resize',function(){if(bsVp.clientWidth!==bsW){bsW=bsVp.clientWidth;bsMeasure()}});
  bsW=bsVp.clientWidth;bsMeasure();
}

/* reveals */
var counted=false;
var revealIO=new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(!e.isIntersecting)return;
    var el=e.target;el.classList.add('in');revealIO.unobserve(el);
    setTimeout(function(){el.classList.add('settled')},1800);
    if(el.classList.contains('energy'))runCounter();
  });
},{threshold:0,rootMargin:'0px 0px -10% 0px'});
$$('[data-reveal]').forEach(function(el){revealIO.observe(el)});

/* living elements run only on screen */
var liveIO=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('live',e.isIntersecting)})},{rootMargin:'120px 0px'});
$$('[data-live]').forEach(function(el){liveIO.observe(el)});
document.addEventListener('visibilitychange',function(){document.body.classList.toggle('paused',document.hidden)});

/* nav */
/* the nav stays invisible over the dark top of the page and turns into a white sheet once the page is light */
var nav=$('.nav'),menuBtn=$('.menu-btn'),navSolid=null,navScrolled=null,darkTop=$('.hero, .page-head'),navLim=24;
function navMeasure(){navLim=darkTop?Math.max(24,darkTop.offsetTop+darkTop.offsetHeight-nav.offsetHeight-1):24}
function navUpdate(){
  var s=scrollY>navLim||nav.classList.contains('open')||nav.classList.contains('drop-open');
  if(s!==navSolid){navSolid=s;nav.classList.toggle('solid',s)}
  /* off the very top but still over the dark part: the bar darkens so the text below never shows through it */
  var sc=scrollY>8;
  if(sc!==navScrolled){navScrolled=sc;nav.classList.toggle('scrolled',sc)}
}
/* "Produktet" and "Markat" in the top bar each drop a panel (on phones they open inside the menu); one open at a time */
var dropBtns=$$('.nav-drop');
function setDrop(btn,o){
  dropBtns.forEach(function(b){var on=!!o&&b===btn;b.parentNode.classList.toggle('is-open',on);b.setAttribute('aria-expanded',String(on))});
  nav.classList.toggle('drop-open',!!o&&!!btn);
  navUpdate();
}
dropBtns.forEach(function(b){
  b.addEventListener('click',function(e){e.stopPropagation();setDrop(b,!b.parentNode.classList.contains('is-open'))});
});
$$('.prod-menu a').forEach(function(a){a.addEventListener('click',function(){setDrop(null,false)})});
function setMenu(o){
  nav.classList.toggle('open',o);
  root.classList.toggle('menu-lock',o);   /* the page under the open menu stays put (touch screens) */
  menuBtn.setAttribute('aria-expanded',String(o));
  menuBtn.setAttribute('aria-label',o?TX.menuClose:TX.menuOpen);
  if(!o)setDrop(null,false);
  navUpdate();
}
menuBtn.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
$$('.nav-links a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  var openBtn=$('.has-drop.is-open .nav-drop');
  if(openBtn&&!nav.classList.contains('open')){setDrop(null,false);openBtn.focus();return}
  if(nav.classList.contains('open')){setMenu(false);menuBtn.focus()}
});
document.addEventListener('click',function(e){
  if(nav.contains(e.target))return;
  if(nav.classList.contains('drop-open'))setDrop(null,false);
  if(nav.classList.contains('open'))setMenu(false);
});

/* the airflow thread down the page margin */
var main=$('#main'),hero=$('.hero'),winter=$('#dimri'),contact=$('#kontakt'),prodSec=$('#rreth-nesh');
var th={svg:$('.thread'),ghost:$('.th-ghost'),line:$('.th-line'),head:$('.th-head'),grad:$('#thGrad'),on:false,pinned:false,L:0,y0:0,y1:0,target:0,shown:0,raf:null,last:0,lastOff:-1};
var hasThread=!!(th.svg&&hero&&winter&&contact&&prodSec);
function gutterPx(){var w=root.clientWidth;return Math.min(56,Math.max(16,w*.04))}
function buildThread(){
  if(!hasThread)return;
  var W=main.clientWidth,H=main.offsetHeight;
  var wrapW=Math.min(1200,W-2*gutterPx());
  var side=(W-wrapW)/2;
  if(side<60){th.on=false;th.svg.classList.remove('on');return}
  th.svg.classList.add('on');
  var x0=W-side/2,amp=Math.min(16,side*.16);
  /* the line starts at the first section after the hero and ends at the contact card */
  var y0=prodSec.offsetTop,y1=contact.offsetTop+140;
  var step=300,y=y0,px=x0,i=0,d='M'+x0.toFixed(1)+' '+y0.toFixed(1);
  while(y<y1-1){
    var ny=Math.min(y1,y+step),nx=x0+amp*Math.sin((i+1)*1.7),h=(ny-y)/2;
    d+='C'+px.toFixed(1)+' '+(y+h).toFixed(1)+' '+nx.toFixed(1)+' '+(ny-h).toFixed(1)+' '+nx.toFixed(1)+' '+ny.toFixed(1);
    px=nx;y=ny;i++;
  }
  th.svg.setAttribute('width',W);th.svg.setAttribute('height',H);
  th.svg.setAttribute('viewBox','0 0 '+W+' '+H);
  th.ghost.setAttribute('d',d);th.line.setAttribute('d',d);
  th.L=th.line.getTotalLength();
  th.line.style.strokeDasharray=th.L+' '+th.L;
  th.grad.setAttribute('y2',H);
  var wt=winter.offsetTop/H,wb=(winter.offsetTop+winter.offsetHeight)/H;
  $('.tw1',th.grad).setAttribute('offset',Math.max(0,wt-.02));
  $('.tw2',th.grad).setAttribute('offset',(wt+wb)/2);
  $('.tw3',th.grad).setAttribute('offset',Math.min(1,wb+.02));
  /* fade the first and last stretch of the line so it appears and leaves softly */
  var fade=$('#thFade'),fl=Math.min(180,(y1-y0)*.12)/(y1-y0);
  fade.setAttribute('y1',y0);fade.setAttribute('y2',y1);
  $('.tf1',fade).setAttribute('offset',fl.toFixed(4));$('.tf2',fade).setAttribute('offset',(1-fl).toFixed(4));
  ['#thMask','.tm-rect'].forEach(function(s){var m=$(s,th.svg);m.setAttribute('width',W);m.setAttribute('height',H)});
  th.y0=y0;th.y1=y1;th.on=true;th.lastOff=-1;
  threadTarget();
  if(th.pinned||RM.matches){th.shown=th.target=th.L;drawThread()}
  else{th.shown=th.target;drawThread()}
}
function threadTarget(){
  var tip=scrollY+innerHeight*.62;
  var p=Math.min(1,Math.max(0,(tip-th.y0)/(th.y1-th.y0)));
  th.target=th.pinned?th.L:p*th.L;
}
function drawThread(){
  if(!hasThread)return;
  var off=th.L-th.shown;
  if(Math.abs(off-th.lastOff)<.4)return;
  th.lastOff=off;
  th.line.style.strokeDashoffset=off.toFixed(1);
  if(th.shown<2||th.pinned){th.head.style.opacity='0';return}
  var pt=th.line.getPointAtLength(th.shown);
  th.head.style.opacity='1';
  th.head.setAttribute('transform','translate('+pt.x.toFixed(1)+' '+pt.y.toFixed(1)+')');
}
function threadTick(now){
  var dt=Math.min(100,now-(th.last||now));th.last=now;
  th.shown+=(th.target-th.shown)*(1-Math.pow(1-.14,dt/16.667));
  if(Math.abs(th.target-th.shown)<.5){th.shown=th.target;th.raf=null;th.last=0}
  else th.raf=requestAnimationFrame(threadTick);
  drawThread();
}
function onScroll(){
  navUpdate();
  if(!th.on||th.pinned)return;
  threadTarget();
  if(th.raf===null)th.raf=requestAnimationFrame(threadTick);
}
addEventListener('scroll',onScroll,{passive:true});

/* the step connector line, measured from the real icon positions */
var stepRow=$('.step-row'),stepSvg=$('.step-line');
function buildStepLine(){
  if(!stepRow||getComputedStyle(stepSvg).display==='none')return;
  var r=stepRow.getBoundingClientRect(),ics=$$('.step-ic',stepRow);
  var a=ics[0].getBoundingClientRect(),b=ics[ics.length-1].getBoundingClientRect();
  var x0=a.left+a.width/2-r.left,x1=b.left+b.width/2-r.left,W=r.width,seg=(x1-x0)/3;
  stepSvg.setAttribute('viewBox','0 0 '+W.toFixed(0)+' 40');
  var d='M'+x0.toFixed(1)+' 20';
  for(var k=0;k<3;k++){var s=x0+seg*k,e=s+seg,dy=k%2?14:-14;d+='C'+(s+seg*.35).toFixed(1)+' '+(20+dy)+' '+(e-seg*.35).toFixed(1)+' '+(20-dy)+' '+e.toFixed(1)+' 20'}
  $$('path',stepSvg).forEach(function(p){p.setAttribute('d',d)});
}

var rT=null;
function rebuild(){clearTimeout(rT);rT=setTimeout(function(){navMeasure();navUpdate();buildThread();buildStepLine()},120)}
addEventListener('resize',rebuild);
if('ResizeObserver' in window)new ResizeObserver(rebuild).observe(main);
addEventListener('load',rebuild);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(rebuild);
navMeasure();buildThread();buildStepLine();navUpdate();

/* the room calculator, the one interactive moment */
var area=$('#area'),areaOut=$('#areaOut'),kwEl=$('#kw'),btuEl=$('#btu'),needEl=$('#need'),needle=$('.needle'),fill=$('.dial-fill'),statusEl=$('#calcStatus');
var SIZES=[[2,7000],[2.5,9000],[3.5,12000],[5,18000],[7,24000]],MAXKW=8,calcState={},sT=null;
function ang(kw){return -120+Math.min(kw,MAXKW)/MAXKW*240}
function fmt1(v){var s=v.toFixed(1);return EN?s:s.replace('.',',')}
function fmtK(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,EN?',':'.')}
function checked(name){return $('input[name="'+name+'"]:checked')}
function calc(){
  var a=+area.value,s=checked('sun'),ins=checked('ins');
  var need=a*.1*(+s.value)*(+ins.value);
  var pick=null;for(var i=0;i<SIZES.length;i++){if(SIZES[i][0]>=need*.95){pick=SIZES[i];break}}
  var kwText,btuText,t;
  if(pick){kwText=fmt1(pick[0]);btuText=fmtK(pick[1])+' BTU';t=pick[0]}
  else{kwText='7+';btuText=TX.twoUnits;t=MAXKW}
  areaOut.textContent=a+' m²';
  area.style.setProperty('--p',((a-10)/90*100).toFixed(1)+'%');
  needEl.textContent=TX.need+fmt1(need)+' kW';
  kwEl.textContent=kwText;btuEl.textContent=btuText;
  /* the needle follows the exact need as the slider moves; the arc fills to the unit size we recommend */
  needle.style.transform='rotate('+ang(Math.min(need,MAXKW)).toFixed(2)+'deg)';
  fill.style.strokeDashoffset=(100-Math.min(t,MAXKW)/MAXKW*100).toFixed(2);
  calcState={a:a,kw:kwText,btu:btuText,multi:!pick,sun:$('label[for="'+s.id+'"]').textContent.toLowerCase(),ins:$('label[for="'+ins.id+'"]').textContent.toLowerCase()};
  clearTimeout(sT);
  sT=setTimeout(function(){statusEl.textContent=TX.rec+kwText+' kW, '+btuText},450);
}
if(area)(function ticks(){
  var g=$('.ticks'),cx=200,cy=200,R=150;
  for(var k=0;k<=16;k++){
    var kw=k/2,maj=[2,2.5,3.5,5,7].indexOf(kw)>-1,end=kw===0||kw===8;
    var a=ang(kw)*Math.PI/180,sn=Math.sin(a),cs=Math.cos(a);
    var r1=R-15,r2=R-((maj||end)?31:23);
    var l=document.createElementNS(NS,'line');
    l.setAttribute('x1',(cx+r1*sn).toFixed(1));l.setAttribute('y1',(cy-r1*cs).toFixed(1));
    l.setAttribute('x2',(cx+r2*sn).toFixed(1));l.setAttribute('y2',(cy-r2*cs).toFixed(1));
    if(maj)l.setAttribute('class','maj');
    g.appendChild(l);
    var label=kw===8?'8+':kw===0?'0':(maj&&kw!==2)?fmt1(kw).replace(/[.,]0$/,''):null;
    if(label){
      var t=document.createElementNS(NS,'text'),rl=R+24;
      t.setAttribute('x',(cx+rl*sn).toFixed(1));t.setAttribute('y',(cy-rl*cs).toFixed(1));
      t.textContent=label;g.appendChild(t);
    }
  }
})();
if(area){
  area.addEventListener('input',calc);
  $$('.seg input').forEach(function(r){r.addEventListener('change',calc)});
  calc();
}

/* form prefill from the calculator and the audience tabs */
var fName=$('#f-name'),fPhone=$('#f-phone'),fCo=$('#f-company'),fCity=$('#f-city'),fType=$('#f-type'),fNeed=$('#f-need'),fMsg=$('#f-msg');
function focusFormSoon(){setTimeout(function(){try{fName.focus({preventScroll:true})}catch(e){}},RM.matches?0:750)}
var calcCta=$('#calcCta');
if(calcCta&&fNeed)calcCta.addEventListener('click',function(){
  var s=calcState;
  fNeed.value='kondicioner';
  fMsg.value=TX.room+': '+s.a+' m², '+TX.sun+': '+s.sun+', '+TX.ins+': '+s.ins+'. '+TX.suggested+' '+(s.multi?TX.over7:s.kw+' kW ('+s.btu+')')+'.';
  showForm();focusFormSoon();
});
/* any "ask for an offer" link prefills the form: who is asking (data-type), what for (data-need), which model (data-product) */
if(fType&&fNeed)$$('[data-type],[data-need],[data-product]').forEach(function(a){a.addEventListener('click',function(){
  var t=a.getAttribute('data-type'),nd=a.getAttribute('data-need'),p=a.getAttribute('data-product');
  if(t)fType.value=t;
  if(nd)fNeed.value=nd;else if(t==='Projekt')fNeed.value='projekt';else if(p)fNeed.value='kondicioner';
  if(fNeed.selectedIndex<0)fNeed.selectedIndex=0;
  if(p)fMsg.value=TX.interest+p+'.';
  showForm();focusFormSoon();
})});

/* product catalogues (one per brand): each has its own type filters */
$$('.catalog').forEach(function(cat){
  var btns=$$('.filters button',cat),items=$$('.pitem',cat),status=$('.cat-status',cat);
  if(!btns.length)return;
  function apply(f,animate){
    var n=0;
    btns.forEach(function(b){b.setAttribute('aria-pressed',String(b.getAttribute('data-f')===f))});
    items.forEach(function(it){
      var show=f==='all'||(' '+it.getAttribute('data-cat')+' ').indexOf(' '+f+' ')>-1;
      if(show){
        n++;
        if(it.hidden){
          it.hidden=false;
          if(animate){it.classList.remove('pop');void it.offsetWidth;it.classList.add('pop')}
        }
      }else it.hidden=true;
    });
    if(animate&&status)status.textContent=TX.showing(n);
  }
  btns.forEach(function(b){b.addEventListener('click',function(){apply(b.getAttribute('data-f'),true)})});
  items.forEach(function(it){it.addEventListener('animationend',function(){it.classList.remove('pop')})});
  apply(cat.getAttribute('data-default')||'mur',false);
});

/* brand bar: a logo click glides the page to that brand's models; the bar follows the brand you are reading */
var bbLinks=$$('.bb-logo');
if(bbLinks.length){
  var glideRaf=null;
  var stopGlide=function(){if(glideRaf){cancelAnimationFrame(glideRaf);glideRaf=null}};
  var glideTo=function(y,done){
    stopGlide();
    var y0=scrollY,dy=y-y0,dur=Math.min(1300,Math.max(650,Math.abs(dy)*.45)),t0=null;
    (function step(now){
      if(t0===null)t0=now;
      var k=Math.min(1,(now-t0)/dur),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
      window.scrollTo({top:y0+dy*e,behavior:'instant'});
      if(k<1)glideRaf=requestAnimationFrame(step);else{glideRaf=null;if(done)done()}
    })(performance.now());
  };
  ['wheel','touchstart','keydown'].forEach(function(ev){addEventListener(ev,stopGlide,{passive:true})});
  var setActive=function(id){bbLinks.forEach(function(a){var on=a.getAttribute('href')==='#'+id;a.classList.toggle('is-active',on);if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})};
  bbLinks.forEach(function(a){a.addEventListener('click',function(e){
    var id=a.getAttribute('href').slice(1),target=document.getElementById(id);
    if(!target)return;
    e.preventDefault();setActive(id);
    var bar=$('.brand-bar'),off=(nav?nav.offsetHeight:76)+(bar?bar.offsetHeight:0)+24;
    glideTo(target.getBoundingClientRect().top+scrollY-off,function(){
      try{target.focus({preventScroll:true})}catch(err){}
      history.replaceState(null,'','#'+id);
    });
  })});
  var brandIO=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting&&!glideRaf)setActive(en.target.id)})},{rootMargin:'-45% 0px -50% 0px'});
  bbLinks.forEach(function(a){var t=document.getElementById(a.getAttribute('href').slice(1));if(t)brandIO.observe(t)});
}
$$('.swatches').forEach(function(g){
  var img=g.parentNode.querySelector('img'),sws=$$('.sw',g);
  sws.forEach(function(b){
    var pre=new Image();
    b.addEventListener('pointerenter',function(){if(!pre.src)pre.src=b.getAttribute('data-src')});
    b.addEventListener('click',function(){
      sws.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
      img.src=b.getAttribute('data-src');img.alt=b.getAttribute('data-alt');
    });
  });
});

/* tabs */
var tabs=$$('[role=tab]'),panels=$$('[role=tabpanel]');
function selectTab(t,focus){
  tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',String(on));x.tabIndex=on?0:-1});
  panels.forEach(function(p){
    var on=p.id===t.getAttribute('aria-controls');
    if(on&&p.hidden){p.hidden=false;p.classList.remove('enter');void p.offsetWidth;p.classList.add('enter')}
    else if(!on)p.hidden=true;
  });
  if(focus)t.focus();
}
panels.forEach(function(p,i){if(i>0)p.hidden=true});
tabs.forEach(function(t,i){
  t.addEventListener('click',function(){selectTab(t)});
  t.addEventListener('keydown',function(e){
    var j=null,n=tabs.length;
    if(e.key==='ArrowDown'||e.key==='ArrowRight')j=(i+1)%n;
    else if(e.key==='ArrowUp'||e.key==='ArrowLeft')j=(i-1+n)%n;
    else if(e.key==='Home')j=0;else if(e.key==='End')j=n-1;
    if(j!==null){e.preventDefault();selectTab(tabs[j],true)}
  });
});

/* faq */
$$('.qa .q').forEach(function(b){
  b.addEventListener('click',function(){
    var qa=b.closest('.qa'),o=!qa.classList.contains('open');
    qa.classList.toggle('open',o);b.setAttribute('aria-expanded',String(o));
  });
});

/* winter counter: 1 kWh in, up to 4 out */
function runCounter(){
  if(counted)return;counted=true;
  var el=$('#heatNum');
  var t0=performance.now(),dur=1700,last='';
  el.textContent=fmt1(1);
  (function f(now){
    var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);
    var s=k<1?fmt1(1+3*e):'4';
    if(s!==last){last=s;el.textContent=s}
    if(k<1)requestAnimationFrame(f);
  })(t0);
}

/* the form: opens the visitor's email app with the request written out */
var form=$('#leadForm'),done=$('#formDone'),mailAgain=$('#mailAgain');
function setErr(input,errEl,bad){input.setAttribute('aria-invalid',String(bad));errEl.hidden=!bad}
function showForm(){if(form&&form.hidden){done.hidden=true;done.classList.remove('show');form.hidden=false}}
if(form){
fName.addEventListener('input',function(){if(fName.value.trim())setErr(fName,$('#e-name'),false)});
fPhone.addEventListener('input',function(){if(fPhone.value.trim())setErr(fPhone,$('#e-phone'),false)});
form.addEventListener('submit',function(e){
  e.preventDefault();
  var name=fName.value.trim(),phone=fPhone.value.trim();
  setErr(fName,$('#e-name'),!name);setErr(fPhone,$('#e-phone'),!phone);
  if(!name){fName.focus();return}
  if(!phone){fPhone.focus();return}
  var optText=function(sel){var o=sel.options[sel.selectedIndex];return o?o.text:'-'};
  var subject=TX.subject+' · '+optText(fType)+' · '+name;
  var body=[TX.lName+': '+name,TX.lPhone+': '+phone,TX.lCo+': '+((fCo&&fCo.value.trim())||'-'),TX.lCity+': '+(fCity.value.trim()||'-'),TX.lType+': '+optText(fType),TX.lNeed+': '+optText(fNeed),'',fMsg.value.trim()].join('\n');
  var href='mailto:'+BIZ.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  mailAgain.setAttribute('href',href);
  window.location.href=href;
  form.hidden=true;done.hidden=false;done.classList.add('show');done.focus();
});
$('#editForm').addEventListener('click',function(){showForm();fName.focus()});
}

/* reduced motion, honored live in both directions */
/* reveals, hovers and the gauge stay eased for everyone; only the scroll-drawn margin line is shown whole */
function pinToFinalStates(){
  th.pinned=true;
  if(th.raf!==null){cancelAnimationFrame(th.raf);th.raf=null}
  th.shown=th.target=th.L;th.lastOff=-1;drawThread();
}
function unpinFinalStates(){
  th.pinned=false;th.lastOff=-1;
  threadTarget();th.shown=th.target;drawThread();
}
if(RM.matches)pinToFinalStates();
RM.addEventListener('change',function(e){if(e.matches)pinToFinalStates();else unpinFinalStates()});
})();
