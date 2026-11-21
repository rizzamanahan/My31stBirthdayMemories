import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";
const $=id=>document.getElementById(id);
const configured=Boolean(firebaseConfig.apiKey && firebaseConfig.projectId) && !firebaseConfig.apiKey.startsWith('PASTE_') && !firebaseConfig.projectId.startsWith('PASTE_');
let admin=false, auth, db, storage, media=[], boothUrl="";
const pages=['home','photos','videos','booth','wishes','gifts'];
window.showPage=page=>{if(!pages.includes(page))return;document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===page));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===page));document.querySelector('main')?.scrollIntoView({behavior:'smooth'});location.hash=page};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
if(pages.includes(location.hash.slice(1)))showPage(location.hash.slice(1));

function setAdmin(v){admin=v;document.querySelectorAll('.admin-only').forEach(x=>x.classList.toggle('hidden',!v));renderMedia();}
function renderMedia(){for(const type of ['photos','videos','gifts']){const list=media.filter(x=>x.type===type), grid=$(type+'Grid');if(!grid)continue;grid.replaceChildren();if($(type+'Count'))$(type+'Count').textContent=type==='gifts'?`${list.length} gift uploads`:type==='videos'?`${list.length} videos`:`${list.length} / 31 photos`;if(!list.length){grid.innerHTML='<div class="empty">✨ Magical memories coming soon ✨</div>';continue;}for(const item of list){const card=document.createElement('div');card.className='media';const el=document.createElement(item.contentType.startsWith('video/')?'video':'img');el.src=item.url;if(el.tagName==='VIDEO'){el.controls=true;el.preload='metadata'}else el.alt=item.name;const foot=document.createElement('footer'),name=document.createElement('span');name.textContent=item.name;foot.append(name);if(admin){const del=document.createElement('button');del.textContent='×';del.className='remove';del.onclick=async()=>{if(!confirm('Delete this memory?'))return;try{await deleteDoc(doc(db,'media',item.id));await deleteObject(ref(storage,item.path))}catch(e){alert(e.message)}};foot.append(del)}card.append(el,foot);grid.append(card)}}}
function renderWishes(wishes){const box=$('wishesList');if(!box)return;box.replaceChildren();if(!wishes.length){box.textContent='Be the first to leave a magical wish! ✨';return;}for(const w of wishes){const div=document.createElement('div');div.className='wish';const strong=document.createElement('strong'),p=document.createElement('p'),small=document.createElement('small');strong.textContent='💌 '+w.name;p.textContent=w.message;small.textContent=w.createdAt?.toDate?.().toLocaleDateString()||'Just now';div.append(strong,p,small);if(admin){const del=document.createElement('button');del.className='remove';del.textContent='Delete';del.onclick=async()=>{if(confirm('Delete this greeting?'))try{await deleteDoc(doc(db,'wishes',w.id))}catch(e){alert(e.message)}};div.append(del)}box.append(div)}}
if(!configured){if($('wishesList'))$('wishesList').textContent='Birthday greetings will appear here after Firebase setup.';document.querySelectorAll('input[type=file]').forEach(x=>x.disabled=true);if($('wishForm'))$('wishForm').onsubmit=e=>{e.preventDefault();alert('Connect Firebase first. See README.md')};}else{
const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);storage=getStorage(app);
onAuthStateChanged(auth,user=>setAdmin(!!user&&user.uid===ADMIN_UID));
onSnapshot(collection(db,'media'),snapshot=>{media=snapshot.docs.map(d=>({id:d.id,...d.data()}));renderMedia()},err=>console.error(err));
onSnapshot(query(collection(db,'wishes'),orderBy('createdAt','desc')),snapshot=>renderWishes(snapshot.docs.map(d=>({id:d.id,...d.data()}))),err=>{console.error('Greetings listener:',err);if($('wishesList'))$('wishesList').textContent='Unable to load greetings: '+err.message});
onSnapshot(doc(db,'settings','photobooth'),snap=>{boothUrl=snap.data()?.url||'';if($('boothUrl'))$('boothUrl').value=boothUrl;$('boothStatus').textContent=boothUrl?'Photobooth link is ready! ✨':'Photobooth link coming soon.'});
// Show upload progress without requiring changes to index.html.
function uploadStatus(type) {
  const input = $(type + 'Upload');
  if (!input) return null;
  let box = $(type + 'UploadStatus');
  if (box) return box;
  box = document.createElement('div');
  box.id = type + 'UploadStatus';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  box.style.cssText = 'width:100%;margin:12px 0;padding:12px;border-radius:12px;background:#fff2f8;color:#79365d;font:14px sans-serif;';
  const message = document.createElement('div');
  message.className = 'upload-message';
  const bar = document.createElement('progress');
  bar.max = 100;
  bar.value = 0;
  bar.style.cssText = 'display:block;width:100%;height:18px;margin-top:8px;accent-color:#e94991;';
  box.append(message, bar);
  input.closest('.toolbar')?.insertAdjacentElement('afterend', box);
  return box;
}
function showUpload(type, message, percent) {
  const box = uploadStatus(type);
  if (!box) return;
  box.querySelector('.upload-message').textContent = message;
  const bar = box.querySelector('progress');
  bar.value = Math.max(0, Math.min(100, percent));
}
for (const type of ['photos', 'videos', 'gifts']) {
  const input = $(type + 'Upload');
  if (!input) continue;
  input.addEventListener('change', async event => {
    const files = [...event.target.files];
    event.target.value = '';
    if (!files.length) return;
    if (!admin) {
      showUpload(type, 'Owner login required. Please sign in to your private Admin page first.', 0);
      return;
    }
    if (type === 'photos' && media.filter(item => item.type === 'photos').length + files.length > 31) {
      showUpload(type, 'Maximum 31 photos allowed.', 0);
      return;
    }
    input.disabled = true;
    let completed = 0;
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi)$/i.test(file.name);
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/i.test(file.name);
        if ((type === 'videos' && !isVideo) || (type === 'photos' && !isImage) || (type === 'gifts' && !isImage && !isVideo)) {
          throw new Error('Unsupported file: ' + file.name + '. Try an MP4 video or JPG/PNG image.');
        }
        const id = crypto.randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `birthday/${type}/${id}/${safeName}`;
        const storageRef = ref(storage, path);
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
        showUpload(type, `Uploading ${completed + 1}/${files.length}: ${file.name} (${fileSizeMB} MB) — 0%`, 0);
        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file, { contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg') });
          task.on('state_changed', snapshot => {
            const percent = snapshot.totalBytes ? Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100) : 0;
            showUpload(type, `Uploading ${completed + 1}/${files.length}: ${file.name} (${fileSizeMB} MB) — ${percent}%`, percent);
          }, reject, resolve);
        });
        showUpload(type, `Upload complete. Saving ${file.name} to gallery…`, 100);
        const url = await getDownloadURL(storageRef);
        await setDoc(doc(db, 'media', id), {
          type, name: file.name, url, path,
          contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          createdAt: serverTimestamp()
        });
        completed++;
        showUpload(type, `Saved ${completed}/${files.length} file(s) to the gallery. 💗`, 100);
      }
    } catch (error) {
      console.error('Birthday media upload failed:', error);
      const reason = error.code ? `${error.code}: ${error.message}` : error.message;
      showUpload(type, `Upload failed: ${reason}`, 0);
      alert(`Upload failed: ${reason}`);
    } finally {
      input.disabled = false;
    }
  });
}
if($('wishForm'))$('wishForm').onsubmit=async e=>{e.preventDefault();const name=$('wishName').value.trim(),message=$('wishText').value.trim(),btn=e.target.querySelector('button');if(!name||!message)return;if(name.length>60||message.length>1000)return alert('Message too long.');btn.disabled=true;try{await addDoc(collection(db,'wishes'),{name,message,createdAt:serverTimestamp()});e.target.reset();alert('Your birthday wish is posted! 💖')}catch(err){alert('Could not save greeting: '+err.message)}finally{btn.disabled=false}};
if($('saveBooth'))$('saveBooth').onclick=async()=>{if(!admin)return;try{const u=new URL($('boothUrl').value);if(u.protocol!=='https:')throw Error('Use an https:// link');await setDoc(doc(db,'settings','photobooth'),{url:u.href})}catch(e){alert(e.message)}};
}
if($('openBooth'))$('openBooth').onclick=()=>boothUrl?window.open(boothUrl,'_blank','noopener,noreferrer'):alert('Photobooth link coming soon!');
if($('shareBooth'))$('shareBooth').onclick=async()=>{if(!boothUrl)return alert('Photobooth link coming soon!');try{if(navigator.share)await navigator.share({title:'Birthday Photobooth',url:boothUrl});else{await navigator.clipboard.writeText(boothUrl);alert('Link copied!')}}catch(e){if(e.name!=='AbortError')alert(e.message)}};
