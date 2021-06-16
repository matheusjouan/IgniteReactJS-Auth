// Vou utilizar essa função em páginas que possam ser acessadas por visitantes (usuário não logado)

import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRGuest<P>(fn: GetServerSideProps<P>) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

    // Acesso a todos cookies da página => ctx.req.cookies
    const cookies = parseCookies(ctx);

    // Se existe JTW dentro do cookies, redireciona p/ página dashboard
    if (cookies['nextauth.token']) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        }
      }
    }

    return await fn(ctx);

  }
}
