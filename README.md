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

### 6. Study Resources Module
- **NCERT Textbooks**:
  - Built-in PDF viewer for NCERT books
  - Organized by class (Math, Science, Social Studies for Class 9-10)
  - Quick chapter navigation
  - Bookmark functionality
  
- **Notes Sharing**:
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

### 7. Exam Management System
- **Exam Calendar**:
  - Group leaders post test/exam dates
  - Subject, date, time, syllabus
  - View all upcoming exams in calendar view
  
- **Exam Countdown**:
  - Shows days/hours until each exam
  - Color-coded urgency (red for <3 days, yellow for <7 days)
  
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

### 8. Smart Study Planner
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

### 9. Rich Text & Math Support
- **Mathematical Symbols**:
  - Basic: √, ², ³, ≥, ≤, ≠, ≈, ±
  - Advanced: ∫, ∑, ∏, ∂, ∞, π, θ
  - Fractions, equations, matrices
  
- **Text Formatting**:
  - Bold, italic, underline
  - Headings and subheadings
  - Bullet points and numbered lists
  - Code blocks for programming topics

### 10. Smart Notifications
Users receive notifications for:
- ✅ Daily todo/study list posted
- ✅ New homework assignment
- ✅ Exam date announced
- ✅ Exam countdown reminders (7 days, 3 days, 1 day before)
- ✅ Notes request fulfilled
- ✅ New message in group chat
- ✅ Study planner reminder

**Notification Settings**:
- Enable/disable per notification type
- Quiet hours
- Notification sound customization

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
    
exams/
  {examId}/
    - subject: string
    - date: timestamp
    - time: string
    - syllabus: string
    - type: string ("test" | "exam")
    - postedBy: userId
    - groupId: string
    - prepMaterial: object
    
groups/
  {groupId}/
    messages/
      {messageId}/
        - text: string
        - senderId: userId
        - senderName: string
        - timestamp: Timestamp
        - type: "text" | "image" | "file"
        - fileURL: string (optional)
        - fileName: string (optional)

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
- **Primary**: Blue (#3B82F6) - Trust, learning, focus
- **Secondary**: Green (#10B981) - Success, completion
- **Warning**: Orange (#F59E0B) - Upcoming deadlines
- **Danger**: Red (#EF4444) - Urgent, overdue
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Inter/Poppins (bold, clear)
- **Body**: Inter/System font (readable)
- **Math**: KaTeX font (professional)

### Key Screens
1. **Dashboard**: Overview of homework, exams, recent notes
2. **Groups**: List of joined groups, group selector
3. **Notes Library**: Grid/list view of all notes with filters
4. **Study Planner**: Calendar view with tasks
5. **Chat**: WhatsApp-like interface
6. **Exam Prep**: Focused view per exam with countdown
7. **Profile**: User stats, settings, preferences

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

**Last Updated**: December 2024
**Version**: 1.2.0 (MVP - Core features completed, Today's Work & Daily Coordination completed)