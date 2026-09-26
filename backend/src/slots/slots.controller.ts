import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { SlotsService } from './slots.service.js';
import { SlotDto, SlotsResponse } from '../common/swagger/api-schemas.js';

@ApiTags('Slots')
@ApiExtraModels(SlotsResponse, SlotDto)
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({
    summary: 'List available slots',
    description:
      'Returns all slots that do **not** have an active booking, ' +
      'sorted by `startsAt` ascending, then `id` ascending. ' +
      'No authentication required.',
  })
  @ApiOkResponse({
    description: 'A list of available slots.',
    schema: { $ref: getSchemaPath(SlotsResponse) },
    content: {
      'application/json': {
        example: {
          slots: [
            {
              id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              startsAt: '2030-01-15T09:00:00.000Z',
              endsAt: '2030-01-15T09:30:00.000Z',
            },
            {
              id: '4cb96g75-6828-5673-c4gd-3d074g77bgb7',
              startsAt: '2030-01-15T09:30:00.000Z',
              endsAt: '2030-01-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
  getAvailableSlots() {
    return this.slotsService.getAvailableSlots();
  }
}
