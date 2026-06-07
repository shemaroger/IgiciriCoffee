import { useAuth, UserRole } from '../auth/AuthContext';
import { canAccessStack } from '../auth/rbac';
import { useAppToast } from './useAppToast';

export const useRoleGuard = () => {
  const { session } = useAuth();
  const { showToast } = useAppToast();
  const role: UserRole = session?.role ?? 'guest';

  const guard = (stack: string): boolean => {
    if (canAccessStack(role, stack)) return true;
    showToast(`Access restricted for ${role} accounts`, 'error');
    return false;
  };

  return { role, guard };
};
