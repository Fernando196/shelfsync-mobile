import { request } from '../api/http';
import { ILoginResponse } from '../interfaces/login.interface';

export function login(userName: string, password: string): Promise<ILoginResponse> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ userName, password }) });
}
