import React, { createContext, useContext } from 'react';

export const GlobalContext = createContext();
export const GlobalTimerContext = createContext();
export const GlobalAudioContext = createContext();
export const GlobalFeedbackContext = createContext();
export const GlobalLocationContext = createContext();
export const GlobalNavigationContext = createContext();

// Define and export individual hooks
export const useGlobalContext = () => useContext(GlobalContext);
export const useGlobalTimerContext = () => useContext(GlobalTimerContext);
export const useGlobalAudioContext = () => useContext(GlobalAudioContext);
export const useGlobalFeedbackContext = () => useContext(GlobalFeedbackContext);
export const useGlobalLocationContext = () => useContext(GlobalLocationContext);
export const useGlobalNavigationContext = () => useContext(GlobalNavigationContext);

// Export all hooks as a single object for convenience
export const contextHooks = {
  useGlobalContext,
  useGlobalTimerContext,
  useGlobalAudioContext,
  useGlobalFeedbackContext,
  useGlobalLocationContext,
  useGlobalNavigationContext
};