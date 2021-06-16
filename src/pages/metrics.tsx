import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Metrics() {



  return (
    <>
      <h1>Metrics</h1>

    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {

  const apiClient = setupAPIClient(ctx);
  const response = await apiClient('/me');

  console.log(response.data)
  return {
    props: {}
  }
}, {
  permissions: ['metrics.list'],
  roles: ['administrator']
});

/**
 * Algumas forma de fazer isso
 * No lado do servidor, atualmente só tenho acesso ao token do usuário
 * e no payload do token tenho as informações do usuário, como por exemplo as permissões
 *
 * yarn add jwt-decode => Serve para decodificar um JWT e pegar seu conteudo, por exemplo o payload
 *
 * Porém cada página exige permissões e roles diferentes
 * por isso no withSSRAuth vai receber dois parâmetros agora
 *  1º a função que vai executar p/ pegar os dados (SSR)
 *  2º um objeto que contem: permissions e roles (para ver se pode acessar a tela)
 *
 */