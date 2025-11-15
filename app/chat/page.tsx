"use client";

import { useEffect, useState, useRef } from "react";
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
// File upload temporarily disabled - Storage not configured
// import { uploadImage, uploadPDF } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (!newMessage.trim() || !user || !groupId) return;

    try {
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
    }
  };

  // File upload temporarily disabled
  // const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   // Implementation disabled - Storage not configured
  // };

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
                        <img
                          src={message.fileURL}
                          alt="Shared image"
                          className="max-w-full rounded mb-2"
                        />
                      ) : message.type === "file" && message.fileURL ? (
                        <a
                          href={message.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:opacity-80"
                        >
                          {message.text}
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

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

