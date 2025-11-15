"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCurrentUser } from "@/lib/firebase/auth";
import {
  getAllGroups,
  createGroup,
  joinGroup,
  getUserGroups,
  checkGroupExists,
  type Group,
} from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import Link from "next/link";

export default function GroupsPage() {
  const router = useRouter();
  const { user, setUser, setLoading } = useAuthStore();
  const { profile } = useUserProfile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [newGroupClass, setNewGroupClass] = useState("");
  const [newGroupDivision, setNewGroupDivision] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
      } else {
        setUser(currentUser);
        loadGroups();
      }
      setLoading(false);
    };
    checkAuth();
  }, [router, setUser, setLoading]);

  const loadGroups = async () => {
    if (!user) return;
    try {
      setLoadingGroups(true);
      const [allGroups, joinedGroups] = await Promise.all([
        getAllGroups(),
        getUserGroups(user.uid),
      ]);
      setGroups(allGroups);
      setUserGroups(joinedGroups);
    } catch (err: any) {
      console.error("Error loading groups:", err);
      setError(err.message || "Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError("");
    setCreating(true);

    try {
      // Validate inputs
      if (!newGroupClass || !newGroupDivision.trim()) {
        setError("Please select a class and enter a division");
        setCreating(false);
        return;
      }

      // Check if group already exists
      const exists = await checkGroupExists(newGroupClass, newGroupDivision.trim().toUpperCase());
      if (exists) {
        setError(`Group ${newGroupClass}${newGroupDivision.trim().toUpperCase()} already exists`);
        setCreating(false);
        return;
      }

      // Create group name
      const groupName = `${newGroupClass.replace("Class ", "")}${newGroupDivision.trim().toUpperCase()}`;

      // Create group
      const groupRef = await createGroup({
        name: groupName,
        class: newGroupClass,
        division: newGroupDivision.trim().toUpperCase(),
        createdBy: user.uid,
        members: [user.uid],
        leaders: [user.uid],
      });

      // Add group to user's groups
      await joinGroup(groupRef.id, user.uid);

      // Reset form and reload
      setNewGroupClass("");
      setNewGroupDivision("");
      setShowCreateModal(false);
      await loadGroups();
    } catch (err: any) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;

    setError("");
    setJoining(groupId);

    try {
      await joinGroup(groupId, user.uid);
      await loadGroups();
    } catch (err: any) {
      console.error("Error joining group:", err);
      setError(err.message || "Failed to join group");
    } finally {
      setJoining(null);
    }
  };

  const isUserMember = (groupId: string) => {
    return userGroups.some((g) => g.id === groupId);
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
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-primary font-heading">Groups</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link href="/profile">
                <span className="text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">
                  {profile?.name || user.displayName || user.email?.split("@")[0] || "User"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold font-heading text-gray-900 dark:text-white">All Groups</h2>
            <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {loadingGroups ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No groups found. Create the first one!</p>
              <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const isMember = isUserMember(group.id!);
                return (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{group.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{group.class}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      {group.members.length} {group.members.length === 1 ? "member" : "members"}
                    </p>
                    {isMember ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/chat?groupId=${group.id}`)}
                      >
                        Open Chat
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleJoinGroup(group.id!)}
                        disabled={joining === group.id}
                      >
                        {joining === group.id ? "Joining..." : "Join Group"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-4 font-heading text-gray-900 dark:text-white">Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class
                  </label>
                  <select
                    id="class"
                    value={newGroupClass}
                    onChange={(e) => setNewGroupClass(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  >
                    <option value="">Select class</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="division"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Division
                  </label>
                  <Input
                    id="division"
                    type="text"
                    value={newGroupDivision}
                    onChange={(e) => setNewGroupDivision(e.target.value)}
                    placeholder="e.g., A, B, C"
                    maxLength={5}
                    required
                  />
                </div>

                {newGroupClass && newGroupDivision && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Group name will be:{" "}
                      <span className="font-semibold">
                        {newGroupClass.replace("Class ", "")}
                        {newGroupDivision.trim().toUpperCase()}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError("");
                    setNewGroupClass("");
                    setNewGroupDivision("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={creating}>
                  {creating ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

