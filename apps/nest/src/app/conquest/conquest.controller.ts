import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { warMachine } from '@end/war/core';
import { createActor } from 'xstate';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entity } from '../sync/sync.service';

@Controller('conquest')
@Public()
export class ConquestController {
  constructor(@InjectModel(Entity.name) private entityModel: Model<Entity>) {}

  @Post()
  log(@Body() warId: string) {
    const warActor = createActor(warMachine);
    warActor.start();
    warActor.send({
      type: 'generate-new-war',
      players: ['1', '2'],
      tiles: {
        '1': {
          id: '1',
          owner: '1',
          troopCount: 0,
          neighborIds: ['2'],
          habitable: true,
        },
        '2': {
          id: '2',
          owner: '2',
          troopCount: 0,
          neighborIds: ['1'],
          habitable: true,
        },
      },
    });
    warActor.send({ type: 'attack', tile1: '1', tile2: '2' });
    return warActor.getSnapshot();
  }

  @Get('war/:id')
  war(@Param() params: { id?: string }) {
    console.log(params.id);
    const war = this.entityModel
      .findOne({
        table: 'wars',
        _id: { $eq: params.id },
      })
      .exec();
    return war;
  }
}
