import { ProductImage } from '../entities/product-image.entity.js';

export class ResponseProductImageDto {
  id!: string;
  url!: string;
  isPrimary!: boolean;
  sortOrder!: number;

  static fromEntity(image: ProductImage): ResponseProductImageDto {
    const dto = new ResponseProductImageDto();
    dto.id = image.id;
    dto.url = image.url;
    dto.isPrimary = image.isPrimary;
    dto.sortOrder = image.sortOrder;
    return dto;
  }
}
