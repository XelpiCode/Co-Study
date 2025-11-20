"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { format, differenceInCalendarDays } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  addExam,
  getUserGroups,
  listenToExams,
  DAILY_SUBJECTS,
  type Exam,
  type Group,
  type DailySubject,
} from "@/lib/firebase/firestore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

interface ExamFormState {
  subject: DailySubject;
  topics: string;
  examDate: string;
}

export default function ExamsPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [formState, setFormState] = useState<ExamFormState>({
    subject: DAILY_SUBJECTS[0],
    topics: "",
    examDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
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
    const loadGroups = async () => {
      if (!user) return;
      try {
        setLoadingGroups(true);
        const groups = await getUserGroups(user.uid);
        setUserGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId((prev) => prev || groups[0].id!);
        }
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [user]);

  useEffect(() => {
    if (!selectedGroupId) {
      setExams([]);
      return;
    }
    const unsubscribe = listenToExams(selectedGroupId, (items) => {
      setExams(items);
    });
    return () => unsubscribe();
  }, [selectedGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGroupId) return;
    if (!formState.subject.trim() || !formState.examDate) {
      return;
    }

    try {
      setSubmitting(true);
      await addExam(selectedGroupId, {
        subject: formState.subject,
        topics: formState.topics.trim(),
        examDate: Timestamp.fromDate(new Date(formState.examDate)),
        reminderFrequency: "daily",
        createdBy: user.uid,
      });
      setFormState({
        subject: DAILY_SUBJECTS[0],
        topics: "",
        examDate: "",
      });
    } catch (error) {
      console.error("Error adding exam:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroup = useMemo(
    () => userGroups.find((group) => group.id === selectedGroupId),
    [userGroups, selectedGroupId]
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                ← Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">
                Exams
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/notifications" className="text-sm underline text-primary">
                Notifications
              </Link>
              <Link href="/profile">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  {profile?.name ||
                    user.displayName ||
                    user.email?.split("@")[0] ||
                    "User"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 flex-1 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">
            Exam Planner
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Schedule exams per class, track topics, and get daily reminders until the exam date.
          </p>
        </div>

        {loadingGroups ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : userGroups.length === 0 ? (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You need to join a class/group before creating exam reminders.
            </p>
            <Link href="/groups">
              <Button>Browse Groups</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Select Class / Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {userGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.class} {group.division})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Add an Exam
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={formState.subject}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          subject: e.target.value as DailySubject,
                        }))
                      }
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      {DAILY_SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Topics / Chapters
                    </label>
                    <textarea
                      value={formState.topics}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, topics: e.target.value }))
                      }
                      placeholder="Chapter 5: Light, Chapter 6: Magnetism"
                      className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Exam Date
                    </label>
                    <Input
                      type="date"
                      value={formState.examDate}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, examDate: e.target.value }))
                      }
                      required
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Saving..." : "Schedule Exam"}
                  </Button>
                </form>
              </section>

              <section className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Upcoming Exams
                      </h3>
                      {selectedGroup && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedGroup.name} • {selectedGroup.class} {selectedGroup.division}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Daily reminders enabled
                    </span>
                  </div>

                  {exams.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      No exams scheduled yet. Add your first exam for this class.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {exams.map((exam) => {
                        const examDate = exam.examDate.toDate();
                        const daysUntil = Math.max(
                          0,
                          differenceInCalendarDays(examDate, new Date())
                        );
                        const reminderMessage =
                          daysUntil === 0
                            ? "Exam today — stay calm and trust your prep."
                            : `Only ${daysUntil} day${daysUntil === 1 ? "" : "s"} left. Review your notes when you can.`;

                        return (
                          <div
                            key={exam.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {exam.subject}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {format(examDate, "EEE, MMM d")}
                                </p>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {daysUntil === 0
                                  ? "Happening today"
                                  : `${daysUntil} day${daysUntil === 1 ? "" : "s"} remaining`}
                              </div>
                            </div>
                            {exam.topics && (
                              <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                Topics: {exam.topics}
                              </p>
                            )}
                            <div className="mt-3 text-xs text-primary font-semibold">
                              Reminder: {reminderMessage}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


