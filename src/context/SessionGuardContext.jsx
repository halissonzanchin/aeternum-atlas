import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionGuardService } from "../services/session/sessionGuardService";

const SessionGuardContext = createContext({
  isDisplaced: false,
  isExpired: false,
  isUnavailable: false,
  isAuthorized: false,
  displacementDetails: null,
  pendingTransfer: null,
  confirmPendingTransfer: async () => {},
  cancelPendingTransfer: () => {},
  retryValidation: async () => {},
  dismiss: () => {}
});

export function useSessionGuard() {
  return useContext(SessionGuardContext);
}

export function SessionGuardProvider({ children, onLogout }) {
  const [guardState, setGuardState] = useState(() => sessionGuardService.getState());

  useEffect(() => {
    const unsubscribe = sessionGuardService.subscribe((nextState) => {
      setGuardState({ ...nextState });
    });
    return unsubscribe;
  }, []);

  const dismiss = () => {
    sessionGuardService.reset();
    if (typeof onLogout === "function") {
      onLogout();
    }
  };

  const retryValidation = async () => {
    return sessionGuardService.retryValidation();
  };

  const confirmPendingTransfer = async () => {
    return sessionGuardService.confirmPendingTransfer();
  };

  const cancelPendingTransfer = () => {
    sessionGuardService.cancelPendingTransfer();
    dismiss();
  };

  const value = {
    ...guardState,
    confirmPendingTransfer,
    cancelPendingTransfer,
    retryValidation,
    dismiss
  };

  return (
    <SessionGuardContext.Provider value={value}>
      {children}
    </SessionGuardContext.Provider>
  );
}
