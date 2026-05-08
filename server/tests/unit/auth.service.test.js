const makeUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Andy Aquino',
  email: 'andy@example.com',
  phone: '+502 1234 5678',
  role: 'customer',
  status: 'active',
  password_hash: 'hashed_password',
  created_at: new Date('2026-05-01T00:00:00.000Z'),
  ...overrides,
});

const loadService = () => {
  jest.resetModules();

  const User = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  const RefreshToken = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  jest.doMock('../../src/models/User', () => User);
  jest.doMock('../../src/models/RefreshToken', () => RefreshToken);
  jest.doMock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }));

  const authService = require('../../src/services/authService');
  return { authService, User, RefreshToken };
};

describe('authService', () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  });

  test('register creates a customer and returns tokens', async () => {
    const { authService, User, RefreshToken } = loadService();
    const user = makeUser();

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(user);
    RefreshToken.create.mockResolvedValue({});

    const result = await authService.register({
      name: 'Andy Aquino',
      email: 'andy@example.com',
      password: 'Password1',
      phone: '+502 1234 5678',
      role: 'customer',
    });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'andy@example.com',
      role: 'customer',
      status: 'active',
    }));
    expect(RefreshToken.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      token_hash: expect.any(String),
      expires_at: expect.any(Date),
    }));
    expect(result).toEqual(expect.objectContaining({
      user: expect.objectContaining({ id: 'user-1', email: 'andy@example.com' }),
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    }));
  });

  test('register marks vendor users as pending approval', async () => {
    const { authService, User, RefreshToken } = loadService();

    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ role: 'vendor', status: 'pending_approval' }));
    RefreshToken.create.mockResolvedValue({});

    const result = await authService.register({
      name: 'Vendedor Kingsley',
      email: 'vendor@example.com',
      password: 'Password1',
      role: 'vendor',
    });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      role: 'vendor',
      status: 'pending_approval',
    }));
    expect(result.user.status).toBe('pending_approval');
  });

  test('register rejects duplicate email', async () => {
    const { authService, User } = loadService();
    User.findOne.mockResolvedValue(makeUser());

    await expect(authService.register({
      name: 'Andy Aquino',
      email: 'andy@example.com',
      password: 'Password1',
      role: 'customer',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('register rejects weak password', async () => {
    const { authService } = loadService();

    await expect(authService.register({
      name: 'Andy Aquino',
      email: 'andy@example.com',
      password: 'password',
      role: 'customer',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('login returns tokens for valid credentials', async () => {
    const { authService, User, RefreshToken } = loadService();
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Password1', 12);

    User.findOne.mockResolvedValue(makeUser({ password_hash: passwordHash }));
    RefreshToken.create.mockResolvedValue({});

    const result = await authService.login({
      email: 'andy@example.com',
      password: 'Password1',
    });

    expect(result.user.email).toBe('andy@example.com');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
  });

  test('login rejects suspended users', async () => {
    const { authService, User } = loadService();
    User.findOne.mockResolvedValue(makeUser({ status: 'suspended' }));

    await expect(authService.login({
      email: 'andy@example.com',
      password: 'Password1',
    })).rejects.toMatchObject({ statusCode: 403 });
  });

  test('login rejects invalid credentials', async () => {
    const { authService, User } = loadService();
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Password1', 12);

    User.findOne.mockResolvedValue(makeUser({ password_hash: passwordHash }));

    await expect(authService.login({
      email: 'andy@example.com',
      password: 'Wrongpass1',
    })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh rotates a valid refresh token', async () => {
    const { authService, User, RefreshToken } = loadService();
    const storedToken = {
      user_id: 'user-1',
      expires_at: new Date(Date.now() + 60_000),
      update: jest.fn(),
    };

    RefreshToken.findOne.mockResolvedValue(storedToken);
    RefreshToken.create.mockResolvedValue({});
    User.findByPk.mockResolvedValue(makeUser());

    const result = await authService.refresh('raw-refresh-token');

    expect(storedToken.update).toHaveBeenCalledWith(expect.objectContaining({
      revoked: true,
      revoked_at: expect.any(Date),
    }));
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  test('refresh rejects expired tokens and revokes them', async () => {
    const { authService, RefreshToken } = loadService();
    const storedToken = {
      expires_at: new Date(Date.now() - 60_000),
      update: jest.fn(),
    };

    RefreshToken.findOne.mockResolvedValue(storedToken);

    await expect(authService.refresh('expired-token')).rejects.toMatchObject({ statusCode: 401 });
    expect(storedToken.update).toHaveBeenCalledWith(expect.objectContaining({
      revoked: true,
      revoked_at: expect.any(Date),
    }));
  });

  test('logout revokes the matching refresh token', async () => {
    const { authService, RefreshToken } = loadService();
    RefreshToken.update.mockResolvedValue([1]);

    await authService.logout('raw-refresh-token');

    expect(RefreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked: true, revoked_at: expect.any(Date) }),
      expect.objectContaining({ where: expect.objectContaining({ revoked: false }) })
    );
  });
});
