import { ref, uploadBytes, getDownloadURL, UploadResult } from "firebase/storage";
import { storage } from "./config";

export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
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

