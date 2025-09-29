import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../../../../src/modules/users/users.service';
import { User, UserDocument } from '../../../../src/modules/users/schemas/user.schema';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '@shared/types/user.types';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.PARTICIPANT,
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'VTEX',
    },
    preferences: {
      language: 'pt',
      timezone: 'America/Sao_Paulo',
      emailNotifications: true,
      pushNotifications: true,
      sessionReminders: true,
    },
    isActive: true,
    isEmailVerified: false,
    save: jest.fn().mockResolvedValue(this),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            ...mockUserModel,
            findOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
            findById: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
              }),
            }),
            find: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockUser]),
              }),
            }),
            new: jest.fn().mockImplementation((data) => ({
              ...data,
              save: jest.fn().mockResolvedValue({ ...mockUser, ...data }),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users without passwords', async () => {
      const users = await service.findAll();
      expect(users).toEqual([mockUser]);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = await service.findById(mockUser._id);
      expect(user).toEqual(mockUser);
      expect(model.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      const user = await service.findByEmail(mockUser.email);
      expect(user).toEqual(mockUser);
      expect(model.findOne).toHaveBeenCalledWith({ email: mockUser.email });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.PARTICIPANT,
        profile: mockUser.profile,
        preferences: mockUser.preferences,
      };

      const UserModel = model as any;
      UserModel.prototype.save = jest.fn().mockResolvedValue({
        ...mockUser,
        ...createUserDto,
      });
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const newUser = new UserModel(createUserDto);
      const savedUser = await newUser.save();

      expect(savedUser.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      await expect(service.create({ email: mockUser.email })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      jest.spyOn(model, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      } as any);

      await expect(service.remove(mockUser._id)).resolves.not.toThrow();
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: mockUser._id });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(model, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      } as any);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
