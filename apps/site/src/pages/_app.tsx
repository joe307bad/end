import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { TamaguiProvider } from 'tamagui';
import { tamaguiConfig } from './tamagui.config';



function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to site!</title>
      </Head>
      <main className="app">
        <TamaguiProvider config={tamaguiConfig} disableInjectCSS disableRootThemeClass>
          <Component {...pageProps} />
        </TamaguiProvider>
      </main>
    </>
  );
}

export default CustomApp;
