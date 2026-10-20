import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiProperty()
  errCode!: string;

  @ApiProperty()
  field!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  description!: string;
}

export class ErrorResponseDto {
  @ApiProperty()
  statusCode!: number;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: () => ErrorDetailDto, isArray: true })
  errors!: ErrorDetailDto[];
}
