/**
 * admin controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::admin.admin', ({ strapi }) => ({
  async login(ctx) {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest('Email y contraseña son requeridos.');
    }

    const admin = await strapi.db.query('api::admin.admin').findOne({
      where: { Email: email },
    });

    if (!admin) {
      return ctx.notFound('No se encontró un administrador con este correo.');
    }

    const esValido = await strapi
      .service('api::admin.admin')
      .validarPassword(password, admin.Password);

    if (!esValido) {
      return ctx.unauthorized('Contraseña incorrecta.');
    }

    const { Password, ...adminSinPassword } = admin;
    return ctx.send({ admin: adminSinPassword });
  },
}));