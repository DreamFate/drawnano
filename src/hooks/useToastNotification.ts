import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * 统一管理 error 和 warning , info的 toast 通知
 */
export function useToastNotification() {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    if (info) {
      toast.info(info);
      const timer = setTimeout(() => setInfo(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [info]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      const timer = setTimeout(() => setSuccess(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);


  const showError = useCallback((message: string) => {
    setError(message);
  }, []);

  const showWarning = useCallback((message: string) => {
    setWarning(message);
  }, []);

  const showInfo = useCallback((message: string) => {
    setInfo(message);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
  }, []);

  return {
    showError,
    showWarning,
    showInfo,
    showSuccess,
  };
}
