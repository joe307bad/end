import React from 'react';
import { allDevlogs, Devlog } from 'contentlayer/generated';
import { H1 } from 'tamagui';
import { GetStaticProps, GetStaticPropsContext } from 'next';

export default function DevlogPage({ devlog }: { devlog: Devlog | undefined }) {
  return <H1>{devlog?.title ?? ''}</H1>;
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  return {
    props: {
      devlog: allDevlogs.find((manual) => manual.url === context.params?.slug),
    },
  };
};

export async function getStaticPaths() {
  const paths = allDevlogs.map((manual) => ({
    params: { slug: manual.url },
  }));

  return { paths, fallback: false };
}
