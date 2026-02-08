import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Idempotency Key Manager
 * Prevents duplicate form submissions by tracking unique request keys
 * 
 * Features:
 * - Generates unique idempotency keys based on form data hash
 * - Tracks processed requests to prevent duplicates
 * - Auto-expires keys after configurable TTL
 * - Persists across component re-renders using session storage
 */

interface IdempotencyState {
  key: string;
  isProcessing: boolean;
  isProcessed: boolean;
  processedAt?: number;
}

interface UseIdempotencyOptions {
  /** Time-to-live for processed keys in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Storage key prefix for session storage */
  storagePrefix?: string;
}

interface UseIdempotencyReturn {
  /** Current idempotency key */
  idempotencyKey: string;
  /** Generate a new idempotency key based on form data */
  generateKey: (data: Record<string, unknown>) => string;
  /** Check if a key has already been processed */
  isKeyProcessed: (key: string) => boolean;
  /** Mark the current operation as started (processing) */
  startProcessing: () => boolean;
  /** Mark the current operation as completed */
  completeProcessing: () => void;
  /** Mark the operation as failed (allows retry) */
  failProcessing: () => void;
  /** Reset the idempotency state for a new submission */
  reset: () => void;
  /** Check if currently processing */
  isProcessing: boolean;
  /** Lock status - true if operation is in progress or already completed */
  isLocked: boolean;
}

// Simple hash function for generating consistent keys
const hashData = (data: Record<string, unknown>): string => {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useIdempotency = (options: UseIdempotencyOptions = {}): UseIdempotencyReturn => {
  const { ttl = 5 * 60 * 1000, storagePrefix = 'booking_idempotency' } = options;
  
  const [state, setState] = useState<IdempotencyState>({
    key: '',
    isProcessing: false,
    isProcessed: false,
  });
  
  const sessionIdRef = useRef<string>(generateSessionId());
  const processedKeysRef = useRef<Map<string, number>>(new Map());

  // Load processed keys from session storage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`${storagePrefix}_processed`);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<[string, number]>;
        const now = Date.now();
        // Filter out expired keys
        const validKeys = parsed.filter(([, timestamp]) => now - timestamp < ttl);
        processedKeysRef.current = new Map(validKeys);
      }
    } catch (e) {
      console.warn('Failed to load idempotency keys from storage:', e);
    }
  }, [storagePrefix, ttl]);

  // Save processed keys to session storage
  const saveProcessedKeys = useCallback(() => {
    try {
      const entries = Array.from(processedKeysRef.current.entries());
      sessionStorage.setItem(`${storagePrefix}_processed`, JSON.stringify(entries));
    } catch (e) {
      console.warn('Failed to save idempotency keys:', e);
    }
  }, [storagePrefix]);

  // Generate idempotency key from form data
  const generateKey = useCallback((data: Record<string, unknown>): string => {
    const dataHash = hashData(data);
    const timestamp = Math.floor(Date.now() / 1000); // Second precision
    const key = `${storagePrefix}_${sessionIdRef.current}_${dataHash}_${timestamp}`;
    
    setState(prev => ({ ...prev, key, isProcessed: false }));
    return key;
  }, [storagePrefix]);

  // Check if a key has been processed
  const isKeyProcessed = useCallback((key: string): boolean => {
    const processedAt = processedKeysRef.current.get(key);
    if (!processedAt) return false;
    
    // Check if key has expired
    if (Date.now() - processedAt > ttl) {
      processedKeysRef.current.delete(key);
      return false;
    }
    
    return true;
  }, [ttl]);

  // Start processing - returns false if already processing or processed
  const startProcessing = useCallback((): boolean => {
    if (state.isProcessing) {
      console.warn('Idempotency: Already processing, ignoring duplicate request');
      return false;
    }
    
    if (state.key && isKeyProcessed(state.key)) {
      console.warn('Idempotency: Key already processed, ignoring duplicate request');
      return false;
    }
    
    setState(prev => ({ ...prev, isProcessing: true }));
    return true;
  }, [state.isProcessing, state.key, isKeyProcessed]);

  // Complete processing successfully
  const completeProcessing = useCallback(() => {
    if (state.key) {
      processedKeysRef.current.set(state.key, Date.now());
      saveProcessedKeys();
    }
    
    setState(prev => ({
      ...prev,
      isProcessing: false,
      isProcessed: true,
      processedAt: Date.now(),
    }));
  }, [state.key, saveProcessedKeys]);

  // Fail processing - allows retry
  const failProcessing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isProcessing: false,
      isProcessed: false,
    }));
  }, []);

  // Reset state for new submission
  const reset = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    setState({
      key: '',
      isProcessing: false,
      isProcessed: false,
    });
  }, []);

  return {
    idempotencyKey: state.key,
    generateKey,
    isKeyProcessed,
    startProcessing,
    completeProcessing,
    failProcessing,
    reset,
    isProcessing: state.isProcessing,
    isLocked: state.isProcessing || state.isProcessed,
  };
};

export default useIdempotency;
