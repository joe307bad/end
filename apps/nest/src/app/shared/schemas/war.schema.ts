import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongoose';


@Schema({ strict: false })
export class War {
  @Prop({ required: true })
  warId: string;

  @Prop({ type: Number })
  completed_at: number;

  _id: ObjectId;

  context: any;
}

export const WarSchema = SchemaFactory.createForClass(War);
