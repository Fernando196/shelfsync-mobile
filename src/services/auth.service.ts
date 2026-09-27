import { request } from '../api/http';
import { LoginResponse } from '../interfaces/login.interface';

export function login(email: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
