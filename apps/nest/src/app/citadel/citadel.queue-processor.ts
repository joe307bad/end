import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { War } from '../conquest/conquest.controller';
import { subYears } from 'date-fns';
import { Context } from '@end/war/core';
import { CitadelFeed } from './citadel.service';
import { generateRandomId } from '../shared';
import { isEmptyRecord } from 'effect/Record';

@Processor('citadel-feed-queue')
export class CitadelQueueProcessor {
  constructor(
    @InjectModel('citadel-feed') private citadelModel: Model<CitadelFeed>,
    @InjectModel(War.name) private warModel: Model<War>
  ) {}

  @Process({ concurrency: 1 })
  async CitadelQueueProcessor(job: Job) {
    const now = Date.now();

    // find the latest entry in CitadelFeed
    const latestCitadelFeedEntry = await this.citadelModel
      .findOne<CitadelFeed | null>()
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
        completed_at: { $gt: entryDate.getTime() },
        value: 'war-complete',
      })
      .exec();

    // get all wars created after entryDate
    const allWars = await this.warModel
      .find<{ context: Context; victor_id?: string }>({
        updated_at: { $gt: entryDate.getTime() },
        value: { $nin: ['war-complete', 'searching-for-players'] },
      })
      .exec();

    // run calculations on this subset
    const { battleWinRate, totalTroopCount } = allWars.reduce(
      (leaderboards: Partial<CitadelFeed['leaderboards']>, curr) => {
        Object.values(curr.context?.turns ?? {}).forEach((turn, i) => {
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

        Object.values(curr.context.tiles)
          .filter((t) => t.owner !== 'null')
          .forEach((tile, i) => {
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

    // calculate change for battle win rate
    Object.keys(battleWinRate).forEach((user, i) => {
      const exists = latestCitadelFeedEntry?.leaderboards.battleWinRate[user];

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
      const exists = latestCitadelFeedEntry?.leaderboards.totalTroopCount[user];

      if (exists) {
        const prev =
          latestCitadelFeedEntry.leaderboards.totalTroopCount[user].value;
        latestCitadelFeedEntry.leaderboards.totalTroopCount[user].change =
          totalTroopCount[user].value - prev;
      }
    });

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

    // calculate change for planets captured
    Object.keys(totalPlanetsCaptured).forEach((user, i) => {
      const exists =
        latestCitadelFeedEntry?.leaderboards.totalPlanetsCaptured[user];

      if (exists) {
        const prev =
          latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].value;
        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].change =
          totalPlanetsCaptured[user].value - prev;
      }
    });

    if (
      isEmptyRecord(totalPlanetsCaptured) &&
      isEmptyRecord(battleWinRate) &&
      isEmptyRecord(totalTroopCount)
    ) {
      return;
    }

    // TODO Calculate each victors battle rate for each war

    await this.citadelModel.create({
      _id: generateRandomId(),
      leaderboards: {
        totalPlanetsCaptured,
        battleWinRate,
        totalTroopCount,
      },
      created_at: now,
    });
  }
}
