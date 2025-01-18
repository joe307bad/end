import Head from 'next/head';

export function Index({ version }: { version: string }) {
  return (
    <>
      <Head>
        <script src="/main.js"></script>
      </Head>
      <h1>{version ?? '0.0.0'}</h1>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      version: process?.env?.END_VERSION,
    },
  };
}

export default Index;
