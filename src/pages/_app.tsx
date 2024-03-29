import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="h-full w-full">
      <ToastContainer />
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
