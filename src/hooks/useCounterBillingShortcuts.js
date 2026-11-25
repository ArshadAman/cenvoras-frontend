import { useEffect } from 'react';
import { handleCounterBillingKeyDown } from '../utils/counterBillingShortcuts';

export { handleCounterBillingKeyDown };

export default function useCounterBillingShortcuts({ isOpen, onSaveToast }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const listener = (e) => handleCounterBillingKeyDown(e, { onSaveToast });
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [isOpen, onSaveToast]);
}
