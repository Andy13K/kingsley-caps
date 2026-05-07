export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPassword = (password) =>
  password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);

export const isValidPhone = (phone) => /^\+?[\d\s\-()]{7,20}$/.test(phone);

export const getPasswordError = (password) => {
  if (!password || password.length < 8) return 'Mínimo 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'Debe tener al menos una mayúscula';
  if (!/\d/.test(password)) return 'Debe tener al menos un número';
  return null;
};

export const validateRegisterForm = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Nombre requerido (mínimo 2 caracteres)';
  if (!isValidEmail(email)) errors.email = 'Email inválido';
  const pwError = getPasswordError(password);
  if (pwError) errors.password = pwError;
  if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
  return errors;
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!isValidEmail(email)) errors.email = 'Email inválido';
  if (!password) errors.password = 'Contraseña requerida';
  return errors;
};
