import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ strict: false })
export class CitadelFeed {
  @Prop()
  leaderboards: {
    battleWinRate: Record<
      string,
      { totalBattles: number; battlesWon: number; change: number }
    >;
    totalTroopCount: Record<string, { value: number; change: number }>;
    totalPlanetsCaptured: Record<string, { value: number; change: number }>;
  };

  @Prop()
  _id: string;

  @Prop()
  created_at: number;
}

@Injectable()
export class CitadelService {
  constructor(
    @InjectQueue('citadel-recalculation-queue') private readonly queue: Queue
  ) {}

  async recalculate() {
    const queueSize = await this.queue.count();

    if (queueSize >= 1) {
      return;
    }

    await this.queue.add({
      foo: 'bar',
    });
  }
}
