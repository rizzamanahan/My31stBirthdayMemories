import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig, ADMIN_UID } from './firebase-config.js';
const $=id=>document.getElementById(id),app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
let isAdmin=false;
function youtubeId(raw){try{const u=new URL(raw.trim());const host=u.hostname.toLowerCase();let id='';if(host==='youtu.be'||host==='www.youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(host)){if(u.pathname==='/watch')id=u.searchParams.get('v');else if(/^\/(shorts|embed|live)\//.test(u.pathname))id=u.pathname.split('/')[2];}return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;}catch{return null;}}
const status=message=>{$('status').textContent=message;};
onAuthStateChanged(auth,user=>{isAdmin=!!user&&user.uid===ADMIN_UID;$('loginForm').hidden=isAdmin;$('signedIn').hidden=!isAdmin;$('videoManager').hidden=!isAdmin;$('photoManager').hidden=!isAdmin;$('giftManager').hidden=!isAdmin;if(user&&!isAdmin)status('This account is not the authorized Admin.');else status(isAdmin?'Signed in as owner. You can add YouTube videos below.':'');});
$('loginForm').onsubmit=async e=>{e.preventDefault();try{const result=await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);if(result.user.uid!==ADMIN_UID){await signOut(auth);status('This account is not the authorized Admin.');}}catch(err){status('Sign-in failed: '+err.message);}};
$('logout').onclick=()=>signOut(auth);
$('videoForm').onsubmit=async e=>{e.preventDefault();if(!isAdmin)return status('Please sign in as Admin.');const id=youtubeId($('youtubeUrl').value),name=$('videoTitle').value.trim();if(!id)return status('Please enter a valid YouTube watch, youtu.be, Shorts, or embed URL.');if(!name)return status('Please enter a title.');const btn=$('addVideo');btn.disabled=true;status('Saving video link...');try{await addDoc(collection(db,'media'),{type:'videos',provider:'youtube',youtubeId:id,name,url:`https://www.youtube.com/watch?v=${id}`,createdAt:serverTimestamp()});$('videoForm').reset();status('Video added! Open the Videos gallery to see it. 💗');}catch(err){status('Could not save video: '+err.message);}finally{btn.disabled=false;}};
onSnapshot(collection(db,'media'),snapshot=>{const list=$('managedVideos');list.replaceChildren();const videos=snapshot.docs.filter(d=>d.data().type==='videos');if(!videos.length){list.textContent='No videos added yet.';return;}for(const d of videos){const row=document.createElement('div');row.className='managed';const label=document.createElement('span');label.textContent=d.data().name||'Birthday video';const button=document.createElement('button');button.textContent='Remove';button.disabled=!isAdmin;button.onclick=async()=>{if(!isAdmin||!confirm('Remove this video from the gallery?'))return;try{await deleteDoc(doc(db,'media',d.id));status('Video removed from gallery.');}catch(e){status('Could not remove video: '+e.message);}};row.append(label,button);list.append(row);}},err=>status('Cannot load video list: '+err.message));

// GitHub Pages photo URLs are stored in Firestore; the image bytes remain on GitHub.
function validPhotoUrl(raw){
 try{
  const u=new URL(raw.trim());
  if(u.protocol!=='https:'||u.username||u.password)return null;
  const path=decodeURIComponent(u.pathname);
  const githubPages=u.hostname.toLowerCase()==='rizzamanahan.github.io'&&path.startsWith('/My31stBirthdayMemories/photos/');
  const githubRaw=u.hostname.toLowerCase()==='raw.githubusercontent.com'&&/^\/rizzamanahan\/My31stBirthdayMemories\/(main|master)\/photos\//i.test(path);
  if(!(githubPages||githubRaw)||!/\.(png|jpe?g|webp|gif|avif)$/i.test(path))return null;
  return u.href;
 }catch{return null;}
}
$('photoForm').onsubmit=async e=>{
 e.preventDefault();if(!isAdmin)return status('Please sign in as Admin.');
 const url=validPhotoUrl($('photoUrl').value),name=$('photoTitle').value.trim();
 if(!url)return status('Use a direct HTTPS image link from this repository’s photos folder (.jpg, .png, .webp, .gif, or .avif).');
 if(!name)return status('Please enter a photo caption.');
 const button=$('addPhoto');button.disabled=true;status('Saving photo link...');
 try{
  const existing=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js').then(m=>m.getDocs(collection(db,'media')));
  if(existing.docs.filter(d=>d.data().type==='photos').length>=31){status('Your photo gallery already has 31 entries. Remove one before adding another.');return;}
  await addDoc(collection(db,'media'),{type:'photos',provider:'github',name,url,contentType:'image/jpeg',createdAt:serverTimestamp()});
  $('photoForm').reset();status('Photo added! View the Photos gallery. 💗');
 }catch(err){status('Could not save photo: '+err.message);}finally{button.disabled=false;}
};
onSnapshot(collection(db,'media'),snapshot=>{
 const list=$('managedPhotos');list.replaceChildren();const photos=snapshot.docs.filter(d=>d.data().type==='photos');
 if(!photos.length){list.textContent='No photos added yet.';return;}
 for(const d of photos){const row=document.createElement('div');row.className='managed';
 const label=document.createElement('span');label.textContent=d.data().name||'Birthday photo';
 const button=document.createElement('button');button.textContent='Remove';button.disabled=!isAdmin;
 button.onclick=async()=>{if(!isAdmin||!confirm('Remove this photo from the gallery? (The GitHub file will remain.)'))return;
 try{await deleteDoc(doc(db,'media',d.id));status('Photo removed from gallery.');}catch(e){status('Could not remove photo: '+e.message);}};
 row.append(label,button);list.append(row);
 }
},err=>status('Cannot load photo list: '+err.message));

// Unboxing gifts: YouTube unlisted videos or GitHub-hosted images.
$('giftKind').onchange=()=>{$('giftUrl').placeholder=$('giftKind').value==='youtube'?'https://youtu.be/...':'https://rizzamanahan.github.io/My31stBirthdayMemories/photos/gift.jpg';};
$('giftForm').onsubmit=async e=>{
 e.preventDefault();if(!isAdmin)return status('Please sign in as Admin.');
 const kind=$('giftKind').value,name=$('giftTitle').value.trim(),raw=$('giftUrl').value.trim();
 if(!name)return status('Please enter a gift caption.');
 let record;
 if(kind==='youtube'){
  const id=youtubeId(raw);if(!id)return status('Enter a valid YouTube video link.');
  record={type:'gifts',provider:'youtube',youtubeId:id,name,url:`https://www.youtube.com/watch?v=${id}`,contentType:'video/youtube'};
 }else{
  const url=validPhotoUrl(raw);if(!url)return status('Enter a direct GitHub image URL from your photos folder.');
  record={type:'gifts',provider:'github',name,url,contentType:'image/jpeg'};
 }
 const btn=$('addGift');btn.disabled=true;status('Saving unboxing gift...');
 try{await addDoc(collection(db,'media'),{...record,createdAt:serverTimestamp()});$('giftForm').reset();status('Unboxing gift added! 🎁');}
 catch(err){status('Could not save gift: '+err.message);}finally{btn.disabled=false;}
};
onSnapshot(collection(db,'media'),snapshot=>{
 const list=$('managedGifts');list.replaceChildren();const gifts=snapshot.docs.filter(d=>d.data().type==='gifts');
 if(!gifts.length){list.textContent='No unboxing gifts added yet.';return;}
 for(const d of gifts){const row=document.createElement('div');row.className='managed';const label=document.createElement('span');label.textContent=(d.data().provider==='youtube'?'🎬 ':'📸 ')+(d.data().name||'Gift');const btn=document.createElement('button');btn.textContent='Remove';btn.disabled=!isAdmin;btn.onclick=async()=>{if(!isAdmin||!confirm('Remove this gift from the gallery?'))return;try{await deleteDoc(doc(db,'media',d.id));status('Gift removed from gallery.');}catch(e){status('Could not remove gift: '+e.message);}};row.append(label,btn);list.append(row);}
},err=>status('Cannot load gifts: '+err.message));
