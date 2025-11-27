import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 统一管理 error 和 warning 的 toast 通知
 */
export function useToastNotification() {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => setError(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (warning) {
      toast.warning(warning);
      const timer = setTimeout(() => setWarning(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    setWarning(message);
  }, []);

  return {
    showError,
    showWarning,
  };
}
