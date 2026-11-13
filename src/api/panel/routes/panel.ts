/**
 * El panel de administración llama a esta ruta después del login para
 * confirmar que el usuario tiene rol Administrador.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/panel-access',
      handler: 'panel.access',
    },
  ],
};
