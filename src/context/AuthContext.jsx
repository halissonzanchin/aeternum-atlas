import React, { createContext, useContext, useMemo } from "react";

const AuthContext = createContext({
  user: null,
  authenticated: false
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children, user = null }) {
  const value = useMemo(() => ({
    user,
    authenticated: Boolean(user?.id)
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
