import React from 'react';
import { allDevlogs, Devlog } from 'contentlayer/generated';
import { View } from 'tamagui';
import { GetStaticPropsContext } from 'next';
import path from 'path';
import { useLiveReload } from 'next-contentlayer2/hooks';
import { Nav } from '../../components/Nav';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { readFileSync } from 'fs';

export default function DevlogPage({
  page,
  source,
  routes,
  version,
}: {
  page: Devlog | undefined;
  source: any;
  routes: { url: string; title: string; type: string }[];
  version;
}) {
  useLiveReload();

  return (
    <Nav
      version={version}
      routes={routes}
      activePage={page?.url}
      title={page?.title}
    >
      <View id="markdown">
        <MDXRemote {...source} />
      </View>
    </Nav>
  );
}

export async function getStaticProps(context: GetStaticPropsContext) {
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
  const page = allDevlogs.find(
    (devlog) =>
      path.basename(
        devlog._raw.sourceFileName,
        path.extname(devlog._raw.sourceFileName)
      ) === context.params?.slug
  );
  // @ts-ignore
  const compiledMdx = await serialize(page.body.raw);
  return {
    props: {
      page,
      routes: data.routes ?? null,
      source: compiledMdx,
      // @ts-ignore
      version: process?.env?.END_VERSION ?? 'END_VERSION not found',
    },
  };
}

export async function getStaticPaths() {
  const paths = allDevlogs.map((devlog) => ({
    params: {
      slug: path.basename(
        devlog._raw.sourceFileName,
        path.extname(devlog._raw.sourceFileName)
      ),
    },
  }));

  return { paths, fallback: false };
}
