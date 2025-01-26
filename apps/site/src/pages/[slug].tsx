import React, { ReactElement } from 'react';
import { View } from 'tamagui';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { GetStaticPropsContext } from 'next';
import { useLiveReload } from 'next-contentlayer2/hooks';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { usePersistentState } from '../utlis';
import { Nav } from '../components/Nav';

export default function Page({
  page,
  source,
}: {
  page: TPage | undefined;
  source: any;
}) {
  useLiveReload();

  return (
    <Nav activePage={page?.url} title={page?.title}>
      <View id="markdown">
        <MDXRemote {...source} />
      </View>
    </Nav>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const page = allPages.find((manual) => manual.url === context.params?.slug);
  // @ts-ignore
  const compiledMdx = await serialize(page.body.raw);
  return {
    props: {
      page,
      source: compiledMdx,
    },
  };
}

export async function getStaticPaths() {
  const paths = allPages.map((p) => ({
    params: { slug: p.url },
  }));

  return { paths, fallback: false };
}
