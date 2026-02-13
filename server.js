import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Ouvir na porta definida pela variável de ambiente (obrigatório para Cloud Run)
const PORT = process.env.PORT || 8080;

// 2. Ouvir no host 0.0.0.0
const HOST = '0.0.0.0';

// O diretório estático agora é sempre 'dist' devido ao build do Vite
const STATIC_PATH = path.join(__dirname, 'dist');

// Servir arquivos estáticos
app.use(express.static(STATIC_PATH));

// Rota Catch-all para SPA (Single Page Application)
app.get('*', (req, res) => {
    const indexPath = path.join(STATIC_PATH, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Aplicação não encontrada. Certifique-se de ter rodado "npm run build".');
    }
});

// Inicialização do Servidor
app.listen(PORT, HOST, () => {
    console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    console.log(`Servindo arquivos de: ${STATIC_PATH}`);
});