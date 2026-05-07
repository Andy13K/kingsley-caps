jest.mock('../../src/models', () => ({
  Notification: { create: jest.fn(), findAndCountAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), count: jest.fn() },
  User: { findAll: jest.fn(), findOne: jest.fn() },
  Store: { findOne: jest.fn() },
}));

jest.mock('../../src/utils/AppError', () => {
  return class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = true;
    }
  };
});

jest.mock('../../src/utils/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));

const { Notification, User, Store } = require('../../src/models');
const notificationService = require('../../src/services/notificationService');

describe('notificationService.createLowStockAlert', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates notification for the correct vendor', async () => {
    Store.findOne.mockResolvedValue({ id: 'store-uuid', vendor_id: 'vendor-uuid' });
    Notification.create.mockResolvedValue({});

    const variant = { id: 'v-uuid', store_id: 'store-uuid', product_id: 'p-uuid', sku: 'CAP-001', low_stock_threshold: 3 };

    await notificationService.createLowStockAlert({ variant, stockAfter: 2 });

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'vendor-uuid',
        store_id: 'store-uuid',
        type: 'low_stock',
      })
    );
  });

  test('does nothing when store is not found', async () => {
    Store.findOne.mockResolvedValue(null);

    await notificationService.createLowStockAlert({
      variant: { store_id: 'missing-store', sku: 'CAP-X', low_stock_threshold: 3 },
      stockAfter: 1,
    });

    expect(Notification.create).not.toHaveBeenCalled();
  });
});

describe('notificationService.createPaymentConfirmedNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates two notifications: one for customer and one for vendor', async () => {
    Store.findOne.mockResolvedValue({ id: 'store-uuid', vendor_id: 'vendor-uuid' });
    Notification.create.mockResolvedValue({});

    const order = { id: 'order-uuid', customer_id: 'customer-uuid', store_id: 'store-uuid' };
    const payment = { id: 'payment-uuid', amount_fiat: 700, amount_crypto: '0.2' };

    await notificationService.createPaymentConfirmedNotification({ order, payment });

    expect(Notification.create).toHaveBeenCalledTimes(2);

    const calls = Notification.create.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.user_id === 'customer-uuid' && c.type === 'payment_confirmed')).toBe(true);
    expect(calls.some((c) => c.user_id === 'vendor-uuid' && c.type === 'payment_received')).toBe(true);
  });
});

describe('notificationService.createDiscrepancyAlert', () => {
  beforeEach(() => jest.clearAllMocks());

  test('notifies ALL superadmins when discrepancy occurs', async () => {
    User.findAll.mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);
    Notification.create.mockResolvedValue({});

    const payment = { id: 'payment-uuid', store_id: 'store-uuid', amount_crypto: '0.2' };
    const order = { id: 'order-uuid' };

    await notificationService.createDiscrepancyAlert({ payment, order });

    expect(User.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: 'superadmin' } })
    );
    expect(Notification.create).toHaveBeenCalledTimes(2);

    const calls = Notification.create.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => c.user_id === 'admin-1' && c.type === 'payment_discrepancy')).toBe(true);
    expect(calls.some((c) => c.user_id === 'admin-2' && c.type === 'payment_discrepancy')).toBe(true);
  });

  test('creates no notifications when there are no superadmins', async () => {
    User.findAll.mockResolvedValue([]);
    await notificationService.createDiscrepancyAlert({ payment: { id: 'p', store_id: 's', amount_crypto: '0.1' }, order: { id: 'o' } });
    expect(Notification.create).not.toHaveBeenCalled();
  });
});

describe('notificationService.getUserNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns paginated notifications with unread count', async () => {
    const mockRows = [{ id: 'n1', read: false }, { id: 'n2', read: true }];
    Notification.findAndCountAll.mockResolvedValue({ count: 10, rows: mockRows });
    Notification.count.mockResolvedValue(5);

    const result = await notificationService.getUserNotifications({ userId: 'u-uuid', page: 1, limit: 20 });

    expect(result.notifications).toEqual(mockRows);
    expect(result.total).toBe(10);
    expect(result.unreadCount).toBe(5);
    expect(Notification.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 'u-uuid' }, limit: 20, offset: 0 })
    );
  });

  test('filters by unread when unreadOnly is true', async () => {
    Notification.findAndCountAll.mockResolvedValue({ count: 3, rows: [] });
    Notification.count.mockResolvedValue(3);

    await notificationService.getUserNotifications({ userId: 'u-uuid', unreadOnly: true, page: 1, limit: 10 });

    expect(Notification.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 'u-uuid', read: false } })
    );
  });
});

describe('notificationService.markAsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  test('marks notification as read when it belongs to the user', async () => {
    const mockNotification = { id: 'n-uuid', user_id: 'u-uuid', update: jest.fn().mockResolvedValue(true) };
    Notification.findOne.mockResolvedValue(mockNotification);

    await notificationService.markAsRead({ notificationId: 'n-uuid', userId: 'u-uuid' });

    expect(Notification.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'n-uuid', user_id: 'u-uuid' } })
    );
    expect(mockNotification.update).toHaveBeenCalledWith({ read: true });
  });

  test('throws AppError when notification does not belong to user', async () => {
    Notification.findOne.mockResolvedValue(null);

    await expect(
      notificationService.markAsRead({ notificationId: 'n-uuid', userId: 'wrong-user' })
    ).rejects.toThrow('Notificación no encontrada');
  });
});
