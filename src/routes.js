import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);
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

routes.use(authMiddleware); // diz para todas as rotas abaixo usarem o middleware. As rotas acima, não vão usar.

routes.put('/users', UserController.update);
routes.get('/providers', ProviderController.index);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
