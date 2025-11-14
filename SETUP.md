# Co-Study Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Firebase project created (for production)

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Firebase Configuration**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - ⚠️ **Storage is optional** - Skip for now (file uploads disabled)
   - Copy your Firebase config values
   - Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
   
   **Note:** `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` can be left empty or set to your project's default value. File uploads are currently disabled.

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to http://localhost:3000

## Project Structure

```
Co-study/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat feature (priority)
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions
│   ├── firebase/         # Firebase configuration
│   └── utils.ts          # Helper functions
├── store/                # Zustand state management
└── public/               # Static assets
```

## Current Features

✅ Authentication (Email/Password, Google OAuth)
✅ Real-time Chat System
✅ Dashboard
✅ Firebase Integration
✅ Responsive UI with Tailwind CSS

## Next Steps

- Set up Firestore security rules
- Implement group management
- Add notes sharing feature
- Implement homework tracker
- Add exam management system

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Docker
```bash
docker build -t co-study .
docker run -p 3000:3000 co-study
```

