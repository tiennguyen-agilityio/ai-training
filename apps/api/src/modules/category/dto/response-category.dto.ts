import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity.js';

export class ResponseCategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ nullable: true, type: Date, example: null })
  deletedAt!: Date | null;

  static fromEntity(category: Category): ResponseCategoryDto {
    const dto = new ResponseCategoryDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    dto.deletedAt = category.deletedAt;
    return dto;
  }
}
