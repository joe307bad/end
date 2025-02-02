import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { concatMap, from, Subject, tap } from 'rxjs';
import { subYears } from 'date-fns';
import { Context } from '@end/war/core';
import { generateRandomId } from '../shared';
import { isEmptyRecord } from 'effect/Record';
import * as R from 'remeda';
import { War } from '../shared/schemas/war.schema';
import { Entity } from '../shared/schemas/entity.schema';
import { SharedService } from '../shared/shared.service';

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
  private taskQueue$ = new Subject<() => Promise<void>>();
  private queueLimit = 2;
  private currentTaskCount = 0;

  constructor(
    @InjectModel('citadel-feed') private citadelFeed: Model<CitadelFeed>,
    @InjectModel(War.name) private warModel: Model<War>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    private sharedService: SharedService
  ) {
    this.taskQueue$
      .pipe(
        concatMap((task) =>
          from(task()).pipe(
            tap(() => {
              this.currentTaskCount--;
            })
          )
        )
      )
      .subscribe();
  }

  async getLatest() {
    return this.citadelFeed.findOne().sort({ created_at: -1 });
  }

  async enqueue() {
    if (this.currentTaskCount === this.queueLimit) {
      return;
    }

    this.currentTaskCount++;
    this.taskQueue$.next(() => this.recalculate());
  }

  async recalculate() {
    const now = Date.now();

    // find the latest entry in CitadelFeed
    const latestCitadelFeedEntry = await this.citadelFeed
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

    // TODO Calculate each victors battle rate for each war

    const recentlyCompletedWars = await this.warModel
      .find<War>({
        value: 'war-complete',
      })
      .sort({ completed_at: -1 })
      .exec()
      .then((wars) => wars.slice(0, 5));

    const warIds = recentlyCompletedWars.map((w) => w.warId);

    const planetsByWar = await this.entityModel
      .find<{ planet_id: string; _id: string }>({
        table: 'wars',
        _id: { $in: warIds },
      })
      .sort({ completed_at: -1 })
      .exec()
      .then((wars) =>
        wars.reduce((acc: Record<string, string>, curr) => {
          acc[curr._id] = curr.planet_id;
          return acc;
        }, {})
      );

    const planetData = await this.entityModel
      .find<{ name: string; _id: string }>({
        table: 'planets',
        _id: { $in: Object.values(planetsByWar) },
      })
      .exec();

    const latestWars: {
      userName: string;
      summary: string;
      completed: number;
      warId: string;
    }[] = recentlyCompletedWars.map((war) => {
      const planetId = planetsByWar[war.warId];
      const planet = planetData.find((p) => p._id === planetId);
      return {
        warId: war.warId.toString(),
        completed: war.completed_at,
        userName:
          war.context.players.find((p) => p.id === war.context.victor)
            ?.userName ?? '',
        summary: planet.name,
      };
    });

    const newCitadelFeed = {
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
          R.sortBy([(item) => item.aggregate, 'desc']),
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
          R.sortBy([(item) => item[1].value, 'desc']),
          R.reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {})
        ),
      },
      latestWars,
      created_at: now,
    };

    await this.citadelFeed.create(newCitadelFeed);

    this.sharedService.next({
      roomId: 'live-updates',
      leaderboards: newCitadelFeed.leaderboards,
      latestWars,
      updatedAt: now,
      type: 'citadel-update',
    });
  }
}
