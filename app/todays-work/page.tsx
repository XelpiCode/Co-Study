"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getUserGroups,
  listenToDailyWork,
  type DailyWorkEntry,
  type Group,
} from "@/lib/firebase/firestore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import TodaysWorkHistory from "@/components/dashboard/todays-work-history";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function TodaysWorkPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [dailyWorkEntries, setDailyWorkEntries] = useState<DailyWorkEntry[]>([]);
  const [loadingDailyWork, setLoadingDailyWork] = useState(false);

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
        if (groups.length > 0) {
          setSelectedGroupId((prev) => prev || groups[0].id || "");
        }
      } catch (err) {
        console.error("Error loading user groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadUserGroups();
  }, [user]);

  useEffect(() => {
    if (!selectedGroupId) {
      setDailyWorkEntries([]);
      return;
    }

    setLoadingDailyWork(true);
    const unsubscribe = listenToDailyWork(selectedGroupId, (entries) => {
      setDailyWorkEntries(entries);
      setLoadingDailyWork(false);
    });

    return () => unsubscribe();
  }, [selectedGroupId]);

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
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary font-heading cursor-pointer">Co-Study</h1>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <Link href="/dashboard" className="text-primary hover:underline">
                  Dashboard
                </Link>{" "}
                / Today&apos;s Work
              </p>
              <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mt-1">Today&apos;s Work</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Share what was taught today, homework, and prep notes for your class.
              </p>
            </div>
            {userGroups.length > 0 && (
              <div className="flex flex-col">
                <label htmlFor="groupSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Viewing group
                </label>
                <select
                  id="groupSelect"
                  className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingGroups ? (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              Loading your groups...
            </div>
          ) : userGroups.length === 0 ? (
            <div className="p-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-gray-700 dark:text-gray-200 mb-4">
                Join or create a group to start posting Today&apos;s Work updates.
              </p>
              <Link href="/groups">
                <Button>Go to Groups</Button>
              </Link>
            </div>
          ) : selectedGroupId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Today&apos;s Work History</h3>
                <Link href={`/todays-work/add${selectedGroupId ? `?groupId=${selectedGroupId}` : ""}`}>
                  <Button>+ Add Today&apos;s Work</Button>
                </Link>
              </div>
              <TodaysWorkHistory
                groupId={selectedGroupId}
                currentUserId={user.uid}
                entries={dailyWorkEntries}
                isLoading={loadingDailyWork}
              />
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Select a group to get started.</p>
          )}
        </div>
      </main>
    </div>
  );
}

