import bcrypt from 'bcryptjs';

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    if (data.Password) {
      data.Password = await bcrypt.hash(data.Password, 10);
    }
  },
};