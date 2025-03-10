import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { NonWorkingDayService } from './non-working-day.service';
import { CreateNonWorkingDayDto } from './dto/create-non-working-day.dto';
import { UpdateNonWorkingDayDto } from './dto/update-non-working-day.dto';

@Controller('non-working-day')
export class NonWorkingDayController {
  constructor(private readonly nonWorkingDayService: NonWorkingDayService) {}

  @Post()
  create(@Body() createNonWorkingDayDto: CreateNonWorkingDayDto) {
    // return createNonWorkingDayDto;
    return this.nonWorkingDayService.create(createNonWorkingDayDto);
  }

  @Get()
  findAll() {
    return this.nonWorkingDayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nonWorkingDayService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateNonWorkingDayDto: UpdateNonWorkingDayDto,
  ) {
    return this.nonWorkingDayService.update(id, updateNonWorkingDayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nonWorkingDayService.remove(+id);
  }
}
