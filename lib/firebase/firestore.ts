import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData,
  setDoc,
} from "firebase/firestore";
import { db } from "./config";
import { User } from "firebase/auth";

const checkDb = () => {
  if (!db) {
    throw new Error(
      "Firebase is not configured. Please check your .env.local file and ensure all Firebase environment variables are set."
    );
  }
};

// Types
export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  type: "text" | "image" | "file";
  fileURL?: string;
  fileName?: string;
}

export interface Exam {
  id?: string;
  groupId: string;
  subject: DailySubject;
  topics: string;
  examDate: Timestamp;
  reminderFrequency: "daily" | "none";
  createdBy: string;
  createdAt: Timestamp;
}

export interface Group {
  id?: string;
  name: string;
  class: string;
  division: string;
  createdBy: string;
  createdAt: Timestamp;
  members: string[];
  leaders: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  classGrade: string;
  groups?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const DAILY_SUBJECTS = [
  "English",
  "Maths",
  "Malayalam",
  "Chemistry",
  "Biology",
  "Physics",
  "S.S",
  "AI",
  "Assignments/Other",
] as const;

export type DailySubject = (typeof DAILY_SUBJECTS)[number];

export interface Summary {
  id?: string;
  userId: string;
  prompt: string;
  class: string;
  subject: string;
  chapter: string;
  summary: string;
  ncertReferenced: boolean;
  createdAt: Timestamp;
}

export interface DailyWorkEntry {
  id?: string;
  date: Timestamp;
  subject: DailySubject;
  topics: string;
  postedBy: string;
  postedAt: Timestamp;
  type: "today";
}

// Messages
export const sendMessage = async (
  groupId: string,
  message: Omit<Message, "id" | "timestamp">
) => {
  checkDb();
  const messagesRef = collection(db!, "groups", groupId, "messages");
  return await addDoc(messagesRef, {
    ...message,
    timestamp: Timestamp.now(),
  });
};

export const subscribeToMessages = (
  groupId: string,
  callback: (messages: Message[]) => void
) => {
  checkDb();
  const messagesRef = collection(db!, "groups", groupId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
      } as Message);
    });
    callback(messages);
  });
};

// Groups
export const createGroup = async (group: Omit<Group, "id" | "createdAt">) => {
  checkDb();
  const groupsRef = collection(db!, "groups");
  return await addDoc(groupsRef, {
    ...group,
    createdAt: Timestamp.now(),
  });
};

export const getGroup = async (groupId: string) => {
  checkDb();
  const groupRef = doc(db!, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists()) {
    return { id: groupSnap.id, ...groupSnap.data() } as Group;
  }
  return null;
};

export const getUserGroups = async (userId: string) => {
  checkDb();
  const groupsRef = collection(db!, "groups");
  const q = query(groupsRef, where("members", "array-contains", userId));
  const querySnapshot = await getDocs(q);
  const groups: Group[] = [];
  querySnapshot.forEach((doc) => {
    groups.push({ id: doc.id, ...doc.data() } as Group);
  });
  return groups;
};

export const getAllGroups = async () => {
  checkDb();
  const groupsRef = collection(db!, "groups");
  const q = query(groupsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const groups: Group[] = [];
  querySnapshot.forEach((doc) => {
    groups.push({ id: doc.id, ...doc.data() } as Group);
  });
  return groups;
};

export const joinGroup = async (groupId: string, userId: string) => {
  checkDb();
  const groupRef = doc(db!, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error("Group not found");
  }

  const groupData = groupSnap.data() as Group;
  
  // Check if user is already a member
  if (groupData.members.includes(userId)) {
    throw new Error("User is already a member of this group");
  }

  // Add user to group members
  await updateDoc(groupRef, {
    members: [...groupData.members, userId],
  });

  // Add group to user's groups array
  const userRef = doc(db!, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    const userGroups = userData.groups || [];
    if (!userGroups.includes(groupId)) {
      await updateDoc(userRef, {
        groups: [...userGroups, groupId],
        updatedAt: new Date(),
      });
    }
  } else {
    // Create user profile if it doesn't exist
    await setDoc(userRef, {
      uid: userId,
      groups: [groupId],
      updatedAt: new Date(),
    }, { merge: true });
  }
};

export const leaveGroup = async (groupId: string, userId: string) => {
  checkDb();
  const groupRef = doc(db!, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) {
    throw new Error("Group not found");
  }

  const groupData = groupSnap.data() as Group;
  
  // Remove user from group members
  await updateDoc(groupRef, {
    members: groupData.members.filter((id) => id !== userId),
    leaders: groupData.leaders.filter((id) => id !== userId),
  });

  // Remove group from user's groups array
  const userRef = doc(db!, "users", userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    const userGroups = (userData.groups || []).filter((id) => id !== groupId);
    await updateDoc(userRef, {
      groups: userGroups,
      updatedAt: new Date(),
    });
  }
};

export const checkGroupExists = async (classGrade: string, division: string): Promise<boolean> => {
  checkDb();
  const groupsRef = collection(db!, "groups");
  const q = query(
    groupsRef,
    where("class", "==", classGrade),
    where("division", "==", division)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Exams
export const listenToExams = (
  groupId: string,
  callback: (exams: Exam[]) => void
) => {
  checkDb();
  const examsRef = collection(db!, "groups", groupId, "exams");
  const q = query(examsRef, orderBy("examDate", "asc"));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const exams: Exam[] = [];
    snapshot.forEach((doc) => {
      exams.push({ id: doc.id, ...(doc.data() as Exam) });
    });
    callback(exams);
  });
};

export const addExam = async (
  groupId: string,
  exam: Omit<Exam, "id" | "groupId" | "createdAt">
) => {
  checkDb();
  const examsRef = collection(db!, "groups", groupId, "exams");
  return await addDoc(examsRef, {
    ...exam,
    groupId,
    createdAt: Timestamp.now(),
  });
};

export const deleteExam = async (groupId: string, examId: string) => {
  checkDb();
  const examRef = doc(db!, "groups", groupId, "exams", examId);
  await deleteDoc(examRef);
};

export const getUpcomingExams = async (
  groupIds: string[],
  daysAhead = 60
): Promise<Exam[]> => {
  checkDb();
  if (groupIds.length === 0) return [];

  const now = new Date();
  const horizon = new Date();
  horizon.setDate(now.getDate() + daysAhead);

  const exams: Exam[] = [];

  await Promise.all(
    groupIds.map(async (groupId) => {
      const examsRef = collection(db!, "groups", groupId, "exams");
      const q = query(examsRef, orderBy("examDate", "asc"));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data() as Exam;
        const examDate = data.examDate.toDate();
        if (examDate >= now && examDate <= horizon) {
          exams.push({ id: doc.id, ...data });
        }
      });
    })
  );

  return exams.sort(
    (a, b) => a.examDate.toDate().getTime() - b.examDate.toDate().getTime()
  );
};

// User Profile Functions
/**
 * Save user profile to Firestore
 */
export async function saveUserProfile(
  user: User,
  profileData: { name: string; classGrade: string }
): Promise<void> {
  checkDb();
  const userRef = doc(db!, "users", user.uid);

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || "",
    name: profileData.name,
    classGrade: profileData.classGrade,
    groups: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(userRef, profile, { merge: true });
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  checkDb();
  const userRef = doc(db!, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, "uid" | "email" | "createdAt">>
): Promise<void> {
  checkDb();
  const userRef = doc(db!, "users", uid);

  await setDoc(
    userRef,
    {
      ...updates,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

const normalizeDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const listenToDailyWork = (
  groupId: string,
  callback: (entries: DailyWorkEntry[]) => void,
  maxEntries = 100
) => {
  checkDb();
  const dailyWorkRef = collection(db!, "groups", groupId, "dailyWork");
  const q = query(dailyWorkRef, orderBy("postedAt", "desc"), limit(maxEntries));

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const entries: DailyWorkEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      } as DailyWorkEntry);
    });
    callback(entries);
  });
};

export const addDailyWorkEntries = async (
  groupId: string,
  entries: Array<{ subject: DailySubject; topics: string; postedBy: string }>
) => {
  checkDb();
  const now = new Date();
  const dateValue = Timestamp.fromDate(normalizeDate(now));
  const postedAt = Timestamp.fromDate(now);
  const dailyWorkRef = collection(db!, "groups", groupId, "dailyWork");

  await Promise.all(
    entries.map((entry) =>
      addDoc(dailyWorkRef, {
        date: dateValue,
        subject: entry.subject,
        topics: entry.topics,
        postedBy: entry.postedBy,
        postedAt,
        type: "today",
      })
    )
  );
};

export const updateDailyWorkEntry = async (
  groupId: string,
  entryId: string,
  updates: Partial<Pick<DailyWorkEntry, "subject" | "topics">>
) => {
  checkDb();
  const entryRef = doc(db!, "groups", groupId, "dailyWork", entryId);
  await updateDoc(entryRef, updates);
};

// Study summary utilities
export const saveSummary = async (summary: Omit<Summary, "id" | "createdAt">) => {
  checkDb();
  // Store summaries under the user's profile document for easier scoping:
  // users/{userId}/studySummaries/{summaryId}
  const summariesRef = collection(db!, "users", summary.userId, "studySummaries");
  const docRef = await addDoc(summariesRef, {
    ...summary,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getUserSummaries = async (userId: string): Promise<Summary[]> => {
  checkDb();
  const summariesRef = collection(db!, "users", userId, "studySummaries");
  const summariesQuery = query(summariesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(summariesQuery);
  return snapshot.docs.map(
    (docSnap) =>
      ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Summary),
  );
};

export const deleteSummary = async (userId: string, summaryId: string) => {
  checkDb();
  const summaryRef = doc(db!, "users", userId, "studySummaries", summaryId);
  await deleteDoc(summaryRef);
};

