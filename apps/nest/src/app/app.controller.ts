import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { InjectModel } from '@nestjs/mongoose';
import { Entity } from './sync/sync.service';
import { Model } from 'mongoose';
import { User } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  @Get('leaderboard')
  async leaderboard() {
    const allWars = (await this.entityModel
      .find({ table: 'wars', victor: { $exists: true } })
      .exec()) as unknown as { victor: string }[];

    const unsorted = await allWars.reduce(
      async (
        acc: Promise<Record<string, { name: string; score: number }>>,
        curr
      ) => {
        const a = await acc;
        if (a[curr.victor]) {
          a[curr.victor].score = a[curr.victor].score + 1;
          return a;
        }

        const user = (await this.userModel
          .findOne({ _id: curr.victor })
          .exec()) as unknown as { userName: string };

        a[curr.victor] = {
          name: user.userName,
          score: 1,
        };
        return a;
      },
      Promise.resolve({})
    );

    return Object.values(unsorted).sort((a, b) => a.score - b.score);
  }
}
