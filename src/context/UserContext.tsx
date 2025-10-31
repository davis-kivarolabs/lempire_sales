// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  phone?: string;
  status: string;
  role?: "admin" | "sales" | "marketing";
}

interface UserContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load user from localStorage when app starts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}


// // src/context/UserContext.tsx
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { auth, db } from "../firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";

// interface UserProfile {
//   user_id: string;
//   username: string;
//   email: string;
//   phone?: string;
//   status: string;
//   role?: "admin" | "sales" | "marketing";
// }

// const UserContext = createContext<UserProfile | null>(null);

// export function UserProvider({ children }: { children: React.ReactNode }) {
//   const [profile, setProfile] = useState<UserProfile | null>(null);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         const ref = doc(db, "users", user.uid);
//         const snap = await getDoc(ref);
//         if (snap.exists()) setProfile(snap.data() as UserProfile);
//       } else {
//         setProfile(null);
//       }
//     });

//     return () => unsub();
//   }, []);

//   return <UserContext.Provider value={profile}>{children}</UserContext.Provider>;
// }

// export function useUser() {
//   return useContext(UserContext);
// }
