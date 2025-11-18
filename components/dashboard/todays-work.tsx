"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  DAILY_SUBJECTS,
  addDailyWorkEntries,
  type DailySubject,
  type DailyWorkEntry,
  updateDailyWorkEntry,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";

type FormRow = {
  id: number;
  subject: DailySubject;
  topics: string;
};

interface TodaysWorkPanelProps {
  groupId: string;
  currentUserId: string;
  entries: DailyWorkEntry[];
  isLoading: boolean;
}

const initialRow = (): FormRow => ({
  id: Date.now(),
  subject: DAILY_SUBJECTS[0],
  topics: "",
});

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export default function TodaysWorkPanel({ groupId, currentUserId, entries, isLoading }: TodaysWorkPanelProps) {
  const [rows, setRows] = useState<FormRow[]>([initialRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    if (submitting) return;
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
        groupId,
        trimmedRows.map((row) => ({
          subject: row.subject,
          topics: row.topics,
          postedBy: currentUserId,
        }))
      );
      resetForm();
    } catch (error) {
      console.error("Failed to save daily work", error);
      setFormError("Could not save entries. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Add Today&apos;s Work</h4>
          <span className="text-sm text-gray-500 dark:text-gray-400">Group synced automatically</span>
        </div>
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/30 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={`subject-${row.id}`}>
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
                    className="text-sm text-red-600 hover:text-red-700"
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
                  className="min-h-[80px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={row.topics}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, topics: e.target.value } : r)))
                  }
                  placeholder="e.g. Study Chapter 4, complete worksheet"
                />
              </div>
            </div>
          ))}
        </div>
        {formError && <p className="text-sm text-red-500">{formError}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Today’s Work"}
          </Button>
          <button type="button" onClick={handleAddRow} className="text-sm text-primary hover:underline">
            + Add another subject
          </button>
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">History</h4>
          {isLoading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
        {entries.length === 0 && !isLoading ? (
          <p className="text-gray-600 dark:text-gray-400">No posts yet. Be the first to share Today&apos;s Work!</p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto pr-2 space-y-6">
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
    </div>
  );
}

