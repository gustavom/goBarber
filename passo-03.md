### Fazendo uploads de arquivo
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