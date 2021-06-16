import { AppProps } from 'next/app'

import { AuthProvider } from '../contexts/AuthContext';


function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Engloba a aplicação com o Provider de Autenticação
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
