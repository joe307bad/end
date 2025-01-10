import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitadelFeedSchema, CitadelService } from './citadel.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      {
        name: 'citadel-feed',
        collection: 'citadel-feed',
        schema: CitadelFeedSchema,
      },
    ]),
  ],
  providers: [CitadelService],
  exports: [CitadelService],
})
export class CitadelModule {}
