import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { getUserProfile, type UserProfile } from "@/lib/firebase/firestore";

export function useUserProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (err) {
        console.error("Error loading user profile:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  return { profile, loading };
}

