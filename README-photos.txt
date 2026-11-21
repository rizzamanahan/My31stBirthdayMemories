# Birthday Fairyland — GitHub Photos Update

Replace index.html, app.js, admin.html, admin.js in your existing GitHub Pages repository. Keep firebase-config.js, photos, portraits, and other assets unchanged.

## Upload a photo (free)
1. In GitHub repository rizzamanahan/My31stBirthdayMemories, open/create folder `photos`. To create it if missing, choose Add file > Create new file and name it `photos/.gitkeep`, then commit.
2. Open photos folder > Add file > Upload files > choose a JPG/PNG/WebP image (GitHub browser upload typically limits files to 25 MiB) > Commit changes.
3. Wait for GitHub Pages deployment. Copy the URL in this form: https://rizzamanahan.github.io/My31stBirthdayMemories/photos/YOUR-EXACT-FILENAME.jpg (URL-encode spaces or use simple filenames). Open the URL to verify it displays only the image.
4. Open admin.html, log in, paste title and URL in Add GitHub Photo, and click Add to Birthday Photos. It will appear in the public photo gallery through Firestore.
5. Remove in Admin removes only the Firestore entry, not the GitHub image file.

## Firestore permissions
Existing Firestore `media` rules must allow public reads and writes only to the authorized Firebase Auth UID (ADMIN_UID in firebase-config.js). Do not replace existing `wishes` and `settings` rules. Example inside match /databases/{database}/documents:
match /media/{mediaId} {
  allow read: if true;
  allow create, update, delete: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
}

No Firebase Storage required for GitHub image links or YouTube links. Photo gallery remains limited to 31 entries. Existing videos, greetings and design are preserved.
