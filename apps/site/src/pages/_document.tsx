import React from 'react';
import NextDocument, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import { StyleSheet } from 'react-native';
import { tamaguiConfig } from '@end/ui/shared';

export default class Document extends NextDocument {
  // @ts-ignore
  static async getInitialProps({ renderPage }: DocumentContext) {
    const page = await renderPage();

    // @ts-ignore RN doesn't have this type
    const rnwStyle = StyleSheet.getSheet();

    return {
      ...page,
      styles: (
        <>
          <style
            id={rnwStyle.id}
            dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }}
          />
          <style
            dangerouslySetInnerHTML={{
              __html: tamaguiConfig.getCSS(),
            }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Funnel+Sans:ital,wght@0,300..800;1,300..800&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
            rel="stylesheet" />
          <meta id="theme-color" name="theme-color" />
          <meta name="color-scheme" content="light dark" />
        </Head>
        <body>
        <Main />
        <NextScript />
        </body>
      </Html>
    );
  }
}
