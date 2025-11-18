"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getUserGroups,
  DAILY_SUBJECTS,
  addDailyWorkEntries,
  type DailySubject,
  type Group,
} from "@/lib/firebase/firestore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type FormRow = {
  id: number;
  subject: DailySubject;
  topics: string;
};

const initialRow = (): FormRow => ({
  id: Date.now(),
  subject: DAILY_SUBJECTS[0],
  topics: "",
});

function AddTodaysWorkForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [rows, setRows] = useState<FormRow[]>([initialRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Get groupId from URL params if available
  const groupIdParam = searchParams.get("groupId");

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
          const defaultGroupId = groupIdParam || groups[0].id || "";
          setSelectedGroupId(defaultGroupId);
        }
      } catch (err) {
        console.error("Error loading user groups:", err);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadUserGroups();
  }, [user, groupIdParam]);

  const resetForm = () => {
    setRows([initialRow()]);
    setFormError(null);
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, initialRow()]);
  };

  const handleRemoveRow = (id: number) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !selectedGroupId || !user) return;

    const trimmedRows = rows
      .map((row) => ({ ...row, topics: row.topics.trim() }))
      .filter((row) => row.topics.length > 0);

    if (trimmedRows.length === 0) {
      setFormError("Add at least one subject with details.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await addDailyWorkEntries(
        selectedGroupId,
        trimmedRows.map((row) => ({
          subject: row.subject,
          topics: row.topics,
          postedBy: user.uid,
        }))
      );
      resetForm();
      // Redirect back to main page after successful submission
      router.push("/todays-work");
    } catch (error) {
      console.error("Failed to save daily work", error);
      setFormError("Could not save entries. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <Link href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </Link>{" "}
              /{" "}
              <Link href="/todays-work" className="text-primary hover:underline">
                Today&apos;s Work
              </Link>{" "}
              / Add
            </p>
            <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mt-1">
              Add Today&apos;s Work
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Post what was taught today, homework, and prep notes for your class.
            </p>
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
          ) : (
            <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <div className="flex flex-col">
                <label htmlFor="groupSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Group
                </label>
                <select
                  id="groupSelect"
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                >
                  <option value="">Select a group</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Subject Entries</h4>
                </div>
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/30 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <label
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        htmlFor={`subject-${row.id}`}
                      >
                        Subject
                      </label>
                      <select
                        id={`subject-${row.id}`}
                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={row.subject}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, subject: e.target.value as DailySubject } : r))
                          )
                        }
                      >
                        {DAILY_SUBJECTS.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor={`topics-${row.id}`}>
                        Details / Homework
                      </label>
                      <textarea
                        id={`topics-${row.id}`}
                        className="min-h-[100px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={row.topics}
                        onChange={(e) =>
                          setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, topics: e.target.value } : r)))
                        }
                        placeholder="e.g. Study Chapter 4, complete worksheet"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={submitting || !selectedGroupId}>
                  {submitting ? "Posting..." : "Post Today's Work"}
                </Button>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-sm text-primary hover:underline"
                >
                  + Add another subject
                </button>
                <Link href="/todays-work" className="text-sm text-gray-600 dark:text-gray-400 hover:underline ml-auto">
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AddTodaysWorkPage() {
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
      <AddTodaysWorkForm />
    </Suspense>
  );
}

