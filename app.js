import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig, ADMIN_UID } from './firebase-config.js';
const $ = id => document.getElementById(id);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app), db = getFirestore(app);
let admin = false, media = [], boothUrl = '', wishes = [];
const pages = ['home','photos','videos','booth','wishes','gifts'];
window.showPage = page => {if (!pages.includes(page)) return;document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('active',el.id===page));document.querySelectorAll('nav button').forEach(el=>el.classList.toggle('active',el.dataset.page===page));document.querySelector('main')?.scrollIntoView({behavior:'smooth'});location.hash=page;};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>window.showPage(b.dataset.page));
if(pages.includes(location.hash.slice(1)))window.showPage(location.hash.slice(1));
function renderMedia(){
  for(const type of ['photos','videos','gifts']){
    const grid=$(type+'Grid');if(!grid)continue;
    const list=media.filter(m=>m.type===type);grid.replaceChildren();
    if($(type+'Count'))$(type+'Count').textContent=type==='photos'?`${list.length} / 31 photos`:type==='videos'?`${list.length} videos`:`${list.length} gifts`;
    if(!list.length){grid.innerHTML='<div class="empty">✨ Magical memories coming soon ✨</div>';continue;}
    for(const item of list){
      const card=document.createElement('div');card.className='media';
      let visual;
      if(item.provider==='youtube' && item.youtubeId){
        visual=document.createElement('iframe');visual.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.youtubeId)}`;
        visual.title=item.name||'Birthday video';visual.loading='lazy';visual.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';visual.allowFullscreen=true;
        visual.referrerPolicy='strict-origin-when-cross-origin';
      }else if(item.url){
        const video=String(item.contentType||'').startsWith('video/');visual=document.createElement(video?'video':'img');visual.src=item.url;
        if(video){visual.controls=true;visual.preload='metadata';}else visual.alt=item.name||'Birthday memory';
      }else continue;
      const foot=document.createElement('footer'),label=document.createElement('span');label.textContent=item.name||'Birthday memory';foot.append(label);
      if(admin){const del=document.createElement('button');del.className='remove';del.textContent='Delete';del.onclick=async()=>{if(!confirm('Remove this gallery entry?'))return;try{await deleteDoc(doc(db,'media',item.id));}catch(e){alert(e.message);}};foot.append(del);}
      if(type==='videos'||type==='gifts'){
        const expand=document.createElement('button');expand.type='button';expand.className='video-expand';expand.textContent=visual.tagName==='IMG'?'⛶ Expand photo':'⛶ Expand video';
        expand.setAttribute('aria-label',visual.tagName==='IMG'?'Expand photo to fullscreen':'Expand video to fullscreen');
        expand.onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();return;}if(card.requestFullscreen){await card.requestFullscreen();return;}if(visual.requestFullscreen){await visual.requestFullscreen();return;}alert('Fullscreen is not supported in this browser. Try the fullscreen icon inside the video player.');}catch(e){try{if(visual.requestFullscreen)await visual.requestFullscreen();else alert('Use the fullscreen icon inside the video player.');}catch(_){alert('Use the fullscreen icon inside the video player.');}}};
        foot.append(expand);
      }
      card.append(visual,foot);grid.append(card);
    }
  }
}
function renderWishes(){const box=$('wishesList');if(!box)return;box.replaceChildren();if(!wishes.length){box.textContent='Be the first to leave a magical wish! ✨';return;}for(const w of wishes){const el=document.createElement('div');el.className='wish';const title=document.createElement('strong'),msg=document.createElement('p'),date=document.createElement('small');title.textContent='💌 '+(w.name||'Guest');msg.textContent=w.message||'';date.textContent=w.createdAt?.toDate?.().toLocaleDateString()||'Just now';el.append(title,msg,date);if(admin){const del=document.createElement('button');del.className='remove';del.textContent='Delete';del.onclick=async()=>{if(confirm('Delete greeting?'))try{await deleteDoc(doc(db,'wishes',w.id));}catch(e){alert(e.message);}};el.append(del);}box.append(el);}}
onAuthStateChanged(auth,user=>{admin=!!user&&user.uid===ADMIN_UID;document.querySelectorAll('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));renderMedia();renderWishes();});
onSnapshot(collection(db,'media'),s=>{media=s.docs.map(d=>({id:d.id,...d.data()}));renderMedia();},e=>console.error('Media listener:',e));
onSnapshot(query(collection(db,'wishes'),orderBy('createdAt','desc')),s=>{wishes=s.docs.map(d=>({id:d.id,...d.data()}));renderWishes();},e=>{console.error('Greetings listener:',e);if($('wishesList'))$('wishesList').textContent='Unable to load greetings: '+e.message;});
onSnapshot(doc(db,'settings','photobooth'),s=>{boothUrl=s.data()?.url||'';if($('boothUrl'))$('boothUrl').value=boothUrl;if($('boothStatus'))$('boothStatus').textContent=boothUrl?'Photobooth link is ready! ✨':'Photobooth link coming soon.';},e=>console.error('Photobooth:',e));
if($('wishForm'))$('wishForm').onsubmit=async e=>{e.preventDefault();const name=$('wishName').value.trim(),message=$('wishText').value.trim(),btn=e.target.querySelector('button');if(!name||!message)return;btn.disabled=true;try{await addDoc(collection(db,'wishes'),{name,message,createdAt:serverTimestamp()});e.target.reset();alert('Your birthday wish is posted! 💖');}catch(err){alert('Could not save greeting: '+err.message);}finally{btn.disabled=false;}};
if($('saveBooth'))$('saveBooth').onclick=async()=>{if(!admin)return alert('Admin only');try{const u=new URL($('boothUrl').value);if(u.protocol!=='https:')throw Error('Use an HTTPS link');await setDoc(doc(db,'settings','photobooth'),{url:u.href});}catch(e){alert(e.message);}};
if($('openBooth'))$('openBooth').onclick=()=>boothUrl?window.open(boothUrl,'_blank','noopener,noreferrer'):alert('Photobooth link coming soon!');
if($('shareBooth'))$('shareBooth').onclick=async()=>{if(!boothUrl)return alert('Photobooth link coming soon!');try{if(navigator.share)await navigator.share({title:'Birthday Photobooth',url:boothUrl});else{await navigator.clipboard.writeText(boothUrl);alert('Link copied!');}}catch(e){if(e.name!=='AbortError')alert(e.message);}};
// Firebase Storage is not enabled in this project. Upload controls are disabled, not silently broken.
for(const type of ['videos','gifts']){const input=$(type+'Upload');if(input){input.disabled=true;input.title='Direct uploads require Firebase Storage. Use the private Admin page to add YouTube videos.';}}
