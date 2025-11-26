"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { getUserGroups, type Group } from "@/lib/firebase/firestore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
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

  const cardBaseClasses =
    "bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer p-6 h-full flex flex-col gap-2";
  const cardDescriptionClasses = "text-gray-600 dark:text-gray-400 truncate";
  const cardActionClasses = "text-sm text-primary mt-3";
  const placeholderActionClasses = "text-sm mt-3 text-transparent select-none";

  if (!user) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                C
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading leading-tight">
                  Co-Study
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your class HQ for notes, exams & daily study
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/notifications">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  Notifications
                </span>
              </Link>
              <Link href="/profile">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  {profile?.name || user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </Link>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
                Welcome back, {profile?.name || user.displayName || user.email?.split("@")[0] || "Student"} 👋
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Stay on top of today&apos;s work, upcoming exams, and your AI-powered study plans.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="pill-label">
                Class {profile?.classGrade?.replace("Class ", "") || "—"}
              </span>
              <span className="section-chip">
                📚 NCERT ready
              </span>
              <span className="section-chip">
                🤖 AI Study Planner
              </span>
            </div>
          </div>

          {/* User's Group Chats */}
          {loadingGroups ? (
            <div className="mb-8 flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Loading your groups…</p>
            </div>
          ) : userGroups.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 font-heading text-gray-900 dark:text-white">Your Groups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {userGroups.map((group) => (
                  <Link key={group.id} href={`/chat?groupId=${group.id}`}>
                    <div className={`${cardBaseClasses} border-l-4 border-l-primary/70`}>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">💬 {group.name} Chat</h3>
                      <p className={cardDescriptionClasses}>Real-time messaging with your classmates.</p>
                      <span className={cardActionClasses}>Open chat →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You haven&apos;t joined any groups yet. Join or create a group to start chatting!
              </p>
              <Link href="/groups">
                <Button>Go to Groups</Button>
              </Link>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 my-10" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/profile">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">👤 Profile</h3>
                <p className={cardDescriptionClasses}>View and edit your profile</p>
                <p className={cardActionClasses}>Edit profile →</p>
              </div>
            </Link>

            <Link href="/groups">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">👥 Groups</h3>
                <p className={cardDescriptionClasses}>Browse and manage your study groups</p>
                <p className={cardActionClasses}>Open groups →</p>
              </div>
            </Link>

            <Link href="/notes">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📚 Notes</h3>
                <p className={cardDescriptionClasses}>Share and access study notes</p>
                <p className={cardActionClasses}>View notes →</p>
              </div>
            </Link>

            <Link href="/todays-work">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📝 Today&apos;s Work</h3>
                <p className={cardDescriptionClasses}>Manage homework logs with editing history</p>
                <p className={cardActionClasses}>Open Today&apos;s Work →</p>
              </div>
            </Link>

            <Link href="/exams">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">📅 Exams</h3>
                <p className={cardDescriptionClasses}>View exam schedule and countdown</p>
                <p className={cardActionClasses}>Open Exam Planner →</p>
              </div>
            </Link>

            <Link href="/notifications">
              <div className={`${cardBaseClasses} app-card`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">🔔 Notifications</h3>
                <p className={cardDescriptionClasses}>Daily reminders for each class</p>
                <p className={cardActionClasses}>View reminders →</p>
              </div>
            </Link>

            <Link href="/study-planner">
              <div className={`${cardBaseClasses} app-card border border-sky-200/80 dark:border-sky-800/80 shadow-md shadow-sky-100/70 dark:shadow-sky-900/40`}>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  📊 Study Planner (AI)
                </h3>
                <p className={cardDescriptionClasses}>
                  Get AI-generated key points, important questions, and NCERT-aligned summaries.
                </p>
                <p className={cardActionClasses}>Open AI Study Planner →</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

