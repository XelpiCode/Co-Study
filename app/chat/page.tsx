"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { subscribeToMessages, sendMessage, type Message } from "@/lib/firebase/firestore";
// File upload temporarily disabled - Storage not configured
// import { uploadImage, uploadPDF } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupId] = useState("demo-group"); // TODO: Get from selected group
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(groupId, {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email || "Anonymous",
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">Chat</h1>
            </div>
            <span className="text-gray-700">{user.email}</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 container mx-auto px-4 py-4 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow-md p-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
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
                          : "bg-gray-100 text-gray-900"
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
                          isOwn ? "text-blue-100" : "text-gray-500"
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

