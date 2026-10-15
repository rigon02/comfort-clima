(function(){
'use strict';
/* the business email and phone used by the form */
var BIZ={email:'info@comfort-clima.com',phone:'+383 48 77 22 88'};

var $=function(s,c){return (c||document).querySelector(s)};
var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion: reduce)');
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

/* the liquid light behind the dark top of each page: a slow domain-warped flow in one gradient of the logo's blues,
   deep navy through the logo's dark blue (#13498D) and the blue where the two rings overlap (#0B82BB) to its light blue (#37ABE0).
   The "warmth" cycle now only leans the flow towards the lighter blues. Drawn small and scaled up. */
function Liquid(cv,fx,fy){
  var gl=null;
  try{gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'})}catch(e){}
  if(!gl)return null;
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS='precision highp float;uniform vec2 R;uniform float T;uniform float W;uniform vec2 F;'+
    'float h(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}'+
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}'+
    'float b(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}'+
    'vec3 ir(float x){x=clamp(x,0.,1.);vec3 a=vec3(.047,.141,.29),c=vec3(.075,.286,.553),d=vec3(.043,.51,.733),e=vec3(.216,.671,.878);'+
    'return x<.34?mix(a,c,x/.34):(x<.67?mix(c,d,(x-.34)/.33):mix(d,e,(x-.67)/.33));}'+
    'void main(){vec2 u=gl_FragCoord.xy/R;vec2 p=(gl_FragCoord.xy-.5*R)/R.y*1.5;float t=T*.05;'+
    'vec2 q=vec2(b(p+vec2(0.,t)),b(p+vec2(5.2,1.3)-vec2(t*.8,0.)));'+
    'vec2 r=vec2(b(p+2.6*q+vec2(1.7,9.2)+t*.6),b(p+2.6*q+vec2(8.3,2.8)-t*.5));'+
    'float f=b(p+3.*r);'+
    'float pool=smoothstep(1.35,.0,length((u-F)*vec2(R.x/R.y,1.)));'+
    'float l=smoothstep(.14,.74,f);'+
    'float s=smoothstep(.0,.82,(r.x-.26)*2.1+.6*(q.y-.42)+.45*(f-.5));'+
    'float x=mix(.2,.42,W)+.62*s;'+
    'vec3 base=vec3(.006,.016,.038);'+
    'vec3 col=ir(x)*(.1+1.1*l*(.5+.65*pool));'+
    'col=mix(base,col,smoothstep(.02,.3,l));'+
    'col+=vec3(.82,.92,1.)*pow(smoothstep(.58,.9,f),3.)*.22*pool;'+
    'col*=.88;'+
    'col+=(h(gl_FragCoord.xy+fract(T))-.5)*.035;'+
    'gl_FragColor=vec4(col,1.);}';
  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);
  if(!vs||!fs)return null;
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var uR=gl.getUniformLocation(pr,'R'),uT=gl.getUniformLocation(pr,'T'),uW=gl.getUniformLocation(pr,'W');
  gl.uniform2f(gl.getUniformLocation(pr,'F'),fx,fy);
  var w=0,h=0,dirty=true,lost=false,shown=false;
  if('ResizeObserver' in window)new ResizeObserver(function(){dirty=true}).observe(cv);
  else addEventListener('resize',function(){dirty=true});
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;cv.parentNode.classList.add('no-gl')});
  return {draw:function(t,warm){
    if(lost)return;
    if(dirty){
      dirty=false;
      var cw=cv.clientWidth||1,ch=cv.clientHeight||1,s=Math.min(.6,760/cw);
      var nw=Math.max(2,Math.round(cw*s)),nh=Math.max(2,Math.round(ch*s));
      if(nw!==w||nh!==h){w=cv.width=nw;h=cv.height=nh;gl.viewport(0,0,w,h)}
    }
    gl.uniform2f(uR,w,h);gl.uniform1f(uT,t);gl.uniform1f(uW,warm);
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(!shown){shown=true;cv.classList.add('on')}
  },
  /* the colours just drawn at a few points (0..1 across, 0..1 down): lets the product pick up the light around it */
  read:function(pts){
    if(lost||!w)return null;
    var out=[],px=new Uint8Array(4);
    for(var i=0;i<pts.length;i++){
      gl.readPixels(Math.round(pts[i][0]*(w-1)),Math.round((1-pts[i][1])*(h-1)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
      out.push([px[0],px[1],px[2]]);
    }
    return out;
  }};
}

/* hero: the liquid light behind the text, and on the right three products taking turns, floating
   (Fujitsu Airstage outdoor unit, Fujitsu monobloc heat pump, Dogu ventilation unit).
   The Airstage photo is the grille and casing (with see-through gaps where the fan shows); its fan turns on a canvas underneath.
   The other two are shown as photographed. All pick up the colours of the liquid around them as light on their edges. */
var hero0=$('.hero');
if(hero0&&$('.liquid',hero0)){
  var hBtn=$('.hero-pause',hero0),hCv=$('.liquid',hero0),hLiq=Liquid(hCv,.42,.72);
  var hT=2,hL=14,hF=0,hLast=0,hRaf=null,hVisible=true,hPaused=false,hCache={},hFrame=0;
  if(!hLiq)hero0.classList.add('no-gl');
  var prod=$('.prod-float',hero0),prodShadow=$('.prod-shadow',hero0),prodBox=$('.hero-product',hero0);
  /* the fan opening in each photo with a spinning fan: its centre and the matrix that turns a circle into the tilted ellipse, in photo pixels */
  var FANS=[
    {cx:277.1,cy:467.9,m:[243.3,-34.1,-34.1,304.71],rf:.86,photoW:926}    /* Airstage outdoor unit; the monobloc (slide 2) has none */
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
  var easeIO=function(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2};
  /* a 30 second loop of the liquid's warmth: hold cool 5s, warm up 10s, hold warm 5s, cool down 10s */
  function hWarm(t){
    t=t%30;
    if(t<5)return 0;
    t-=5;if(t<10)return easeIO(t/10);
    t-=10;if(t<5)return 1;
    t-=5;return 1-easeIO(t/10);
  }
  function hRender(){
    var wk=hWarm(hT);
    if(hLiq){hLiq.draw(hL,wk);if(hFrame++%6===0)hLight()}
    else{var hw=wk.toFixed(2);if(hCache.hw!==hw){hCache.hw=hw;hero0.style.setProperty('--hw',hw)}}
    fDraw();hFloat();
  }
  function hTick(now){
    var dt=Math.min(.1,(now-(hLast||now))/1000);hLast=now;
    var sp=RM.matches?.6:1;   /* calmer for visitors who prefer less motion, never frozen; the pause button stops it */
    hT+=dt;hL+=dt*sp;hF+=dt*sp;fA=(fA+dt*sp*FAN.speed)%360;
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
    var l=hPaused?'Vazhdo animacionin':'Ndalo animacionin';
    hBtn.setAttribute('aria-pressed',String(hPaused));hBtn.setAttribute('aria-label',l);hBtn.title=l;
    hero0.classList.toggle('is-paused',hPaused);
    hSync();
  });
  hRender();hSync();
}

/* sub-pages: the same liquid behind the page header, at a fixed warmth per page, with its own pause */
var pHead=$('.page-head'),pCv=pHead?$('.liquid',pHead):null;
if(pCv){
  var pWarm=+(pHead.getAttribute('data-warm')||0),pLiq=Liquid(pCv,.8,.66),pBtn=$('.hero-pause',pHead);
  var pT=9,pLast=0,pRaf=null,pVis=true,pPaused=false;
  if(!pLiq){pHead.classList.add('no-gl');pHead.style.setProperty('--hw',pWarm)}
  else{
    var pTick=function(now){
      var dt=Math.min(.1,(now-(pLast||now))/1000);pLast=now;
      pT+=dt*(RM.matches?.6:1);pLiq.draw(pT,pWarm);
      pRaf=requestAnimationFrame(pTick);
    };
    var pSync=function(){
      var run=pVis&&!pPaused&&!document.hidden;
      if(run&&pRaf===null){pLast=0;pRaf=requestAnimationFrame(pTick)}
      else if(!run&&pRaf!==null){cancelAnimationFrame(pRaf);pRaf=null}
    };
    new IntersectionObserver(function(es){pVis=es[0].isIntersecting;pSync()}).observe(pHead);
    document.addEventListener('visibilitychange',pSync);
    pLiq.draw(pT,pWarm);pSync();
  }
  if(pBtn)pBtn.addEventListener('click',function(){
    pPaused=!pPaused;
    var l=pPaused?'Vazhdo animacionin':'Ndalo animacionin';
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
  addEventListener('resize',bsMeasure);
  bsMeasure();
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
var nav=$('.nav'),menuBtn=$('.menu-btn'),navSolid=null,darkTop=$('.hero, .page-head'),navLim=24;
function navMeasure(){navLim=darkTop?Math.max(24,darkTop.offsetTop+darkTop.offsetHeight-nav.offsetHeight-1):24}
function navUpdate(){
  var s=scrollY>navLim||nav.classList.contains('open')||nav.classList.contains('drop-open');
  if(s!==navSolid){navSolid=s;nav.classList.toggle('solid',s)}
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
  menuBtn.setAttribute('aria-expanded',String(o));
  menuBtn.setAttribute('aria-label',o?'Mbyll menunë':'Hap menunë');
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
function fmt1(v){return v.toFixed(1).replace('.',',')}
function fmtK(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function checked(name){return $('input[name="'+name+'"]:checked')}
function calc(){
  var a=+area.value,s=checked('sun'),ins=checked('ins');
  var need=a*.1*(+s.value)*(+ins.value);
  var pick=null;for(var i=0;i<SIZES.length;i++){if(SIZES[i][0]>=need*.95){pick=SIZES[i];break}}
  var kwText,btuText,t;
  if(pick){kwText=fmt1(pick[0]);btuText=fmtK(pick[1])+' BTU';t=pick[0]}
  else{kwText='7+';btuText='Dy njësi ose multi-split';t=MAXKW}
  areaOut.textContent=a+' m²';
  area.style.setProperty('--p',((a-10)/90*100).toFixed(1)+'%');
  needEl.textContent='Nevoja e llogaritur: '+fmt1(need)+' kW';
  kwEl.textContent=kwText;btuEl.textContent=btuText;
  /* the needle follows the exact need as the slider moves; the arc fills to the unit size we recommend */
  needle.style.transform='rotate('+ang(Math.min(need,MAXKW)).toFixed(2)+'deg)';
  fill.style.strokeDashoffset=(100-Math.min(t,MAXKW)/MAXKW*100).toFixed(2);
  calcState={a:a,kw:kwText,btu:btuText,multi:!pick,sun:$('label[for="'+s.id+'"]').textContent.toLowerCase(),ins:$('label[for="'+ins.id+'"]').textContent.toLowerCase()};
  clearTimeout(sT);
  sT=setTimeout(function(){statusEl.textContent='Masa e rekomanduar: '+kwText+' kW, '+btuText},450);
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
    var label=kw===8?'8+':kw===0?'0':(maj&&kw!==2)?fmt1(kw).replace(',0',''):null;
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
  fMsg.value='Dhoma: '+s.a+' m², diell: '+s.sun+', izolim: '+s.ins+'. Kalkulatori sugjeroi '+(s.multi?'mbi 7 kW (dy njësi ose multi-split)':s.kw+' kW ('+s.btu+')')+'.';
  showForm();focusFormSoon();
});
/* any "ask for an offer" link prefills the form: who is asking (data-type), what for (data-need), which model (data-product) */
if(fType&&fNeed)$$('[data-type],[data-need],[data-product]').forEach(function(a){a.addEventListener('click',function(){
  var t=a.getAttribute('data-type'),nd=a.getAttribute('data-need'),p=a.getAttribute('data-product');
  if(t)fType.value=t;
  if(nd)fNeed.value=nd;else if(t==='Projekt')fNeed.value='projekt';else if(p)fNeed.value='kondicioner';
  if(fNeed.selectedIndex<0)fNeed.selectedIndex=0;
  if(p)fMsg.value='Më intereson: '+p+'.';
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
    if(animate&&status)status.textContent='Po shfaqen '+n+(n===1?' model':' modele');
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
  el.textContent='1,0';
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
  var subject='Kërkesë për ofertë · '+fType.value+' · '+name;
  var body=['Emri: '+name,'Telefoni: '+phone,'Kompania: '+((fCo&&fCo.value.trim())||'-'),'Qyteti: '+(fCity.value.trim()||'-'),'Lloji i klientit: '+optText(fType),'Çfarë më duhet: '+optText(fNeed),'',fMsg.value.trim()].join('\n');
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
