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

## 🔨 Currently Working On

### Real-Time Chat System
**Priority**: HIGH - Core feature for student collaboration

**Features to Implement**:
- **Group Chat**:
  - Real-time messaging per class group
  - Text messages with timestamp
  - Image sharing in chat
  - File sharing (PDFs, documents)
  - Message delivery status
  
- **Chat UI Components**:
  - WhatsApp-like message bubbles
  - Sender name and time display
  - Scroll to bottom on new message
  - Message input with send button
  - File upload button
  
- **Real-time Sync**:
  - Firebase Firestore onSnapshot listeners
  - Instant message updates across all devices
  - Typing indicators (optional for MVP)
  - Online/offline status indicators
  
- **Message Features**:
  - Send text messages
  - Upload and share images
  - Upload and share PDF files
  - Auto-scroll to latest message
  - Message timestamps (relative: "2 mins ago")

**Technical Implementation**:
```typescript
// Firestore structure for messages
messages/{groupId}/messages/{messageId}
  - text: string
  - senderId: string
  - senderName: string
  - timestamp: Timestamp
  - type: "text" | "image" | "file"
  - fileURL?: string
  - fileName?: string
```

---

## ✅ Core Features (To Be Built After Chat)

### 1. Authentication & User Management
- Email/password registration and login
- Google OAuth integration
- User profiles with:
  - Name, class
  - Profile picture
  - Role (Student, Group Leader)
- Password reset functionality

### 2. Class-Based Groups
- **Group Creation**: Students can join/create groups by class (e.g., "Class 9A", "Class 10 Science")
- **Group Roles**:
  - **Group Leader/Admin**: Can post announcements, exam dates, manage members
  - **Members**: Can post notes, participate in discussions
- **Group Information**:
  - Class name and section
  - Member count and list
  - Group creation date

### 3. Study Resources Module
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

### 4. Daily Coordination Features
- **Today's Work**: 
  - What was taught in class today
  - Topics covered
  - Posted by group leader or any member
  - Timestamp and date

- **Homework Tracker**:
  - Assignment details (subject, description, due date)
  - Mark homework as completed
  - View pending vs completed homework
  - Get reminders for upcoming due dates

- **Tomorrow's Preparation**:
  - What to study for next class
  - Topics to prepare
  - Helps students stay ahead

- **Daily Summary**:
  - Key points from today's lessons
  - Important formulas, concepts, definitions
  - Quick revision material

### 5. Exam Management System
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

### 6. Smart Study Planner
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

### 7. Rich Text & Math Support
- **Mathematical Symbols**:
  - Basic: √, ², ³, ≥, ≤, ≠, ≈, ±
  - Advanced: ∫, ∑, ∏, ∂, ∞, π, θ
  - Fractions, equations, matrices
  
- **Text Formatting**:
  - Bold, italic, underline
  - Headings and subheadings
  - Bullet points and numbered lists
  - Code blocks for programming topics

### 8. Real-Time Chat
*See "Currently Working On" section above for detailed implementation plan*

### 9. Smart Notifications
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
    - class: string (e.g., "Class 9" or "Class 10")
    - profilePicture: string (URL)
    - role: string ("student" | "leader")
    - createdAt: timestamp
    - studyStats: object

groups/
  {groupId}/
    - name: string (e.g., "Class 9A")
    - class: string ("Class 9" | "Class 10")
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
    
messages/
  {groupId}/
    messages/
      {messageId}/
        - text: string
        - senderId: userId
        - timestamp: timestamp
        - type: string ("text" | "image" | "file")
        - fileURL: string (optional)
        - replyTo: messageId (optional)
        - reactions: object

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

- **Developer**: [Ankith R]
- **Framework**: Next.js + Firebase
- **AI Assistant**: Cursor AI, Claude

---

## 📞 Contact & Support

- **Issues**: GitHub Issues (when open-sourced)
- **Email**: [Your email for the competition]
- **Documentation**: [Link to detailed docs]

---

## 🎯 Competition Context

**Program Name**: Budding Scientists
**Focus**: Solving real-world problems for students using technology
**Unique Value**: All-in-one platform combining notes, coordination, planning, and communication with exam-focused features and mathematical notation support.

---

**Last Updated**: November 2025
**Version**: 1.0.0 (MVP in development)