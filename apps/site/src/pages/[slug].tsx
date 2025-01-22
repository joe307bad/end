import React from 'react';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { H1 } from 'tamagui';

export default function Page({ manual }: TPage | undefined) {
  return <H1>{manual.title ?? ''}</H1>;
}

export async function getStaticProps(context) {
  return {
    props: {
      manual: allPages.find((manual) => manual.url === context.params.slug),
    },
  };
}

export async function getStaticPaths() {
  const paths = allPages.map((manual) => ({
    params: { slug: manual.url },
  }));

  return { paths, fallback: false };
}
