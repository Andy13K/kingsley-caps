const STORAGE_KEY = 'kc_users';
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

const sanitize = ({ password, ...user }) => user;

const apiError = (status, message) => {
  const err = new Error(message);
  err.response = { status, data: { error: { message } } };
  return err;
};

export const mockRegister = async (data) => {
  await delay(700);
  const users = getUsers();
  if (users.find((u) => u.email === data.email.toLowerCase())) {
    throw apiError(409, 'El email ya está registrado');
  }
  const user = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    email: data.email.toLowerCase(),
    password: data.password,
    phone: data.phone || null,
    role: data.role || 'customer',
    status: data.role === 'vendor' ? 'pending_approval' : 'active',
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  const token = `mock_${user.id}_${Date.now()}`;
  return {
    user: sanitize(user),
    accessToken: token,
    refreshToken: `refresh_${token}`,
  };
};

export const mockLogin = async ({ email, password }) => {
  await delay(750);
  const users = getUsers();
  const user = users.find((u) => u.email === email.toLowerCase());
  if (!user || user.password !== password) {
    throw apiError(401, 'Credenciales inválidas');
  }
  if (user.status === 'suspended') {
    throw apiError(403, 'Tu cuenta ha sido suspendida');
  }
  const token = `mock_${user.id}_${Date.now()}`;
  return {
    user: sanitize(user),
    accessToken: token,
    refreshToken: `refresh_${token}`,
  };
};

export const mockLogout = async () => { await delay(200); };
