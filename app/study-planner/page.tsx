"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import {
  saveSummary,
  getUserSummaries,
  deleteSummary,
  DAILY_SUBJECTS,
  type DailySubject,
  type Summary,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Upload, X, BookOpen, History, Trash2, RefreshCw } from "lucide-react";
import { getAvailableClasses, getBooksBySubject, type NCERTChapter } from "@/lib/data/ncert-books";

export default function StudyPlannerPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [prompt, setPrompt] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<DailySubject | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryMeta, setSummaryMeta] = useState<{
    subject: string;
    chapter: string;
    ncertReferenced: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Summary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("");

  const availableClasses = useMemo(() => getAvailableClasses(), []);

  const mapDailySubjectToNCERTSubject = (subject: DailySubject) => {
    switch (subject) {
      case "Maths":
        return "Math" as const;
      case "S.S":
        return "Social Studies" as const;
      case "Physics":
      case "Chemistry":
      case "Biology":
        return "Science" as const;
      default:
        return null;
    }
  };

  const availableChapters: NCERTChapter[] = useMemo(() => {
    if (!selectedClass || !selectedSubject) return [];
    const ncertSubject = mapDailySubjectToNCERTSubject(selectedSubject as DailySubject);
    if (!ncertSubject) return [];
    const book = getBooksBySubject(selectedClass, ncertSubject);
    return book?.chapters ?? [];
  }, [selectedClass, selectedSubject]);

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
    // Auto-fill class from profile
    if (profile?.classGrade) {
      const classNum = profile.classGrade.replace("Class ", "").trim();
      setSelectedClass(classNum);
    }
  }, [profile]);

  // Reset chapter when class or subject changes
  useEffect(() => {
    setSelectedChapter("");
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    // Load history
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const summaries = await getUserSummaries(user.uid);
      setHistory(summaries);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError("Please enter a topic or chapter name");
      return;
    }

    if (!selectedClass) {
      setError("Please select your class");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSummary(null);
    setSummaryMeta(null);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("class", selectedClass);
      if (selectedSubject) {
        formData.append("subject", selectedSubject);
      }
      if (selectedChapter) {
        formData.append("chapter", selectedChapter);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/ai/summary", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
      setSummaryMeta({
        subject: data.subject,
        chapter: data.chapter,
        ncertReferenced: data.ncertReferenced,
      });

      // Save to history
      if (user) {
        try {
          await saveSummary({
            userId: user.uid,
            prompt,
            class: selectedClass,
            subject: data.subject,
            chapter: data.chapter,
            summary: data.summary,
            ncertReferenced: data.ncertReferenced,
          });
          loadHistory();
        } catch (saveError) {
          console.error("Error saving summary:", saveError);
          // Don't show error to user, summary was generated successfully
        }
      }
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewHistory = (summaryItem: Summary) => {
    setSummary(summaryItem.summary);
    setSummaryMeta({
      subject: summaryItem.subject,
      chapter: summaryItem.chapter,
      ncertReferenced: summaryItem.ncertReferenced,
    });
    setPrompt(summaryItem.prompt);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteHistory = async (summaryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this summary?")) {
      return;
    }
    try {
      if (!user) return;
      await deleteSummary(user.uid, summaryId);
      loadHistory();
      if (summary && history.find((s) => s.id === summaryId)?.summary === summary) {
        setSummary(null);
        setSummaryMeta(null);
      }
    } catch (err) {
      console.error("Error deleting summary:", err);
      alert("Failed to delete summary");
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
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                ← Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">Study Planner</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/notifications" className="text-sm underline text-primary">
                Notifications
              </Link>
              <Link href="/profile">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  {profile?.name || user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-2">
            AI-Powered Study Summary
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Get comprehensive study summaries with NCERT references, practice questions, and key points
          </p>
        </div>

        {/* History Button */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Hide" : "Show"} History ({history.length})
          </Button>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Summary History</h3>
            {loadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No summaries yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleViewHistory(item)}
                    className="p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.prompt}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.subject} • {item.chapter}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {item.createdAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => item.id && handleDeleteHistory(item.id, e)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                What do you want to learn?
              </label>
              <Input
                type="text"
                placeholder="e.g., English chapter - Kingdom of fools, Quadratic equations, Photosynthesis"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Describe the topic or chapter you want to study
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select class</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Detected from your profile if possible. Change this if you are demoing another class.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Subject (Optional)
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as DailySubject | "")}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Auto-detect</option>
                  {DAILY_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Same subject list as the Exams page. Leave empty to auto-detect from your prompt.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Chapter (Optional)
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                disabled={isGenerating || !selectedClass || !selectedSubject || !availableChapters.length}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {selectedClass && selectedSubject
                    ? availableChapters.length
                      ? "Let AI detect chapter automatically"
                      : "No NCERT chapters found for this combination"
                    : "Select class and subject first"}
                </option>
                {availableChapters.map((chapter) => (
                  <option key={chapter.number} value={chapter.name}>
                    Chapter {chapter.number}: {chapter.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pick the exact NCERT chapter if you know it, or leave this to let AI detect it from your topic.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Upload Lecture Notes (Optional)
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Choose Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isGenerating}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImage}
                      disabled={isGenerating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Upload a photo of your lecture notes for AI to explain
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isGenerating || !prompt.trim() || !selectedClass}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                "Generate Study Summary"
              )}
            </Button>
          </div>
        </form>

        {/* Summary Display */}
        {summary && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Study Summary
                </h3>
                {summaryMeta && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      <BookOpen className="h-4 w-4 inline mr-1" />
                      {summaryMeta.subject} • {summaryMeta.chapter}
                    </span>
                    {summaryMeta.ncertReferenced && (
                      <span className="text-green-600 dark:text-green-400">✓ NCERT Referenced</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {summary.split("\n").map((line, index) => {
                // Handle headers
                if (line.startsWith("### ")) {
                  return (
                    <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                      {line.replace("### ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={index} className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
                      {line.replace("## ", "")}
                    </h2>
                  );
                }
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={index} className="text-2xl font-bold mt-10 mb-5 text-gray-900 dark:text-white">
                      {line.replace("# ", "")}
                    </h1>
                  );
                }
                // Handle bold text
                const boldRegex = /\*\*(.+?)\*\*/g;
                if (boldRegex.test(line)) {
                  const parts: (string | JSX.Element)[] = [];
                  let lastIndex = 0;
                  let match;
                  boldRegex.lastIndex = 0;
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(
                      <strong key={`bold-${match.index}`} className="font-semibold">
                        {match[1]}
                      </strong>
                    );
                    lastIndex = match.index + match[0].length;
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }
                  return (
                    <p key={index} className="mb-3">
                      {parts}
                    </p>
                  );
                }
                // Handle bullet points
                if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                  return (
                    <li key={index} className="ml-6 mb-1 list-disc">
                      {line.replace(/^[-•]\s/, "")}
                    </li>
                  );
                }
                // Regular paragraph
                if (line.trim()) {
                  return (
                    <p key={index} className="mb-3">
                      {line}
                    </p>
                  );
                }
                // Empty line
                return <br key={index} />;
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

