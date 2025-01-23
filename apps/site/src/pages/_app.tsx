import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { TamaguiProvider } from 'tamagui';
import { Nav, tamaguiConfig } from '@end/ui/shared';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>end | strategy game of conquest and interactive fiction</title>
      </Head>
      <main style={{ height: '100%' }} className="app">
        <TamaguiProvider
          config={tamaguiConfig}
          disableInjectCSS
          disableRootThemeClass
        >
          <Component {...pageProps} />
        </TamaguiProvider>
      </main>
    </>
  );
}

export default CustomApp;
