import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from '../services/user.service.js';
import { User } from '../entities/user.entity.js';
import { ResponseUserDto } from '../dto/response-user.dto.js';
import { UserRole, UserStatus } from '../../../common/enums/user.enum.js';

import type { Mock } from 'vitest';
describe('UserController', () => {
  let controller: UserController;
  let userService: {
    create: Mock;
    findAll: Mock;
    findOne: Mock;
    updateByAdmin: Mock;
    remove: Mock;
  };

  const user = {
    id: 'user-id-1',
    clerkId: 'clerk-1',
    email: 'jane@example.com',
    role: UserRole.USER,
    firstName: 'Jane',
    lastName: 'Doe',
    phoneNumber: null,
    avatarUrl: null,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as User;

  beforeEach(async () => {
    userService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      updateByAdmin: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(UserController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('delegates to UserService.create and returns its result', async () => {
      const dto = {
        clerkId: 'clerk-1',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      userService.create.mockResolvedValue(user);

      const result = await controller.create(dto);

      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(ResponseUserDto.fromEntity(user));
    });
  });

  describe('findAll', () => {
    it('delegates to UserService.findAll and maps data to ResponseUserDto, passing meta through', async () => {
      const meta = { limit: 10, currentPage: 1, pageCount: 1, totalCount: 1 };
      userService.findAll.mockResolvedValue({ data: [user], meta });

      const result = await controller.findAll(
        { page: 1, limit: 10, role: UserRole.ADMIN },
        user,
      );

      expect(userService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10, search: undefined },
        { role: UserRole.ADMIN },
        { includeDeleted: true, excludeId: user.id },
      );
      expect(result).toEqual({
        data: [ResponseUserDto.fromEntity(user)],
        meta,
      });
    });

    it('propagates BadRequestException', async () => {
      userService.findAll.mockRejectedValue(new BadRequestException());

      await expect(
        controller.findAll({ page: 999, limit: 10 }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the response DTO built from the authenticated user, without calling UserService', () => {
      const result = controller.getCurrentUser(user);

      expect(result).toEqual(ResponseUserDto.fromEntity(user));
      expect(userService.findOne).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('delegates to UserService.findOne', async () => {
      userService.findOne.mockResolvedValue(user);

      const result = await controller.findOne({ id: 'user-id-1' });

      expect(userService.findOne).toHaveBeenCalledWith('user-id-1', {
        includeDeleted: true,
      });
      expect(result).toEqual(ResponseUserDto.fromEntity(user));
    });

    it('propagates NotFoundException', async () => {
      userService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne({ id: 'missing-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('delegates to UserService.updateByAdmin', async () => {
      const dto = { firstName: 'Janet' };
      const updatedUser = { ...user, firstName: 'Janet' };
      userService.updateByAdmin.mockResolvedValue(updatedUser);

      const result = await controller.update({ id: 'user-id-1' }, dto);

      expect(userService.updateByAdmin).toHaveBeenCalledWith('user-id-1', dto);
      expect(result).toEqual(ResponseUserDto.fromEntity(updatedUser));
    });

    it('propagates NotFoundException', async () => {
      userService.updateByAdmin.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update({ id: 'missing-id' }, { firstName: 'Janet' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('delegates to UserService.remove', async () => {
      userService.remove.mockResolvedValue(undefined);

      await controller.remove({ id: 'user-id-1' });

      expect(userService.remove).toHaveBeenCalledWith('user-id-1');
    });

    it('propagates NotFoundException', async () => {
      userService.remove.mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove({ id: 'missing-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
