import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

const routes = new Router();
// rota para teste
/* routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Gustavo Martusewicz',
    email: 'gustavo_crj@hotmail.com',
    password_hash: '123456',
  });
  res.json(user);
}); */

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

export default routes;
