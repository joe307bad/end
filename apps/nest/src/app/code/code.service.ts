import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { War } from '../shared/schemas/war.schema';
import { Entity } from '../shared/schemas/entity.schema';
import { SharedService } from '../shared/shared.service';
import { CitadelFeed } from '../citadel/citadel.service';

@Schema({ strict: false })
export class Code {
  @Prop()
  _id: string;

  @Prop()
  code: string;
}

export const CodeSchema = SchemaFactory.createForClass(Code);

@Injectable()
export class CodeService {
  constructor(@InjectModel(Code.name) private codeModel: Model<Code>) {}

  codeExists(code: string) {
    return this.codeModel.exists({ code });
  }
}
