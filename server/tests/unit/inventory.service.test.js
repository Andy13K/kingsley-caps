jest.mock('../../src/models', () => ({
  sequelize: {
    transaction: jest.fn(),
    literal: jest.fn((sql) => ({ sql })),
  },
  ProductVariant: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  InventoryMovement: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Product: {},
  Store: {},
  User: {},
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

const { sequelize, ProductVariant, InventoryMovement } = require('../../src/models');
const inventoryService = require('../../src/services/inventoryService');

describe('inventoryService.adjustStock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation(async (callback) => {
      const t = { LOCK: { UPDATE: 'UPDATE' } };
      return callback(t);
    });
  });

  test('increments stock with type "in"', async () => {
    const mockVariant = {
      id: 'variant-uuid',
      store_id: 'store-uuid',
      stock: 10,
      low_stock_threshold: 3,
      update: jest.fn().mockResolvedValue(true),
    };
    ProductVariant.findOne.mockResolvedValue(mockVariant);
    InventoryMovement.create.mockResolvedValue({ id: 'movement-uuid' });

    const result = await inventoryService.adjustStock({
      productVariantId: 'variant-uuid',
      quantity: 5,
      type: 'in',
      reason: 'restock',
      userId: 'user-uuid',
      storeId: 'store-uuid',
    });

    expect(mockVariant.update).toHaveBeenCalledWith({ stock: 15 }, expect.any(Object));
    expect(InventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stock_before: 10,
        stock_after: 15,
        type: 'in',
        quantity: 5,
      }),
      expect.any(Object)
    );
    expect(result.variant).toBe(mockVariant);
  });

  test('throws AppError when stock would go negative', async () => {
    const mockVariant = {
      id: 'variant-uuid',
      store_id: 'store-uuid',
      stock: 3,
      low_stock_threshold: 3,
      update: jest.fn(),
    };
    ProductVariant.findOne.mockResolvedValue(mockVariant);

    await expect(
      inventoryService.adjustStock({
        productVariantId: 'variant-uuid',
        quantity: 5,
        type: 'out',
        reason: 'venta',
        userId: 'user-uuid',
        storeId: 'store-uuid',
      })
    ).rejects.toThrow('Stock insuficiente');

    expect(mockVariant.update).not.toHaveBeenCalled();
    expect(InventoryMovement.create).not.toHaveBeenCalled();
  });

  test('uses sequelize transaction for atomic stock adjustment', async () => {
    const mockVariant = {
      stock: 10,
      low_stock_threshold: 3,
      update: jest.fn().mockResolvedValue(true),
    };
    ProductVariant.findOne.mockResolvedValue(mockVariant);
    InventoryMovement.create.mockResolvedValue({});

    await inventoryService.adjustStock({
      productVariantId: 'variant-uuid',
      quantity: 2,
      type: 'in',
      reason: 'test',
      userId: 'user-uuid',
      storeId: 'store-uuid',
    });

    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(ProductVariant.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE' })
    );
  });
});

describe('inventoryService.getAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns variants at or below low stock threshold', async () => {
    const mockVariants = [
      { id: 'v1', stock: 2, low_stock_threshold: 3, sku: 'CAP-001' },
      { id: 'v2', stock: 0, low_stock_threshold: 5, sku: 'CAP-002' },
    ];
    ProductVariant.findAll.mockResolvedValue(mockVariants);

    const result = await inventoryService.getAlerts({ storeId: 'store-uuid' });

    expect(result).toEqual(mockVariants);
    expect(ProductVariant.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ store_id: 'store-uuid' }),
      })
    );
  });

  test('returns empty array when no low stock variants', async () => {
    ProductVariant.findAll.mockResolvedValue([]);

    const result = await inventoryService.getAlerts({ storeId: 'store-uuid' });

    expect(result).toEqual([]);
  });
});
