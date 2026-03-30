/**
 * useAuth — SRP: manages only authentication token and current user state.
 * DIP: depends on clearToken/setToken abstractions injected from api layer.
 */
import { useState } from "react";
import { clearToken } from "../api";

export function useAuth() {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Sets both token and user in one call (used after login).
  function setAuth(token, user) {
    setAuthToken(token);
    setCurrentUser(user);
  }

  // Clears auth state; caller is responsible for resetting other app state.
  function clearAuth() {
    clearToken();
    setAuthToken(null);
    setCurrentUser(null);
  }

  return { authToken, currentUser, setCurrentUser, setAuth, clearAuth };
}
