// Storage functionality temporarily disabled
// Uncomment and configure Firebase Storage to enable file uploads

import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage } from "./config";

export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  if (!storage) {
    throw new Error("Firebase Storage is not configured. Please enable Storage in Firebase Console.");
  }
  const storageRef = ref(storage, path);
  const snapshot: UploadResult = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};

export const uploadImage = async (
  file: File,
  userId: string,
  groupId: string
): Promise<string> => {
  const timestamp = Date.now();
  const path = `groups/${groupId}/images/${userId}_${timestamp}_${file.name}`;
  return await uploadFile(file, path);
};

export const uploadPDF = async (
  file: File,
  userId: string,
  groupId: string
): Promise<string> => {
  const timestamp = Date.now();
  const path = `groups/${groupId}/files/${userId}_${timestamp}_${file.name}`;
  return await uploadFile(file, path);
};

