const jwt = require('jsonwebtoken');

const loadAuthenticate = () => {
  jest.resetModules();

  const User = {
    findByPk: jest.fn(),
  };

  jest.doMock('../../src/models/User', () => User);
  jest.doMock('../../src/config/jwt', () => ({
    accessSecret: 'middleware_access_secret',
  }));

  const authenticate = require('../../src/middleware/authenticate');
  return { authenticate, User };
};

const runMiddleware = (middleware, req) => {
  const res = {};
  const next = jest.fn();
  middleware(req, res, next);
  return new Promise((resolve) => {
    setImmediate(() => resolve(next));
  });
};

describe('authenticate middleware', () => {
  test('adds active user to request when bearer token is valid', async () => {
    const { authenticate, User } = loadAuthenticate();
    const user = { id: 'user-1', role: 'customer', status: 'active' };
    const token = jwt.sign({ sub: 'user-1' }, 'middleware_access_secret');

    User.findByPk.mockResolvedValue(user);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = await runMiddleware(authenticate, req);

    expect(req.user).toBe(user);
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects missing bearer token', async () => {
    const { authenticate } = loadAuthenticate();

    const next = await runMiddleware(authenticate, { headers: {} });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      message: expect.stringContaining('Token'),
    }));
  });

  test('rejects invalid token', async () => {
    const { authenticate } = loadAuthenticate();

    const next = await runMiddleware(authenticate, {
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  test('rejects inactive users', async () => {
    const { authenticate, User } = loadAuthenticate();
    const token = jwt.sign({ sub: 'user-1' }, 'middleware_access_secret');

    User.findByPk.mockResolvedValue({ id: 'user-1', status: 'suspended' });

    const next = await runMiddleware(authenticate, {
      headers: { authorization: `Bearer ${token}` },
    });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});

describe('authorize middleware', () => {
  test('allows users with an accepted role', () => {
    jest.resetModules();
    const authorize = require('../../src/middleware/authorize');
    const req = { user: { role: 'vendor' } };
    const next = jest.fn();

    authorize('vendor', 'superadmin')(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('rejects unauthenticated requests', () => {
    jest.resetModules();
    const authorize = require('../../src/middleware/authorize');
    const next = jest.fn();

    authorize('vendor')({}, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  test('rejects users without required role', () => {
    jest.resetModules();
    const authorize = require('../../src/middleware/authorize');
    const next = jest.fn();

    authorize('vendor')({ user: { role: 'customer' } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
    }));
  });
});
