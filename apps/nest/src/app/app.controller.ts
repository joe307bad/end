import { Controller, Get, Inject } from '@nestjs/common';

import { SharedService } from './shared/shared.service';
import { InjectModel } from '@nestjs/mongoose';
import { Entity } from './sync/sync.service';
import { Model } from 'mongoose';
import { User } from './users/users.service';
import { CitadelFeed, CitadelService } from './citadel/citadel.service';
import { Public } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private citadelService: CitadelService) {}

  @Get('citadel')
  async citadel() {
    return this.citadelService.getLatest().then((r) => r ?? {});
  }
}
