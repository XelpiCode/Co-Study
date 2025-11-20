"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  subscribeToMessages,
  sendMessage,
  getGroup,
  type Message,
  type Group,
} from "@/lib/firebase/firestore";
import { uploadImage, uploadPDF } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupId = searchParams.get("groupId");

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, setUser, setLoading]);

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) {
        setLoadingGroup(false);
        return;
      }
      try {
        setLoadingGroup(true);
        const groupData = await getGroup(groupId);
        if (!groupData) {
          router.push("/dashboard");
          return;
        }
        setGroup(groupData);
      } catch (err) {
        console.error("Error loading group:", err);
        router.push("/dashboard");
      } finally {
        setLoadingGroup(false);
      }
    };
    loadGroup();
  }, [groupId, router]);

  useEffect(() => {
    if (!user || !groupId) return;

    const unsubscribe = subscribeToMessages(groupId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !groupId || sendingMessage) return;

    try {
      setSendingMessage(true);
      const senderName = profile?.name || user.displayName || user.email?.split("@")[0] || "Anonymous";
      
      await sendMessage(groupId, {
        text: newMessage,
        senderId: user.uid,
        senderName: senderName,
        type: "text",
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!user || !groupId) {
      console.warn("Missing user or group information for upload.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      window.alert("File must be 5MB or smaller.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPDF) {
      window.alert("Only image or PDF files can be uploaded.");
      return;
    }

    try {
      setUploadingFile(true);
      const senderName = profile?.name || user.displayName || user.email?.split("@")[0] || "Anonymous";

      const downloadURL = isImage
        ? await uploadImage(file, user.uid, groupId)
        : await uploadPDF(file, user.uid, groupId);

      await sendMessage(groupId, {
        text: isImage ? "Shared an image" : file.name,
        senderId: user.uid,
        senderName,
        type: isImage ? "image" : "file",
        fileURL: downloadURL,
        fileName: file.name,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      window.alert("Something went wrong while uploading. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  if (!user || loadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!groupId || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Group not found</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">
                {group.name} Chat
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/profile">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  {profile?.name || user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border border-gray-200 dark:border-gray-700">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwn
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold mb-1 opacity-80">
                          {message.senderName}
                        </p>
                      )}
                      {message.type === "image" && message.fileURL ? (
                        <div className="relative w-full max-w-md mb-2 rounded overflow-hidden">
                          {message.fileName && (
                            <p className="text-xs mb-2 opacity-80">{message.fileName}</p>
                          )}
                          <Image
                            src={message.fileURL}
                            alt="Shared image"
                            width={800}
                            height={600}
                            className="rounded"
                            style={{ width: "100%", height: "auto" }}
                            unoptimized
                          />
                        </div>
                      ) : message.type === "file" && message.fileURL ? (
                        <a
                          href={message.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                        >
                          {message.fileName || message.text}
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatDistanceToNow(message.timestamp.toDate(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendingMessage}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
            >
              {uploadingFile ? "Uploading..." : "Upload"}
            </Button>
            <Button type="submit" disabled={!newMessage.trim() || sendingMessage}>
              {sendingMessage ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
