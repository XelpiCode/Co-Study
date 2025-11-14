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
} from "firebase/firestore";
import { db } from "./config";

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

export interface Group {
  id?: string;
  name: string;
  class: string;
  createdBy: string;
  createdAt: Timestamp;
  members: string[];
  leaders: string[];
}

// Messages
export const sendMessage = async (
  groupId: string,
  message: Omit<Message, "id" | "timestamp">
) => {
  const messagesRef = collection(db, "groups", groupId, "messages");
  return await addDoc(messagesRef, {
    ...message,
    timestamp: Timestamp.now(),
  });
};

export const subscribeToMessages = (
  groupId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, "groups", groupId, "messages");
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
  const groupsRef = collection(db, "groups");
  return await addDoc(groupsRef, {
    ...group,
    createdAt: Timestamp.now(),
  });
};

export const getGroup = async (groupId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists()) {
    return { id: groupSnap.id, ...groupSnap.data() } as Group;
  }
  return null;
};

export const getUserGroups = async (userId: string) => {
  const groupsRef = collection(db, "groups");
  const q = query(groupsRef, where("members", "array-contains", userId));
  const querySnapshot = await getDocs(q);
  const groups: Group[] = [];
  querySnapshot.forEach((doc) => {
    groups.push({ id: doc.id, ...doc.data() } as Group);
  });
  return groups;
};

