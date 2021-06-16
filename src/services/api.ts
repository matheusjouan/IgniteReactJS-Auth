import axios, { AxiosError } from 'axios';
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import Router from 'next/router'
import { AuthTokenError } from '../errors/AuthTokenError';


// Variável que identifica se o token esta sendo atualizado
let isRefreshing = false;

// Fila de requisições enquando já tiver uma requisição atualizando JWT
let failedRequestQueue = [];

export function setupAPIClient(ctx = undefined) {

  // Pega todos os Cookies
  const cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    // Seta os headers default => passando o token de autenticação
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });

  // Intercepta a resposta da requisição para gerar um novo JWT
  // response.use() => Recebe dois parâmetros (funções)
  //   - 1º o que fazer se a resposta der sucesso
  //   - 2º o que fazer se a resposta der erro
  api.interceptors.response.use(response => {
    // 1º parâmetro: Resposta com sucesso, faz nada
    return response;
  },
    // 2º Parâmetro: resposta com erro
    (error: AxiosError) => {
      // Condição retornado no backend
      if (error.response.status === 401) {
        // Condição retornado no backend
        if (error.response.data?.code === 'token.expired') {
          // Obtendo os cookies mais recentes (atualizados) p/ enviar p/ backend
          const cookiesList = parseCookies(ctx);
          const { 'nextauth.refreshToken': refreshToken } = cookiesList;

          // Toda configuração da requisição que foi feita para o backend
          // Usado p/ repetir uma requisição p/ backend
          const originalConfig = error.config;

          // Só vai acontecer somente uma requisição p/ refresh token
          // independente de qts chamadas API aconteça qnd o JWT estiver inválido 
          if (!isRefreshing) {
            // Atribui como true
            isRefreshing = true;

            api.post('/refresh', {
              refreshToken,
            }).then(response => {
              // Pego a resposta dessa requisição que vem os novos JWT e RefreshToken
              // Armazeno nos Cookies os novos JWT e Refresh Token

              setCookie(ctx, 'nextauth.token', response.data.token, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/'
              });

              setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/'
              });

              // Atualizar com o novo Token gerado
              api.defaults.headers['Authorization'] = `Bearer ${response.data.token}`;

              // Caso tenha dado certo a requisição do Refresh Token, executo na fila de requisições
              // "pausadas" cada requisição o método onSuccess, passando o novo JWT
              failedRequestQueue.forEach(request => request.onSuccess(response.data.token))
            })
              .catch(err => {
                // Se houve algum erro chama o onFailure, que rejeita as requisiçoes dentro da fila
                failedRequestQueue.forEach(request => request.onFailure(err))
              })
              .finally(() => {
                // Quando terminar o Refresh do Token, limpa a fila e retorno variável com false
                isRefreshing = false;
                failedRequestQueue = [];
              })
          }

          // Caso tiver uma requisição já atualizando o JWT, armazena as demais req na fila
          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              // O que vai acontecer qnd a requisição de Refresh retorna sucesso
              onSuccess: (token: string) => {
                // Atualiza o Token
                originalConfig.headers['Authorization'] = `Bearer ${token}`,

                  // Executar a chamada API novamente, passando as configs da requisição
                  // o resolve() vai aguardar que isso seja feito dentro do interceptors
                  resolve(api(originalConfig))
              },

              // O que acontece caso o processo de Refresh tenha dado errado (Requisição com Erro)
              onFailure: (err: AxiosError) => {
                reject(err);
              }
            })
          });
        }


      } else {
        // Desloga o usuário

        if (process.browser) {
          destroyCookie(undefined, 'nextauth.token');
          destroyCookie(undefined, 'nextauth.refreshToken')
          Router.push('/');
        } else {
          return Promise.reject()
        }
      }

      // Sempre no final do interceptors, caso aconteça um erro que não caia nas condições
      // reijeitamos a requisição, passando o erro.
      return Promise.reject(new AuthTokenError);
    }
  );

  return api;
}

