// Arquivo que vai fazer requisições a partir do browser
// Ou seja, não passa o contexto da requisição como parâmetro

// E quando utilizar no lado do servidor, passamos o contexto como parâmetro

import { setupAPIClient } from './api';

export const api = setupAPIClient();