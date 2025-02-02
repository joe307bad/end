import React, { Dispatch, FC, ReactElement, SetStateAction } from 'react';
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
  version,
}: {
  activePage?: string;
  title?: string;
  children: JSX.Element;
  routes: { url: string; title: string; type: string }[];
  version;
}) {
  const [menuOpen, toggleMenu]: [
    boolean | null,
    Dispatch<SetStateAction<boolean | null>>
  ] = usePersistentState('menuOpen', true);

  if (menuOpen === null) {
    return null;
  }

  return (
    <N
      activePage={activePage}
      title={title}
      menuOpen={menuOpen}
      toggleMenu={toggleMenu}
      LinkWrapper={LinkWrapper}
      routes={routes}
      version={version}
    >
      {children}
    </N>
  );
}
