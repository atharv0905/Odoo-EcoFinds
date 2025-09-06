import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { createUserFromFirebase, getUserByFirebaseId } from "../services/api";
import { User } from "../types/api";

interface ApiUserContextType {
  firebaseUserId: string | null; // Firebase UID
  apiUser: User | null; // User object from MongoDB
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const ApiUserContext = createContext<ApiUserContextType | undefined>(undefined);

export const useApiUser = () => {
  const ctx = useContext(ApiUserContext);
  if (!ctx) throw new Error("useApiUser must be used within ApiUserProvider");
  return ctx;
};

export const ApiUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [firebaseUserId, setFirebaseUserId] = useState<string | null>(null);
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadOrCreateUser = async () => {
    if (!user) {
      setFirebaseUserId(null);
      setApiUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const firebaseId = user.uid;
      console.log(
        `[ApiUserContext] Loading user for Firebase ID: ${firebaseId}`
      );
      console.log(`[ApiUserContext] Email: ${user.email}`);

      // Try to get user by Firebase ID first
      try {
        const res = await getUserByFirebaseId(firebaseId);
        console.log(`[ApiUserContext] Found existing user: ${res.user.name}`);
        setFirebaseUserId(firebaseId);
        setApiUser(res.user);
      } catch (userError) {
        // User doesn't exist in MongoDB, create them
        console.log(
          `[ApiUserContext] User not found in MongoDB, creating new user`
        );
        await createNewUser();
      }
    } catch (e) {
      console.error("Failed to load/create API user", e);
    } finally {
      setLoading(false);
    }
  };

  const createNewUser = async () => {
    if (!user?.email || !user?.uid) return;

    try {
      const name =
        user.displayName || user.email.split("@")[0] || "EcoFinds User";
      console.log(
        `[ApiUserContext] Creating new user: ${name} (${user.email}) with Firebase ID: ${user.uid}`
      );

      const res = await createUserFromFirebase({
        firebaseId: user.uid,
        email: user.email,
        name,
      });

      console.log(`[ApiUserContext] User created successfully in MongoDB`);
      setFirebaseUserId(user.uid);
      setApiUser(res.user);
    } catch (createError: any) {
      if (createError.message?.includes("already exists")) {
        // User already exists, try to get them
        console.log(
          `[ApiUserContext] User already exists, fetching existing user`
        );
        try {
          const existingUserRes = await getUserByFirebaseId(user.uid);
          console.log(
            `[ApiUserContext] Found existing user: ${existingUserRes.user.name}`
          );
          setFirebaseUserId(user.uid);
          setApiUser(existingUserRes.user);
        } catch (findError) {
          console.error("Failed to find existing user:", findError);
          throw createError;
        }
      } else {
        throw createError;
      }
    }
  };

  useEffect(() => {
    loadOrCreateUser();
  }, [user?.uid]); // Use Firebase UID for tracking

  const refreshUser = async () => {
    if (!firebaseUserId) return;
    try {
      const res = await getUserByFirebaseId(firebaseUserId);
      setApiUser(res.user);
    } catch (e) {
      console.error("Failed to refresh API user", e);
    }
  };

  return (
    <ApiUserContext.Provider
      value={{ firebaseUserId, apiUser, loading, refreshUser }}
    >
      {children}
    </ApiUserContext.Provider>
  );
};
