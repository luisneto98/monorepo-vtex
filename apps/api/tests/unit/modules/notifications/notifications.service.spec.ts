import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../../src/modules/notifications/notifications.service';
import {
  Notification,
  NotificationStatus,
} from '../../../../src/modules/notifications/schemas/notification.schema';
import {
  DeviceToken,
  Platform,
} from '../../../../src/modules/notifications/schemas/device-token.schema';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: any;
  let deviceTokenModel: any;

  const mockNotification = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Notification',
    message: 'Test Message',
    status: NotificationStatus.DRAFT,
    deviceCount: 100,
    createdBy: '507f1f77bcf86cd799439012',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockNotificationModel = {
    new: jest.fn().mockResolvedValue(mockNotification),
    constructor: jest.fn().mockResolvedValue(mockNotification),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockDeviceTokenModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(DeviceToken.name),
          useValue: mockDeviceTokenModel,
        },
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationModel = module.get(getModelToken(Notification.name));
    deviceTokenModel = module.get(getModelToken(DeviceToken.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const dto = {
        title: 'Test',
        message: 'Test message',
      };

      deviceTokenModel.countDocuments.mockResolvedValue(100);

      const savedNotification = {
        _id: '507f1f77bcf86cd799439011',
        ...dto,
        status: NotificationStatus.DRAFT,
        deviceCount: 100,
      };

      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedNotification),
      }));

      notificationModel.constructor = mockConstructor;
      Object.setPrototypeOf(notificationModel, mockConstructor.prototype);

      // Mock the model as a constructor function
      (service as any).notificationModel = mockConstructor;

      const result = await service.createNotification(dto, '507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result._id).toBe('507f1f77bcf86cd799439011');
    });
  });

  describe('scheduleNotification', () => {
    it('should schedule a notification for future delivery', async () => {
      const notificationId = '507f1f77bcf86cd799439011';
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now

      await service.scheduleNotification(notificationId, futureDate);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-notification',
        { notificationId },
        expect.objectContaining({
          delay: expect.any(Number),
          removeOnComplete: true,
          attempts: 3,
        }),
      );
    });

    it('should throw error when scheduling in the past', async () => {
      const notificationId = '507f1f77bcf86cd799439011';
      const pastDate = new Date(Date.now() - 60000); // 1 minute ago

      await expect(service.scheduleNotification(notificationId, pastDate)).rejects.toThrow(
        'Cannot schedule notification in the past',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const notifications = [mockNotification];

      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(notifications),
              }),
            }),
          }),
        }),
      });

      mockNotificationModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: notifications,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });
  });

  describe('getStats', () => {
    it('should return notification statistics', async () => {
      mockNotificationModel.countDocuments
        .mockResolvedValueOnce(50) // totalSent
        .mockResolvedValueOnce(5) // totalFailed
        .mockResolvedValueOnce(10); // totalScheduled

      mockDeviceTokenModel.countDocuments.mockResolvedValue(100);

      const stats = await service.getStats();

      expect(stats).toEqual({
        totalSent: 50,
        totalFailed: 5,
        totalScheduled: 10,
        totalDevices: 100,
        deliveryRate: expect.any(Number),
      });
    });
  });

  describe('registerDevice', () => {
    it('should register a new device token', async () => {
      const dto = {
        token: 'test-token',
        platform: Platform.IOS,
        isTestDevice: false,
      };

      mockDeviceTokenModel.findOne.mockResolvedValue(null);

      const savedToken = { _id: '123', ...dto };

      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedToken),
      }));

      (service as any).deviceTokenModel = Object.assign(mockConstructor, {
        findOne: mockDeviceTokenModel.findOne,
      });

      const result = await service.registerDevice(dto, '507f1f77bcf86cd799439012');

      expect(result).toBeDefined();
      expect(result._id).toBe('123');
    });

    it('should update existing device token', async () => {
      const dto = {
        token: 'existing-token',
        platform: Platform.ANDROID,
      };

      const existingDevice = {
        ...dto,
        save: jest.fn().mockResolvedValue({ _id: '123', ...dto }),
      };

      mockDeviceTokenModel.findOne.mockResolvedValue(existingDevice);

      await service.registerDevice(dto);

      expect(existingDevice.save).toHaveBeenCalled();
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification to specific device', async () => {
      const deviceId = '507f1f77bcf86cd799439011';
      const device = {
        _id: deviceId,
        token: 'test-token',
        platform: 'ios',
      };

      mockDeviceTokenModel.findById.mockResolvedValue(device);

      await service.sendTestNotification('Test Title', 'Test Message', deviceId);

      expect(mockDeviceTokenModel.findById).toHaveBeenCalledWith(deviceId);
    });

    it('should throw NotFoundException if device not found', async () => {
      mockDeviceTokenModel.findById.mockResolvedValue(null);

      await expect(service.sendTestNotification('Test', 'Test', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
