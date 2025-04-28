"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/config"; // adjust if needed
import { onAuthStateChanged, onIdTokenChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intendedRoute, setIntendedRoute] = useState(null);

  const router = useRouter(); // ✅ useRouter instead of useNavigate

  useEffect(() => {
    const setUserAndRole = async (user) => {
      try {
        setCurrentUser(user);

        if (user) {
          const idToken = await user.getIdToken();
          setToken(idToken);

          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserData(userData);
            setRole(userData.role);
          } else {
            console.warn("No user document found.");
            setUserData({ role: "guest" });
            setRole("guest");
          }

          if (intendedRoute) {
            router.push(intendedRoute);
            setIntendedRoute(null);
          }
        } else {
          setCurrentUser(null);
          setUserData(null);
          setRole(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Error setting user:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setUserAndRole(user);
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        try {
          const refreshedToken = await user.getIdToken(true);
          setToken(refreshedToken);
        } catch (err) {
          console.error("Token refresh error", err);
        }
      }
    });

    const handleLogoutSync = (event) => {
      if (event.key === "logout") {
        signOut(auth)
          .then(() => {
            setCurrentUser(null);
            setUserData(null);
            setRole(null);
            setToken(null);
            router.push("/user-login");
          })
          .catch((err) => {
            console.error("Cross-tab logout error:", err);
          });
      }
    };

    window.addEventListener("storage", handleLogoutSync);

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      window.removeEventListener("storage", handleLogoutSync);
    };
  }, [intendedRoute, router]);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.setItem("logout", Date.now()); // for cross-tab logout sync

      setCurrentUser(null);
      setUserData(null);
      setRole(null);
      setToken(null);

      if (role === "admin") {
        router.push("/admin-login");
      } else {
        router.push("/user-login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const hasRole = (requiredRole) => role === requiredRole;

  const value = {
    currentUser,
    userData,
    role,
    token,
    loading,
    hasRole,
    setIntendedRoute: (path) => {
      if (!intendedRoute) setIntendedRoute(path);
    },
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
