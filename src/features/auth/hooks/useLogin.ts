import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  });
}
