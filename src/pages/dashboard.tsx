import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

import { Can } from '../components/Can';

export default function Dashboard() {

  const { user, signOut } = useContext(AuthContext);


  return (
    <>
      <h1>Dashboard</h1>
      <p>{user?.email}</p>

      <button onClick={signOut}>SAIR</button>

      <Can permissions={['metrics.list']}>
        <div>Componente a ser visualizado</div>
      </Can>


    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {

  const apiClient = setupAPIClient(ctx);
  const response = await apiClient('/me');

  return {
    props: {}
  }
});
