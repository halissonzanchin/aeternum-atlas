import React, { createContext, useContext, useEffect, useState } from "react";
import { sessionGuardService } from "../services/session/sessionGuardService";

const SessionGuardContext = createContext({
  isDisplaced: false,
  isExpired: false,
  displacementDetails: null,
  pendingTransfer: null,
  transferStats: { transfersToday: 0, maxTransfers: 5, transfersRemaining: 5 },
  confirmPendingTransfer: async () => {},
  cancelPendingTransfer: () => {},
  reconnect: async () => {},
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
    sessionGuardService.revokeSession();
    if (typeof onLogout === "function") {
      onLogout();
    }
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
    dismiss
  };

  return (
    <SessionGuardContext.Provider value={value}>
      {children}
    </SessionGuardContext.Provider>
  );
}
