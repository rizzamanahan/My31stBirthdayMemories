Birthday Fairyland - Photos and Unboxing Gifts Update

Replace index.html, app.js, admin.html and admin.js in your GitHub repository. Keep firebase-config.js, portrait and existing assets.

Admin: https://rizzamanahan.github.io/My31stBirthdayMemories/admin.html

PHOTOS: Upload JPG/PNG/WebP files to the photos/ folder of the GitHub repository, then add the direct GitHub Pages URL under Add GitHub Photo.
GIFTS: Under Add Unboxing Gift, select either YouTube unboxing video (upload as Unlisted) or GitHub gift photo (upload to photos/ folder), enter caption and URL, then submit.

Both photos and gifts are stored as link records in Firestore media collection; files remain hosted by GitHub or YouTube. Deleting a gallery entry does not delete the hosted file.

Firestore rules must permit public reads of media and writes only by the authorized Firebase admin UID. No Firebase Storage billing needed.
