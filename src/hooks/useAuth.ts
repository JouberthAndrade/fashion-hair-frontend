import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login as loginRequest, logout as logoutRequest } from '@/api/auth';
import { getApiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, accessToken, setSession, clear, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginRequest(email, password),
    onSuccess: (data) => {
      setSession({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      toast.success(`Bem-vindo(a), ${data.user.name}!`);
      navigate(data.user.role === 'ADMIN' ? '/painel' : '/agenda', { replace: true });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Falha no login'));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await logoutRequest(refreshToken);
        } catch {
          // ignore — still clear local state
        }
      }
    },
    onSettled: () => {
      clear();
      navigate('/login', { replace: true });
    },
  });

  return {
    user,
    isAuthenticated: Boolean(user && accessToken),
    isAdmin: user?.role === 'ADMIN',
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
