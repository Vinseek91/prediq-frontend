import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="application-name" content="PREDIQ" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PREDIQ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#020408" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/prediq-logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/prediq-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/prediq-logo.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/prediq-logo.png" />
        <link rel="icon" type="image/png" href="/prediq-logo.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
