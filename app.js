
(function(){
"use strict";
var CFG={owner:"chan-yerim-wedding",repo:"chan-yerim-wedding.github.io",branch:"main"};
var PAGE=document.body.getAttribute("data-page")==="admin"?"admin":"guest";
var API="https://api.github.com/repos/"+CFG.owner+"/"+CFG.repo;
var RAW="https://raw.githubusercontent.com/"+CFG.owner+"/"+CFG.repo+"/"+CFG.branch+"/";
var TOKEN_KEY="wedding-gh-token";
function getToken(){try{return localStorage.getItem(TOKEN_KEY)||"";}catch(e){return "";}}
function setToken(t){try{if(t)localStorage.setItem(TOKEN_KEY,t);else localStorage.removeItem(TOKEN_KEY);}catch(e){}}
function U(p){p=String(p||"");if(!p||/^(data:|blob:|https?:)/.test(p))return p;return PAGE==="admin"?RAW+p:p;}
var SRC={};
var DEFAULTS={siteTitle:"",theme:"rose",font:"classic",script:"cormorant",coverStyle:"below",galleryStyle:"grid",effect:"petals",motion:true,
  order:["greeting","story","calendar","mid","gallery","location","notice","accounts","contact","closing"],hidden:{story:true,notice:true},
  story:[],notices:[],bgm:"",bgmName:"",photos:[],cover:"",mid:"",midText:"",accounts:{groom:[],bride:[]}};
function migrate(o){
  o=JSON.parse(JSON.stringify(o));
  Object.keys(DEFAULTS).forEach(function(k){if(o[k]===undefined)o[k]=JSON.parse(JSON.stringify(DEFAULTS[k]));});
  if(o.petals===false&&o.effect==="petals")o.effect="none";delete o.petals;
  DEFAULTS.order.forEach(function(k){if(o.order.indexOf(k)<0)o.order.push(k);});
  ["groom","bride"].forEach(function(s){o[s]=o[s]||{};});
  return o;
}
var S=null, D=null, dirty=false;
var app=document.getElementById("app");
var mode=PAGE==="admin"?"edit":"view", tab="design", galleryAll=false, authed=false;
var STASH="wedding-draft-v2";

var THEMES={
  rose:{n:"로즈 토프",d:"따뜻하고 부드러운",v:{ground:"#E9E6E1",paper:"#FBFAF8",ink:"#2B2826",mute:"#8D8781",line:"#DED9D2",accent:"#8A6C66","accent-soft":"#F1EAE7",gold:"#A8916A"}},
  sage:{n:"세이지 그린",d:"싱그럽고 차분한",v:{ground:"#E3E7E0",paper:"#FAFAF7",ink:"#252A26",mute:"#848B84",line:"#D6DBD3",accent:"#5E7462","accent-soft":"#E8EDE6",gold:"#A39468"}},
  navy:{n:"네이비 골드",d:"격식 있는 클래식",v:{ground:"#E2E3E8",paper:"#FBFAF7",ink:"#1F2433",mute:"#7F8495",line:"#D8DAE0",accent:"#2F3E5C","accent-soft":"#E6E9F0",gold:"#B0925A"}},
  mono:{n:"모노크롬",d:"절제된 흑백",v:{ground:"#E5E5E3",paper:"#FFFFFF",ink:"#1A1A1A",mute:"#8C8C8A",line:"#DCDCDA",accent:"#2A2A2A","accent-soft":"#F0F0EE",gold:"#7E7E7A"}},
  lavender:{n:"라벤더 미스트",d:"몽환적인 파스텔",v:{ground:"#E7E4EC",paper:"#FBFAFC",ink:"#2A2730",mute:"#8B8693",line:"#DDD9E3",accent:"#7B6E93","accent-soft":"#EEEAF3",gold:"#A8916A"}},
  burgundy:{n:"버건디 와인",d:"깊고 성숙한",v:{ground:"#EAE3E2",paper:"#FBF9F8",ink:"#2E2222",mute:"#8E7F7E",line:"#E0D5D3",accent:"#7A2E3A","accent-soft":"#F3E6E6",gold:"#A8865A"}}
};
var FONTS={
  classic:{n:"고운바탕",d:"단정한 명조",f:'"Gowun Batang","Nanum Myeongjo",serif'},
  myeongjo:{n:"나눔명조",d:"전통적인 인쇄체",f:'"Nanum Myeongjo","Gowun Batang",serif'},
  modern:{n:"고운돋움",d:"부드러운 고딕",f:'"Gowun Dodum","Noto Sans KR",sans-serif'}
};
var SCRIPTS={
  cormorant:{n:"Cormorant",d:"우아한 세리프",f:'"Cormorant","Gowun Batang",Georgia,serif',st:"italic",sc:1},
  vibes:{n:"Great Vibes",d:"흘림 손글씨",f:'"Great Vibes","Cormorant",cursive',st:"normal",sc:1.15},
  playfair:{n:"Playfair",d:"모던 세리프",f:'"Playfair Display",Georgia,serif',st:"italic",sc:.86}
};
var COVERS={below:{n:"사진 아래 이름",d:"기본 · 사진과 글이 분리"},overlay:{n:"사진 위 이름",d:"전체 화면 사진에 이름"},arch:{n:"아치 프레임",d:"사진을 아치 모양으로"}};
var GALLERIES={grid:{n:"격자",d:"한눈에 보기"},slide:{n:"슬라이드",d:"옆으로 넘기기"},magazine:{n:"매거진",d:"높이가 다른 2열"}};
var EFFECTS={petals:{n:"꽃잎",d:"흩날리는 꽃잎"},snow:{n:"눈송이",d:"겨울 예식에 어울려요"},sparkle:{n:"반짝임",d:"은은한 금빛"},none:{n:"없음",d:"효과 끄기"}};
var SECTIONS={greeting:"인사말 · 혼주",story:"우리의 이야기",calendar:"예식 일시 · 달력",mid:"중간 배경 사진",gallery:"갤러리",location:"오시는 길",notice:"안내 말씀",accounts:"마음 전하실 곳",contact:"연락하기",closing:"마무리 인사"};
var GREETS=[
  ["클래식","초대합니다","서로가 마주 보며 다져온 사랑을\n이제 함께 한곳을 바라보며\n걸어가려 합니다.\n\n저희 두 사람의 새로운 시작을\n따뜻한 마음으로 축복해 주시면\n더없는 기쁨으로 간직하겠습니다."],
  ["담백하게","저희 결혼합니다","평생을 함께하고 싶은 사람을 만났습니다.\n\n서로 아끼고 존중하며\n예쁘게 살겠습니다.\n오셔서 축복해 주세요."],
  ["겨울 예식","함께해 주세요","겨울의 끝자락, 봄을 기다리는 계절에\n저희 두 사람이 하나가 되려 합니다.\n\n바쁘시더라도 귀한 걸음 하시어\n새 출발을 축복해 주시면\n감사하겠습니다."],
  ["봄 예식","소중한 분들을 초대합니다","봄의 한가운데에서\n서로의 계절이 되어주기로 약속했습니다.\n\n저희 두 사람이 사랑으로 만나\n한 길을 함께 걸어가려 합니다.\n귀한 걸음으로 축복해 주시면\n더없는 기쁨으로 간직하겠습니다."],
  ["가을 예식","저희의 시작을 함께해 주세요","깊어가는 가을, 서로에게 물들어\n같은 곳을 바라보게 되었습니다.\n\n소중한 분들 앞에서\n평생을 약속하려 합니다.\n오셔서 축복해 주시면 감사하겠습니다."]
];

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function br(s){return esc(s).replace(/\n/g,"<br>");}
function sur(p){var f=String(p.father||"").trim();return f?f.charAt(0):"";}
function hasSur(p){var n=String(p.name||"").trim(),x=sur(p);return x?(n.length>1&&n.charAt(0)===x):n.length>=3;}
function given(p){var n=String(p.name||"").trim();return hasSur(p)?n.slice(1):n;}
function gName(s){return hasSur(s.bride)?String(s.groom.name||""):given(s.groom);}
function get(o,p){return p.split(".").reduce(function(a,k){return a==null?undefined:a[k];},o);}
function set(o,p,v){var ks=p.split("."),last=ks.pop();ks.reduce(function(a,k){return a[k]=a[k]||{};},o)[last]=v;}
function pad(n){return String(n).padStart(2,"0");}
function autoTitle(s){return (gName(s)||"신랑")+" ♥ "+(s.bride.name||"신부")+" 결혼합니다";}
function siteTitle(s){return String(s.siteTitle||"").trim()||autoTitle(s);}
function toast(t){var el=document.createElement("div");el.className="toast";el.textContent=t;document.body.appendChild(el);setTimeout(function(){el.remove();},2400);}
function copy(text){
  var done=function(){toast("복사했어요");};
  var fb=function(){var ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");done();}catch(e){toast("길게 눌러 직접 복사해 주세요");}ta.remove();};
  try{navigator.clipboard.writeText(text).then(done,fb);}catch(e){fb();}
}
function applyLook(s){
  var r=document.documentElement,t=(THEMES[s.theme]||THEMES.rose).v,f=FONTS[s.font]||FONTS.classic,sc=SCRIPTS[s.script]||SCRIPTS.cormorant;
  Object.keys(t).forEach(function(k){r.style.setProperty("--"+k,t[k]);});
  r.style.setProperty("--f-body",f.f);r.style.setProperty("--f-display",sc.f);r.style.setProperty("--display-style",sc.st);r.style.setProperty("--display-scale",sc.sc);
  r.classList.toggle("no-motion",s.motion===false);r.classList.toggle("is-admin",mode!=="view");r.classList.toggle("vibes",s.script==="vibes");
  ["below","overlay","arch"].forEach(function(c){r.classList.toggle("cv-"+c,s.coverStyle===c);});
  document.title=siteTitle(s);
}

var WD=["일","월","화","수","목","금","토"],WD_EN=["SUN","MON","TUE","WED","THU","FRI","SAT"];
function parseDate(s){var p=String(s.date||"").split("-").map(Number);return p.length===3&&p[0]?{y:p[0],m:p[1],d:p[2],dt:new Date(p[0],p[1]-1,p[2])}:null;}
function timeKo(t){var p=String(t||"").split(":").map(Number);if(isNaN(p[0]))return "";var h=p[0],m=p[1]||0;return (h<12?"오전 ":"오후 ")+(h%12||12)+"시"+(m?" "+m+"분":"");}
function timeEn(t){var p=String(t||"").split(":").map(Number);if(isNaN(p[0]))return "";var h=p[0],m=p[1]||0;return (h%12||12)+":"+pad(m)+(h<12?" AM":" PM");}

/* ---------- invitation sections ---------- */
function coverHTML(s){
  var g=s.groom,b=s.bride,dd=parseDate(s),cs=s.coverStyle;
  var std='<p class="std" id="cv-std">SAVE THE DATE'+(dd?'<b>'+pad(dd.m)+' . '+pad(dd.d)+'</b>':'')+'</p>';
  var names='<p class="cover-of">THE WEDDING OF</p><h1 class="cover-names"><span>'+esc(g.en)+'</span><i>&amp;</i><span style="animation-delay:.25s">'+esc(b.en)+'</span></h1><p class="cover-ko">'+esc(gName(s))+' · '+esc(b.name)+'</p>'+
    (dd?'<p class="cover-date">'+dd.y+'. '+pad(dd.m)+'. '+pad(dd.d)+'. '+WD_EN[dd.dt.getDay()]+' '+esc(timeEn(s.time))+'</p>':'')+
    '<p class="cover-venue">'+esc(s.venue)+(s.hall?' '+esc(s.hall):'')+'</p>';
  var photo=s.cover?'<img class="cover-photo" id="cv-img" src="'+U(s.cover)+'" alt="'+esc(gName(s))+' · '+esc(b.name)+' 웨딩 사진">':'';
  var h='<header class="cover">';
  if(!s.cover){
    h+='<div class="monogram" aria-hidden="true"><span>'+esc((g.en||"G").charAt(0))+'<em>&amp;</em>'+esc((b.en||"B").charAt(0))+'</span></div>'+names;
  }else if(cs==="overlay"){
    h+='<div class="cover-frame">'+photo+'<div class="cover-text">'+names+'</div></div>';
  }else if(cs==="arch"){
    h+='<p class="arch-top">SAVE THE DATE'+(dd?' · '+pad(dd.m)+'.'+pad(dd.d):'')+'</p><div class="cover-frame">'+photo+'</div>'+names;
  }else{
    h+='<div class="cover-frame">'+photo+std+'</div>'+names;
  }
  return h+'</header>';
}
function sec(eye,title,inner){return '<section class="sec">'+(eye?'<p class="eyebrow rv">'+eye+'</p>':'')+(title?'<h2 class="h2 rv">'+esc(title)+'</h2>':'')+inner+'</section>';}
var RENDER={
  greeting:function(s){
    var g=s.groom,b=s.bride;
    var lines=String(s.greeting||"").split("\n").map(function(l){return l.trim()?'<span class="rv" style="display:block">'+esc(l)+'</span>':'<br>';}).join("");
    return sec("Invitation",s.greetTitle,'<p class="greet">'+lines+'</p><div class="ornament"></div><div class="parents rv">'+
      '<div><b>'+esc(g.father)+'</b>'+(g.mother?' · <b>'+esc(g.mother)+'</b>':'')+'<span class="rel">의 '+esc(g.order)+'</span><b>'+esc(given(g))+'</b></div>'+
      '<div><b>'+esc(b.father)+'</b>'+(b.mother?' · <b>'+esc(b.mother)+'</b>':'')+'<span class="rel">의 '+esc(b.order)+'</span><b>'+esc(given(b))+'</b></div></div>');
  },
  story:function(s){
    if(!s.story.length)return "";
    return sec("Our Story","우리의 이야기",'<ol class="story">'+s.story.map(function(it){return '<li class="rv"><p class="when">'+esc(it.date)+'</p><h3>'+esc(it.title)+'</h3>'+(it.text?'<p>'+br(it.text)+'</p>':'')+'</li>';}).join("")+'</ol>');
  },
  calendar:function(s){
    var dd=parseDate(s);if(!dd)return "";
    var h='<p class="when-line rv">'+dd.y+'년 '+dd.m+'월 '+dd.d+'일 '+WD[dd.dt.getDay()]+'요일 '+esc(timeKo(s.time))+'</p><div class="cal rv" role="grid" aria-label="'+dd.y+'년 '+dd.m+'월 달력">';
    WD.forEach(function(w,i){h+='<div class="wd'+(i===0?' sun':'')+'">'+w+'</div>';});
    var first=new Date(dd.y,dd.m-1,1).getDay(),days=new Date(dd.y,dd.m,0).getDate();
    for(var i=0;i<first;i++)h+='<div></div>';
    for(var d=1;d<=days;d++){var sun=(first+d-1)%7===0;h+=d===dd.d?'<div><span class="day">'+d+'</span></div>':'<div class="'+(sun?'sun':'')+'">'+d+'</div>';}
    h+='</div>';
    var t=new Date();t.setHours(0,0,0,0);var diff=Math.round((dd.dt-t)/864e5),nm=esc(given(s.groom))+' ♥ '+esc(given(s.bride));
    if(diff>=0)h+='<div class="count rv" id="count"><div><b data-c="d">0</b><small>DAYS</small></div><div class="sep">:</div><div><b data-c="h">00</b><small>HOUR</small></div><div class="sep">:</div><div><b data-c="m">00</b><small>MIN</small></div><div class="sep">:</div><div><b data-c="s">00</b><small>SEC</small></div></div>';
    h+='<p class="dday rv">'+(diff>0?nm+'의 결혼식이 <b>'+diff+'일</b> 남았습니다':diff===0?'오늘, '+nm+'이 결혼합니다':'함께 축복해 주셔서 감사합니다')+'</p>';
    return sec("Wedding Day","",h);
  },
  mid:function(s){
    if(!s.mid)return "";
    return '<section class="mid"><img id="mid-img" src="'+U(s.mid)+'" alt="" loading="lazy"><div class="mid-in"><p class="eyebrow rv">Our Promise</p><p class="rv">'+br(s.midText)+'</p></div></section>';
  },
  gallery:function(s){
    var ph=s.photos;if(!ph.length)return "";
    var st=s.galleryStyle,h="";
    if(st==="slide"){
      h='<div class="slide" id="slide">'+ph.map(function(src,i){return '<button data-lb="'+i+'" aria-label="사진 '+(i+1)+' 크게 보기"><img class="gimg" src="'+U(src)+'" alt="" loading="lazy"></button>';}).join("")+'</div><p class="slide-count" id="slide-n">1 / '+ph.length+'</p>';
    }else{
      var show=galleryAll?ph:ph.slice(0,st==="magazine"?8:9),ex=show.length%3;
      h='<div class="'+(st==="magazine"?"mag":"grid")+'">'+show.map(function(src,i){var w=st==="grid"?(ex===1&&i===0?" w6":ex===2&&i<2?" w3":""):"";return '<button class="rv-soft'+w+'" data-lb="'+i+'" aria-label="사진 '+(i+1)+' 크게 보기"><img class="gimg" src="'+U(src)+'" alt="" loading="lazy"></button>';}).join("")+'</div>';
      if(show.length<ph.length)h+='<button class="more" data-more>사진 더 보기 ('+ph.length+')</button>';
    }
    return sec("Gallery","우리의 순간",h);
  },
  location:function(s){
    var q=encodeURIComponent(s.address||s.venue||"");
    var h='<p class="venue rv">'+esc(s.venue)+(s.hall?' <span class="muted small">'+esc(s.hall)+'</span>':'')+'</p><p class="addr">'+esc(s.address)+'</p>'+(s.venueTel?'<p class="addr">'+esc(s.venueTel)+'</p>':'');
    h+='<div class="btnrow"><a class="pill" href="https://map.naver.com/p/search/'+q+'" target="_blank" rel="noopener">네이버 지도</a><a class="pill" href="https://map.kakao.com/?q='+q+'" target="_blank" rel="noopener">카카오맵</a><button class="pill" data-copy="'+esc(s.address)+'">주소 복사</button></div><div class="way rv">';
    [["subway","지하철"],["bus","버스"],["car","자가용"],["parking","주차"]].forEach(function(w){if(s[w[0]])h+='<div><h3>'+w[1]+'</h3><p>'+br(s[w[0]])+'</p></div>';});
    return sec("Location","오시는 길",h+'</div>');
  },
  notice:function(s){
    if(!s.notices.length)return "";
    return sec("Notice","안내 말씀",'<div class="notices">'+s.notices.map(function(n){return '<div class="notice rv"><h3>'+esc(n.title)+'</h3><p>'+br(n.text)+'</p></div>';}).join("")+'</div>');
  },
  accounts:function(s){
    var A=s.accounts;if(!(A.groom||[]).length&&!(A.bride||[]).length)return "";
    var h='<p class="muted small" style="margin:-14px 0 18px">축하의 마음을 전해 주시는 분들을 위해 안내드립니다</p>';
    [["groom","신랑측"],["bride","신부측"]].forEach(function(side){
      var rows=A[side[0]]||[];if(!rows.length)return;
      h+='<div class="acc rv" data-acc><button aria-expanded="false"><span>'+side[1]+' 계좌번호</span><span aria-hidden="true">⌄</span></button><div class="acc-body" hidden>';
      rows.forEach(function(r){h+='<div class="acc-row"><div><p class="who">'+esc(r.who)+'</p><p class="num">'+esc(r.bank)+' '+esc(r.num)+'</p></div><button class="copy" data-copy="'+esc(r.bank+" "+r.num)+'">복사</button></div>';});
      h+='</div></div>';
    });
    return sec("With Heart","마음 전하실 곳",h);
  },
  contact:function(s){
    var cols=[[s.groom,"신랑측","신랑"],[s.bride,"신부측","신부"]].map(function(c){
      var p=c[0],ppl=[[c[2],p===s.groom?gName(s):p.name,p.phone],["아버지",p.father,p.fatherPhone],["어머니",p.mother,p.motherPhone]].filter(function(x){return x[2];});
      if(!ppl.length)return "";
      return '<div><h3>'+c[1]+'</h3>'+ppl.map(function(x){return '<div class="person"><p class="role">'+x[0]+'</p><p>'+esc(x[1])+'</p><p class="num">'+esc(x[2])+'</p><button class="copy" data-copy="'+esc(x[2])+'">번호 복사</button></div>';}).join("")+'</div>';
    }).join("");
    if(!cols)return "";
    return sec("Contact","연락하기",'<div class="contacts rv">'+cols+'</div>');
  },
  closing:function(s){return s.closing?'<section class="sec"><p class="closing rv">'+br(s.closing)+'</p></section>':"";}
};
function invitation(s){
  var dd=parseDate(s);
  var h='<article class="card">'+coverHTML(s);
  s.order.forEach(function(k){if(!s.hidden[k]&&RENDER[k])h+=RENDER[k](s);});
  h+='<footer class="foot">'+esc(s.groom.en)+' &amp; '+esc(s.bride.en)+(dd?' · '+dd.y+'.'+pad(dd.m)+'.'+pad(dd.d):'')+'</footer></article>';
  return h;
}

/* ---------- lightbox ---------- */
function openLB(i,list){
  var idx=i,el=document.createElement("div");el.className="lb";el.setAttribute("role","dialog");el.setAttribute("aria-label","사진 보기");
  var paint=function(){el.innerHTML='<button class="lb-x" aria-label="닫기">×</button><img src="'+U(list[idx])+'" alt="사진 '+(idx+1)+'"><div class="lb-bar"><button data-p aria-label="이전 사진">‹</button><span>'+(idx+1)+' / '+list.length+'</span><button data-n aria-label="다음 사진">›</button></div>';};
  var go=function(dir){idx=(idx+dir+list.length)%list.length;paint();};
  var key=function(e){if(e.key==="Escape")close();if(e.key==="ArrowLeft")go(-1);if(e.key==="ArrowRight")go(1);};
  function close(){document.removeEventListener("keydown",key);el.remove();}
  paint();
  el.addEventListener("click",function(e){if(e.target.closest(".lb-x")||e.target===el)close();else if(e.target.closest("[data-p]"))go(-1);else if(e.target.closest("[data-n]"))go(1);});
  var x0=null;el.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;},{passive:true});
  el.addEventListener("touchend",function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)go(dx<0?1:-1);x0=null;});
  document.addEventListener("keydown",key);document.body.appendChild(el);el.querySelector(".lb-x").focus();
}
var appWired=false;
function wireInvitation(root,s){
  var isApp=root===app;
  if(!isApp||!appWired)root.addEventListener("click",function(e){
    if(isApp&&mode!=="view")return;
    if(isApp)s=S;
    var c=e.target.closest("[data-copy]");if(c){copy(c.getAttribute("data-copy"));return;}
    var l=e.target.closest("[data-lb]");if(l){openLB(+l.getAttribute("data-lb"),s.photos);return;}
    if(e.target.closest("[data-more]")){galleryAll=true;render();return;}
    var a=e.target.closest("[data-acc]>button");if(a){var box=a.parentNode,body=box.querySelector(".acc-body");body.hidden=!body.hidden;box.classList.toggle("open",!body.hidden);a.setAttribute("aria-expanded",String(!body.hidden));}
  });
  if(isApp)appWired=true;
  var sl=root.querySelector("#slide"),sn=root.querySelector("#slide-n");
  if(sl&&sn)sl.addEventListener("scroll",function(){var b=sl.querySelector("button");if(!b)return;var i=Math.round(sl.scrollLeft/(b.offsetWidth+10));sn.textContent=(Math.min(i,s.photos.length-1)+1)+" / "+s.photos.length;},{passive:true});
}

/* ---------- effects ---------- */
var RM=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var fx={raf:0,tick:0,anim:0,onScroll:null,onResize:null,nodes:[],audio:null};
var fxOn=true;try{fxOn=localStorage.getItem("wedding-fx")!=="off";}catch(e){}
function stopFx(){
  if(fx.onScroll){window.removeEventListener("scroll",fx.onScroll);window.removeEventListener("resize",fx.onScroll);}
  if(fx.onResize)window.removeEventListener("resize",fx.onResize);
  cancelAnimationFrame(fx.raf);cancelAnimationFrame(fx.anim);clearInterval(fx.tick);
  fx.nodes.forEach(function(n){n.remove();});fx.nodes=[];
  if(fx.audio){fx.audio.pause();fx.audio=null;}
}
function startFx(s){
  var prog=document.getElementById("prog"),cv=document.getElementById("cv-img"),std=document.getElementById("cv-std"),mid=document.getElementById("mid-img");
  var motion=s.motion!==false&&!RM,pending=false;
  function frame(){
    pending=false;var y=window.scrollY,H=document.documentElement.scrollHeight-innerHeight;
    if(prog)prog.style.transform="scaleX("+(H>0?Math.min(1,y/H):0)+")";
    if(!motion)return;
    if(cv&&y>0&&y<innerHeight*1.3){cv.style.animation="none";cv.style.transform="translateY("+(y*.32)+"px) scale("+(1+y*.00025)+")";if(std)std.style.opacity=String(Math.max(0,1-y/260));}
    if(mid){var r=mid.parentNode.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight){mid.style.transform="translateY("+((r.top+r.height/2-innerHeight/2)/innerHeight*-60)+"px)";}}
  }
  fx.onScroll=function(){if(!pending){pending=true;fx.raf=requestAnimationFrame(frame);}};
  window.addEventListener("scroll",fx.onScroll,{passive:true});window.addEventListener("resize",fx.onScroll);frame();
  var box=document.getElementById("count"),dd=parseDate(s);
  if(box&&dd){
    var tp=String(s.time||"12:00").split(":").map(Number),target=new Date(dd.y,dd.m-1,dd.d,tp[0]||0,tp[1]||0),els={};
    ["d","h","m","s"].forEach(function(k){els[k]=box.querySelector('[data-c="'+k+'"]');});
    var tick=function(){var sec=Math.floor(Math.max(0,target-new Date())/1000);els.d.textContent=Math.floor(sec/86400);els.h.textContent=pad(Math.floor(sec%86400/3600));els.m.textContent=pad(Math.floor(sec%3600/60));els.s.textContent=pad(sec%60);};
    tick();fx.tick=setInterval(tick,1000);
  }
  if(s.bgm){
    var au=fx.audio=new Audio(U(s.bgm));au.loop=true;au.volume=.6;
    var bt=document.createElement("button");bt.className="chip bgm";bt.setAttribute("aria-label","배경음악");
    var lab=function(){bt.classList.toggle("on",!au.paused);bt.innerHTML='<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>'+(au.paused?"음악 켜기":"음악 끄기");};lab();
    bt.addEventListener("click",function(){if(au.paused)au.play().then(lab,function(){toast("음악을 재생할 수 없어요");});else{au.pause();lab();}});
    document.body.appendChild(bt);fx.nodes.push(bt);
  }
  if(s.effect&&s.effect!=="none"&&!RM){
    var tg=document.createElement("button");tg.className="chip fx-tg";
    var nm=(EFFECTS[s.effect]||{}).n||"효과";
    var lab2=function(){tg.textContent=nm+(fxOn?" 끄기":" 켜기");};lab2();
    var c=document.createElement("canvas");c.className="fx-cv";c.hidden=!fxOn;
    tg.addEventListener("click",function(){fxOn=!fxOn;try{localStorage.setItem("wedding-fx",fxOn?"on":"off");}catch(e){}lab2();c.hidden=!fxOn;});
    document.body.appendChild(c);document.body.appendChild(tg);fx.nodes.push(c,tg);
    particles(c,s.effect);
  }
}
function particles(c,kind){
  var ctx=c.getContext("2d"),dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0,ps=[];
  var size=function(){W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
  size();fx.onResize=size;window.addEventListener("resize",size);
  var t=getComputedStyle(document.documentElement),gold=t.getPropertyValue("--gold").trim()||"#A8916A";
  var hues=[[232,196,196],[240,214,208],[226,182,186],[246,232,226]];
  var mk=function(top){return {x:Math.random()*W,y:top?Math.random()*H:-20,r:kind==="snow"?1.5+Math.random()*3:kind==="sparkle"?1+Math.random()*2.2:5+Math.random()*6,vy:kind==="snow"?.3+Math.random()*.6:.35+Math.random()*.55,vx:-.2+Math.random()*.4,a:Math.random()*6.28,va:-.02+Math.random()*.04,sw:Math.random()*6.28,c:hues[Math.floor(Math.random()*hues.length)],o:.45+Math.random()*.4,life:Math.random()};};
  var n=kind==="snow"?40:kind==="sparkle"?28:16;for(var i=0;i<n;i++)ps.push(mk(true));
  var draw=function(){
    fx.anim=requestAnimationFrame(draw);if(c.hidden)return;ctx.clearRect(0,0,W,H);
    ps.forEach(function(p,i){
      if(kind==="sparkle"){
        p.life+=.006;if(p.life>1){ps[i]=mk(true);ps[i].life=0;return;}
        var a=Math.sin(p.life*Math.PI);ctx.save();ctx.globalAlpha=a*.85;ctx.translate(p.x,p.y);ctx.fillStyle=gold;
        ctx.beginPath();for(var k=0;k<4;k++){ctx.rotate(Math.PI/2);ctx.lineTo(0,-p.r*3);ctx.lineTo(p.r*.5,-p.r*.5);}ctx.closePath();ctx.fill();ctx.restore();return;
      }
      p.sw+=.012;p.y+=p.vy;p.x+=p.vx+Math.sin(p.sw)*.35;p.a+=p.va;
      if(p.y>H+20||p.x<-30||p.x>W+30)ps[i]=mk(false);
      if(kind==="snow"){
        var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);g.addColorStop(0,"rgba(255,255,255,"+(p.o+.1)+")");g.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.r*2,0,6.29);ctx.fill();
        ctx.fillStyle="rgba(210,214,224,"+(p.o*.5)+")";ctx.beginPath();ctx.arc(p.x,p.y,p.r*.6,0,6.29);ctx.fill();return;
      }
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.scale(1,.55+Math.abs(Math.sin(p.sw*1.7))*.45);
      var gr=ctx.createRadialGradient(-p.r*.3,-p.r*.3,0,0,0,p.r);gr.addColorStop(0,"rgba(255,248,246,"+p.o+")");gr.addColorStop(1,"rgba("+p.c.join(",")+","+p.o+")");
      ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(0,-p.r);ctx.bezierCurveTo(p.r,-p.r*.6,p.r*.8,p.r*.6,0,p.r);ctx.bezierCurveTo(-p.r*.8,p.r*.6,-p.r,-p.r*.6,0,-p.r);ctx.fill();ctx.restore();
    });
  };
  draw();
}

/* ---------- admin ---------- */
var TABS=[["design","디자인"],["content","내용"],["media","사진 · 음악"],["layout","구성"]];
function fid(p){return "f-"+p.replace(/\./g,"-");}
function field(p,label,type,wide,ph){
  var id=fid(p),v=esc(get(D,p)),t=type||"text";
  return '<div class="fld'+(wide?' wide':'')+'"><label for="'+id+'">'+label+'</label>'+(t==="textarea"?'<textarea id="'+id+'" data-path="'+p+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>'+v+'</textarea>':'<input id="'+id+'" type="'+t+'" data-path="'+p+'" value="'+v+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>')+'</div>';
}
function panel(title,sub,inner){return '<section class="panel"><h2>'+title+(sub?'<small>'+sub+'</small>':'')+'</h2>'+inner+'</section>';}
function opts(key,map,extra){
  return '<div class="opts">'+Object.keys(map).map(function(k){var o=map[k];return '<button class="opt" data-opt="'+key+'" data-val="'+k+'" aria-pressed="'+(D[key]===k)+'">'+(extra?extra(k,o):'')+'<b>'+o.n+'</b><small>'+o.d+'</small></button>';}).join("")+'</div>';
}
function rows(path,cols,blank,addLabel){
  var list=get(D,path)||[],base=path.replace(/\./g,"-");
  var h='<div class="rows">';
  list.forEach(function(r,i){
    h+='<div class="row-edit" style="--cols:'+cols.filter(function(c){return c[2]!=="textarea";}).length+'">';
    cols.forEach(function(c){
      var id="r-"+base+"-"+i+"-"+c[0],common=' id="'+id+'" aria-label="'+c[1]+'" placeholder="'+c[1]+'" data-list="'+path+'" data-i="'+i+'" data-k="'+c[0]+'"';
      h+= c[2]==="textarea"?'<textarea class="full"'+common+'>'+esc(r[c[0]])+'</textarea>':'<input'+common+' value="'+esc(r[c[0]])+'">';
    });
    h+='<button class="rm" data-list-rm="'+path+'" data-i="'+i+'" aria-label="삭제" style="grid-row:1;grid-column:-2">×</button></div>';
  });
  return h+'</div><p style="margin:10px 0 0"><button class="ghost" data-list-add="'+path+'" data-blank="'+esc(JSON.stringify(blank))+'">+ '+addLabel+'</button></p>';
}
function slot(key,label,sub,ratio,max){
  var w=ratio==="wide"?"width:150px;aspect-ratio:3/2":"";
  return panel(label,sub,'<div class="cover-slot">'+(D[key]?'<img src="'+U(D[key])+'" alt="'+label+'" style="'+w+'">':'<div class="empty" style="'+w+'">사진 없음</div>')+
    '<label class="upl">사진 선택<input type="file" id="up-'+key+'" data-max="'+max+'" accept="image/*"></label>'+(D[key]?'<button class="ghost" data-clear="'+key+'">빼기</button>':'')+'</div>');
}
function sizeMB(){return JSON.stringify(D).length/1048576;}
function adminHTML(){
  var h='<div class="adm"><div class="adm-top"><div class="adm-top-in"><h1>청첩장 편집</h1><div class="tabs" role="group" aria-label="화면 전환"><button data-mode="edit" aria-pressed="'+(mode==="edit")+'">편집</button><button data-mode="preview" aria-pressed="'+(mode==="preview")+'">미리보기</button></div><a class="adm-x" href="./" target="_blank" rel="noopener">하객 화면</a><button class="adm-x" data-logout>연결 해제</button></div>';
  if(mode==="edit")h+='<div class="subtabs" role="tablist">'+TABS.map(function(t){return '<button role="tab" data-tab="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+'</button>';}).join("")+'</div>';
  h+='</div>';
  if(mode==="preview"){h+='<div class="preview-wrap" id="pv">'+invitation(D)+'</div>';}
  else{
    h+='<div class="adm-body">';
    if(readStash())h+='<div class="note">저장하지 못한 편집 내용이 남아 있어요.<button data-restore>불러오기</button><button data-drop>버리기</button></div>';
    if(tab==="design"){
      h+=panel("테마 색","전체 분위기를 정해요",opts("theme",THEMES,function(k,o){var v=o.v;return '<span class="sw"><i style="background:'+v.accent+'"></i><i style="background:'+v["accent-soft"]+'"></i><i style="background:'+v.gold+'"></i></span>';}));
      h+=panel("한글 글꼴","",opts("font",FONTS,function(k,o){return '<span class="sample-txt" style="font-family:'+esc(o.f)+'">결혼합니다</span>';}));
      h+=panel("영문 글꼴","표지 이름과 소제목",opts("script",SCRIPTS,function(k,o){return '<span class="sample-txt" style="font-family:'+esc(o.f)+';font-style:'+o.st+'">Wedding</span>';}));
      h+=panel("표지 스타일","",opts("coverStyle",COVERS));
      h+=panel("갤러리 형식","",opts("galleryStyle",GALLERIES));
      h+=panel("화면 효과","하객이 직접 끌 수도 있어요",opts("effect",EFFECTS)+'<label class="chk"><input type="checkbox" id="f-motion" data-bool="motion"'+(D.motion!==false?' checked':'')+'> 스크롤 애니메이션 (글이 떠오르고 사진이 천천히 움직여요)</label>');
    }
    if(tab==="content"){
      h+=panel("사이트 이름","브라우저 탭과 링크 공유 시 보여요",'<div class="fields">'+field("siteTitle","비워두면 자동으로 만들어져요","text",1,autoTitle(D))+'</div>');
      ["groom","bride"].forEach(function(s){
        var L=s==="groom"?"신랑":"신부";
        h+=panel(L,"",'<div class="fields">'+field(s+".name","이름")+field(s+".en","영문 이름 (표지)")+field(s+".phone",L+" 연락처","tel")+field(s+".order","관계 (장남·장녀 등)")+field(s+".father","아버지")+field(s+".fatherPhone","아버지 연락처","tel")+field(s+".mother","어머니")+field(s+".motherPhone","어머니 연락처","tel")+'</div>');
      });
      h+=panel("예식 일시 · 장소","",'<div class="fields">'+field("date","날짜","date")+field("time","시간","time")+field("venue","예식장 이름")+field("hall","홀 · 층")+field("address","주소 (지도 검색에 쓰여요)","text",1)+field("venueTel","예식장 전화번호","tel")+'</div>');
      h+=panel("인사말","예시를 눌러 바로 채울 수 있어요",'<div class="tpls">'+GREETS.map(function(g,i){return '<button class="ghost" data-greet="'+i+'">'+g[0]+'</button>';}).join("")+'</div><div class="fields">'+field("greetTitle","제목","text",1)+field("greeting","본문 (줄바꿈 그대로 보여요)","textarea",1)+'</div>');
      h+=panel("교통 안내","비운 항목은 숨겨져요",'<div class="fields">'+field("subway","지하철","textarea",1)+field("bus","버스","textarea",1)+field("car","자가용","textarea",1)+field("parking","주차","textarea",1)+'</div>');
      h+=panel("우리의 이야기","연애 연표 · 구성 탭에서 켜면 보여요",rows("story",[["date","날짜 (예: 2021. 05)"],["title","제목"],["text","내용","textarea"]],{date:"",title:"",text:""},"이야기 추가"));
      h+=panel("안내 말씀","식사 · 화환 · 셔틀 등 · 구성 탭에서 켜면 보여요",rows("notices",[["title","제목 (예: 식사 안내)"],["text","내용","textarea"]],{title:"",text:""},"안내 추가"));
      h+=panel("마음 전하실 곳","비워두면 숨겨져요",'<p class="side-label">신랑측</p>'+rows("accounts.groom",[["who","이름 (예: 아버지 임재웅)"],["bank","은행"],["num","계좌번호"]],{who:"",bank:"",num:""},"신랑측 계좌 추가")+'<p class="side-label" style="margin-top:18px">신부측</p>'+rows("accounts.bride",[["who","이름"],["bank","은행"],["num","계좌번호"]],{who:"",bank:"",num:""},"신부측 계좌 추가"));
      h+=panel("문구","",'<div class="fields">'+field("midText","중간 사진 위 문구","textarea",1)+field("closing","마무리 인사","textarea",1)+'</div>');
    }
    if(tab==="media"){
      h+=slot("cover","대표 사진","표지에 크게 들어가요 · 세로 사진 추천","tall",1600);
      h+=slot("mid","중간 배경 사진","스크롤할 때 천천히 움직여요 · 가로 사진 추천","wide",1400);
      h+=panel("갤러리",D.photos.length+"장 · 화살표로 순서 변경",'<label class="upl">사진 추가 (여러 장 가능)<input type="file" id="up-gal" accept="image/*" multiple></label><div class="pics">'+
        D.photos.map(function(src,i){return '<div class="pic" data-i="'+i+'"><img src="'+U(src)+'" alt="갤러리 '+(i+1)+'"><span class="n">'+(i+1)+'</span><div class="pic-ctl"><button data-mv="-1" aria-label="앞으로">‹</button><button class="del" data-del aria-label="삭제">✕</button><button data-mv="1" aria-label="뒤로">›</button></div></div>';}).join("")+'</div>');
      h+=panel("배경음악","MP3 · 5MB 이하 · 하객이 버튼을 눌러야 재생돼요",'<div class="cover-slot">'+(D.bgm?'<span>♪ '+esc(D.bgmName||"배경음악")+'</span><button class="ghost" data-clear="bgm">빼기</button>':'<span class="muted small">음악 없음</span>')+'<label class="upl">음악 파일 선택<input type="file" id="up-bgm" accept="audio/*"></label></div>');
    }
    if(tab==="layout"){
      h+=panel("섹션 순서 · 보이기","체크를 끄면 하객 화면에서 숨겨져요",'<div class="order">'+D.order.map(function(k,i){return '<div class="order-row'+(D.hidden[k]?' off':'')+'"><input type="checkbox" id="vis-'+k+'" data-vis="'+k+'"'+(D.hidden[k]?'':' checked')+' aria-label="'+SECTIONS[k]+' 보이기"><span>'+SECTIONS[k]+'</span><button data-ord="'+i+'" data-dir="-1" aria-label="위로">↑</button><button data-ord="'+i+'" data-dir="1" aria-label="아래로">↓</button></div>';}).join("")+'</div>');
    }
    h+='</div>';
  }
  h+='<div class="savebar"><div class="savebar-in"><div class="meter'+(dirty?' warn':'')+'" id="meter">'+meterTxt()+'</div><button class="save" id="save-btn">저장하고 반영</button></div></div></div>';
  return h;
}
function meterTxt(){return dirty?'<b>저장하지 않은 변경사항</b>이 있어요':'저장하면 1~2분 뒤 하객 화면에 반영돼요';}
function updateMeter(){dirty=true;var m=document.getElementById("meter");if(m){m.className="meter warn";m.innerHTML=meterTxt();}}
function compress(file,max){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){var k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",0.8));};
    img.onerror=function(){URL.revokeObjectURL(url);rej();};img.src=url;
  });
}
function readStash(){try{var s=localStorage.getItem(STASH);if(!s)return null;if(!S||s===JSON.stringify(S)){localStorage.removeItem(STASH);return null;}return JSON.parse(s);}catch(e){return null;}}
function writeStash(o){try{localStorage.setItem(STASH,JSON.stringify(o));}catch(e){}}
function dropStash(){try{localStorage.removeItem(STASH);}catch(e){}}
function wireAdmin(){
  var root=app.querySelector(".adm");
  root.addEventListener("input",function(e){
    var t=e.target;
    if(t.dataset.path){set(D,t.dataset.path,t.value);if(t.dataset.path==="siteTitle"||/\.(name|father)$/.test(t.dataset.path))document.title=siteTitle(D);}
    else if(t.dataset.list){get(D,t.dataset.list)[+t.dataset.i][t.dataset.k]=t.value;}
    else return;
    updateMeter();
  });
  root.addEventListener("change",function(e){
    var t=e.target;
    dirty=true;
    if(t.dataset.bool){D[t.dataset.bool]=t.checked;applyLook(D);updateMeter();return;}
    if(t.dataset.vis){D.hidden[t.dataset.vis]=!t.checked;t.closest(".order-row").classList.toggle("off",!t.checked);return;}
    if((t.id==="up-cover"||t.id==="up-mid")&&t.files[0]){var key=t.id.slice(3);toast("사진을 준비하는 중…");compress(t.files[0],+t.dataset.max).then(function(u){D[key]=u;render();},function(){toast("이 사진 형식은 열 수 없어요. JPG나 PNG로 올려 주세요");});}
    if(t.id==="up-gal"&&t.files.length){
      var fs=[].slice.call(t.files);toast(fs.length+"장 준비하는 중…");
      Promise.all(fs.map(function(f){return compress(f,1280).catch(function(){return null;});})).then(function(us){var ok=us.filter(Boolean);D.photos=D.photos.concat(ok);if(ok.length<us.length)toast((us.length-ok.length)+"장은 형식 문제로 건너뛰었어요");render();});
    }
    if(t.id==="up-bgm"&&t.files[0]){
      var f=t.files[0];if(f.size>5*1048576){toast("5MB 이하 파일만 넣을 수 있어요");return;}
      var fr=new FileReader();fr.onload=function(){D.bgm=fr.result;D.bgmName=f.name;render();};fr.onerror=function(){toast("파일을 읽지 못했어요");};fr.readAsDataURL(f);
    }
  });
  root.addEventListener("click",function(e){
    var t=e.target.closest("button");if(!t)return;
    if(t.dataset.mode){mode=t.dataset.mode;render();return;}
    if(t.dataset.tab){tab=t.dataset.tab;window.scrollTo(0,0);render();return;}
    if(t.hasAttribute("data-logout")){setToken("");authed=false;render();return;}
    if(t.id==="save-btn"){save(t);return;}
    if(!t.hasAttribute("data-del")&&!t.hasAttribute("data-no")&&!t.hasAttribute("data-drop"))dirty=true;
    if(t.dataset.opt){D[t.dataset.opt]=t.dataset.val;applyLook(D);updateMeter();root.querySelectorAll('[data-opt="'+t.dataset.opt+'"]').forEach(function(b){b.setAttribute("aria-pressed",String(b===t));});return;}
    if(t.dataset.greet){var g=GREETS[+t.dataset.greet];D.greetTitle=g[1];D.greeting=g[2];render();toast("'"+g[0]+"' 인사말을 넣었어요");return;}
    if(t.dataset.clear){D[t.dataset.clear]="";if(t.dataset.clear==="bgm")D.bgmName="";render();return;}
    if(t.dataset.listAdd){get(D,t.dataset.listAdd).push(JSON.parse(t.dataset.blank));render();return;}
    if(t.dataset.listRm){get(D,t.dataset.listRm).splice(+t.dataset.i,1);render();return;}
    if(t.dataset.ord){var i=+t.dataset.ord,j=i+(+t.dataset.dir);if(j<0||j>=D.order.length)return;var x=D.order[i];D.order[i]=D.order[j];D.order[j]=x;render();return;}
    if(t.hasAttribute("data-restore")){var st=readStash();if(st)D=migrate(st);dropStash();applyLook(D);render();return;}
    if(t.hasAttribute("data-drop")){dropStash();render();return;}
    var pic=t.closest(".pic");
    if(pic){
      var k=+pic.dataset.i;
      if(t.dataset.mv){var m=k+(+t.dataset.mv);if(m<0||m>=D.photos.length)return;var tmp=D.photos[k];D.photos[k]=D.photos[m];D.photos[m]=tmp;render();return;}
      if(t.hasAttribute("data-del")){var a=document.createElement("div");a.className="ask";a.innerHTML='<span>이 사진을 뺄까요?</span><div><button class="yes" data-yes>빼기</button><button data-no>취소</button></div>';pic.appendChild(a);return;}
      if(t.hasAttribute("data-yes")){D.photos.splice(k,1);render();return;}
      if(t.hasAttribute("data-no")){t.closest(".ask").remove();return;}
    }
  });
  if(mode==="preview")wireInvitation(document.getElementById("pv"),D);
}

/* ---------- static page shell (index.html / admin.html) ---------- */
var FONT_LINK='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;1,400;1,500&family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&family=Great+Vibes&family=Nanum+Myeongjo:wght@400;700&family=Noto+Sans+KR:wght@400;500&family=Playfair+Display:ital@0;1&display=swap">';
var SITE="https://"+CFG.repo+"/";
function descOf(st){var dd=parseDate(st);return (dd?dd.y+"년 "+dd.m+"월 "+dd.d+"일 · ":"")+[st.venue,st.hall].filter(Boolean).join(" ");}
function shellHTML(st,page){
  var t=esc(siteTitle(st)),ds=esc(descOf(st)),v=Date.now().toString(36);
  var meta=page==="admin"?'<meta name="robots" content="noindex,nofollow">':
    '<meta name="description" content="'+ds+'"><meta property="og:type" content="website"><meta property="og:title" content="'+t+'"><meta property="og:description" content="'+ds+'">'+
    '<meta property="og:image" content="'+SITE+'og.jpg?v='+v+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="'+SITE+'"><meta name="twitter:card" content="summary_large_image">';
  return '<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
    '<title>'+(page==="admin"?'청첩장 관리':t)+'</title>'+meta+FONT_LINK+'<link rel="stylesheet" href="app.css?v='+APP_VER+'"></head>'+
    '<body data-page="'+page+'"><main id="app"><p class="boot">불러오는 중…</p></main><script src="app.js?v='+APP_VER+'"></script></body></html>\n';
}
var APP_VER="2";

/* ---------- GitHub ---------- */
function gh(method,path,body){
  var h={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},tk=getToken();
  if(tk)h.Authorization="Bearer "+tk;
  if(body)h["Content-Type"]="application/json";
  return fetch(API+path,{method:method,headers:h,body:body?JSON.stringify(body):undefined,cache:"no-store"}).then(function(r){
    return r.text().then(function(txt){var j=null;try{j=txt?JSON.parse(txt):null;}catch(e){}
      if(!r.ok){var err=new Error((j&&j.message)||("HTTP "+r.status));err.status=r.status;throw err;}return j;});
  });
}
function loadData(){
  if(PAGE==="admin"){
    var h={"Accept":"application/vnd.github.raw+json"},tk=getToken();if(tk)h.Authorization="Bearer "+tk;
    return fetch(API+"/contents/data.json?ref="+CFG.branch+"&t="+Date.now(),{headers:h,cache:"no-store"})
      .then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
      .catch(function(){return fetch("data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();});});
  }
  return fetch("data.json?v="+Date.now(),{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});
}
function dataUrlB64(u){return String(u).split(",")[1]||"";}
function extOf(u){var m=/^data:([^;,]+)/.exec(u)||[];var t=m[1]||"";return t.indexOf("jpeg")>=0?"jpg":t.indexOf("png")>=0?"png":t.indexOf("mpeg")>=0||t.indexOf("mp3")>=0?"mp3":(t.split("/")[1]||"bin").replace(/[^a-z0-9]/g,"");}
function makeOg(src){
  return new Promise(function(res){
    var img=new Image();img.crossOrigin="anonymous";
    img.onload=function(){try{
      var W=1200,H=630,c=document.createElement("canvas");c.width=W;c.height=H;
      var k=Math.max(W/img.width,H/img.height),w=img.width*k,h=img.height*k,y=Math.min(0,Math.max(H-h,-(h-H)*0.25));
      c.getContext("2d").drawImage(img,(W-w)/2,y,w,h);res(c.toDataURL("image/jpeg",0.85));}catch(e){res(null);}};
    img.onerror=function(){res(null);};img.src=src;
  });
}
function refsOf(st){var a=[st.cover,st.mid,st.bgm].concat(st.photos||[]);return a.filter(function(p){return p&&!/^(data:|https?:)/.test(p);});}

function save(btn){
  if(!authed){toast("먼저 GitHub 키를 연결해 주세요");return;}
  btn.disabled=true;btn.textContent="저장 중…";
  var next=JSON.parse(JSON.stringify(D));next.isSample=false;writeStash(next);
  var stamp=Date.now().toString(36),n=0,uploads=[];
  function conv(v,folder){if(!v||String(v).indexOf("data:")!==0)return v;var p=folder+"/"+stamp+"-"+(n++)+"."+extOf(v);uploads.push({path:p,b64:dataUrlB64(v)});return p;}
  var coverChanged=String(next.cover||"").indexOf("data:")===0||next.cover!==S.cover;
  var coverSrc=next.cover?U(next.cover):"";
  next.cover=conv(next.cover,"images");next.mid=conv(next.mid,"images");next.bgm=conv(next.bgm,"media");
  next.photos=(next.photos||[]).map(function(p){return conv(p,"images");});
  var keep={};refsOf(next).forEach(function(p){keep[p]=1;});
  var removed=refsOf(S).filter(function(p){return !keep[p]&&/^(images|media)\//.test(p)&&!/^images\/(cover|mid|g\d+)\.jpg$/.test(p);});
  var baseSha,treeSha,steps=0;
  function step(t){btn.textContent=t;}
  (coverChanged&&coverSrc?makeOg(coverSrc):Promise.resolve(null)).then(function(og){
    if(og)uploads.push({path:"og.jpg",b64:dataUrlB64(og)});
    step("저장 준비 중…");
    return gh("GET","/git/ref/heads/"+CFG.branch);
  }).then(function(ref){baseSha=ref.object.sha;return gh("GET","/git/commits/"+baseSha);
  }).then(function(c){treeSha=c.tree.sha;
    var tree=[],chain=Promise.resolve();
    uploads.forEach(function(u,i){chain=chain.then(function(){step("사진 올리는 중 "+(i+1)+"/"+uploads.length);
      return gh("POST","/git/blobs",{content:u.b64,encoding:"base64"}).then(function(b){tree.push({path:u.path,mode:"100644",type:"blob",sha:b.sha});});});});
    return chain.then(function(){
      tree.push({path:"data.json",mode:"100644",type:"blob",content:JSON.stringify(next,null,1)});
      tree.push({path:"index.html",mode:"100644",type:"blob",content:shellHTML(next,"guest")});
      removed.forEach(function(p){tree.push({path:p,mode:"100644",type:"blob",sha:null});});
      step("저장 중…");
      return gh("POST","/git/trees",{base_tree:treeSha,tree:tree});
    });
  }).then(function(t){return gh("POST","/git/commits",{message:"청첩장 수정 ("+new Date().toLocaleString("ko-KR")+")",tree:t.sha,parents:[baseSha]});
  }).then(function(c){return gh("PATCH","/git/refs/heads/"+CFG.branch,{sha:c.sha});
  }).then(function(){
    S=JSON.parse(JSON.stringify(next));D=JSON.parse(JSON.stringify(next));dirty=false;dropStash();
    render();toast("저장했어요. 1~2분 뒤 하객 화면에 반영돼요");
  }).catch(function(e){
    btn.disabled=false;btn.textContent="저장하고 반영";
    var st=e&&e.status;
    if(st===401){setToken("");authed=false;render();toast("GitHub 키가 만료됐거나 틀렸어요. 다시 연결해 주세요");}
    else if(st===403||st===404)toast("이 키로는 저장할 권한이 없어요. 키의 저장소와 Contents 권한을 확인해 주세요");
    else if(st===409||st===422)toast("저장이 겹쳤어요. 잠시 후 다시 눌러 주세요");
    else toast("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
  });
}

/* ---------- admin login ---------- */
function loginHTML(msg){
  return '<div class="adm"><div class="adm-top"><div class="adm-top-in"><h1>청첩장 관리</h1><a class="adm-x" href="./" target="_blank" rel="noopener">하객 화면</a></div></div>'+
  '<div class="adm-body">'+
  '<section class="panel"><h2>GitHub 키 연결<small>처음 한 번만 하면 돼요</small></h2>'+
  '<p class="small" style="margin:0 0 12px;color:var(--mute)">저장하려면 이 청첩장 저장소에만 쓸 수 있는 GitHub 키(토큰)가 필요해요. 키는 이 기기의 브라우저에만 보관되고, 다른 곳으로 보내지지 않아요.</p>'+
  '<div class="fields"><div class="fld wide"><label for="tk-in">GitHub 키 (github_pat_로 시작)</label><input id="tk-in" type="password" autocomplete="off" placeholder="github_pat_..."></div></div>'+
  (msg?'<p class="small" style="color:var(--bad);margin:10px 0 0">'+esc(msg)+'</p>':'')+
  '<p style="margin:14px 0 0"><button class="save" id="tk-go">연결하기</button></p></section>'+
  '<section class="panel"><h2>키 만드는 방법</h2><ol class="small" style="margin:0;padding-left:18px;line-height:1.9">'+
  '<li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub 키 만들기 페이지</a>를 여세요.</li>'+
  '<li><b>Token name</b>: 청첩장 관리</li>'+
  '<li><b>Expiration</b>: Custom → 예식 이후 날짜 (예: 2027-03-31)</li>'+
  '<li><b>Resource owner</b>: <b>'+CFG.owner+'</b></li>'+
  '<li><b>Repository access</b>: Only select repositories → <b>'+CFG.repo+'</b></li>'+
  '<li><b>Permissions</b> → Repository permissions → <b>Contents</b>: Read and write</li>'+
  '<li><b>Generate token</b>을 누르고, 나온 키를 복사해서 위 칸에 붙여넣으세요.</li></ol>'+
  '<p class="small" style="margin:12px 0 0;color:var(--mute)">키는 비밀번호와 같아요. 다른 사람이나 채팅에 보내지 마세요.</p></section></div></div>';
}
function wireLogin(){
  var b=document.getElementById("tk-go"),inp=document.getElementById("tk-in");
  var go=function(){
    var tk=String(inp.value||"").trim();if(!tk){inp.focus();return;}
    b.disabled=true;b.textContent="확인 중…";setToken(tk);
    gh("GET","").then(function(r){
      if(!r||!r.permissions||!r.permissions.push)throw {status:403};
      authed=true;return boot();
    }).catch(function(e){setToken("");app.innerHTML=loginHTML(e&&e.status===401?"키가 올바르지 않아요. 다시 복사해서 붙여넣어 주세요.":e&&(e.status===403||e.status===404)?"이 키에는 저장 권한이 없어요. 저장소 선택과 Contents 권한을 확인해 주세요.":"확인하지 못했어요. 인터넷 연결을 확인해 주세요.");wireLogin();});
  };
  b.addEventListener("click",go);inp.addEventListener("keydown",function(e){if(e.key==="Enter")go();});
}

/* ---------- render ---------- */
function render(){
  var y=window.scrollY;stopFx();
  if(PAGE==="guest"){
    applyLook(S);
    app.innerHTML='<div class="progress" aria-hidden="true"><i id="prog"></i></div>'+invitation(S);
    wireInvitation(app,S);startFx(S);return;
  }
  if(!authed){app.innerHTML=loginHTML();wireLogin();return;}
  applyLook(D);app.innerHTML=adminHTML();wireAdmin();if(mode==="preview")startFx(D);
  window.scrollTo(0,y);
}
window.addEventListener("beforeunload",function(e){if(PAGE==="admin"&&dirty){e.preventDefault();e.returnValue="";}});
function boot(){
  return loadData().then(function(d){
    SRC=d;S=migrate(d);D=migrate(d);dirty=false;render();
  }).catch(function(){app.innerHTML='<p class="boot">청첩장을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>';});
}
if(PAGE==="admin"&&getToken()){
  gh("GET","").then(function(r){authed=!!(r&&r.permissions&&r.permissions.push);if(!authed)setToken("");}).catch(function(e){if(e&&e.status===401)setToken("");}).then(boot);
}else boot();
})();
