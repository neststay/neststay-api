import { Module } from '@nestjs/common';
import { PropertyModule } from '../property/property.module.js';
import { AvailabilityController } from './availability.controller.js';
import { BookingController } from './booking.controller.js';
import { BookingRepository } from './booking.repository.js';
import { BookingService } from './booking.service.js';

@Module({
  imports: [PropertyModule],
  controllers: [AvailabilityController, BookingController],
  providers: [BookingRepository, BookingService],
  exports: [BookingService],
})
export class BookingModule {}
