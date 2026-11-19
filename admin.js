import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";
const $=id=>document.getElementById(id);
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PASTE_') || !ADMIN_UID || ADMIN_UID.startsWith('PASTE_')) {
  $('status').textContent='Complete firebase-config.js before signing in.';
  $('loginForm').hidden=true;
} else {
  const auth=getAuth(initializeApp(firebaseConfig));
  onAuthStateChanged(auth,user=>{
    const owner=Boolean(user && user.uid===ADMIN_UID);
    $('signedIn').hidden=!owner;
    $('loginForm').hidden=owner;
    $('status').textContent=user&&!owner?'This account is not authorized to manage the birthday album.':'';
  });
  $('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();const btn=e.currentTarget.querySelector('button');btn.disabled=true;$('status').textContent='Signing in…';
    try{const cred=await signInWithEmailAndPassword(auth,$('email').value,$('password').value);$('password').value='';if(cred.user.uid!==ADMIN_UID){await signOut(auth);throw Error('This account is not the authorized owner.')} $('status').textContent='Welcome back! Choose a section to manage.';}
    catch(error){$('status').textContent=error.message}finally{btn.disabled=false}
  });
  $('logout').addEventListener('click',async()=>{await signOut(auth);$('status').textContent='Signed out.'});
}
