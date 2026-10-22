export default {
  routes: [
    {
      method: 'POST',
      path: '/admins/login',
      handler: 'admin.login',
      config: {
        auth: false,
      },
    },
  ],
};