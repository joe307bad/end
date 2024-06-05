import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { warMachine, Event } from '@end/war/core';
import { createActor } from 'xstate';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entity } from '../sync/sync.service';

@Controller('conquest')
@Public()
export class ConquestController {
  constructor(@InjectModel(Entity.name) private entityModel: Model<Entity>) {}

  @Post()
  log(@Body() event: Event) {
    const warActor = createActor(warMachine());
    warActor.start();
    warActor.send(event);
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
