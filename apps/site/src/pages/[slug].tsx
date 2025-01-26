import React from 'react';
import { View } from 'tamagui';
import { allPages, Page as TPage } from 'contentlayer/generated';
import { GetStaticPropsContext } from 'next';
import { Nav } from '@end/ui/shared';
import { routes } from 'routes.json';
import { useLiveReload, useMDXComponent } from 'next-contentlayer2/hooks';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import { useRouter } from 'next/router';
import { usePersistentState } from '../utlis';

export default function Page({
  page,
  source,
}: {
  page: TPage | undefined;
  source: any;
}) {
  useLiveReload();
  const router = useRouter();
  const [menuOpen, toggleMenu] = usePersistentState('menuOpen', false);

  return (
    <Nav
      navigate={(r) => router.push(`/${r}`)}
      activePage={page?.url}
      title={page?.title}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
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
