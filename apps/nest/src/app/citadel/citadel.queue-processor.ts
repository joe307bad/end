import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { War } from '../conquest/conquest.controller';
import { subYears } from 'date-fns';
import { Context } from '@end/war/core';
import { CitadelFeed } from './citadel.service';
import { generateRandomId } from '../shared';
import { isEmptyRecord } from 'effect/Record';
import * as R from 'remeda';
import { Entity } from '../sync/sync.service';

@Processor('citadel-feed-queue')
export class CitadelQueueProcessor {
  constructor(
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
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
      .lean()
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

    // get all wars updated after entryDate
    const allWars = await this.warModel
      .find<{
        context: Context;
        victor_id?: string;
        value: 'war-in-progress' | 'war-complete';
      }>({
        updated_at: { $gt: entryDate.getTime() },
        value: { $nin: ['war-complete', 'searching-for-players'] },
      })
      .exec();
    // get all wars created after entryDate
    const warsCreatedAfter = await this.warModel
      .find<{
        context: Context;
        victor_id?: string;
        value: 'war-in-progress' | 'war-complete';
      }>({
        created_at: { $gt: entryDate.getTime() },
        value: { $nin: ['war-complete', 'searching-for-players'] },
      })
      .exec();

    // run calculations on this subset
    const { battleWinRate } = allWars.reduce(
      (leaderboards: Partial<CitadelFeed['leaderboards']>, curr) => {
        Object.values(curr.context?.turns ?? {}).forEach((turn, i) => {
          // do not count current turn if war is still in progress
          if (i === curr.context.turn - 1 && curr.value === 'war-in-progress') {
            return;
          }

          turn.battles
            .filter(
              (b) => new Date(b.createdDate).getTime() > entryDate.getTime()
            )
            .forEach((battle) => {
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

        // Object.values(curr.context.tiles)
        //   .filter((t) => t.owner !== 'null')
        //   .forEach((tile, i) => {
        //     if (!leaderboards.totalTroopCount?.[tile.owner]) {
        //       leaderboards.totalTroopCount[tile.owner] = {
        //         value: 0,
        //         change: 0,
        //       };
        //     }
        //
        //     leaderboards.totalTroopCount[tile.owner].value =
        //       leaderboards.totalTroopCount[tile.owner].value + tile.troopCount;
        //   });

        return leaderboards;
      },
      { battleWinRate: {} }
    );

    // calculate change for battle win rate
    Object.keys(battleWinRate).forEach((user, i) => {
      const exists = latestCitadelFeedEntry?.leaderboards.battleWinRate?.[user];

      if (exists) {
        const prev =
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].battlesWon /
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].totalBattles;

        battleWinRate[user].totalBattles =
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].totalBattles +
          battleWinRate[user].totalBattles;

        battleWinRate[user].battlesWon =
          latestCitadelFeedEntry.leaderboards.battleWinRate[user].battlesWon +
          battleWinRate[user].battlesWon;

        const currBwr =
          battleWinRate[user].battlesWon / battleWinRate[user].totalBattles;

        battleWinRate[user].change = currBwr - prev;
      }
    });

    // // calculate change for troop count
    // Object.keys(totalTroopCount).forEach((user, i) => {
    //   const exists =
    //     latestCitadelFeedEntry?.leaderboards.totalTroopCount?.[user];
    //
    //   if (exists) {
    //     const prev =
    //       latestCitadelFeedEntry.leaderboards.totalTroopCount[user].value;
    //
    //     totalTroopCount[user].change =
    //       latestCitadelFeedEntry.leaderboards.totalTroopCount[user].value -
    //       prev;
    //     totalTroopCount[user].value =
    //       latestCitadelFeedEntry.leaderboards.totalTroopCount[user].value +
    //       totalTroopCount[user].value;
    //   }
    // });

    const totalPlanetsCaptured = completedWars.reduce(
      (acc: Record<string, { value: number; change: number }>, curr) => {
        if (!acc[curr.context.victor]) {
          acc[curr.context.victor] = {
            value: 0,
            change: 0,
          };
        }

        acc[curr.context.victor].value = acc[curr.context.victor].value + 1;
        return acc;
      },
      {}
    );

    // calculate change for planets captured
    Object.keys(totalPlanetsCaptured).forEach((user, i) => {
      const exists =
        latestCitadelFeedEntry?.leaderboards.totalPlanetsCaptured?.[user];

      if (exists) {
        const prev =
          latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].value;

        latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].change =
          totalPlanetsCaptured[user].value - prev;

        totalPlanetsCaptured[user].value =
          latestCitadelFeedEntry.leaderboards.totalPlanetsCaptured[user].value +
          totalPlanetsCaptured[user].value;
      }
    });

    if (
      isEmptyRecord(totalPlanetsCaptured) &&
      isEmptyRecord(battleWinRate) // &&
      // isEmptyRecord(totalTroopCount)
    ) {
      return;
    }

    const updatedLeaderboards = {
      totalPlanetsCaptured: {
        ...latestCitadelFeedEntry?.leaderboards?.totalPlanetsCaptured,
        ...totalPlanetsCaptured,
      },
      battleWinRate: {
        ...latestCitadelFeedEntry?.leaderboards?.battleWinRate,
        ...battleWinRate,
      },
      // totalTroopCount: {
      //   ...latestCitadelFeedEntry?.leaderboards?.totalTroopCount,
      //   // ...totalTroopCount,
      // },
    };

    // TODO Calculate each victors battle rate for each war

    await this.citadelModel.create({
      _id: generateRandomId(),
      leaderboards: {
        battleWinRate: R.pipe(
          {
            ...latestCitadelFeedEntry?.leaderboards?.battleWinRate,
            ...battleWinRate,
          },
          R.toPairs,
          R.map(([key, value]) => ({
            key,
            value,
            aggregate: value.battlesWon / value.totalBattles,
          })),
          R.sortBy((item) => item.aggregate),
          R.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
          }, {})
        ),
        totalPlanetsCaptured: R.pipe(
          {
            ...latestCitadelFeedEntry?.leaderboards?.totalPlanetsCaptured,
            ...totalPlanetsCaptured,
          },
          R.toPairs,
          R.sortBy(([key, value]) => value.value),
          R.reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {})
        ),
      },
      created_at: now,
    });
  }
}
