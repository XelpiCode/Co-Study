"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  differenceInCalendarDays,
  format,
  isSameMonth,
  isSameWeek,
} from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getUpcomingExams,
  getUserGroups,
  type Exam,
  type Group,
} from "@/lib/firebase/firestore";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

type ReminderCategory = "month" | "week" | "tomorrow";

interface ExamReminder {
  exam: Exam;
  group?: Group;
  message: string;
  category: ReminderCategory;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [reminders, setReminders] = useState<ExamReminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

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
    const loadReminders = async () => {
      if (!user) return;
      try {
        setLoadingReminders(true);
        const userGroups = await getUserGroups(user.uid);
        setGroups(userGroups);
        const exams = await getUpcomingExams(
          userGroups.map((group) => group.id!).filter(Boolean),
          45
        );
        const now = new Date();
        const remindersWithMeta = exams
          .map((exam) => {
          const group = userGroups.find((g) => g.id === exam.groupId);
            const examDate = exam.examDate.toDate();
            const daysUntil = differenceInCalendarDays(examDate, now);
            const isTomorrow = daysUntil === 1;
            const thisWeek =
              daysUntil >= 0 &&
              daysUntil <= 7 &&
              isSameWeek(examDate, now, { weekStartsOn: 1 });
            const thisMonth =
              daysUntil >= 0 && isSameMonth(examDate, now) && !thisWeek && !isTomorrow;

            if (!(isTomorrow || thisWeek || thisMonth)) {
              return null;
            }

            let message = "";
            let category: ReminderCategory = "month";
            if (isTomorrow) {
              message = `${exam.subject} exam tomorrow, study well!`;
              category = "tomorrow";
            } else if (thisWeek) {
              message = `${exam.subject} exam this week on ${format(
                examDate,
                "EEEE, MMM d"
              )}. Keep revising!`;
              category = "week";
            } else {
              message = `${exam.subject} exam this month on ${format(
                examDate,
                "EEEE do MMMM"
              )}. Plan your study schedule.`;
              category = "month";
            }

            return {
              exam,
              group,
              message,
              category,
            };
          })
          .filter((reminder): reminder is NonNullable<typeof reminder> => reminder !== null) as ExamReminder[];
        setReminders(remindersWithMeta);
      } catch (error) {
        console.error("Error loading reminders:", error);
      } finally {
        setLoadingReminders(false);
      }
    };
    loadReminders();
  }, [user]);

  const groupedReminders = useMemo(() => {
    const month: ExamReminder[] = [];
    const week: ExamReminder[] = [];
    const tomorrow: ExamReminder[] = [];

    reminders.forEach((reminder) => {
      if (reminder.category === "tomorrow") {
        tomorrow.push(reminder);
      } else if (reminder.category === "week") {
        week.push(reminder);
      } else {
        month.push(reminder);
      }
    });

    return { month, week, tomorrow };
  }, [reminders]);

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
                Notifications
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/exams" className="text-sm underline text-primary">
                Exams
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

      <main className="container mx-auto px-4 py-8 flex-1 max-w-5xl w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">
              Daily Prep Reminders
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay on top of upcoming exams across your classes. We surface reminders each day so nothing sneaks up on you.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={loadingReminders}
          >
            {loadingReminders ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {groups.length === 0 ? (
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Join a group to start receiving exam reminders.
            </p>
            <Link href="/groups">
              <Button>Go to Groups</Button>
            </Link>
          </div>
        ) : loadingReminders ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10">
            No upcoming exams that need attention. Schedule exams from the Exams page to start receiving reminders.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedReminders.month.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Exams This Month
                </h3>
                <div className="space-y-4">
                  {groupedReminders.month.map((reminder) => (
                    <NotificationCard key={reminder.exam.id} reminder={reminder} />
                  ))}
                </div>
              </section>
            )}

            {groupedReminders.week.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Exams This Week
                </h3>
                <div className="space-y-4">
                  {groupedReminders.week.map((reminder) => (
                    <NotificationCard key={reminder.exam.id} reminder={reminder} />
                  ))}
                </div>
              </section>
            )}

            {groupedReminders.tomorrow.length > 0 && (
              <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Exams Tomorrow
                </h3>
                <div className="space-y-4">
                  {groupedReminders.tomorrow.map((reminder) => (
                    <NotificationCard key={reminder.exam.id} reminder={reminder} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NotificationCard({ reminder }: { reminder: ExamReminder }) {
  const { exam, group, message, category } = reminder;
  const examDate = exam.examDate.toDate();
  const daysUntil = differenceInCalendarDays(examDate, new Date());

  const badgeClass =
    category === "tomorrow"
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
      : category === "week"
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200";

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {exam.subject}
          </p>
          {group && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {group.name} • {group.class} {group.division}
            </p>
          )}
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
          {category === "tomorrow"
            ? "Tomorrow"
            : category === "week"
            ? `${daysUntil} day${daysUntil === 1 ? "" : "s"}`
            : format(examDate, "MMM d")}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      {exam.topics && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Focus Topics: {exam.topics}
        </p>
      )}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Scheduled for {format(examDate, "EEE, MMM d")}
      </div>
    </div>
  );
}


