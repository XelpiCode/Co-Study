"use client";

import { useMemo, useState } from "react";
import {
  DAILY_SUBJECTS,
  type DailySubject,
  type DailyWorkEntry,
  updateDailyWorkEntry,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";

interface TodaysWorkHistoryProps {
  groupId: string;
  currentUserId: string;
  entries: DailyWorkEntry[];
  isLoading: boolean;
}

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function TodaysWorkHistory({
  groupId,
  currentUserId,
  entries,
  isLoading,
}: TodaysWorkHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<DailySubject>(DAILY_SUBJECTS[0]);
  const [editingTopics, setEditingTopics] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const groupedEntries = useMemo(() => {
    const map = new Map<
      string,
      {
        label: string;
        dateValue: number;
        items: DailyWorkEntry[];
      }
    >();

    entries.forEach((entry) => {
      const dateObj =
        (entry.date && "toDate" in entry.date ? entry.date.toDate() : null) ||
        (entry.postedAt && "toDate" in entry.postedAt ? entry.postedAt.toDate() : null) ||
        new Date();
      const key = dateObj.toISOString().split("T")[0];
      if (!map.has(key)) {
        map.set(key, {
          label: formatDate(dateObj),
          dateValue: dateObj.getTime(),
          items: [],
        });
      }
      map.get(key)!.items.push(entry);
    });

    return Array.from(map.values()).sort((a, b) => b.dateValue - a.dateValue);
  }, [entries]);

  const startEditing = (entry: DailyWorkEntry) => {
    if (!entry.id) return;
    setEditingId(entry.id);
    setEditingSubject(entry.subject);
    setEditingTopics(entry.topics);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTopics("");
  };

  const saveEditing = async () => {
    if (!editingId) return;
    if (editingTopics.trim().length === 0) {
      setEditError("Details cannot be empty.");
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await updateDailyWorkEntry(groupId, editingId, {
        subject: editingSubject,
        topics: editingTopics.trim(),
      });
      cancelEditing();
    } catch (error) {
      console.error("Failed to update entry", error);
      setEditError("Could not update entry. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">History</h4>
        {isLoading && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
      {entries.length === 0 && !isLoading ? (
        <p className="text-gray-600 dark:text-gray-400">No posts yet. Be the first to share Today&apos;s Work!</p>
      ) : (
        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-6">
          {groupedEntries.map((group) => (
            <div key={group.dateValue} className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {group.label}
              </div>
              <div className="space-y-3">
                {group.items.map((entry) => {
                  const isAuthor = entry.postedBy === currentUserId;
                  const isEditing = editingId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900/40"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <select
                              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={editingSubject}
                              onChange={(e) => setEditingSubject(e.target.value as DailySubject)}
                            >
                              {DAILY_SUBJECTS.map((subject) => (
                                <option key={subject} value={subject}>
                                  {subject}
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            className="min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={editingTopics}
                            onChange={(e) => setEditingTopics(e.target.value)}
                          />
                          {editError && <p className="text-sm text-red-500">{editError}</p>}
                          <div className="flex flex-wrap gap-3">
                            <Button type="button" onClick={saveEditing} disabled={savingEdit}>
                              {savingEdit ? "Saving..." : "Save"}
                            </Button>
                            <button
                              type="button"
                              className="text-sm text-gray-600 dark:text-gray-300"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-lg font-semibold text-gray-900 dark:text-white">{entry.subject}</h5>
                            {isAuthor && (
                              <button
                                type="button"
                                className="text-sm text-primary hover:underline"
                                onClick={() => startEditing(entry)}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{entry.topics}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

