jest.mock('../../src/models', () => ({
  sequelize: {
    transaction: jest.fn(),
    literal: jest.fn((sql) => ({ sql })),
  },
  Product: { findAll: jest.fn() },
  Order: { findAll: jest.fn() },
  OrderItem: {},
  ProductVariant: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  User: {},
  Store: {},
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

const { Op } = require('sequelize');
const { Product, Order } = require('../../src/models');
const inventoryService = require('../../src/services/inventoryService');

describe('inventoryService.getDemandData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('queries Product and Order filtered by store_id', async () => {
    Product.findAll.mockResolvedValue([]);
    Order.findAll.mockResolvedValue([]);

    await inventoryService.getDemandData('store-uuid');

    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ store_id: 'store-uuid' }),
      })
    );
    expect(Order.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ store_id: 'store-uuid' }),
      })
    );
  });

  test('only includes paid-lifecycle statuses and excludes pending_payment and cancelled', async () => {
    Product.findAll.mockResolvedValue([]);
    Order.findAll.mockResolvedValue([]);

    await inventoryService.getDemandData('store-uuid');

    const orderCallArgs = Order.findAll.mock.calls[0][0];
    const statusFilter = orderCallArgs.where.status[Op.in];

    expect(statusFilter).toEqual(
      expect.arrayContaining(['paid', 'preparing', 'packed', 'shipped', 'delivered'])
    );
    expect(statusFilter).not.toContain('pending_payment');
    expect(statusFilter).not.toContain('cancelled');
  });

  test('returns a 30-element daily_sales array initialized to zero for each active product', async () => {
    Product.findAll.mockResolvedValue([
      { id: 'product-uuid', name: 'Snapback Classic', category: 'Snapback' },
    ]);
    Order.findAll.mockResolvedValue([]);

    const result = await inventoryService.getDemandData('store-uuid');

    expect(result).toHaveLength(1);
    expect(result[0].daily_sales).toHaveLength(30);
    expect(result[0].daily_sales.every(v => v === 0)).toBe(true);
  });

  test('places order quantity in the correct day bucket (5 days ago → index 24)', async () => {
    // daysAgo=5 → arrayIndex = 29 - 5 = 24
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    Product.findAll.mockResolvedValue([
      { id: 'product-uuid', name: 'Snapback Classic', category: 'Snapback' },
    ]);
    Order.findAll.mockResolvedValue([
      {
        created_at: fiveDaysAgo,
        items: [
          { quantity: 3, ProductVariant: { product_id: 'product-uuid' } },
        ],
      },
    ]);

    const result = await inventoryService.getDemandData('store-uuid');

    expect(result[0].daily_sales[24]).toBe(3);
    expect(result[0].daily_sales.filter(v => v !== 0)).toHaveLength(1);
  });
});
