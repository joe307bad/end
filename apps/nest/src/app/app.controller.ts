import { Controller, Get, Inject } from '@nestjs/common';

import { AppService } from './app.service';
import { InjectModel } from '@nestjs/mongoose';
import { Entity } from './sync/sync.service';
import { Model } from 'mongoose';
import { User } from './users/users.service';
import { CitadelService } from './citadel/citadel.service';
import { Public } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(
    private citadelService: CitadelService,
    @InjectModel(Entity.name) private entityModel: Model<Entity>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  @Get('citadel')
  @Public()
  async citadel() {
    await this.citadelService.recalculate();
    return "Citadel"
  }
}
