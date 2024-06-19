import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/auth.guard';
import { warMachine, Event } from '@end/war/core';
import { createActor } from 'xstate';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Entity } from '../sync/sync.service';

@Schema({ strict: false })
export class War {
  @Prop({ required: true })
  state: string;

  _id: ObjectId;
}

export const WarSchema = SchemaFactory.createForClass(War);

@Controller('conquest')
@Public()
export class ConquestController {
  constructor(
    @InjectModel(War.name) private warModel: Model<War>,
    @InjectModel(Entity.name) private entityModel: Model<Entity>
  ) {}

  @Post()
  async log(@Body() event: Event) {
    switch (event.type) {
      case 'generate-new-war':
        const warActor = createActor(warMachine(event.warId));
        warActor.start();
        warActor.send(event);
        const state = warActor.getSnapshot();
        await this.warModel
          .create({ state: JSON.stringify(state) })
          .then((r) => {
            return { id: r._id };
          });

        return { state, warId: event.warId };
      case 'attack':
        const war = await this.warModel.findById(event.warId).exec();
        const warState = JSON.parse(war.state);
        const existingWarActor = createActor(warMachine(event.warId, warState));
        existingWarActor.start();
        existingWarActor.send(event);
        const existingWarState = existingWarActor.getSnapshot();
        await this.warModel
          .updateOne(
            { _id: event.warId },
            { state: JSON.stringify(existingWarState) }
          )
          .then((r) => {
            return { id: r.upsertedId };
          });

        return existingWarState;
    }
  }

  @Get('war/:id')
  async war(@Param() params: { id?: string }) {
    console.log(params.id);
    const war = await this.entityModel
      .findOne({
        table: 'wars',
        _id: { $eq: params.id },
      })
      .exec();
    return { war };
  }
}
