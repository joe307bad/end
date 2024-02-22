import { Injectable } from '@nestjs/common';
import { InjectModel, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/users.service';

@Schema()
export class Entity {
  @Prop({ required: true })
  table: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);

export class CreateEntitySchema {
  readonly table: string;
}

@Injectable()
export class SyncService {
  constructor(@InjectModel(Entity.name) private entityModel: Model<Entity>) {}

  findAll(): Promise<Entity[]> {
    return this.entityModel.find({});
  }

  getAllByType(table: string) {
    return this.entityModel.find({
      table,
    });
  }

  findById(id: string): Promise<Entity> {
    return this.entityModel.find({ id }).then((response) => response[0]);
  }

  getCreatedAfterTimestamp(table: string, timestamp: number) {
    return this.entityModel.find({
      table,
      created_on_server: timestamp,
    });
  }

  getDeletedByType(type: string) {
    return this.unitRepo
      .find({
        selector: {
          type: { $eq: type },
          deleted: { $eq: true },
        },
        limit: 1000,
      })
      .then((response) =>
        response.docs.map((d) => {
          // @ts-ignore
          d.id = d._id;
          delete d._id;
          delete d._rev;
          delete d.type;
          return d;
        })
      );
  }

  getDeletedAfterTimestamp(type: string, timestamp: number) {
    return this.unitRepo
      .find({
        selector: {
          type: { $eq: type },
          created_on_server: { $gt: timestamp },
        },
        limit: 1000,
      })
      .then((response) =>
        response.docs.map((d) => {
          // @ts-ignore
          d.id = d._id;
          delete d._id;
          delete d._rev;
          delete d.type;
          return d;
        })
      );
  }

  async getUpdatedAfterTimestamp(
    type: string,
    timestamp: number,
    created: any[]
  ) {
    const c = created.map((c) => c.id);
    const b = await this.unitRepo
      .find({
        selector: {
          type: { $eq: type },
          _id: { $nin: c },
          deleted: { $eq: false },
          updated_on_server: { $gt: timestamp },
        },
        limit: 1000,
      })
      .then((response) =>
        response.docs.map((d) => {
          // @ts-ignore
          d.id = d._id;
          delete d._id;
          delete d._rev;
          delete d.type;
          return d;
        })
      );

    return b;
  }

  create(unit: any): Promise<DocumentInsertResponse> {
    return this.unitRepo.insert(unit);
  }

  async update(unit: any): Promise<DocumentInsertResponse> {
    const existingEntity = await this.unitRepo
      .get(unit._id)
      .catch((e) => false);

    return this.unitRepo.insert({
      // @ts-ignore
      ...(existingEntity !== false ? existingEntity : {}),
      ...unit,
    });
  }
}
