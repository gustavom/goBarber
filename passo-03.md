## Fazendo uploads de arquivo
---
1 - Para realizar o upload de arquivos, instale o multer:
```sh
npm install multer
```

2 - Cria pasta `temp` na raiz do projeto:
```sh
mkdir tmp
``` 

3 - Cria pasta `temp/uploads` na raiz do projeto:
```sh
mkdir tmp/uploads
``` 
4 - Crie o arquivo `multer.js`
```sh
touch src/config/multer.js
```
5 - No arquivo, adicione:
```js
import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, callback) => {
      crypto.randomBytes(16, (err, res) => {
        if (err) return callback(err);

        return callback(null, res.toString('hex') + extname(file.originalname));
      });
    },
  }),
};

```

6 - No arquivo de rotas, adicione:
```js
import multer from 'multer';
import multerConfig from './config/multer';

const upload = multer(multerConfig);


// apos o middleware de auth
routes.post('/files', upload.single('file'), (req, res) => {
  return res.json({ ok: true });
});
```

## Avatar do usuário
---
1 - importe:
```js
import FileController from './app/controllers/FileController';
```
2 - no arquivo de rotas, modifique a nossa rota
```js
routes.post('/files', upload.single('file'), FileController.store);
```
3 - Crie o arquivo `FileController.js`:
```sh
touch src/app/controllers/FileController.js
```
4 - Adicione no filecontroller:
```js
class FileController {
  async store(req, res) {
    return res.json(req.file);
  }
}

export default new FileController();

```

5 - Criando a migration para a tabela de files:
```sh
npx sequelize migration:create --name=create-files
```

6 - No arquivo de migration, adicione:
```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable('files');
  },
};

```
7 - Faça a criação da tabela no banco de dados:
```sh
npx sequelize db:migrate
```
8 - Crie o model de files:
```sh
touch src/app/models/File.js
```

9 - No model, adicione:
```js
import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );
    return this;
  }
}

export default File;

```

10 - Importe o model no `src/database/index.js` e atualize o array de models
```js
import File from '../app/models/File';
```
```js
const models = [User, File];
```

11 - Adicione o model no `FileController.js`:
```js
import File from '../models/File';

class FileController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;

    const file = await File.create({
      name,
      path,
    });
    return res.json(file);
  }
}

export default new FileController();
```

12 - Criando a migration para integrar a tabela de files com users:
```sh
npx sequelize migration:create --name=add-avatar-field-to-users
```

13 - Na nova migration, adicione:
```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'avatar_id', {
      type: Sequelize.INTEGER,
      references: { model: 'files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('users', 'avatar_id');
  },
};
```

14 - Rode a migration:
```sh
npx sequelize db:migrate
```

15 - No model de usuário, crie o método estático para a associação:
```js
// adicione acime do checkpassword
static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id' });
  }
```

16 - No index de database `src/database/index.js`, atualize:
```js
import Sequelize from 'sequelize';

import User from '../app/models/User';
import File from '../app/models/File';

import databaseConfig from '../config/database';

const models = [User, File];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();

```

## Listando os prestadores de serviço
---
Vamos criar a lista de prestadores de serviço.

1 - Crie o controller para Providers:
```sh
touch src/app/controllers/ProviderController.js
```
2 - No arquivo `ProviderController.js`, crie a classe, com o método index para listar os providers:
```js
import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['id', 'name', 'email', 'avatar_id'],
      include: [
        { model: File, as: 'avatar', attributes: ['name', 'path', 'url'] },
      ],
    });
    return res.json(providers);
  }
}

export default new ProviderController();
```

3 - Importe o novo controller no arquivo de rotas:
```js
import ProviderController from './app/controllers/ProviderController';
```

4 - No arquivo de rotas, crie a nova rota:
```js
routes.get('/providers', ProviderController.index);
```

5 - No arquivo `src/app/models/File.js`, adicione o campo virtual URL:
```js
import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `http://localhost:3333/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );
    return this;
  }
}

export default File;

```


6 - No arquivo `src/app/models/User.js`, atualize o 'associate':
```js
static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
  }
``` 

7 - Servindo os arquivos estaticos. No arquivo `src/app.js`, nos middlewares, adicione:
```js
middlewares() {
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }
``` 

## Migration e model de agendamento