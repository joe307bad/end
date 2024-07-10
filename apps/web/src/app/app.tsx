import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Container,
  ContainerWithNav,
  Landing,
  Providers,
} from '@end/components';
import { faker } from '@faker-js/faker';
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
} from 'react-router-dom';
import Home from '../pages/Home';
import { useAuth } from '@end/auth';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import Conquest from '../pages/Conquest';
import War from '../pages/War';
import { EndApiProvider, useEndApi } from '@end/data/web';

function WithNavigate({
  children,
}: {
  children: (n: NavigateFunction) => ReactNode;
}) {
  const navigate = useNavigate();
  return children(navigate);
}

function Page({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { deleteToken } = useAuth();

  const logOut = useCallback(async () => {
    await deleteToken();
    navigate('/', { replace: true });
  }, []);

  return (
    <ContainerWithNav
      navigate={navigate}
      currentRoute={pathname}
      logOut={logOut}
    >
      {children}
    </ContainerWithNav>
  );
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
    <Page>
      <Outlet />
    </Page>
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
                      <Landing services={services} goToHome={() => n('/home')} />
                      <Link to={'#'}>
                        <Badge title="Download the Android app" />
                      </Link>
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
      <EndApiProvider baseUrl={process.env.API_BASE_URL} webSocketUrl={process.env.WEBSOCKET_URL}>
        <AppRoutes />
      </EndApiProvider>
    </Providers>
  );
}

export default App;
