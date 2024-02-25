import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  async pullChanges(@Query() query: Record<string, string>) {
    const { last_pulled_at, tables } = query;
    const lastPulledAt = last_pulled_at === 'null' ? 0 : Number(last_pulled_at);
    try {
      const changes = await tables
        .split(',')
        .reduce<any[]>((acc, i) => {
          acc.push(i.replace(/[^A-Za-z0-9_]/g, ''));
          return acc;
        }, [])
        .reduce<Promise<any>>(async (acc, table) => {
          const a = await acc;
          const created = await this.syncService.getCreatedAfterTimestamp(
            table,
            lastPulledAt
          );

          const deletedFromThisTable =
            await this.syncService.getDeletedByTypeAfterTimestamp(
              table,
              lastPulledAt
            );

          a[table] = {
            created,
            updated: await this.syncService.getUpdatedAfterTimestamp(
              table,
              lastPulledAt,
              created
            ),
            deleted: deletedFromThisTable.map((d: any) => d.id),
          };

          return a;
        }, Promise.resolve({}));

      const now = Date.now();

      return {
        changes,
        timestamp: now,
      };
    } catch (e) {
      throw new HttpException(
        `Pull Changes Failed: ${e.toString()}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  pushChanges(
    @Body() changes: SyncDatabaseChangeSet,
    @Query() query: Record<string, any>
  ) {
    // TODO does this need to be used? lol
    let { last_pulled_at } = query;
    last_pulled_at = Number(last_pulled_at);
    try {
      for (const table in changes) {
        for (const changeType in changes[table]) {
          switch (changeType) {
            case 'created':
              // TODO change this to a createMany
              changes[table][changeType].forEach((entity) => {
                delete entity._status;
                delete entity._changed;
                entity._id = entity.id;
                entity.created_on_server = last_pulled_at;
                delete entity.id;
                this.syncService.create({ table, ...entity }).catch((e) => {
                  console.error(
                    new HttpException(
                      `Push Changes Failed: ${e.toString()}`,
                      HttpStatus.INTERNAL_SERVER_ERROR
                    )
                  );
                });
              });
              break;
            case 'updated':
              // TODO change this to a updateMany
              changes[table][changeType].forEach((entity) => {
                delete entity._status;
                delete entity._changed;
                entity._id = entity.id;
                entity.updated_on_server = last_pulled_at;
                delete entity.id;
                this.syncService.update({ table, ...entity }).catch((e) => {
                  throw new HttpException(
                    `Push Changes Failed: ${e.toString()}`,
                    HttpStatus.INTERNAL_SERVER_ERROR
                  );
                });
              });
              break;
            case 'deleted':
              changes[table][changeType].forEach(async (id) => {
                this.syncService
                  .update({
                    table,
                    ...{
                      _id: id,
                      deleted_on_server: last_pulled_at,
                      deleted: true,
                    },
                  })
                  .catch((e) => {
                    throw new HttpException(
                      `Push Changes Failed: ${e.toString()}`,
                      HttpStatus.INTERNAL_SERVER_ERROR
                    );
                  });
              });
              break;
          }
        }
      }
      return 'Push Changes success';
    } catch (e) {
      throw new HttpException(
        `Push Changes Failed: ${e.toString()}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
