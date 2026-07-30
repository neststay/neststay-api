import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto.js';
import { SearchResultItemDto } from './search-result-item.dto.js';
import { SearchFacetsDto } from './search-facets.dto.js';

export class SearchResponseDto {
  @ApiProperty({
    type: String,
    description: 'Generated id for this search request',
    example: '01JABC1234567890ABCDEFGH',
  })
  searchId: string;

  @ApiProperty({ type: SearchResultItemDto, isArray: true })
  items: SearchResultItemDto[];

  @ApiProperty({ type: () => SearchFacetsDto })
  facets: SearchFacetsDto;

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
