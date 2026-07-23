import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}
}
