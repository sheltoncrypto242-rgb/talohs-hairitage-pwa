import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { type Session, type User } from "@supabase/supabase-js";
import { registerPush, unregisterPush } from "@/utils/pushNotifications";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pushRegisteredRef = useRef(false);
  const initialCheckDoneRef = useRef(false);

  // authContext.tsx (partial - update the useEffect)
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);

        setLoading(false);

        // Register push after session is loaded
        if (data.session?.user) {
          // Small delay to ensure service worker is ready
          setTimeout(() => {
            registerPush(data.session!.user.id).catch(console.error);
          }, 2000);
        }

        initialCheckDoneRef.current = true;
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        // Wait a bit for service worker to be ready
        setTimeout(() => {
          registerPush(session.user!.id).catch(console.error);
        }, 2000);
      } else if (event === "SIGNED_OUT") {
        // Handle sign out if needed
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Unregister push before signing out
      if (user) {
        await unregisterPush(user.id);
      }

      // Clear local storage
      localStorage.clear();

      // Reset ref
      pushRegisteredRef.current = false;

      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
