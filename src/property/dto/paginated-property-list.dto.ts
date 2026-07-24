import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto.js';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto.js';
import { PropertyResponseDto } from './property-response.dto.js';

export class PaginatedPropertyListDto extends PaginatedResponseDto<PropertyResponseDto> {
  @ApiProperty({ type: [PropertyResponseDto] })
  declare items: PropertyResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  declare meta: PaginationMetaDto;
}
