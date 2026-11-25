import React, { createContext, useContext, useMemo } from "react";

const AuthContext = createContext({
  user: null,
  authenticated: false,
  authReady: false
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children, user = null, authReady = false }) {
  const value = useMemo(() => ({
    user,
    authenticated: Boolean(user?.id),
    authReady: Boolean(authReady)
  }), [user, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
