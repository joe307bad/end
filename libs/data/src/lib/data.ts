export class EndApi {
  private readonly apiUrl;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  login(username: string, password: string) {
    return fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
  }
}
