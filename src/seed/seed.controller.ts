import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  //   @Roles(Role.SuperAdmin)
  exejutePreloadData() {
    const dataUsers = this.seedService.preloadDataUser();
    const dataRegistrations = this.seedService.preloadDataRegistration();
    const dataMinistries = this.seedService.preloadDataMinistries();
    return { dataUsers, dataRegistrations, dataMinistries };
  }
}
