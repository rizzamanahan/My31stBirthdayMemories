# Pink Fairyland 31 — setup

This website uses Firebase for real-time shared greetings and admin-only media uploads. Until configured, live submission and uploads are disabled.

1. Create a project at https://console.firebase.google.com/ and register a **Web app**. Copy the web app's `firebaseConfig` fields into `firebase-config.js`.
2. Under **Authentication → Sign-in method**, enable **Email/Password**. Under **Users**, create your own account with a strong password. Copy its **User UID** (not the email) into `ADMIN_UID` in `firebase-config.js`.
3. Create a **Cloud Firestore** database. Open **Firestore Database → Rules** and paste `firestore.rules`, replacing `REPLACE_WITH_ADMIN_UID` with the exact UID from step 2. Publish the rules.
4. Enable **Firebase Storage** (Firebase may require a billing plan). Open **Storage → Rules** and paste `storage.rules`, replacing `REPLACE_WITH_ADMIN_UID` with the same UID. Publish.
5. In **Authentication → Settings → Authorized domains**, add your GitHub Pages domain (`yourusername.github.io`) if it isn't already there.
6. Upload **index.html**, **app.js**, and **firebase-config.js** to the root of your GitHub repository. Enable GitHub Pages under **Settings → Pages → Deploy from a branch → main / (root)**.
7. Visit the live site. Use **🔐 Admin** to sign in. Upload photos/videos/unboxing gifts, save photobooth link. Guests can view them and post wishes; wishes update live for everyone.

## Security and spam
Only the owner UID can write media/settings and delete greetings. Visitors can post greetings without logging in. Public anonymous guestbooks can receive spam; the included rules validate fields and lengths but **do not provide rate limiting or CAPTCHA**. For stronger spam prevention, use Firebase App Check plus a rate-limited Cloud Function with CAPTCHA verification; keep the public-create Firestore rule disabled if you switch to the function. Do not put a password or service account secret in website files. Firebase web app config is public by design.

Note: Storage can incur charges. Video files must be under 250 MB each under these rules. For larger files, adjust storage limits carefully. Public files are viewable by anyone with the link.
