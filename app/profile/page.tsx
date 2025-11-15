"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
      } else {
        setUser(currentUser);
        loadProfile();
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, setUser, setLoading]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoadingProfile(true);
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setNewName(userProfile.name || "");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !profile) return;

    setError("");
    
    if (!newName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    // Check if name changed
    if (newName.trim() === profile.name.trim()) {
      setEditing(false);
      return;
    }

    setSaving(true);

    try {
      // Update name
      await updateUserProfile(user.uid, {
        name: newName.trim(),
      });

      // Reload profile
      await loadProfile();
      setEditing(false);
    } catch (err: any) {
      console.error("Error updating name:", err);
      setError(err.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  if (!user || loadingProfile) {
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
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">Profile</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Your Profile</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
                {error}
              </div>
            )}

            {profile && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    {!editing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="space-y-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your full name"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveName}
                          disabled={saving}
                          size="sm"
                        >
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditing(false);
                            setNewName(profile.name || "");
                            setError("");
                          }}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{profile.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class
                  </label>
                  <p className="text-gray-900 dark:text-white">{profile.classGrade || "Not set"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

