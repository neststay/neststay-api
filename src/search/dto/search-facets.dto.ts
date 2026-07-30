import { ApiProperty } from '@nestjs/swagger';

export class FacetCountItemDto {
  @ApiProperty({ type: String, description: 'Facet value', example: 'Goa' })
  value: string;

  @ApiProperty({
    type: Number,
    description: 'Number of matching properties for this value',
    example: 5,
  })
  count: number;
}

export class SearchFacetsDto {
  @ApiProperty({ type: FacetCountItemDto, isArray: true })
  locationName: FacetCountItemDto[];

  @ApiProperty({ type: FacetCountItemDto, isArray: true })
  placeTypeName: FacetCountItemDto[];

  @ApiProperty({ type: FacetCountItemDto, isArray: true })
  numberOfGuests: FacetCountItemDto[];

  @ApiProperty({ type: FacetCountItemDto, isArray: true })
  numberOfBedrooms: FacetCountItemDto[];

  @ApiProperty({ type: FacetCountItemDto, isArray: true })
  numberOfBathrooms: FacetCountItemDto[];
}
