import { Router } from 'express';
import User from './app/models/user';

const routes = new Router();

routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Gustavo Martusewicz',
    email: 'gustavo_crj@hotmail.com',
    password_hash: '123456',
  });
  res.json(user);
});

export default routes;
