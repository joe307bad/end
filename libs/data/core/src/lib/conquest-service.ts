import { Event } from 'libs/war/core';

export default class ConquestService {
  private readonly apiUrl;
  private readonly getToken;

  constructor(apiUrl: string, getToken: () => Promise<string | null>) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
  }

  async log(event: Event) {
    const token = await this.getToken();
    return fetch(`${this.apiUrl}/conquest`, {
      method: 'POST',
      headers: new Headers({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(event),
    });
  }
}
