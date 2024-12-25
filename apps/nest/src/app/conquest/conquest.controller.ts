import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import {
  Event,
  getCurrentUsersTurn,
  getDeployedTroopsForTurn,
  getMostRecentDeployment,
  getMostRecentPortal,
  getPossibleDeployedTroops,
  getScoreboard,
  warMachine,
} from '@end/war/core';
import { createActor } from 'xstate';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Entity } from '../sync/sync.service';
import { ConquestService } from './conquest.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/users.service';

const colors: string[] = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#520043', // Cyan
  '#FF1493', // Deep Pink
  '#FFD700', // Gold
  '#008080', // Teal
  '#800000', // Maroon
  '#40E0D0', // Turquoise
  '#8B4513', // Saddle Brown
];

@Schema({ strict: false })
export class War {
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
    @InjectModel(User.name) private userModel: Model<User>,
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
              color: colors[0],
            },
          ],
        });
        const state = warActor.getSnapshot().toJSON();
        await this.warModel
          .create({ ...(state as any), warId: event.warId })
          .then((r) => {
            return { id: r._id };
          });

        return { state, warId: event.warId };
      case 'add-player':
      case 'deploy':
      case 'set-portal-entry':
      case 'start-battle':
      case 'attack':
      case 'complete-turn':
      case 'begin-turn-number-1':
        try {
          const war = (await this.warModel
            .findOne({ warId: event.warId })
            .exec()) as any;
          // const warState = JSON.parse(war.state);
          const existingWarActor = createActor(
            warMachine(event.warId, war.context, war.value)
          );
          existingWarActor.start();
          const preActionState = existingWarActor.getSnapshot();

          if (event.type === 'add-player') {
            const { userId, username } = getUserInfo(this.jwtService)(request);
            event = {
              ...event,
              player: {
                id: userId,
                userName: username,
                color: colors[preActionState.context.players.length],
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
          const existingWarState = existingWarActor.getSnapshot().toJSON() as any;
          await this.warModel
            .updateOne(
              { warId: event.warId },
              {
                ...existingWarState as any,
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
                events: battle.events,
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
                events: battle.events,
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

          if (event.type === 'complete-turn') {
            const currentUsersTurn = getCurrentUsersTurn(
              existingWarState.context
            );
            const turn = existingWarState.context.turn;
            const turns = existingWarState.context.turns;
            const round = Math.ceil(
              Object.keys(turns).length /
                existingWarState.context.players.length
            );
            this.conquest.next({
              type: 'turn-completed',
              currentUsersTurn,
              warId: event.warId,
              round,
            });
          }

          if (
            (event.type === 'add-player' &&
              existingWarState.context.players.length >=
                existingWarState.context.playerLimit) ||
            event.type === 'begin-turn-number-1'
          ) {
            const id = event.warId;
            this.conquest.next({
              type: 'war-started',
              warId: event.warId,
              round: Math.ceil(
                Object.keys(existingWarState.context.turns).length /
                  existingWarState.context.players.length
              ),
              war: { id, ...existingWarState.context },
            });
          }

          if (event.type === 'set-portal-entry') {
            this.conquest.next({
              type: 'portal-entry-set',
              warId: event.warId,
              portal: getMostRecentPortal(existingWarState.context),
            });
          }

          if (event.type === 'deploy') {
            const turn =
              existingWarState.context.turns[existingWarState.context.turn];
            const deployedTroops = getDeployedTroopsForTurn(turn);
            const deployment = getMostRecentDeployment(
              existingWarState.context
            );
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
              deployment,
            });
          }

          if (existingWarState.value === 'war-complete') {
            this.conquest.next({
              type: 'war-completed',
              warId: event.warId,
            });

            const victor = getScoreboard({
              players: existingWarState.context.players,
              tiles: Object.values(existingWarState.context.tiles),
            })[0].id;

            await this.entityModel.updateOne(
              { table: 'wars', _id: event.warId },
              { victor, updated_on_server: Date.now() }
            );
          }

          return { state: existingWarState, warId: event.warId };
        } catch (e) {
          return e.message;
        }
    }
  }

  @Get('war/:id')
  async war(@Param() params: { id?: string }) {
    const war = (await this.warModel
      .findOne({
        warId: { $eq: params.id },
      })
      .exec()) as any;
    // const warState = JSON.parse(war.state);
    const existingWarActor = createActor(
      warMachine(war.warId, war.context, war.value)
    );
    const existingWarState = existingWarActor.getSnapshot();
    const turns = existingWarState.context.turns;
    const deployedTroops = getDeployedTroopsForTurn(
      turns?.[existingWarState.context.turn]
    );
    const availableTroopsToDeploy =
      getPossibleDeployedTroops(existingWarState.context) - deployedTroops;
    return {
      war,
      availableTroopsToDeploy,
      round: !turns
        ? 0
        : Math.ceil(
            Object.keys(turns).length / existingWarState.context.players.length
          ),
      isInactive: existingWarState.value === 'war-complete',
    };
  }
}
