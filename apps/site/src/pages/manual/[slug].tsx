import React from 'react';
import { allManuals, Manual } from 'contentlayer/generated';
import { View } from 'tamagui';
import { GetStaticPropsContext } from 'next';
import path from 'path';
import { useLiveReload } from 'next-contentlayer2/hooks';
import { Nav } from '../../components/Nav';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { readFileSync } from 'fs';

export default function ManualPage({
  page,
  source,
  routes,
  version,
}: {
  page: Manual | undefined;
  source: any;
  routes: { url: string; title: string; type: string }[];
  version: string;
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
  const page = allManuals.find(
    (manual) =>
      path.basename(
        manual._raw.sourceFileName,
        path.extname(manual._raw.sourceFileName)
      ) === context.params?.slug
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
  const paths = allManuals.map((manual) => ({
    params: {
      slug: path.basename(
        manual._raw.sourceFileName,
        path.extname(manual._raw.sourceFileName)
      ),
    },
  }));

  return { paths, fallback: false };
}
