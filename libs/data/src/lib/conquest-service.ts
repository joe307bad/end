import { Database } from '@nozbe/watermelondb';

export default class ConquestService {
  private readonly apiUrl;
  private readonly getToken;

  constructor(apiUrl: string, getToken: () => Promise<string | null>) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
  }

  async queue(action: 'START_WAR', warId: string) {
    const token = await this.getToken();
    return fetch(`${this.apiUrl}/conquest/queue`, {
      method: 'POST',
      headers: new Headers({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        warId,
      }),
    });
  }
}
