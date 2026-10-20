import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../common/enums/user.enum.js';
import { User } from '../entities/user.entity.js';

export class ResponseUserDto {
  id!: string;
  clerkId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  avatarUrl: string | null = null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  deletedAt: Date | null = null;

  static fromEntity(user: User): ResponseUserDto {
    const dto = new ResponseUserDto();
    dto.id = user.id;
    dto.clerkId = user.clerkId;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.status = user.status;
    dto.avatarUrl = user.avatarUrl;
    dto.deletedAt = user.deletedAt;
    return dto;
  }
}
