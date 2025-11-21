# OpenU Manager

A React application for managing Open University courses, tasks, and notes with Firebase integration.

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google Sign-in)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database
   - Enable Authentication (Google Sign-in)
   - Configure Firestore Security Rules (see below)

3. **Create `.env` file:**
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## Firestore Security Rules

Configure these rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user owns the data
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Allow users to access their courses collection
    match /artifacts/{appId}/users/{userId}/courses/{courseId} {
      allow read, write: if isOwner(userId);
    }

    // Allow users to access their tasks collection
    match /artifacts/{appId}/users/{userId}/tasks/{taskId} {
      allow read, write: if isOwner(userId);
    }

    // Allow users to access their notes document (nested under data/)
    match /artifacts/{appId}/users/{userId}/data/notes {
      allow read, write: if isOwner(userId);
    }

    // Fallback: Allow access to any other documents under the user's path
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

## Deployment to Vercel

### Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Firebase project configured

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Environment Variables:**
   - In Vercel project settings, go to **Environment Variables**
   - Add all 6 Firebase environment variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
   - Set them for **Production**, **Preview**, and **Development** environments
   - Redeploy after adding environment variables

4. **Configure Firebase Authorized Domains:**
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

### Continuous Deployment

After initial setup, every push to the main branch will automatically trigger a new deployment on Vercel.

## Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

## Project Structure

```
openu-manager/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── vercel.json         # Vercel deployment configuration
└── .gitignore          # Git ignore rules
```

## Security Notes

- Never commit `.env` files to version control
- Firebase API keys are safe to expose in client-side code (they're public by design)
- All sensitive operations are protected by Firestore Security Rules
- User data is isolated per user ID in Firestore

## License

Private project

