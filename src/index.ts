import type { Core } from '@strapi/strapi';

/**
 * Permisos de la API por rol (solo las acciones "api::...", las de plugins no se tocan).
 *
 *  - Public (sin sesión):   solo puede VER productos y categorías.
 *  - Authenticated (clientes): lo mismo, más crear su pedido (checkout), ver los suyos (mine)
 *                              y consultar el resultado de su pago (verify).
 *  - Administrador: no se modifica, conserva los permisos que ya le diste.
 *
 * Se aplican cada vez que arranca Strapi, así ningún cliente puede crear, editar ni
 * borrar productos, categorías o pedidos aunque los permisos se cambien por error.
 */
const VIEW_CATALOG = [
  'api::product.product.find',
  'api::product.product.findOne',
  'api::category.category.find',
  'api::category.category.findOne',
];

const ROLE_ACTIONS: Record<string, string[]> = {
  public: VIEW_CATALOG,
  authenticated: [
    ...VIEW_CATALOG,
    'api::order.order.checkout',
    'api::order.order.mine',
    'api::order.order.verify',
  ],
};

async function syncApiPermissions(strapi: Core.Strapi, roleType: string, allowed: string[]) {
  const roleQuery = strapi.db.query('plugin::users-permissions.role');
  const permissionQuery = strapi.db.query('plugin::users-permissions.permission');

  const role = await roleQuery.findOne({ where: { type: roleType } });
  if (!role) {
    strapi.log.warn(`[permisos] No se encontró el rol "${roleType}".`);
    return;
  }

  const current = await permissionQuery.findMany({ where: { role: { id: role.id } } });
  const apiPermissions = current.filter((p: any) => String(p.action).startsWith('api::'));

  let removed = 0;
  for (const permission of apiPermissions) {
    if (!allowed.includes(permission.action)) {
      await permissionQuery.delete({ where: { id: permission.id } });
      removed++;
    }
  }

  let added = 0;
  for (const action of allowed) {
    if (!apiPermissions.some((p: any) => p.action === action)) {
      await permissionQuery.create({ data: { action, role: role.id } });
      added++;
    }
  }

  if (removed || added) {
    strapi.log.info(`[permisos] Rol "${roleType}": ${added} permisos agregados, ${removed} quitados.`);
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    for (const [roleType, actions] of Object.entries(ROLE_ACTIONS)) {
      try {
        await syncApiPermissions(strapi, roleType, actions);
      } catch (error) {
        strapi.log.error(`[permisos] No se pudieron actualizar los permisos de "${roleType}": ${error}`);
      }
    }
  },
};
