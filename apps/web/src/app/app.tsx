import React, {
  ComponentType,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Badge,
  Container,
  ContainerWithNav,
  Landing,
  Providers,
} from '@end/components';
import './app.module.scss';

import {
  Link,
  NavigateFunction,
  useLocation,
  useNavigate,
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
  useParams,
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
import { Observable } from 'rxjs';

function WithNavigate({
  children,
}: {
  children: (n: NavigateFunction) => ReactNode;
}) {
  const navigate = useNavigate();
  return children(navigate);
}

function Page({ war, children }: { war?: TWar; children: ReactNode }) {
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
    >
      {children}
    </ContainerWithNav>
  );
}

const EnhancedPage = compose(
  withDatabase,
  withObservables(
    ['warId'],
    ({
      database,
      warId,
    }: {
      database: Database;
      warId: string;
    }): { war: Observable<TWar> } => ({
      war: database.get<TWar>('wars').findAndObserve(warId),
    })
  ) as (arg0: unknown) => ComponentType
)(Page);

function PageRouteComponent({ children }: { children: ReactNode }) {
  const params = useParams();

  if (!params.id) {
    return <Page>{children}</Page>;
  }

  return <EnhancedPage warId={params.id}>{children}</EnhancedPage>;
}

const PrivateRoutes = () => {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null | 'LOADING'>('LOADING');

  useEffect(() => {
    getToken().then((t) => {
      setToken(t);
    });
  }, []);

  if (token === 'LOADING') {
    return null;
  }

  return token ? (
    <PageRouteComponent>
      <Outlet />
    </PageRouteComponent>
  ) : (
    <Navigate to="/" />
  );
};

function AppRoutes() {
  const { services } = useEndApi();

  return (
    <DatabaseProvider database={services.endApi.database}>
      <Router>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/home" element={<Home />} />
            <Route path="/conquest" element={<Conquest />} />
            <Route path="/war/:id" element={<War />} />
          </Route>
          <Route
            path="/"
            element={
              <Container>
                <WithNavigate>
                  {(n) => (
                    <>
                      <Landing
                        services={services}
                        goToHome={() => n('/home')}
                      />
                      {/*<Link to={'#'}>*/}
                      {/*  <Badge title="Download the Android app" />*/}
                      {/*</Link>*/}
                    </>
                  )}
                </WithNavigate>
              </Container>
            }
          />
        </Routes>
      </Router>
    </DatabaseProvider>
  );
}

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
