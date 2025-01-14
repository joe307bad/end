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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { generateRandomId } from '../shared';
import { CitadelService } from '../citadel/citadel.service';
import { SharedService } from '../shared/shared.service';
import { War } from '../shared/schemas/war.schema';
import { Entity } from '../shared/schemas/entity.schema';

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


const getUserInfo = (jwtService: JwtService) => (request: Request) => {
  const authHeader = request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { sub, username } = jwtService.decode(token);
    return { userId: sub, username };
  }
  return null;
};

@Controller('conquest')
export class ConquestController {
  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    private jwtService: JwtService,
    private sharedService: SharedService,
    private userService: UsersService,
    private citadelService: CitadelService
  ) {}

  @Post()
  async log(@Body() event: Event, @Req() request: Request) {
    switch (event.type) {
      case 'generate-new-war':
        const { userId, userName }: { userId: string; userName: string } =
          await (async () => {
            const authHeader = request.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              const token = authHeader.split(' ')[1];
              const { sub } = this.jwtService.decode(token);
              const { userName, _id } = await this.userService.findById(sub);
              return { userId: _id, userName };
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
              userName,
              color: colors[0],
            },
          ],
        });
        const state = warActor.getSnapshot().toJSON();
        await this.warModel
          .create({
            ...(state as any),
            warId: event.warId,
            created_at: Date.now(),
          })
          .then((r) => {
            return { id: r._id };
          });
        this.citadelService.enqueue();

        return { state, warId: event.warId, playerId: userId };
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
            const { userId } = getUserInfo(this.jwtService)(request);
            const { userName, _id } = await this.userService.findById(userId);
            event = {
              ...event,
              player: {
                id: _id,
                userName,
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
          const existingWarState = existingWarActor
            .getSnapshot()
            .toJSON() as any;
          await this.warModel
            .updateOne(
              { warId: event.warId },
              {
                updated_at: Date.now(),
                ...(existingWarState as any),
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

            this.sharedService.next({
              type: 'attack',
              roomId: event.warId,
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
            this.sharedService.next({
              type: 'battle-started',
              roomId: event.warId,
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
            const now = Date.now();
            await this.entityModel.create({
              _id: generateRandomId(),
              table: 'war_users',
              user_id: event.player.id,
              war_id: event.warId,
              created_on_server: Date.now(),
              created_at: now,
              updated_at: now,
            });
            this.sharedService.next({
              roomId: 'live-updates',
              war: {
                id: event.warId,
                players: existingWarState.context.players,
                turn: null,
                updatedAt: now,
              },
              type: 'war-change',
            });
            this.sharedService.next({
              type: 'player-joined',
              roomId: event.warId,
              players: existingWarState.context.players,
            });
          }

          if (event.type === 'complete-turn') {
            const currentUsersTurn = getCurrentUsersTurn(
              existingWarState.context
            );

            const turns = existingWarState.context.turns;
            const round = Math.ceil(
              Object.keys(turns).length /
                existingWarState.context.players.length
            );
            this.sharedService.next({
              type: 'turn-completed',
              currentUsersTurn,
              roomId: event.warId,
              round,
            });
            const updatedAt = Date.now();
            await this.entityModel.updateOne(
              { table: 'wars', _id: event.warId },
              {
                turn_id: currentUsersTurn,
                updated_on_server: Date.now(),
                updated_at: updatedAt,
              }
            );
            this.sharedService.next({
              roomId: 'live-updates',
              war: {
                id: event.warId,
                turn: currentUsersTurn,
                status: existingWarActor.getSnapshot().value,
                updatedAt,
              },
              type: 'war-change',
            });
            this.citadelService.enqueue();
          }

          if (
            (event.type === 'add-player' &&
              existingWarState.context.players.length >=
                existingWarState.context.playerLimit) ||
            event.type === 'begin-turn-number-1'
          ) {
            const id = event.warId;
            this.sharedService.next({
              type: 'war-started',
              roomId: event.warId,
              round: Math.ceil(
                Object.keys(existingWarState.context.turns).length /
                  existingWarState.context.players.length
              ),
              war: { id, ...existingWarState.context },
            });
            const updatedAt = Date.now();
            await this.entityModel.updateOne(
              { table: 'wars', _id: event.warId },
              {
                turn_id: existingWarState.context.players[0].id,
                status: 'war-in-progress',
                updated_on_server: Date.now(),
                updated_at: updatedAt,
              }
            );
            this.sharedService.next({
              roomId: 'live-updates',
              war: {
                id: event.warId,
                players: existingWarState.context.players,
                turn: existingWarState.context.players[0].id,
                status: 'war-in-progress',
                updatedAt,
              },
              type: 'war-change',
            });
            this.citadelService.enqueue();
          }

          if (event.type === 'set-portal-entry') {
            this.sharedService.next({
              type: 'portal-entry-set',
              roomId: event.warId,
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
            this.sharedService.next({
              type: 'deploy',
              tile: event.tile,
              troopsCount:
                existingWarState.context.tiles[event.tile].troopCount,
              roomId: event.warId,
              availableTroopsToDeploy,
              deployment,
            });
          }

          if (existingWarState.value === 'war-complete') {
            const victor = getScoreboard({
              players: existingWarState.context.players,
              tiles: Object.values(existingWarState.context.tiles),
            })[0].id;
            const updatedAt = Date.now();

            await this.warModel.updateOne(
              {
                warId: event.warId,
              },
              {
                completed_at: updatedAt,
                updated_at: updatedAt,
              }
            );

            await this.entityModel.updateOne(
              { table: 'wars', _id: event.warId },
              {
                victor_id: victor,
                turn_id: null,
                status: 'war-complete',
                updated_on_server: updatedAt,
                updated_at: updatedAt,
              }
            );
            this.sharedService.next({
              type: 'war-completed',
              roomId: event.warId,
            });
            this.sharedService.next({
              roomId: 'live-updates',
              war: {
                id: event.warId,
                victor,
                turn: null,
                status: 'war-complete',
                updatedAt,
              },
              type: 'war-change',
            });
            this.citadelService.enqueue();
          }

          return { state: existingWarState, ...event };
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
