const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Joi = require('joi');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'La contraseña debe tener al menos 1 mayúscula y 1 número',
    }),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().optional().allow(''),
  role: Joi.string().valid('customer', 'vendor').default('customer'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const generateAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );

const generateRefreshTokenPair = () => {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

const refreshExpiresAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  status: user.status,
  createdAt: user.created_at,
});

const register = async (data) => {
  const { error, value } = registerSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new AppError(error.details.map((d) => d.message).join(', '), 400);
  }

  const existing = await User.findOne({ where: { email: value.email } });
  if (existing) {
    throw new AppError('El email ya está registrado', 409);
  }

  const passwordHash = await bcrypt.hash(value.password, SALT_ROUNDS);
  const user = await User.create({
    name: value.name,
    email: value.email,
    password_hash: passwordHash,
    phone: value.phone || null,
    address: value.address || null,
    role: value.role,
    status: value.role === 'vendor' ? 'pending_approval' : 'active',
  });

  const accessToken = generateAccessToken(user);
  const { raw: rawRefresh, hash: refreshHash } = generateRefreshTokenPair();

  await RefreshToken.create({
    user_id: user.id,
    token_hash: refreshHash,
    expires_at: refreshExpiresAt(),
  });

  logger.info({ action: 'REGISTER', userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: rawRefresh,
  };
};

const login = async (data) => {
  const { error, value } = loginSchema.validate(data, { abortEarly: false });
  if (error) {
    throw new AppError('Email o contraseña inválidos', 400);
  }

  const user = await User.findOne({ where: { email: value.email } });
  if (!user) {
    throw new AppError('Credenciales inválidas', 401);
  }

  if (user.status === 'suspended') {
    throw new AppError('Tu cuenta ha sido suspendida', 403);
  }

  const passwordValid = await bcrypt.compare(value.password, user.password_hash);
  if (!passwordValid) {
    throw new AppError('Credenciales inválidas', 401);
  }

  const accessToken = generateAccessToken(user);
  const { raw: rawRefresh, hash: refreshHash } = generateRefreshTokenPair();

  await RefreshToken.create({
    user_id: user.id,
    token_hash: refreshHash,
    expires_at: refreshExpiresAt(),
  });

  logger.info({ action: 'LOGIN', userId: user.id });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: rawRefresh,
  };
};

const refresh = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token requerido', 401);
  }

  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  const storedToken = await RefreshToken.findOne({
    where: { token_hash: tokenHash, revoked: false },
  });

  if (!storedToken) {
    throw new AppError('Refresh token inválido', 401);
  }

  if (new Date() > storedToken.expires_at) {
    await storedToken.update({ revoked: true, revoked_at: new Date() });
    throw new AppError('Refresh token expirado', 401);
  }

  const user = await User.findByPk(storedToken.user_id);
  if (!user || user.status !== 'active') {
    throw new AppError('Usuario inactivo', 401);
  }

  await storedToken.update({ revoked: true, revoked_at: new Date() });

  const accessToken = generateAccessToken(user);
  const { raw: newRaw, hash: newHash } = generateRefreshTokenPair();

  await RefreshToken.create({
    user_id: user.id,
    token_hash: newHash,
    expires_at: refreshExpiresAt(),
  });

  return { accessToken, refreshToken: newRaw };
};

const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) {return;}

  const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  await RefreshToken.update(
    { revoked: true, revoked_at: new Date() },
    { where: { token_hash: tokenHash, revoked: false } }
  );
};

const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return { user: sanitizeUser(user) };
};

module.exports = { register, login, refresh, logout, getMe };
