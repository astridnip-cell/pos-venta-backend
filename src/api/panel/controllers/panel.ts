/**
 * Acceso al panel de administración (pos-venta-admin).
 *
 * Solo el rol Administrador tiene permiso para la acción "access" (lo agrega
 * src/index.ts al arrancar), así que Strapi responde 403 a cualquier otro
 * usuario antes de llegar aquí.
 */
export default {
  async access(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Debes iniciar sesión.');
    return ctx.send({ allowed: true, role: user.role?.type ?? null });
  },
};
