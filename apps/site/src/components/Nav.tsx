import React, { FC, ReactElement } from 'react';
import { Nav as N } from '@end/ui/shared';
import { usePersistentState } from '../utlis';
import { routes } from 'routes.json';
import Link from 'next/link';

const LinkWrapper: FC<{ children: ReactElement; href: string }> = ({
  href,
  children,
}) => {
  return <Link href={`/${href}`}>{children}</Link>;
};

export function Nav({
  activePage,
  title,
  children,
}: {
  activePage?: string;
  title?: string;
  children: JSX.Element;
}) {
  const [menuOpen, toggleMenu] = usePersistentState('menuOpen', false);
  return (
    <N
      activePage={activePage}
      title={title}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      LinkWrapper={LinkWrapper}
      // @ts-ignore
      routes={routes}
    >
      {children}
    </N>
  );
}
