import React, { FC, ReactElement } from 'react';
import { Nav as N } from '@end/ui/shared';
import { usePersistentState } from '../utlis';
import Link from 'next/link';

const LinkWrapper: FC<{ children: ReactElement; href: string }> = ({
  href,
  children,
}) => {
  return <Link href={href}>{children}</Link>;
};

export function Nav({
  activePage,
  title,
  children,
  routes,
}: {
  activePage?: string;
  title?: string;
  children: JSX.Element;
  routes: { url: string; title: string; type: string }[];
}) {
  const [menuOpen, toggleMenu] = usePersistentState('menuOpen', false);
  return (
    <N
      activePage={activePage}
      title={title}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      LinkWrapper={LinkWrapper}
      routes={routes}
    >
      {children}
    </N>
  );
}
