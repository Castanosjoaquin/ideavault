import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  createElement,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return createElement(AuthContext.Provider, { value: state }, children);
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
