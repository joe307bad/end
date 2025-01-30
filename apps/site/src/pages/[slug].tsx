import React from 'react';
import { View } from 'tamagui';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { GetStaticPropsContext } from 'next';
import { useLiveReload } from 'next-contentlayer2/hooks';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { Nav } from '../components/Nav';
import { readFileSync } from 'fs';
import path from 'path';

export default function Page({
  page,
  source,
  routes,
}: {
  page: TPage | undefined;
  source: any;
  routes: { url: string; title: string; type: string }[];
}) {
  useLiveReload();

  return (
    <Nav routes={routes} activePage={page?.url} title={page?.title}>
      <View id="markdown">
        <MDXRemote {...source} />
      </View>
    </Nav>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
  const page = allPages.find(
    (manual) => manual.url.replace('/', '') === context.params?.slug
  );
  const data = (() => {
    try {
      // @ts-ignore
      return JSON.parse(
        readFileSync(
          path.resolve(process.cwd(), '../../dist/routes.json'),
          'utf8'
        )
      );
    } catch (e: any) {
      console.error(e.message);
      return '{}';
    }
  })();
  // @ts-ignore
  const compiledMdx = await serialize(page.body.raw);
  return {
    props: {
      page,
      routes: data.routes ?? null,
      source: compiledMdx,
    },
  };
}

export async function getStaticPaths() {
  const paths = allPages.map((p) => ({
    params: { slug: p.url.replace('/', '') },
  }));
;
  return { paths, fallback: false };
}
