import Head from "next/head";
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* SVG favicon (modern browsers) */}
        <link rel="icon" href="/wogelplanner-logo.svg" />
        {/* fallback for browsers expecting /favicon.ico */}
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
