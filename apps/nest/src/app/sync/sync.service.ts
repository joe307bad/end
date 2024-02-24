import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Schema({ strict: false })
export class Entity {
  @Prop({ required: true })
  table: string;

  @Prop()
  _id: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);

export class CreateEntitySchema {
  readonly table: string;
}

@Injectable()
export class SyncService {
  constructor(@InjectModel(Entity.name) private entityModel: Model<Entity>) {}

  getCreatedAfterTimestamp(table: string, timestamp: number) {
    return this.entityModel
      .find({
        table,
        created_on_server: { $gt: timestamp },
      })
      .exec()
      .then((response) =>
        response.map((d: any) => {
          return {
            id: d._id,
            ...d
          };
        })
      );
  }

  getDeletedByType(table: string) {
    return this.entityModel.find({ table, deleted: true }).exec();
  }

  async getUpdatedAfterTimestamp(
    table: string,
    timestamp: number,
    created: any[]
  ) {
    const createdIds = created.map((c) => c.id);
    return this.entityModel
      .find({
        table,
        delete: false,
        updated_on_server: timestamp,
      })
      .exec()
      .then((r) => r.filter((e) => !createdIds.some((id) => id === e.id)));
  }

  create(entity: any): Promise<{ id: Types.ObjectId | string }> {
    return this.entityModel.create(entity).then((r: any) => {
      return { id: r._id };
    });
  }

  async update(entity: any): Promise<{ id: Types.ObjectId }> {
    return this.entityModel
      .updateOne({ _id: entity.id }, entity)
      .then((r) => ({ id: r.upsertedId }));
  }
}
