import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type TransactionState = 'idle' | 'preparing' | 'executing' | 'committing' | 'committed' | 'rolling_back' | 'failed';

interface TransactionIndicatorProps {
  state: TransactionState;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  showProgress?: boolean;
}

const stateConfig: Record<TransactionState, { 
  label: string; 
  icon: typeof Loader2; 
  color: string;
  progress: number;
}> = {
  idle: { label: 'Siap', icon: CheckCircle, color: 'text-muted-foreground', progress: 0 },
  preparing: { label: 'Menyiapkan...', icon: Loader2, color: 'text-blue-500', progress: 20 },
  executing: { label: 'Memproses...', icon: Loader2, color: 'text-primary', progress: 50 },
  committing: { label: 'Menyimpan...', icon: Loader2, color: 'text-amber-500', progress: 80 },
  committed: { label: 'Berhasil!', icon: CheckCircle, color: 'text-green-500', progress: 100 },
  rolling_back: { label: 'Membatalkan...', icon: RefreshCw, color: 'text-orange-500', progress: 30 },
  failed: { label: 'Gagal', icon: AlertCircle, color: 'text-destructive', progress: 0 },
};

export const TransactionIndicator = ({ 
  state, 
  retryCount = 0, 
  maxRetries = 3,
  className,
  showProgress = true,
}: TransactionIndicatorProps) => {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isAnimating = ['preparing', 'executing', 'committing', 'rolling_back'].includes(state);

  if (state === 'idle') return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-center gap-2">
        <Icon className={cn(
          'w-4 h-4',
          config.color,
          isAnimating && 'animate-spin'
        )} />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
          {retryCount > 0 && state === 'executing' && (
            <span className="ml-1 text-muted-foreground">
              (Percobaan {retryCount + 1}/{maxRetries + 1})
            </span>
          )}
        </span>
      </div>
      
      {showProgress && isAnimating && (
        <Progress value={config.progress} className="h-1.5" />
      )}
    </div>
  );
};

export default TransactionIndicator;
