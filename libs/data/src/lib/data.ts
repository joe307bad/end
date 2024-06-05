import { Planet, syncFactory, War } from '@end/wm/core';
import { Database } from '@nozbe/watermelondb';
import ConquestService from './conquest-service';
import { Tile } from '@end/war/core';

export class EndApi {
  private readonly apiUrl;
  private readonly database;
  private readonly conquestService;
  private readonly syncService;
  private token;

  constructor(
    apiUrl: string,
    database: Database,
    conquestService: ConquestService,
    syncService: ReturnType<typeof syncFactory>,
    token: () => Promise<string | null>
  ) {
    this.apiUrl = apiUrl;
    this.database = database;
    this.conquestService = conquestService;
    this.syncService = syncService;
    this.token = token;
  }

  async sync() {
    const token = await this.token();

    if (!token) {
      throw Error('Token not set');
    }

    return this.syncService(token, this.apiUrl);
  }

  login(userName: string, password: string) {
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

  async startWar(
    planet: {
      name: string;
      raised: string;
      landColor: string;
      waterColor: string;
    },
    players: number
  ) {
    const newPlanet = await new Promise<string>(async (resolve) => {
      await this.database.write(async () => {
        const { id } = await this.database
          .get<Planet>('planets')
          .create((p: Planet) => {
            p.name = planet.name;
            p.landColor = planet.landColor;
            p.waterColor = planet.waterColor;
            p.raised = planet.raised;
          });
        resolve(id);
      });
    });

    const { id } = await this.database.get<War>('wars').create((war) => {
      war.planet.id = newPlanet;
      war.players = players;
    });

    return this.conquestService.log({
      type: 'generate-new-war',
      players: [],
      tiles: planet.raised
        .split('|')
        .reduce<Record<string, Tile>>((acc, cur) => {
          acc[cur] = {
            id: '',
            owner: '',
            troopCount: 0,
            habitable: true,
            // TODO need access to the hexasphere to get this
            // should prob implement tsyringe next
            neighborIds: [],
          };

          return acc;
        }, {}),
    });
  }
}
