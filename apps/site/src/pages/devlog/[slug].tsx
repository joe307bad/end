import React from 'react';
import { allDevlogs, Devlog } from 'contentlayer/generated';
import { H1 } from 'tamagui';

export default function DevlogPage({ manual }: Devlog | undefined) {
  return <H1>{manual.title ?? ''}</H1>;
}

export async function getStaticProps(context) {
  return {
    props: {
      manual: allDevlogs.find((manual) => manual.url === context.params.slug),
    },
  };
}

export async function getStaticPaths() {
  const paths = allDevlogs.map((manual) => ({
    params: { slug: manual.url },
  }));

  return { paths, fallback: false };
}
