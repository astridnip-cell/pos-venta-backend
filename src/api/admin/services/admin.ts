/**
 * admin service
 */

import { factories } from '@strapi/strapi';
import bcrypt from 'bcryptjs';

export default factories.createCoreService('api::admin.admin', () => ({
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  },

  async validarPassword(passwordPlano: string, hashGuardado: string) {
    return bcrypt.compare(passwordPlano, hashGuardado);
  },
}));