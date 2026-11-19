PRIVATE ADMIN UPDATE — Fairyland 31

Upload index.html, app.js, admin.html, admin.js, and the assets/ folder to the ROOT of your existing My31stBirthdayMemories GitHub repository.

IMPORTANT: KEEP your existing firebase-config.js unchanged. It already has your actual Firebase project settings and ADMIN_UID. Do not delete it.

Public website: https://rizzamanahan.github.io/My31stBirthdayMemories/
Owner login: https://rizzamanahan.github.io/My31stBirthdayMemories/admin.html

After signing in on admin.html, use the management links to return to the public album. The same Firebase Auth session persists for that origin, so only you see upload/delete controls. Visitors never see an Admin button or login form.

The admin URL is not secret: security depends on Firebase Authentication and properly deployed Firestore and Storage rules that check request.auth.uid against your admin UID. Never set public write access to media or Storage.

Public greetings are still submitted to Firestore /wishes, displayed in real time, and deletable by the owner. Unlimited video count in the UI, but Storage billing, upload-size limits and quotas still apply.

Note: A signed-in admin will see upload/delete controls on the public album. Sign out through admin.html before showing the site to visitors on your own device.
