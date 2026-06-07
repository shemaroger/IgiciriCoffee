import { useContext } from 'react';
import { ToastContext } from '../components/AppToastProvider';

export const useAppToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useAppToast must be inside AppToastProvider');
  return ctx;
};
