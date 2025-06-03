import React, { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';

const INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useForegroundTimer = (callback, enabled = false) => {
  const timerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const lastExecutionTime = useRef(Date.now());

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Check if we need to execute immediately based on time elapsed
    const timeElapsed = Date.now() - lastExecutionTime.current;
    if (timeElapsed >= INTERVAL) {
      callback();
      lastExecutionTime.current = Date.now();
    }

    // Set up the interval
    timerRef.current = setInterval(() => {
      callback();
      lastExecutionTime.current = Date.now();
    }, INTERVAL);
  }, [callback]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopTimer();
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground
        startTimer();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to background
        stopTimer();
      }
      appState.current = nextAppState;
    });

    // Start timer initially if app is active
    if (appState.current === 'active') {
      startTimer();
    }

    // Cleanup
    return () => {
      subscription.remove();
      stopTimer();
    };
  }, [enabled, startTimer, stopTimer]);

  return { startTimer, stopTimer };
};