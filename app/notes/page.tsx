"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PDFViewer from "@/components/notes/pdf-viewer";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/firebase/auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useAuthStore } from "@/store/authStore";

interface LibraryBookSummary {
  id: string;
  class: string;
  subject: string;
  subjectGroup: string;
  subjectKey: string;
  language: string;
  languageKey: string;
  title: string;
  chapterCount: number;
  source: string;
}

interface LibraryOptionsResponse {
  source: string;
  classes: Array<{
    class: string;
    subjects: Array<{
      key: string;
      label: string;
      subjectGroup: string;
      books: LibraryBookSummary[];
    }>;
  }>;
}

interface ChapterRecord {
  id: string;
  number: number;
  title: string;
  pdfUrl: string;
  textPreview?: string | null;
  originalPdfUrl?: string;
  textUrl?: string | null;
}

interface ChaptersResponse {
  source: string;
  book: LibraryBookSummary;
  chapters: ChapterRecord[];
}

export default function NotesPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();

  const [options, setOptions] = useState<LibraryOptionsResponse | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null);

  const [chaptersPayload, setChaptersPayload] = useState<ChaptersResponse | null>(null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

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
    const controller = new AbortController();
    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const response = await fetch("/api/ncert/options", { signal: controller.signal });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load NCERT library");
        }
        const data: LibraryOptionsResponse = await response.json();
        setOptions(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setOptionsError(
            error instanceof Error ? error.message : "Unable to load NCERT library options",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setOptionsLoading(false);
        }
      }
    };

    loadOptions();
    return () => controller.abort();
  }, []);

  const classes = options?.classes ?? [];
  const selectedClassEntry = useMemo(
    () => classes.find((entry) => entry.class === selectedClass),
    [classes, selectedClass],
  );

  useEffect(() => {
    if (selectedClass || !classes.length) return;
    setSelectedClass(classes[0].class);
  }, [classes, selectedClass]);

  useEffect(() => {
    if (!selectedClassEntry) {
      setSelectedSubjectKey("");
      return;
    }
    if (!selectedClassEntry.subjects.length) {
      setSelectedSubjectKey("");
      return;
    }
    const hasSubject = selectedClassEntry.subjects.some(
      (subject) => subject.key === selectedSubjectKey,
    );
    if (!hasSubject) {
      setSelectedSubjectKey(selectedClassEntry.subjects[0].key);
    }
  }, [selectedClassEntry, selectedSubjectKey]);

  const selectedSubjectEntry = useMemo(
    () => selectedClassEntry?.subjects.find((subject) => subject.key === selectedSubjectKey),
    [selectedClassEntry, selectedSubjectKey],
  );

  useEffect(() => {
    if (!selectedSubjectEntry) {
      setSelectedBookId("");
      return;
    }
    if (!selectedSubjectEntry.books.length) {
      setSelectedBookId("");
      return;
    }
    const hasBook = selectedSubjectEntry.books.some((book) => book.id === selectedBookId);
    if (!hasBook) {
      setSelectedBookId(selectedSubjectEntry.books[0].id);
    }
  }, [selectedSubjectEntry, selectedBookId]);

  useEffect(() => {
    if (!selectedBookId) {
      setChaptersPayload(null);
      setSelectedChapterNumber(null);
      return;
    }
    const controller = new AbortController();
    const loadChapters = async () => {
      setChaptersLoading(true);
      setChaptersError(null);
      try {
        const response = await fetch(`/api/ncert/chapters?bookId=${selectedBookId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load chapters");
        }
        const data: ChaptersResponse = await response.json();
        setChaptersPayload(data);
        setSelectedChapterNumber(data.chapters[0]?.number ?? null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setChaptersError(error instanceof Error ? error.message : "Unable to load chapters");
        }
      } finally {
        if (!controller.signal.aborted) {
          setChaptersLoading(false);
        }
      }
    };

    loadChapters();
    return () => controller.abort();
  }, [selectedBookId]);

  const selectedChapter = useMemo(() => {
    if (!chaptersPayload?.chapters || selectedChapterNumber == null) return null;
    return (
      chaptersPayload.chapters.find((chapter) => chapter.number === selectedChapterNumber) || null
    );
  }, [chaptersPayload, selectedChapterNumber]);

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
              <h1 className="text-2xl font-bold text-primary font-heading">NCERT Notes</h1>
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

      <main className="container mx-auto px-4 py-8 flex-1 w-full max-w-7xl">
        {optionsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {optionsError}
          </div>
        )}
        {options?.source === "static" && !optionsError && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-100">
            Firebase admin credentials are missing. Showing bundled NCERT dataset.
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">
            NCERT Textbooks
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access NCERT textbooks across available classes, subjects, and languages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={optionsLoading}
              >
                {classes.map((classEntry) => (
                  <option key={classEntry.class} value={classEntry.class}>
                    Class {classEntry.class}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <div className="space-y-2">
                {(selectedClassEntry?.subjects ?? []).map((subject) => (
                  <button
                    key={subject.key}
                    onClick={() => setSelectedSubjectKey(subject.key)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedSubjectKey === subject.key
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {subject.label}
                  </button>
                ))}
                {!selectedClassEntry?.subjects?.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No subjects found.</p>
                )}
              </div>
            </div>

            {selectedSubjectEntry && selectedSubjectEntry.books.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Edition / Language
                </label>
                <div className="space-y-2">
                  {selectedSubjectEntry.books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedBookId === book.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span className="block font-semibold">{book.language}</span>
                      <span className="text-xs opacity-80">{book.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chaptersPayload && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Chapters ({chaptersPayload.chapters.length})
                </label>
                {chaptersLoading && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Loading chapters…</p>
                )}
                {chaptersError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">{chaptersError}</p>
                )}
                <div className="max-h-[500px] overflow-y-auto space-y-1">
                  {chaptersPayload.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapterNumber(chapter.number)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedChapterNumber === chapter.number
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase">
                        Ch {chapter.number}
                      </span>
                      <span className="text-xs">{chapter.title}</span>
                    </button>
                  ))}
                  {!chaptersPayload.chapters.length && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No chapters available.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {selectedChapter ? (
              <PDFViewer
                key={`${selectedBookId}-${selectedChapter.number}`}
                pdfUrl={selectedChapter.pdfUrl}
                chapterName={`Class ${selectedClass} • ${selectedSubjectEntry?.label ?? ""} • Chapter ${selectedChapter.number}: ${selectedChapter.title}`}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {optionsLoading
                    ? "Loading NCERT library…"
                    : selectedBookId
                      ? "Select a chapter to view"
                      : "Select a class and subject to begin"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
