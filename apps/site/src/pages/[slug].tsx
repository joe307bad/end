import React from 'react';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { H1 } from 'tamagui';
import { GetStaticPropsContext } from 'next';
import { Nav } from '@end/ui/shared';

export default function Page({ page }: { page: TPage | undefined }) {
  return (
    <Nav>
      <H1>{page?.title ?? ''}</H1>
    </Nav>
  );
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
