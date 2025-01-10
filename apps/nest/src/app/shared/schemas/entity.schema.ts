import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ strict: false })
export class Entity {
  @Prop({ required: true })
  table: string;

  @Prop()
  _id: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);
