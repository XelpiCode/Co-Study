"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getUserGroups, type Group } from "@/lib/firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

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
    const loadUserGroups = async () => {
      if (!user) return;
      try {
        setLoadingGroups(true);
        const groups = await getUserGroups(user.uid);
        setUserGroups(groups);
      } catch (err) {
        console.error("Error loading user groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadUserGroups();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary font-heading">Co-Study</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
              <Button
                variant="outline"
                onClick={async () => {
                  const { logout } = await import("@/lib/firebase/auth");
                  await logout();
                  setUser(null);
                  router.push("/");
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 font-heading text-gray-900 dark:text-white">Dashboard</h2>

          {/* User's Group Chats */}
          {loadingGroups ? (
            <div className="mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userGroups.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 font-heading text-gray-900 dark:text-white">Your Groups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userGroups.map((group) => (
                  <Link key={group.id} href={`/chat?groupId=${group.id}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">💬 {group.name} Chat</h3>
                      <p className="text-gray-600 dark:text-gray-400">Real-time messaging with {group.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You haven't joined any groups yet. Join or create a group to start chatting!
              </p>
              <Link href="/groups">
                <Button>Go to Groups</Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/groups">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">👥 Groups</h3>
                <p className="text-gray-600 dark:text-gray-400">Browse and manage your study groups</p>
              </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📚 Notes</h3>
              <p className="text-gray-600 dark:text-gray-400">Share and access study notes</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📝 Homework</h3>
              <p className="text-gray-600 dark:text-gray-400">Track assignments and deadlines</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📅 Exams</h3>
              <p className="text-gray-600 dark:text-gray-400">View exam schedule and countdown</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📊 Study Planner</h3>
              <p className="text-gray-600 dark:text-gray-400">Plan and track your study schedule</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

