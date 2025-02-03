import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '../shared/shared.module';
import { Code, CodeSchema, CodeService } from './code.service';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([
      {
        name: Code.name,
        schema: CodeSchema,
      },
    ]),
  ],
  providers: [CodeService],
  exports: [CodeService],
})
export class CodeModule {}
