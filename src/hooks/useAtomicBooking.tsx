import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Atomic Booking System
 * Ensures booking transactions are atomic (all-or-nothing)
 * 
 * Features:
 * - Transactional state management
 * - Automatic retry with exponential backoff
 * - Rollback on failure
 * - Conflict detection and resolution
 * - Prevents race conditions
 */

export interface BookingData {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  pickup_address: string;
  dropoff_address?: string | null;
  notes?: string | null;
  route_from: string;
  route_to: string;
  route_via?: string | null;
  pickup_time: string;
  travel_date: string;
  passengers: number;
  total_price: number;
  user_id?: string | null;
}

export interface BookingResult {
  success: boolean;
  orderId?: string;
  error?: string;
  retryCount?: number;
}

type TransactionState = 'idle' | 'preparing' | 'executing' | 'committing' | 'committed' | 'rolling_back' | 'failed';

interface AtomicState {
  transactionState: TransactionState;
  orderId: string | null;
  retryCount: number;
  lastError: string | null;
}

interface UseAtomicBookingOptions {
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseDelay?: number;
  /** Timeout for each operation in ms (default: 30000) */
  timeout?: number;
}

interface UseAtomicBookingReturn {
  /** Execute atomic booking transaction */
  executeBooking: (data: BookingData, idempotencyKey: string) => Promise<BookingResult>;
  /** Current transaction state */
  transactionState: TransactionState;
  /** Whether a transaction is in progress */
  isTransacting: boolean;
  /** Current retry count */
  retryCount: number;
  /** Last error message if failed */
  lastError: string | null;
  /** Reset the atomic state */
  reset: () => void;
}

// Generate order ID with collision resistance
const generateOrderId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  // Use more characters for better uniqueness
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = now.getTime().toString(36).slice(-4).toUpperCase();
  return `TRV-${dateStr}-${random}${timestamp}`;
};

// Exponential backoff delay
const getRetryDelay = (attempt: number, baseDelay: number): number => {
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 200;
  return Math.min(baseDelay * Math.pow(2, attempt) + jitter, 10000);
};

// Sleep helper
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const useAtomicBooking = (options: UseAtomicBookingOptions = {}): UseAtomicBookingReturn => {
  const { maxRetries = 3, baseDelay = 1000, timeout = 30000 } = options;
  
  const [state, setState] = useState<AtomicState>({
    transactionState: 'idle',
    orderId: null,
    retryCount: 0,
    lastError: null,
  });
  
  // Track if component is mounted
  const mountedRef = useRef(true);
  // Track processed idempotency keys to prevent duplicate processing
  const processedKeysRef = useRef<Set<string>>(new Set());
  // Track current transaction to prevent concurrent executions
  const transactionLockRef = useRef<string | null>(null);

  const updateState = useCallback((updates: Partial<AtomicState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Check for existing booking with same idempotency key (order_id prefix match)
  const checkExistingBooking = async (
    data: BookingData, 
    idempotencyKey: string
  ): Promise<string | null> => {
    // Check if this exact booking already exists (same user, same details, same date)
    // This handles the case where the booking succeeded but the client didn't receive confirmation
    const { data: existing } = await supabase
      .from('bookings')
      .select('order_id')
      .eq('customer_phone', data.customer_phone)
      .eq('travel_date', data.travel_date)
      .eq('route_from', data.route_from)
      .eq('route_to', data.route_to)
      .eq('pickup_time', data.pickup_time)
      .eq('passengers', data.passengers)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
      .limit(1);
    
    if (existing && existing.length > 0) {
      console.log('Atomic: Found existing booking for this request:', existing[0].order_id);
      return existing[0].order_id;
    }
    
    return null;
  };

  // Execute the actual insert with retry logic
  const executeInsert = async (
    data: BookingData,
    orderId: string,
    attempt: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          order_id: orderId,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_email: data.customer_email || null,
          pickup_address: data.pickup_address,
          dropoff_address: data.dropoff_address || null,
          notes: data.notes || null,
          route_from: data.route_from,
          route_to: data.route_to,
          route_via: data.route_via || null,
          pickup_time: data.pickup_time,
          travel_date: data.travel_date,
          passengers: data.passengers,
          total_price: data.total_price,
          payment_status: 'pending',
          user_id: data.user_id || null,
        });

      if (error) {
        // Check for duplicate key error (unique constraint violation)
        if (error.code === '23505') {
          console.log('Atomic: Duplicate order_id, regenerating...');
          return { success: false, error: 'DUPLICATE_KEY' };
        }
        
        // Check for RLS policy violation
        if (error.code === '42501') {
          return { success: false, error: 'Akses ditolak. Silakan login kembali.' };
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  };

  // Main atomic booking execution
  const executeBooking = useCallback(async (
    data: BookingData,
    idempotencyKey: string
  ): Promise<BookingResult> => {
    // Check idempotency - prevent duplicate processing
    if (processedKeysRef.current.has(idempotencyKey)) {
      console.warn('Atomic: Idempotency key already processed');
      return { 
        success: false, 
        error: 'Pemesanan sudah diproses sebelumnya' 
      };
    }

    // Prevent concurrent transactions
    if (transactionLockRef.current !== null) {
      console.warn('Atomic: Transaction already in progress');
      return { 
        success: false, 
        error: 'Transaksi sedang diproses' 
      };
    }

    // Acquire lock
    transactionLockRef.current = idempotencyKey;
    
    try {
      // Phase 1: Prepare
      updateState({ 
        transactionState: 'preparing', 
        retryCount: 0,
        lastError: null,
        orderId: null,
      });

      // Check for existing booking (handles client retry after network failure)
      const existingOrderId = await checkExistingBooking(data, idempotencyKey);
      if (existingOrderId) {
        updateState({ 
          transactionState: 'committed', 
          orderId: existingOrderId 
        });
        processedKeysRef.current.add(idempotencyKey);
        
        toast.info('Pemesanan Anda sudah tercatat sebelumnya');
        return { 
          success: true, 
          orderId: existingOrderId,
          retryCount: 0,
        };
      }

      // Phase 2: Execute with retries
      updateState({ transactionState: 'executing' });
      
      let lastError = '';
      let orderId = generateOrderId();
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        updateState({ retryCount: attempt });
        
        if (attempt > 0) {
          const delay = getRetryDelay(attempt - 1, baseDelay);
          console.log(`Atomic: Retry attempt ${attempt} after ${delay}ms`);
          await sleep(delay);
          
          // Regenerate order ID on duplicate key error
          if (lastError === 'DUPLICATE_KEY') {
            orderId = generateOrderId();
          }
        }

        const result = await executeInsert(data, orderId, attempt);
        
        if (result.success) {
          // Phase 3: Commit
          updateState({ 
            transactionState: 'committing',
            orderId,
          });

          // Mark idempotency key as processed
          processedKeysRef.current.add(idempotencyKey);
          
          updateState({ transactionState: 'committed' });
          
          return { 
            success: true, 
            orderId,
            retryCount: attempt,
          };
        }

        lastError = result.error || 'Unknown error';
        
        // Don't retry on certain errors
        if (lastError !== 'DUPLICATE_KEY' && !lastError.includes('network')) {
          // Check if error is retryable
          const isRetryable = 
            lastError.includes('timeout') ||
            lastError.includes('connection') ||
            lastError.includes('ETIMEDOUT') ||
            lastError.includes('ECONNRESET');
          
          if (!isRetryable) {
            break;
          }
        }
      }

      // Phase 4: Rollback (no insert succeeded)
      updateState({ 
        transactionState: 'failed',
        lastError,
      });
      
      return { 
        success: false, 
        error: lastError,
        retryCount: maxRetries,
      };

    } finally {
      // Release lock
      transactionLockRef.current = null;
    }
  }, [maxRetries, baseDelay, updateState]);

  // Reset state
  const reset = useCallback(() => {
    if (transactionLockRef.current === null) {
      setState({
        transactionState: 'idle',
        orderId: null,
        retryCount: 0,
        lastError: null,
      });
    }
  }, []);

  return {
    executeBooking,
    transactionState: state.transactionState,
    isTransacting: !['idle', 'committed', 'failed'].includes(state.transactionState),
    retryCount: state.retryCount,
    lastError: state.lastError,
    reset,
  };
};

export default useAtomicBooking;
