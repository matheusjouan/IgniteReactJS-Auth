import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import { useRouter } from 'next/router';

import { setCookie, parseCookies, destroyCookie } from 'nookies';
import Router from "next/dist/next-server/server/router";

type SignInCredentials = {
  email: string;
  password: string;
}

// Informações que terão dentro do Contexto
type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
  signOut(): void;
}

type AuthProviderProps = {
  children: ReactNode;
}

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

// Criando contexto
export const AuthContext = createContext({} as AuthContextData);

// Exportando o Provider p/ ser usado no _app.tsx
export const AuthProvider = ({ children }: AuthProviderProps) => {

  const router = useRouter();

  // Informações retornadas do usuário do backend
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  // Só roda no lado do ClientServer
  let authChannel: BroadcastChannel;

  // Primeira vez que o usuário acessar aplicação
  useEffect(() => {
    const loadDataUser = async () => {
      try {
        // parseCookies => Retornar uma lista com todos cookies salvos
        const { 'nextauth.token': token } = parseCookies();

        // Se tiver um token salvo no Storage, faço a requisição para API
        if (token) {
          // Rota para obter todos os dados do usuário logado
          const response = await api.get('/me');
          const { email, permissions, roles } = response.data;

          // Salvo no estado "users" os dados do usuário logado
          setUser({
            email,
            permissions,
            roles
          })
        }

      } catch (err) {
        destroyCookie(undefined, 'nextauth.token');
        destroyCookie(undefined, 'nextauth.refreshToken')

        router.push('/');
      }
    }

    loadDataUser();

  }, []);

  useEffect(() => {
    // Crio o canal, passando o nome do canal (Somente no ClientSide)
    authChannel = new BroadcastChannel('auth');

    // Escuta as mensagns do canal, e dependendo da mensagem executa algo
    authChannel.onmessage = (message) => {
      // message.data => é onde fica a mensagem recebida
      switch (message.data) {
        case 'signOut':
          signOut();
          break;

        default:
          break;

      }
    }
  }, [])

  const signIn = async ({ email, password }: SignInCredentials) => {

    try {
      const response = await api.post('/sessions', {
        email,
        password
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setUser({
        email,
        permissions,
        roles
      });

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/'
      });

      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/'
      });

      // Após feito o login, atualiza as futuras requisições p/ ter o header com o token
      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      router.push('/dashboard');

    } catch (err) {
      console.log(err);
    }
  }

  const signOut = () => {
    destroyCookie(undefined, 'nextauth:token');
    destroyCookie(undefined, 'nextauth:token');

    // Passo a mensagem caso acontecer uma ação do usuário
    authChannel.postMessage('signOut');

    router.push('/');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}


