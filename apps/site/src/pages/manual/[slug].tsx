import React from 'react';
import { allManuals, Manual } from 'contentlayer/generated';
import { View } from 'tamagui';
import { GetStaticPropsContext } from 'next';
import path from 'path';
import { useLiveReload } from 'next-contentlayer2/hooks';
import { useRouter } from 'next/router';
import { Nav } from '@end/ui/shared';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { routes } from 'routes.json';
import { usePersistentState } from '../../utlis';

export default function ManualPage({
  page,
  source,
}: {
  page: Manual | undefined;
  source: any;
}) {
  useLiveReload();
  const router = useRouter();
  const [menuOpen, toggleMenu] = usePersistentState('menuOpen', false);

  return (
    <Nav
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      navigate={(r) => router.push(`/${r}`)}
      activePage={page?.url}
      title={page?.title}
      // @ts-ignore
      routes={routes}
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
