/**
 * Session Timer Hook
 * Tracks active study time with pause/resume support
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSessionTimerReturn {
  seconds: number;
  minutes: number;
  hours: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => number;
  reset: () => void;
}

export function useSessionTimer(): UseSessionTimerReturn {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-pause after 2 minutes of inactivity
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    if (isRunning && !isPaused) {
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(true);
      }, 2 * 60 * 1000); // 2 minutes
    }
  }, [isRunning, isPaused]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      resetActivityTimer();
    };

    if (isRunning && !isPaused) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);

      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
      };
    }
  }, [isRunning, isPaused, resetActivityTimer]);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    resetActivityTimer();
  }, [resetActivityTimer]);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    resetActivityTimer();
  }, [resetActivityTimer]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    const finalMinutes = Math.floor(elapsedSeconds / 60);
    return finalMinutes;
  }, [elapsedSeconds]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  }, []);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  return {
    seconds,
    minutes,
    hours,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
