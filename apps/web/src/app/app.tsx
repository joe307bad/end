import React, {
  ComponentType,
  FC,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Container,
  ContainerWithNav,
  Landing,
  Providers,
  Register,
} from '@end/components';
import './app.module.scss';

import {
  NavigateFunction,
  useLocation,
  useNavigate,
  Navigate,
  useParams,
  createBrowserRouter,
  RouterProvider,
  Link,
} from 'react-router-dom';
import Home from '../pages/Home';
import { useAuth } from '@end/auth';
import {
  compose,
  DatabaseProvider,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import Conquest from '../pages/Conquest';
import War from '../pages/War';
import { EndApiProvider, useEndApi } from '@end/data/web';
import { War as TWar } from '@end/wm/core';
import { Database } from '@nozbe/watermelondb';
import { Observable, of } from 'rxjs';
import { execute } from '@end/data/core';
import { View } from 'tamagui';
import { useSnapshot } from 'valtio/react';
import { Citadel } from '../pages/Citadel';
import { jwtDecode } from 'jwt-decode';
import { Nav } from '@end/ui/shared';

function WithNavigate({
  children,
}: {
  children: (n: NavigateFunction) => ReactNode;
}) {
  const navigate = useNavigate();
  return children(navigate);
}

function Page({
  war,
  userId,
  children,
}: {
  war?: TWar;
  userId?: string;
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { deleteToken } = useAuth();

  const logOut = useCallback(async () => {
    await deleteToken();
    navigate('/', { replace: true });
  }, []);

  const [title, setTitle] = useState<string>();

  useEffect(() => {
    war?.planet.fetch().then((planet) => {
      setTitle(`The War of ${planet.name}`);
    });
  }, []);

  return (
    <ContainerWithNav
      navigate={navigate}
      currentRoute={pathname}
      logOut={logOut}
      title={title}
      userId={userId}
    >
      {children}
    </ContainerWithNav>
  );
}

const EnhancedPage = compose(
  withDatabase,
  withObservables(
    ['warId', 'userId'],
    ({
      database,
      warId,
      userId,
    }: {
      database: Database;
      warId: string;
      userId: string;
    }): { war: Observable<TWar>; userId: Observable<string> } => {
      return {
        war: database.get<TWar>('wars').findAndObserve(warId),
        userId: of(userId),
      };
    }
  ) as (arg0: unknown) => ComponentType
)(Page);

function PageRouteComponent({
  children,
  userId,
}: {
  children: ReactNode;
  userId?: string;
}) {
  const params = useParams();

  if (!params.id) {
    return <Page userId={userId}>{children}</Page>;
  }

  return (
    <EnhancedPage warId={params.id} userId={userId}>
      {children}
    </EnhancedPage>
  );
}

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { services } = useEndApi();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null | 'LOADING'>('LOADING');
  const unsubscribe = useRef<() => void>();

  useEffect(() => {
    getToken().then((t) => {
      execute(services.syncService.sync())
        .then(async (r) => {
          setToken(t);
          services.warService.store.userId = await execute(
            services.authService.getUserId()
          );
          unsubscribe.current = services.endApi.connectToUserLog();
        })
        .catch((e) => {
          try {
            const statusCode = JSON.parse(e.message).statusCode;
            console.error(e);
            if (statusCode === 401) {
              setToken(null);
            }
          } catch (e) {
            setToken(null);
          }
        });

      execute(services.endApi.getLatestCitadelFeed());
    });
  }, []);

  useEffect(() => {
    return () => {
      if (unsubscribe.current) {
        unsubscribe.current();
      }
    };
  }, []);

  if (token === 'LOADING') {
    return null;
  }
  return token ? (
    <PageRouteComponent userId={jwtDecode(token).sub}>
      {children}
    </PageRouteComponent>
  ) : (
    <Navigate
      to={`/?return_path=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`}
    />
  );
};

function AppRoutes() {
  const { services } = useEndApi();
  const warStore = useSnapshot(services.warService.store);

  const [env, version]: ['prod' | 'staging' | 'dev', string] = (() => {
    if (process.env.NODE_ENV === 'development') {
      return ['dev', 'dev'];
    }

    if (process.env.END_WEB_VERSION) {
      if (!process.env.END_COMMIT_SHA) {
        throw Error('END_WEB_VERSION requires END_COMMIT_SHA');
      }
      return ['staging', process.env.END_COMMIT_SHA];
    }

    if (!process.env.END_VERSION) {
      throw Error('Prod env requires END_VERSION');
    }

    return ['prod', process.env.END_VERSION];
  })();

  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          {
            path: '/',
            element: (
              <Container>
                <WithNavigate>
                  {(n) => (
                    <Landing
                      version={version}
                      services={services}
                      goToRegister={() => n('/register')}
                      goToHome={() => {
                        const queryParams = new URLSearchParams(
                          window.location.search
                        );
                        const returnPath = queryParams.get('return_path');
                        n(returnPath ? returnPath : '/home');
                      }}
                    />
                  )}
                </WithNavigate>
              </Container>
            ),
          },
          {
            path: '/register',
            element: (
              <View width="100%">
                <WithNavigate>
                  {(n) => (
                    <Register services={services} goToHome={() => n('/home')} />
                  )}
                </WithNavigate>
              </View>
            ),
          },
          {
            path: '/conquest',
            element: (
              <PrivateRoute>
                <Conquest userId={warStore.userId} />
              </PrivateRoute>
            ),
          },
          {
            path: '/citadel',
            element: (
              <PrivateRoute>
                <Citadel />
              </PrivateRoute>
            ),
          },
          {
            path: '/home',
            element: (
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            ),
          },
          {
            path: '/war/:id',
            element: (
              <PrivateRoute>
                <War />
              </PrivateRoute>
            ),
          },
        ],
        { ...(env === 'prod' ? { basename: '/app' } : undefined) }
      ),
    [warStore.userId]
  );
  // @ts-ignore
  const { routes }: any = ALL_ROUTES;

  const [menuOpen, toggleMenu] = useState<boolean | null>(false);

  return (
    <DatabaseProvider database={services.endApi.database}>
      <Nav
        full
        routes={routes}
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        LinkWrapper={LinkWrapper}
        router={router}
      >
        <RouterProvider router={router} />
      </Nav>
    </DatabaseProvider>
  );
}

const LinkWrapper: FC<{
  children: ReactElement;
  href: string;
  router?: {
    navigate: (to: string, options?: { replace: boolean }) => Promise<any>;
  };
}> = ({ children, href: h, router }) => {
  const { deleteToken } = useAuth();

  if (!h.startsWith('/app') && h !== '') {
    return <a href={h}>{children}</a>;
  }

  const href = (() => {
    if (
      h.startsWith('/app') &&
      (process.env.NODE_ENV === 'development' || process.env.END_WEB_STAGING)
    ) {
      return h.slice(4);
    }
    return h;
  })();

  return (
    <a
      onClick={async (e) => {
        if (href === '') {
          await deleteToken();
          router?.navigate('/', { replace: true });
        }

        e.preventDefault();
        router?.navigate(href);
      }}
      href={href}
    >
      {children}
    </a>
  );
};

export function App() {
  return (
    <Providers>
      <EndApiProvider
        baseUrl={process.env.API_BASE_URL}
        webSocketUrl={process.env.WEBSOCKET_URL}
      >
        <AppRoutes />
      </EndApiProvider>
    </Providers>
  );
}

export default App;
