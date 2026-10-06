export interface ILoginResponse {
  accessToken: string;
  user: { id: string; email: string; fullName: string };
}
