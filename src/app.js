import express from 'express';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();
    // chamando os metodos no constructor, permitindo a execução
    this.middlewares();
    this.routes();
  }

  // criando metodos de middlewares e rotas
  middlewares() {
    this.server.use(express.json());
  }

  routes() {
    this.server.use(routes);
  }
}

export default new App().server;
