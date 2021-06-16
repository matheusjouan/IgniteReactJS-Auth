
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../errors/AuthTokenError";

import decode from 'jwt-decode';
import { validadeUserPermissions } from "./validadeUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}


export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

    // Acesso a todos cookies da página => ctx.req.cookies
    const cookies = parseCookies(ctx);
    const token = cookies['nextauth.token'];

    // Se não tiver o token, será redirecionado para a página de login
    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }


    // Valida se a rota exige algum tipo de permissão/roles para ser acessada
    if (options) {
      // Decodificando as informações do usuário dentro do JWT
      // No generic, podemos forçar o retorno e a tipagem, passando o objeto
      const userData = decode<{ permissions: string[], roles: string[] }>(token);
      console.log(userData);

      const { permissions, roles } = options;

      // Logistica de verificar a permissão e roles
      const userHasValidPermissions = validadeUserPermissions({
        user: userData,
        permissions,
        roles
      })

      if (!userHasValidPermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }


    // Trativa de Erro no caso chamadas API no SSR
    try {
      return await fn(ctx);
    }
    catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextauth.token');
        destroyCookie(ctx, 'nextauth.refreshToken');

        // Redirecionamento diferente do browser
        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}
