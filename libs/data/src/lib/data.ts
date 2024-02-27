export class EndApi {
  private readonly apiUrl;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  login(userName: string, password: string) {
    console.log(this.apiUrl);
    console.log(userName, password);
    return fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName,
        password,
      }),
    });
  }
}
