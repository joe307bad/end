import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entity } from '../sync/sync.service';
import { ConquestService } from '../conquest/conquest.service';
import { War } from '../conquest/conquest.controller';
import { subYears } from 'date-fns';
import { Context } from '@end/war/core';
import { generateRandomId } from '../shared';
import { CitadelFeed } from './citadel.service';

@Processor('citadel-recalculation-queue')
export class CitadelQueueProcesser {
  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    private conquest: ConquestService
  ) {}

  @Process({ concurrency: 1 })
  async handleJob(job: Job) {
    const now = Date.now();

    // Create leaderboard types if they do not exist
    for (const type of [
      'Battle win rate',
      'Total troop count',
      'Total planets captured',
    ]) {
      const existing = await this.entityModel
        .findOne({ table: 'leaderboard_types', name: type })
        .exec();

      if (!existing) {
        await this.entityModel.create({
          _id: generateRandomId(),
          table: 'leaderboard_types',
          name: type,
          created_on_server: now,
          created_at: now,
          updated_at: now,
        });
      }
    }

    // find the latest entry in CitadelFeed
    const latestCitadelFeedEntry = await this.entityModel
      .findOne<CitadelFeed>()
      .sort({ created_at: -1 })
      .exec();

    const entryDate = (() => {
      if (latestCitadelFeedEntry?.created_at) {
        return new Date(latestCitadelFeedEntry.created_at);
      }

      return subYears(new Date(), 1);
    })();

    // get all completed wars created after entryDate
    const completedWars = await this.warModel
      .find<{ context: Context; victor_id?: string }>({
        completed_at: { $gt: entryDate },
        value: 'war-complete',
      })
      .exec();

    // get all wars created after entryDate
    const allWars = await this.warModel
      .find<{ context: Context; victor_id?: string }>({
        created_at: { $gt: entryDate },
        value: { $ne: 'war-complete' },
      })
      .exec();

    // run calculations on this subset
    const { battleWinRate, totalTroopCount } = allWars.reduce(
      (leaderboards: Partial<CitadelFeed['leaderboards']>, curr) => {
        Object.values(curr.context.turns).forEach((turn, i) => {
          turn.battles.forEach((battle) => {
            const { aggressor, defender } = battle.events.reduce(
              (acc: { aggressor?: number; defender?: number }, curr) => {
                acc.aggressor = acc.aggressor + curr.aggressorChange;
                acc.defender = acc.defender + curr.defenderChange;

                return acc;
              },
              {
                aggressor: battle.aggressorInitialTroopCount,
                defender: battle.defenderInitialTroopCount,
              }
            );

            if (!leaderboards.battleWinRate[battle.aggressor]) {
              leaderboards.battleWinRate[battle.aggressor] = {
                totalBattles: 0,
                battlesWon: 0,
                change: 0,
              };
            }

            if (defender <= 0 || aggressor === 1) {
              leaderboards.battleWinRate[battle.aggressor].totalBattles =
                leaderboards.battleWinRate[battle.aggressor].totalBattles + 1;

              if (defender <= 0) {
                leaderboards.battleWinRate[battle.aggressor].battlesWon =
                  leaderboards.battleWinRate[battle.aggressor].battlesWon + 1;
              }
            }
          });
        });

        Object.values(curr.context.tiles).forEach((tile, i) => {
          if (!leaderboards.totalTroopCount[tile.owner]) {
            leaderboards.totalTroopCount[tile.owner] = {
              value: 0,
              change: 0,
            };
          }

          leaderboards.totalTroopCount[tile.owner].value =
            leaderboards.totalTroopCount[tile.owner].value + tile.troopCount;
        });

        return leaderboards;
      },
      { battleWinRate: {}, totalTroopCount: {} }
    );

    const totalPlanetsCaptured: Record<
      string,
      { value: number; change: number }
    > = completedWars.reduce((acc, curr) => {
      if (!acc[curr.victor_id]) {
        acc[curr.victor_id] = {
          value: 0,
          change: 0,
        };
      }

      acc[curr.victor_id].value = acc[curr.victor_id].value + 1;
      return acc;
    }, {});

    // calculate change for battle win rate
    Object.keys(battleWinRate).forEach((user, i) => {
      const exists = latestCitadelFeedEntry.leaderboards.battleWinRate[user];

      if (exists) {
        const prev =
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].battlesWon /
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].totalBattles;
        const currBwr =
          battleWinRate[user].battlesWon / battleWinRate[user].totalBattles;
        battleWinRate[user].change = currBwr - prev;
      }
    });

    // calculate change for troop count
    Object.keys(totalTroopCount).forEach((user, i) => {
      const exists =
        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user];

      if (exists) {
        const prev = latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].value;
        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].change = totalTroopCount[user].value - prev;
      }
    });

    // calculate change for troop count
    Object.keys(totalTroopCount).forEach((user, i) => {
      const exists =
        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user];

      if (exists) {
        const prev = latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].value;
        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].change = totalTroopCount[user].value - prev;
      }
    });

    // TODO Calculate each victors battle rate for each war

    // loop through wars with/without a victor
    // calculate the total number of troops for each user
    // and planet that have been captured/wars that are in progress
    // this is the "largest standing force" leaderboard
  }
}
