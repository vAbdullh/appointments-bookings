import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SlotsService } from './slots.service.js';

@ApiTags('slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available slots' })
  getAvailableSlots() {
    return this.slotsService.getAvailableSlots();
  }
}
