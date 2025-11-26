# Co-Study - Study Collaboration Platform

## 📚 Overview

**Co-Study** is a comprehensive study collaboration platform designed for CBSE students (Classes 9-10). The app addresses the critical problem of scattered study materials, missed homework updates, and ineffective exam preparation by providing an all-in-one solution for students to collaborate, share resources, and prepare for exams together in an organized, class-based environment.

### Problem Statement
Students struggle with:
- Disorganized study materials scattered across multiple platforms
- Missing homework and class updates
- Lack of structured exam preparation
- Difficulty coordinating with classmates
- No centralized access to quality notes and resources
- Poor tracking of study progress and exam schedules

### Solution
A cross-platform web application that centralizes study resources, enables real-time collaboration, provides intelligent study planning, and keeps students synchronized with their class activities and exam schedules.

---

## 🎯 Target Users

- **Primary**: CBSE students in Classes 9-12 (secondary and senior secondary)
- **Secondary**: Classes 6-8 students
- **Use Cases**: 
  - Daily homework tracking
  - Exam preparation and coordination
  - Notes sharing and collaboration
  - Study schedule management
  - Class communication

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API / Zustand
- **Math Rendering**: KaTeX or MathJax

### Backend
- **BaaS**: Firebase
  - **Authentication**: Firebase Auth (Email/Password, Google Sign-in)
  - **Database**: Cloud Firestore
  - **Storage**: Firebase Storage (for PDFs and images)
  - **Notifications**: Firebase Cloud Messaging (FCM)
  - **Hosting**: Firebase Hosting or Vercel

### Development Tools
- **AI Assistant**: Cursor AI
- **Version Control**: Git & GitHub
- **Package Manager**: npm/pnpm
- **Deployment**: Docker + Vercel/Firebase Hosting

---

## ✅ Completed Features

### 1. Authentication & User Management ✅
- ✅ Email/password registration and login
- ✅ Google OAuth integration
- ✅ User profiles with:
  - Name, class
  - Groups array (tracks user's joined groups)
- ✅ Auto-redirect to dashboard if already logged in
- ✅ Password reset functionality (Firebase Auth built-in)

### 2. Class-Based Groups System ✅
- ✅ **Group Creation**: Students can create groups by class and division (e.g., "9B", "10A")
- ✅ **Group Management**:
  - Create groups with class dropdown and division input
  - Join existing groups
  - View all available groups
  - See member count for each group
- ✅ **Group Information**:
  - Group name (format: {class}{division})
  - Class and division
  - Member count
  - Created by and creation date
- ✅ **User-Group Sync**: User's groups array automatically synced in Firestore

### 3. Real-Time Chat System ✅
- ✅ **Group Chat**:
  - Real-time messaging per class group
  - Text messages with timestamp
  - WhatsApp-like message bubbles
  - Sender name and time display
- ✅ **Chat UI Components**:
  - Message bubbles (own messages vs received)
  - Scroll to bottom on new message
  - Message input with send button
  - Group name displayed in chat header
- ✅ **Real-time Sync**:
  - Firebase Firestore onSnapshot listeners
  - Instant message updates across all devices
  - Message timestamps (relative: "2 mins ago")
- ✅ **Navigation**: 
  - Direct links to group chats from dashboard
  - Back button to return to dashboard

### 4. Dark Mode Support ✅
- ✅ Theme toggle component on all pages
- ✅ Consistent dark mode styling across:
  - Login/Register pages
  - Dashboard
  - Groups page
  - Chat page
- ✅ Proper contrast and readability in both themes

### 5. UI/UX Improvements ✅
- ✅ Consistent navigation bars across all pages
- ✅ Theme toggle in navigation
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and error handling

### 6. Today's Work & Daily Coordination ✅
- ✅ **Today's Work System**:
  - Subject-wise breakdown of what was taught in class
  - Multi-subject entry form with dropdown selector
  - Topics and homework details per subject
  - Posted by any group member
  - Timestamp and date tracking
  - Edit functionality for post author
  - View history of past "Today's Work" posts (scrollable by date)
  - Group-based filtering (view work for specific class/group)
- ✅ **Homework Tracker**:
  - Integrated within Today's Work entries
  - Subject-specific homework entries
  - Description/details for each assignment
  - View all homework entries in organized history
  - Group-based homework tracking
- ✅ **Tomorrow's Preparation**:
  - Pre-class preparation notes integrated in Today's Work
  - Topics to prepare for next class
  - Subject-wise organization
  - Helps students stay ahead
- ✅ **UI Components**:
  - Dedicated Today's Work page (`/todays-work`)
  - Separate Add page (`/todays-work/add`) for posting
  - History view with date grouping
  - Subject dropdown with all CBSE subjects
  - Real-time updates via Firestore listeners
  - Edit/update functionality for authors
- ✅ **Technical Implementation**:
  - Firestore subcollection: `groups/{groupId}/dailyWork/{workId}`
  - Real-time synchronization across all devices
  - Group-based access control
  - Date-based organization and filtering

### 7. Exam Management System ✅
- ✅ **Exam Scheduling**:
  - Group-based exam scheduling per class
  - Subject selection with CBSE subjects
  - Exam date selection with date picker
  - Topics/chapters tracking per exam
  - Created by any group member
- ✅ **Exam Countdown**:
  - Real-time countdown showing days remaining until exam
  - Dynamic reminder messages based on days left
  - "Happening today" indicator for same-day exams
  - Color-coded urgency indicators
- ✅ **Exam Display**:
  - List view of all upcoming exams per group
  - Group selector to filter exams by class
  - Exam details: subject, date, topics
  - Real-time updates via Firestore listeners
- ✅ **UI Components**:
  - Dedicated Exams page (`/exams`)
  - Form to add new exams
  - Upcoming exams list with countdown
  - Group-based filtering
- ✅ **Technical Implementation**:
  - Firestore subcollection: `groups/{groupId}/exams/{examId}`
  - Real-time synchronization across all devices
  - Group-based access control
  - Date-based filtering and sorting

### 8. Smart Notifications System ✅
- ✅ **Exam Reminders**:
  - Daily prep reminders for upcoming exams
  - Categorized by urgency: Tomorrow, This Week, This Month
  - Automatic grouping and prioritization
  - Exam details with subject, date, and topics
- ✅ **Notification Display**:
  - Dedicated Notifications page (`/notifications`)
  - Grouped reminders by time category
  - Color-coded badges (red for tomorrow, yellow for this week, blue for this month)
  - Exam countdown and date information
  - Group context for each reminder
- ✅ **Smart Filtering**:
  - Shows only relevant exams (within 45 days)
  - Filters by user's joined groups
  - Automatic categorization based on exam date
- ✅ **UI Components**:
  - Notification cards with exam details
  - Refresh functionality
  - Empty state handling
  - Link to Exams page for scheduling
- ✅ **Technical Implementation**:
  - Aggregates exams from all user groups
  - Uses date-fns for date calculations
  - Real-time updates when exams are added/modified

### 9. User Profile Management ✅
- ✅ **Profile Display**:
  - View user profile information
  - Display name, email, and class grade
  - Profile page (`/profile`)
- ✅ **Profile Editing**:
  - Edit user name with inline editing
  - Save/cancel functionality
  - Real-time profile updates
  - Error handling for failed updates
- ✅ **UI Components**:
  - Clean profile page layout
  - Edit button for name field
  - Form validation
  - Loading states
- ✅ **Technical Implementation**:
  - Firestore user profile collection
  - Profile update functions
  - Real-time profile synchronization

### 10. NCERT Textbooks & Notes ✅
- ✅ **NCERT Textbooks Access**:
  - Complete NCERT textbooks for classes 9-12
  - Subjects: Math, Science, Social Studies
  - All chapters with official NCERT PDF links
  - Organized by class and subject
- ✅ **PDF Viewer**:
  - Embedded PDF viewer using Google Docs Viewer proxy
  - Fullscreen mode for better reading experience
  - Download functionality for offline access
  - Open in new tab option for direct access
  - Responsive design for mobile and desktop
- ✅ **Navigation & UI**:
  - Class selector (9, 10, 11, 12)
  - Subject selector with visual indicators
  - Scrollable chapter list sidebar
  - Chapter selection with highlighting
  - Real-time chapter switching
- ✅ **UI Components**:
  - Dedicated Notes page (`/notes`)
  - Clean, organized layout
  - Dark mode support
  - Loading and error states
  - Consistent with app design system
- ✅ **Technical Implementation**:
  - Static data structure for NCERT books (`lib/data/ncert-books.ts`)
  - Helper functions for filtering and accessing books
  - Google Docs Viewer integration to bypass X-Frame-Options
  - Future-proof structure for Firebase Storage integration

---

## 🔨 Currently Working On

### Daily Coordination Features (Remaining)
**Priority**: MEDIUM - Additional coordination features

**Features to Implement**:

#### Daily Summary
- **Quick Revision Material**:
  - Key points from today's lessons
  - Important formulas, concepts, definitions
  - Quick revision material
  - Can be added by group leaders or members

**Note**: Today's Work, Homework Tracker, and Tomorrow's Preparation are now completed and integrated into a unified system. The Daily Summary feature will extend this system with quick revision materials.

---

## 📋 Upcoming Features

### 11. Notes Sharing & Upload
- **User Notes Upload**:
  - Upload handwritten notes as photos (JPG, PNG)
  - Upload typed notes as PDFs
  - Notes metadata:
    - Title, subject, chapter
    - Uploaded by (student name)
    - Upload date
    - Tags for easy searching
  - View notes in organized grid/list view
  - Download notes functionality
  
- **Notes Request System**:
  - Students can request notes for specific chapters
  - See pending requests
  - Fulfill requests by uploading notes
  - Notification when request is fulfilled

### 12. Exam Preparation Enhancement
- **Exam Preparation Page**:
  - Consolidated important points per exam
  - Focus areas and critical topics
  - Important formulas and concepts
  - Past year questions (if available)
  - Created by group leader or collaboratively
  
- **Post-Exam Discussion**:
  - Share answer keys with explanations
  - Discuss difficult questions
  - Self-assessment tools

- **Calendar View**:
  - View all upcoming exams in calendar view
  - Monthly/weekly calendar integration

### 13. Smart Study Planner
- **Personal Study Schedule**:
  - Create daily/weekly study plans
  - Assign topics to specific dates
  - Set study duration goals
  
- **Progress Tracking**:
  - Mark topics as: Not Started, In Progress, Completed
  - Visual progress bars per subject
  - Track study hours
  
- **Study Statistics**:
  - Total study time this week/month
  - Topics completed
  - Exam readiness score

### 14. Rich Text & Math Support
- **Mathematical Symbols**:
  - Basic: √, ², ³, ≥, ≤, ≠, ≈, ±
  - Advanced: ∫, ∑, ∏, ∂, ∞, π, θ
  - Fractions, equations, matrices
  
- **Text Formatting**:
  - Bold, italic, underline
  - Headings and subheadings
  - Bullet points and numbered lists
  - Code blocks for programming topics

### 15. Enhanced Notifications
**Additional Notification Types** (to be implemented):
- Daily todo/study list posted
- New homework assignment
- Notes request fulfilled
- New message in group chat
- Study planner reminder

**Notification Settings** (to be implemented):
- Enable/disable per notification type
- Quiet hours
- Notification sound customization
- Push notifications via FCM

---

## 🤖 AI Features (Future Enhancement)

Once core features are stable, we plan to integrate AI capabilities:

### AI Study Assistant
- **Practice Question Generator**: Generate practice questions from uploaded notes
- **Document Summarizer**: Summarize long PDFs and notes into key points
- **Concept Explainer**: Explain difficult topics in simple language
- **Smart Study Scheduler**: AI suggests optimal study schedules based on exam dates and syllabus

### Implementation Approach
- Use OpenAI API or Google Gemini API
- Process user notes to generate relevant questions
- Summarize daily class summaries automatically
- Provide instant doubt resolution

**Note**: AI features will be added after MVP is complete and tested.

---

## 📊 Database Schema (Firestore)

### Collections Structure

```
users/
  {userId}/
    - name: string
    - email: string
    - classGrade: string (e.g., "Class 9" or "Class 10")
    - groups: array of groupIds
    - profilePicture: string (URL) - future
    - role: string ("student" | "leader") - future
    - createdAt: timestamp
    - updatedAt: timestamp
    - studyStats: object - future

groups/
  {groupId}/
    - name: string (e.g., "9B")
    - class: string ("Class 9" | "Class 10" | "Class 11" | "Class 12")
    - division: string (e.g., "A", "B", "C")
    - createdBy: userId
    - createdAt: timestamp
    - members: array of userIds
    - leaders: array of userIds
    messages/
      {messageId}/
        - text: string
        - senderId: userId
        - senderName: string
        - timestamp: Timestamp
        - type: "text" | "image" | "file"
        - fileURL: string (optional)
        - fileName: string (optional)
    dailyWork/
      {workId}/
        - subjects: array of {subject, topics, homework, tomorrowPrep}
        - postedBy: userId
        - postedAt: timestamp
        - date: string (YYYY-MM-DD)
    exams/
      {examId}/
        - subject: string
        - topics: string
        - examDate: Timestamp
        - reminderFrequency: string
        - createdBy: userId
        - createdAt: Timestamp
        - groupId: string
    
notes/
  {noteId}/
    - title: string
    - subject: string
    - chapter: string
    - class: string
    - fileURL: string (Storage path)
    - fileType: string ("image" | "pdf")
    - uploadedBy: userId
    - uploadedAt: timestamp
    - groupId: string
    - tags: array
    - downloads: number
    
homework/
  {homeworkId}/
    - subject: string
    - description: string
    - dueDate: timestamp
    - postedBy: userId
    - groupId: string
    - postedAt: timestamp
    - completedBy: array of userIds
    

studyPlans/
  {userId}/
    plans/
      {planId}/
        - subject: string
        - topic: string
        - scheduledDate: date
        - duration: number (minutes)
        - status: string ("not_started" | "in_progress" | "completed")
        - notes: string

notifications/
  {userId}/
    notifications/
      {notificationId}/
        - type: string
        - title: string
        - body: string
        - read: boolean
        - createdAt: timestamp
        - actionURL: string (optional)
```

---

## 🎨 UI/UX Design Principles

### Design Philosophy
- **Clean & Minimal**: Focus on content, reduce clutter
- **Student-Friendly**: Easy to navigate, intuitive interface
- **Mobile-First**: Optimized for phone usage (primary device)
- **Fast Loading**: Lazy loading, image optimization
- **Accessible**: Good contrast, readable fonts, screen reader support

### Color Scheme
- **Primary**: Vibrant blue → indigo gradient (e.g. #3B82F6 → #6366F1) for energy, focus, and a modern feel
- **Secondary/Accents**: Emerald, violet, amber, and fuchsia tints for section cards and highlights
- **Warning**: Orange (#F59E0B) - Upcoming deadlines
- **Danger**: Red (#EF4444) - Urgent, overdue
- **Neutral**: Slate-based gray scale for text and layered backgrounds (light and dark)

### Typography
- **Headings**: Inter/Poppins (bold, clear)
- **Body**: Inter/System font (readable)
- **Math**: KaTeX font (professional)

### Key Screens
1. **Dashboard**: Gradient app shell with pill labels and cards for homework, exams, AI planner, and quick navigation
2. **Groups**: List of joined groups, group selector, create/join groups
3. **Notes**: NCERT textbooks viewer with class/subject/chapter navigation and embedded PDF viewer
4. **Today's Work**: Daily class work, homework tracking, and preparation notes
5. **Exams**: Exam scheduling, countdown, and topic tracking
6. **Notifications**: Daily exam reminders categorized by urgency
7. **Chat**: WhatsApp-like real-time group messaging
8. **Profile**: User profile display and editing
9. **AI Study Planner**: Split layout with a prompt + inputs on the left and a colorful, section-based AI study summary on the right

### Visual Style for Students (Secondary & Senior Secondary)
- Gradient **app shell** background (`sky → indigo`) with glassy `app-card` components
- **Pill labels** to highlight class, NCERT-readiness, and AI features
- Section-based **study summary cards** (Key Concepts, Important Definitions, Practice Questions, etc.) with distinct colors to make scanning faster for high school students

---

## 🔐 Security & Privacy

### Authentication
- Secure password hashing (handled by Firebase Auth)
- Email verification required
- Password strength requirements
- Two-factor authentication (future)

### Data Privacy
- Users can only see groups they're part of
- Notes visibility controlled by group membership
- Private study plans (not shared)
- Chat messages encrypted in transit
- User data not sold or shared

### Content Moderation
- Report inappropriate content
- Group leader moderation tools
- Automatic NSFW detection for uploaded images
- Ban/remove problematic users

---

## 📱 Progressive Web App (PWA) Features

- **Installable**: Add to home screen on mobile
- **Offline Support**: 
  - Cache NCERT PDFs for offline reading
  - Offline message queue (send when online)
  - View downloaded notes offline
- **Push Notifications**: Even when app is closed
- **Fast Loading**: Service worker caching
- **App-like Feel**: No browser UI, full screen

---

## 📥 NCERT Library Pipeline

- Configure Firebase Admin credentials before running locally or deploying:
  ```
  FIREBASE_ADMIN_PROJECT_ID=your-project-id
  FIREBASE_ADMIN_CLIENT_EMAIL=service-account@email
  FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  FIREBASE_ADMIN_STORAGE_BUCKET=your-project-id.appspot.com
  ```
- Run `npm run scrape:ncert` once to crawl ncert.nic.in, upload every Class 9‑12 PDF (and extracted text) into Firebase Storage, and write metadata/links into Firestore.
- Notes API routes (`/api/ncert/*`) now serve Storage download URLs when admin creds exist, so the Notes dashboard streams PDFs directly from Firebase on Vercel—no local disk writes needed.
- If admin env vars are missing (e.g., during quick local prototyping), the app transparently falls back to the bundled static NCERT list and fetches PDFs straight from ncert.nic.in via `/api/pdf-proxy`.

---

## 🚢 Deployment Strategy

### Development
```bash
npm run dev
# Runs on http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### Hosting Options
1. **Vercel** (Recommended): Zero-config Next.js deployment
2. **Firebase Hosting**: Good Firebase integration
3. **Docker Container**: Deploy to any cloud (Railway, Render, Fly.io)

---

## 📈 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Notes uploaded per week
- Messages sent per day
- Study planner usage rate

### Academic Impact
- User-reported grade improvements
- Exam preparation completion rate
- Homework completion rate
- Study time logged

### Platform Health
- App load time (<2 seconds)
- Crash rate (<1%)
- User retention (Week 1, Month 1)
- User satisfaction (NPS score)

---

## 🤝 Contributing

This project is currently in development for a coding competition. After the competition, we plan to:
- Open source the codebase
- Accept community contributions
- Add more regional languages
- Expand to other education boards (ICSE, State Boards)

---

## 📄 License

[To be decided - likely MIT License]

---

## 👨‍💻 Development Team

- **Developer**: Ankith R
- **Framework**: Next.js + Firebase
- **AI Assistant**: Cursor AI, Claude

---

## 📞 Contact & Support

- **Issues**: GitHub Issues (when open-sourced)
- **Email**: ankith.r.dev@gmail.com
- **Documentation**: Not yet made

---

## 🎯 Competition Context

**Program Name**: Budding Scientists
**Focus**: Solving real-world problems for students using technology
**Unique Value**: All-in-one platform combining notes, coordination, planning, and communication with exam-focused features and mathematical notation support.

---

**Last Updated**: January 2025
**Version**: 1.4.0 (MVP - Core features completed, NCERT Textbooks & Notes System completed)