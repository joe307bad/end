import Head from 'next/head';

export function Index({ version, sha }: { version: string, sha: string }) {
  return (
    <>
      <Head>
        <script src="/main.js"></script>
      </Head>
      <h1>{version ?? '0.0.0'} | {sha ?? '~commit sha~'}</h1>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {
      version: process?.env?.END_VERSION,
      sha: process?.env?.END_COMMIT_SHA,
    },
  };
}

export default Index;
