"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import PDFViewer from "@/components/notes/pdf-viewer";
import {
  NCERT_BOOKS,
  getBooksByClass,
  getBooksBySubject,
  getAvailableClasses,
  getAvailableSubjects,
  type NCERTBook,
  type NCERTChapter,
} from "@/lib/data/ncert-books";

export default function NotesPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [selectedClass, setSelectedClass] = useState<string>("9");
  const [selectedSubject, setSelectedSubject] = useState<"Math" | "Science" | "Social Studies">("Math");
  const [selectedChapter, setSelectedChapter] = useState<NCERTChapter | null>(null);
  const [chapterMetadata, setChapterMetadata] = useState<Record<
    number,
    { derivedTitle: string; defaultName: string }
  >>({});
  const [isChapterMetadataLoading, setIsChapterMetadataLoading] = useState(false);
  const [chapterMetadataError, setChapterMetadataError] = useState<string | null>(null);

  const availableClasses = useMemo(() => getAvailableClasses(), []);
  const availableSubjects = useMemo(
    () => getAvailableSubjects(selectedClass),
    [selectedClass]
  );

  const selectedBook = useMemo(
    () => getBooksBySubject(selectedClass, selectedSubject),
    [selectedClass, selectedSubject]
  );

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
    // Reset selected chapter when class or subject changes
    setSelectedChapter(null);
    setChapterMetadata({});
    setChapterMetadataError(null);
    // Ensure selected subject is available for the new class
    if (selectedSubject && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0] || "Math");
    }
  }, [selectedClass, selectedSubject, availableSubjects]);

  // Auto-select first chapter when book changes
  useEffect(() => {
    if (selectedBook && selectedBook.chapters.length > 0 && !selectedChapter) {
      setSelectedChapter(selectedBook.chapters[0]);
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedBook) return;

    const fetchMetadata = async () => {
      setIsChapterMetadataLoading(true);
      setChapterMetadataError(null);
      try {
        const params = new URLSearchParams({ class: selectedClass, subject: selectedSubject });
        const response = await fetch(`/api/ncert/chapters?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch chapter metadata");
        }
        const data = await response.json();
        if (!isMounted) return;
        const metadataRecord: Record<number, { derivedTitle: string; defaultName: string }> = {};
        for (const chapter of data.chapters || []) {
          metadataRecord[chapter.number] = {
            derivedTitle: chapter.derivedTitle,
            defaultName: chapter.defaultName,
          };
        }
        setChapterMetadata(metadataRecord);
      } catch (error) {
        if (isMounted) {
          setChapterMetadataError(error instanceof Error ? error.message : "Unable to load chapter names");
        }
      } finally {
        if (isMounted) {
          setIsChapterMetadataLoading(false);
        }
      }
    };

    fetchMetadata();
    return () => {
      isMounted = false;
    };
  }, [selectedBook, selectedClass, selectedSubject]);

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">
            NCERT Textbooks
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access NCERT textbooks for Math, Science, and Social Studies (Classes 9-12)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Class and Subject Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Class Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableClasses.map((classNum) => (
                  <option key={classNum} value={classNum}>
                    Class {classNum}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <div className="space-y-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedSubject === subject
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter List */}
            {selectedBook && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Chapters ({selectedBook.chapters.length})
                </label>
                {isChapterMetadataLoading && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Syncing chapter titles…</p>
                )}
                {chapterMetadataError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">{chapterMetadataError}</p>
                )}
                <div className="max-h-[500px] overflow-y-auto space-y-1">
                  {selectedBook.chapters.map((chapter) => (
                    <button
                      key={chapter.number}
                      onClick={() => setSelectedChapter(chapter)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedChapter?.number === chapter.number
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase">
                        Ch {chapter.number}
                      </span>
                      <span className="text-xs">
                        {chapterMetadata[chapter.number]?.derivedTitle || chapter.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - PDF Viewer */}
          <div className="lg:col-span-3">
            {selectedChapter ? (
              <PDFViewer
                key={`${selectedClass}-${selectedSubject}-${selectedChapter.number}`}
                pdfUrl={selectedChapter.pdfUrl}
                chapterName={`Class ${selectedClass} - ${selectedSubject} - Chapter ${selectedChapter.number}: ${selectedChapter.name}`}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedBook
                    ? "Select a chapter to view"
                    : "Select a class and subject to get started"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

