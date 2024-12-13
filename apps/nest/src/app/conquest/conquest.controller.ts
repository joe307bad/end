import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  warMachine,
  Event,
  Battle,
  getPossibleDeployedTroops,
} from '@end/war/core';
import { createActor } from 'xstate';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Entity } from '../sync/sync.service';
import { ConquestService } from './conquest.service';
import { JwtService } from '@nestjs/jwt';
import { v6 as uuidv6 } from 'uuid';
import { faker } from '@faker-js/faker';
import * as S from '@effect/schema/Schema';

@Schema({ strict: false })
export class War {
  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  warId: string;

  _id: ObjectId;
}

const getUserInfo = (jwtService: JwtService) => (request: Request) => {
  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { sub, username } = jwtService.decode(token);
    return { userId: sub, username };
  }
  return null;
};

export const WarSchema = SchemaFactory.createForClass(War);

@Controller('conquest')
export class ConquestController {
  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    private jwtService: JwtService,
    private conquest: ConquestService
  ) {}

  @Post()
  async log(@Body() event: Event, @Req() request: Request) {
    switch (event.type) {
      case 'generate-new-war':
        const { userId, username }: { userId: string; username: string } =
          (() => {
            const authHeader = request.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.split(' ')[1];
              const { sub, username } = this.jwtService.decode(token);
              return { userId: sub, username };
            }
            return null;
          })();

        const warActor = createActor(warMachine(event.warId));
        warActor.start();
        warActor.send({
          ...event,
          players: [
            {
              id: userId,
              userName: username,
              color: 'red', // faker.color.rgb({ format: 'hex' }),
            },
          ],
        });
        const state = warActor.getSnapshot();
        await this.warModel
          .create({ state: JSON.stringify(state), warId: event.warId })
          .then((r) => {
            return { id: r._id };
          });

        return { state, warId: event.warId };
      case 'add-player':
      case 'deploy':
      case 'set-portal-entry':
      case 'start-battle':
      case 'attack':
        try {
          const war = await this.warModel
            .findOne({ warId: event.warId })
            .exec();
          const warState = JSON.parse(war.state);
          const existingWarActor = createActor(
            warMachine(event.warId, warState.context, warState.value)
          );
          existingWarActor.start();

          if (event.type === 'add-player') {
            const { userId, username } = getUserInfo(this.jwtService)(request);
            event = {
              ...event,
              player: {
                id: '6725967b9cd8969c26ec53ed',
                userName: 'user2',
                color: 'blue', // faker.color.rgb({ format: 'hex' }),
              },
            };
          }

          if (event.type === 'start-battle') {
            event = {
              ...event,
              id: crypto.randomUUID(),
            };
          }

          existingWarActor.send(event);
          const existingWarState = existingWarActor.getSnapshot();
          await this.warModel
            .updateOne(
              { warId: event.warId },
              {
                state: JSON.stringify({
                  context: existingWarState.context,
                  value: existingWarState.value,
                }),
              }
            )
            .then((r) => {
              return { id: r.upsertedId };
            });

          if (event.type === 'attack') {
            const battle = existingWarState.context.turns[
              existingWarState.context.turn
              // @ts-ignore
            ].battles.find((b) => b.id === event.battleId);

            if (!battle) {
              return existingWarState.context.tiles;
            }
            const tile1TroopCount =
              existingWarState.context.tiles[battle.defendingTerritory]
                .troopCount;
            const tile2TroopCount =
              existingWarState.context.tiles[battle.attackingFromTerritory]
                .troopCount;

            this.conquest.next({
              type: 'attack',
              warId: event.warId,
              ownerUpdates: {
                [battle.defendingTerritory]:
                  existingWarState.context.tiles[battle.defendingTerritory]
                    .owner,
                [battle.attackingFromTerritory]:
                  existingWarState.context.tiles[battle.attackingFromTerritory]
                    .owner,
              },
              troopUpdates: {
                [battle.defendingTerritory]: tile1TroopCount,
                [battle.attackingFromTerritory]: tile2TroopCount,
              },
              battle: {
                id: battle.id,
                createdDate: battle.createdDate,
                aggressor: battle.aggressor,
                defender: battle.defender,
                attackingFromTerritory: battle.attackingFromTerritory,
                defendingTerritory: battle.defendingTerritory,
              },
            });
          } else if (event.type === 'start-battle') {
            const battle =
              existingWarState.context.turns[existingWarState.context.turn]
                ?.battles[0];

            if (!battle) {
              return existingWarState.context.tiles;
            }
            const defendingTroopCount =
              existingWarState.context.tiles[battle.defendingTerritory]
                .troopCount;
            const attackingTroopCount =
              existingWarState.context.tiles[battle.attackingFromTerritory]
                .troopCount;
            this.conquest.next({
              type: 'battle-started',
              warId: event.warId,
              troopUpdates: {
                [battle.defendingTerritory]: defendingTroopCount,
                [battle.attackingFromTerritory]: attackingTroopCount,
              },
              battle: {
                id: battle.id,
                createdDate: battle.createdDate,
                aggressor: battle.aggressor,
                defender: battle.defender,
                attackingFromTerritory: battle.attackingFromTerritory,
                defendingTerritory: battle.defendingTerritory,
              },
            });
          }

          if (event.type === 'add-player') {
            this.conquest.next({
              type: 'player-joined',
              warId: event.warId,
              players: existingWarState.context.players,
            });
          }

          if (
            event.type === 'add-player' &&
            existingWarState.context.players.length >=
              existingWarState.context.playerLimit
          ) {
            const id = event.warId;
            this.conquest.next({
              type: 'war-started',
              warId: event.warId,
              war: { id, ...existingWarState.context },
            });
          }

          if (event.type === 'set-portal-entry') {
            this.conquest.next({
              type: 'portal-entry-set',
              warId: event.warId,
              portal: existingWarState.context.portal,
            });
          }

          if (event.type === 'deploy') {
            const deployedTroops =
              existingWarState.context.turns[existingWarState.context.turn]
                ?.deployedTroops ?? 0;
            const availableTroopsToDeploy =
              getPossibleDeployedTroops(existingWarState.context) -
              deployedTroops;
            this.conquest.next({
              type: 'deploy',
              tile: event.tile,
              troopsCount:
                existingWarState.context.tiles[event.tile].troopCount,
              warId: event.warId,
              availableTroopsToDeploy,
            });
          }

          return { state: existingWarState, warId: event.warId };
        } catch (e) {
          return e.message;
        }
    }
  }

  @Get('war/:id')
  async war(@Param() params: { id?: string }) {
    const war = await this.warModel
      .findOne({
        warId: { $eq: params.id },
      })
      .exec();
    const warState = JSON.parse(war.state);
    const existingWarActor = createActor(
      warMachine(war.warId, warState.context, warState.value)
    );
    const existingWarState = existingWarActor.getSnapshot();
    const deployedTroops =
      existingWarState.context.turns[existingWarState.context.turn]
        ?.deployedTroops ?? 0;
    const availableTroopsToDeploy =
      getPossibleDeployedTroops(existingWarState.context) - deployedTroops;
    return {
      war,
      availableTroopsToDeploy,
      round: Math.ceil(
        Object.keys(existingWarState.context.turns).length /
          existingWarState.context.players.length
      ),
    };
  }
}
