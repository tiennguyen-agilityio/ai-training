import { ApiProperty } from '@nestjs/swagger';

export class MetaDto {
  @ApiProperty()
  limit!: number;

  @ApiProperty()
  currentPage!: number;

  @ApiProperty()
  pageCount!: number;

  @ApiProperty()
  totalCount!: number;
}

export class PaginatedResult<T> {
  data!: T[];
  meta!: MetaDto;
}
