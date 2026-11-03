import { useState, useEffect, useRef, useCallback } from 'react';
import { getInventoryCsvJobStatus } from '../api/inventory';
import { toast } from 'react-toastify';

const STORAGE_KEY = 'cenvora_active_inventory_csv_task_id';

export function useInventoryCsvJob({ onComplete, pollInterval = 1500 } = {}) {
  const [taskId, setTaskId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [jobState, setJobState] = useState({
    status: taskId ? 'PENDING' : 'IDLE', // 'IDLE' | 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE'
    percent: 0,
    current: 0,
    total: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    errors: [],
    errorMessage: null,
    isProcessing: Boolean(taskId),
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const failureCountRef = useRef(0);

  const clearJob = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Unable to clear sessionStorage:', e);
    }
    setTaskId(null);
    setJobState({
      status: 'IDLE',
      percent: 0,
      current: 0,
      total: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      errorMessage: null,
      isProcessing: false,
    });
  }, []);

  const startJob = useCallback((newTaskId) => {
    if (!newTaskId) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, newTaskId);
    } catch (e) {
      console.warn('Unable to persist to sessionStorage:', e);
    }
    failureCountRef.current = 0;
    setTaskId(newTaskId);
    setJobState({
      status: 'PENDING',
      percent: 5,
      current: 0,
      total: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
      errorMessage: null,
      isProcessing: true,
    });
  }, []);

  useEffect(() => {
    if (!taskId) return;

    let isMounted = true;
    let timerId = null;

    const poll = async () => {
      try {
        const data = await getInventoryCsvJobStatus(taskId);
        if (!isMounted) return;

        failureCountRef.current = 0;
        const state = data?.state;

        if (state === 'PROGRESS') {
          const percent = Math.min(99, Math.max(5, Number(data?.percent || 0)));
          setJobState({
            status: 'PROGRESS',
            percent,
            current: Number(data?.current || 0),
            total: Number(data?.total || 0),
            createdCount: Number(data?.created_count || 0),
            updatedCount: Number(data?.updated_count || 0),
            skippedCount: Number(data?.skipped_count || 0),
            failedCount: Number(data?.failed_count || 0),
            errors: data?.errors || [],
            errorMessage: null,
            isProcessing: true,
          });
          timerId = setTimeout(poll, pollInterval);
        } else if (state === 'SUCCESS') {
          const finalTotal = Number(data?.total || data?.result?.total_rows || 0);
          const finalCreated = Number(data?.created_count || 0);
          const finalUpdated = Number(data?.updated_count || 0);
          const finalSkipped = Number(data?.skipped_count || 0);
          const finalFailed = Number(data?.failed_count || 0);
          const finalErrors = data?.errors || [];

          setJobState({
            status: 'SUCCESS',
            percent: 100,
            current: finalTotal || (finalCreated + finalUpdated + finalSkipped + finalFailed),
            total: finalTotal || (finalCreated + finalUpdated + finalSkipped + finalFailed),
            createdCount: finalCreated,
            updatedCount: finalUpdated,
            skippedCount: finalSkipped,
            failedCount: finalFailed,
            errors: finalErrors,
            errorMessage: null,
            isProcessing: false,
          });

          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {}

          // Toast summary
          const summaryParts = [];
          if (finalCreated > 0) summaryParts.push(`${finalCreated} created`);
          if (finalUpdated > 0) summaryParts.push(`${finalUpdated} updated`);
          if (finalSkipped > 0) summaryParts.push(`${finalSkipped} unchanged`);
          const summaryText = summaryParts.length > 0 ? summaryParts.join(', ') : 'Processed';

          if (finalFailed > 0) {
            toast.warn(`CSV Import finished with ${finalFailed} failed row(s). (${summaryText})`, { autoClose: 6000 });
          } else {
            toast.success(`Inventory CSV Import Complete: ${summaryText}!`, { autoClose: 5000 });
          }

          if (onCompleteRef.current) {
            onCompleteRef.current({
              createdCount: finalCreated,
              updatedCount: finalUpdated,
              skippedCount: finalSkipped,
              failedCount: finalFailed,
              total: finalTotal,
              errors: finalErrors,
            });
          }
        } else if (state === 'FAILURE') {
          const errorMsg = data?.error || 'Task failed during processing.';
          setJobState(prev => ({
            ...prev,
            status: 'FAILURE',
            percent: 100,
            errorMessage: errorMsg,
            isProcessing: false,
          }));
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {}
          toast.error(`CSV import failed: ${errorMsg}`);
        } else {
          // PENDING / STARTED state
          setJobState(prev => ({
            ...prev,
            status: 'PENDING',
            percent: Math.max(prev.percent, 5),
            isProcessing: true,
          }));
          timerId = setTimeout(poll, pollInterval);
        }
      } catch (err) {
        if (!isMounted) return;
        failureCountRef.current += 1;
        console.warn(`Polling attempt failed (${failureCountRef.current}/5):`, err);

        if (failureCountRef.current >= 5) {
          const msg = err?.response?.data?.error || err.message || 'Failed to communicate with server.';
          setJobState(prev => ({
            ...prev,
            status: 'FAILURE',
            isProcessing: false,
            errorMessage: msg,
          }));
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {}
          toast.error(`CSV import polling stopped: ${msg}`);
        } else {
          timerId = setTimeout(poll, pollInterval * 1.5);
        }
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [taskId, pollInterval]);

  return {
    taskId,
    ...jobState,
    startJob,
    clearJob,
  };
}
