import React from 'react';
import { allManuals, Manual } from 'contentlayer/generated';
import { H1 } from 'tamagui';
import { GetStaticPropsContext } from 'next';

export default function ManualPage({ manual }: { manual: Manual | undefined }) {
  return <H1>{manual?.title ?? ''}</H1>;
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      manual: allManuals.find((manual) => manual.url === context.params?.slug),
    },
  };
}

export async function getStaticPaths() {
  const paths = allManuals.map((manual) => ({
    params: { slug: manual.url },
  }));

  return { paths, fallback: false };
}
