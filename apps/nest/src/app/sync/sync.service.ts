import { Injectable } from '@nestjs/common';
import { InjectModel, SchemaFactory } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entity } from '../shared/schemas/entity.schema';


@Injectable()
export class SyncService {
  constructor(@InjectModel(Entity.name) private entityModel: Model<Entity>) {}

  getCreatedAfterTimestamp(table: string, timestamp: number) {
    return this.entityModel
      .find({
        table,
        created_on_server: { $gt: timestamp },
        deleted: { $ne: true },
      })
      .exec()
      .then((response) =>
        response.map((d) => {
          return {
            id: d._id,
            ...d,
          };
        })
      );
  }

  getDeletedByTypeAfterTimestamp(table: string, timestamp: number) {
    return this.entityModel
      .find({
        table,
        deleted: true,
        deleted_on_server: { $gt: timestamp },
      })
      .exec();
  }

  async getUpdatedAfterTimestamp(
    table: string,
    timestamp: number,
    created: { id: string }[]
  ) {
    const createdIds = created.map((c) => c.id);
    return this.entityModel
      .find({
        table,
        _id: { $nin: createdIds },
        deleted: { $ne: true },
        updated_on_server: { $gt: timestamp },
      })
      .exec()
      .then((response) =>
        response.map((d) => {
          return {
            id: d._id,
            ...d,
          };
        })
      );
  }

  create(
    entity: Record<string, string>
  ): Promise<{ id: Types.ObjectId | string }> {
    return this.entityModel.create(entity).then((r) => {
      return { id: r._id };
    });
  }

  async update(entity): Promise<{ id: Types.ObjectId }> {
    return this.entityModel
      .updateOne({ _id: entity._id }, entity)
      .then((r) => ({ id: r.upsertedId }));
  }
}
