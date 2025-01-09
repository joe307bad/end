import { Controller, Get, } from '@nestjs/common';
import { CitadelService } from './citadel/citadel.service';

@Controller()
export class AppController {
  constructor(private citadelService: CitadelService) {}

  @Get('citadel')
  async citadel() {
    return this.citadelService.getLatest().then((r) => r ?? {});
  }
}
