import bcrypt from 'bcryptjs';

// Un hash de bcrypt siempre empieza con $2a$, $2b$ o $2y$ seguido del costo.
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$/;

async function hashIfNeeded(data: Record<string, any> | undefined) {
  if (!data || !data.Password) return;

  // Evita volver a hashear una contraseña que ya está hasheada
  // (por ejemplo al publicar un borrador).
  if (BCRYPT_REGEX.test(data.Password)) return;

  data.Password = await bcrypt.hash(data.Password, 10);
}

export default {
  async beforeCreate(event) {
    await hashIfNeeded(event.params.data);
  },

  async beforeUpdate(event) {
    await hashIfNeeded(event.params.data);
  },
};