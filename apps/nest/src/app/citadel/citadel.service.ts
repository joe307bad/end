import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Entity } from '../sync/sync.service';
import { Model } from 'mongoose';
import { War } from '../conquest/conquest.controller';

class Leaderboards {
  battleWinRate: Record<
    string,
    { totalBattles: number; battlesWon: number; change: number }
  >;
  totalTroopCount: Record<string, { value: number; change: number }>;
  totalPlanetsCaptured: Record<string, { value: number; change: number }>;
}

class LatestWar {
  userName: string;
  summary: string;
  completed: number;
}

  @Schema({ strict: false })
export class CitadelFeed {
  @Prop({ type: Leaderboards })
  leaderboards: Leaderboards;

  @Prop({ type: [LatestWar] })
  latestWars: LatestWar[];

  @Prop()
  _id: string;

  @Prop()
  created_at: number;
}

export const CitadelFeedSchema = SchemaFactory.createForClass(CitadelFeed);

@Injectable()
export class CitadelService {
  constructor(
    @InjectQueue('citadel-queue') private readonly queue: Queue,
    @InjectModel('citadel-feed') private citadelFeed: Model<War>
  ) {}

  async getLatest() {
    return this.citadelFeed.findOne().sort({ created_at: -1 });
  }

  async enqueue() {
    const queueSize = await this.queue.count();

    if (queueSize >= 1) {
      return;
    }

    await this.queue.add({
      'citadel-queue': true,
    });
  }
}
