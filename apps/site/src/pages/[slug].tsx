import React from 'react';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { H1 } from 'tamagui';
import { GetStaticPropsContext } from 'next';

export default function Page({ page }: { page: TPage | undefined }) {
  return <H1>{page?.title ?? ''}</H1>;
}

export async function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {
      page: allPages.find((manual) => manual.url === context.params?.slug),
    },
  };
}

export async function getStaticPaths() {
  const paths = allPages.map((manual) => ({
    params: { slug: manual.url },
  }));

  return { paths, fallback: false };
}
