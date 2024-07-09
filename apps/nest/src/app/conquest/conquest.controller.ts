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

  @Prop({ required: true })
  warId: string;

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
          .create({ state: JSON.stringify(state), warId: event.warId })
          .then((r) => {
            return { id: r._id };
          });

        return { state, warId: event.warId };
      case 'attack':
        const war = await this.warModel.findOne({ warId: event.warId }).exec();
        const warState = JSON.parse(war.state);
        const existingWarActor = createActor(
          warMachine(event.warId, warState.context, warState.value)
        );
        existingWarActor.start();
        existingWarActor.send(event);
        const existingWarState = existingWarActor.getSnapshot();
        const r = await this.warModel
          .updateOne(
            { warId: event.warId },
            { state: JSON.stringify(existingWarState), warId: event.warId }
          )
          .then((r) => {
            return { id: r.upsertedId };
          });

        return { state: existingWarState, warId: event.warId };
    }
  }

  @Get('war/:id')
  async war(@Param() params: { id?: string }) {
    const war = await this.warModel
      .findOne({
        warId: { $eq: params.id },
      })
      .exec();
    return { war };
  }
}
