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
1 - Crie a migration de agendamento
```sh
npx sequelize migration:create --name=create-appointments
```
2 - Adicione na migration:
```js
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('appointments', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      provider_id: {
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true,
      },
      canceled_at: {
        type: Sequelize.DATE,
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
    return queryInterface.dropTable('appointments');
  },
};
```
3 - Crie a tabela:
```sh
npx sequelize db:migrate
```
4 - Crie o model de appointments:
```sh
touch src/app/models/Appointments.js
```
5 - No model, adicione:
```js
import Sequelize, { Model } from 'sequelize';

class Appointments extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
      },
      {
        sequelize,
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }
}

export default Appointments;

```

6 - Atualize o arquivo `src/database/index.js`:
```js
// ... import File from '../app/models/File';
import Appointments from '../app/models/Appointments';

import databaseConfig from '../config/database';

const models = [User, File, Appointments];
// ...
``` 

## Rota de agendamento
1 - Crie o controller de appointments:
```sh
touch src/app/controllers/AppointmentController.js
```
```js
import Appointment from '../models/Appointments';

class AppointmentController {
  async store(req, res) {
    return res.json();
  }
}

export default new AppointmentController();

```

2 - No arquivo de rotas:
```js
import AppointmentController from './app/controllers/AppointmentController';

// apos o middlewares de auth
routes.post('/appointments', AppointmentController.store);
```

3 - Atualize o controller de appointments
```js
import * as Yup from 'yup';
import User from '../models/User';
import Appointment from '../models/Appointments';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { provider_id, date } = req.body;

    /**
     * check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();

```

## Validando os agendamentos
1 - instale a lib para validar datas
```sh
npm install date-fns@next
```
2 - atualize o controller de agendamento
```js
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';
import User from '../models/User';
import Appointment from '../models/Appointments';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }
    const { provider_id, date } = req.body;

    /**
     * check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));

    /**
     * Check for past dates
     */
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permited' });
    }

    /**
     * Check date availability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();

```

## Listando agendamentos do usuário
1 - crie a rota de listagem no arquivo de rotas
```js
routes.get('/appointments', AppointmentController.index);
```

2 - No appointment controller, adicione o metodo index:
```js
async index(req, res) {
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }
```

## Páginação