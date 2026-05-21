jest.mock('../../src/models', () => ({
  Product: {
    findAll: jest.fn(),
  },
  ProductVariant: {},
}));

const { Op } = require('sequelize');
const { Product } = require('../../src/models');
const { getComparableProducts } = require('../../src/services/pricingService');

describe('pricingService.getComparableProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('filters by store_id and category', async () => {
    Product.findAll.mockResolvedValue([]);

    await getComparableProducts('store-1', 'Snapback');

    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          store_id: 'store-1',
          category: 'Snapback',
        }),
      })
    );
  });

  test('excludes the edited product when excludeProductId is provided', async () => {
    Product.findAll.mockResolvedValue([]);

    await getComparableProducts('store-1', 'Snapback', 'product-uuid');

    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { [Op.ne]: 'product-uuid' },
        }),
      })
    );
  });

  test('uses price_override as effective price when variant has it', async () => {
    const mockProducts = [{
      name: 'Cap A',
      base_price: '100.00',
      variants: [{ price_override: '300.00' }],
    }];
    Product.findAll.mockResolvedValue(mockProducts);

    const result = await getComparableProducts('store-1', 'Snapback');

    expect(result).toEqual([{ name: 'Cap A', price: 300 }]);
  });
});
