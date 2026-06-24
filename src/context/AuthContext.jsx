import React, { createContext, useContext } from "react";

const AuthContext = createContext({
  user: {
    id: "admin-demo",
    institutionId: "upe-presidente-franco",
    institution_id: "upe-presidente-franco",
    role: "admin",
    name: "Admin Aeternum"
  }
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  return <AuthContext.Provider value={{
    user: {
      id: "admin-demo",
      institutionId: "upe-presidente-franco",
      institution_id: "upe-presidente-franco",
      role: "admin",
      name: "Admin Aeternum"
    }
  }}>{children}</AuthContext.Provider>;
}
