import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
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
import { database } from '@end/wm/web';
import { DatabaseProvider } from '@nozbe/watermelondb/react';

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
  return (
    <Router>
      <Routes>
        <Route element={<PrivateRoutes />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route
          path="/"
          element={
            <Container>
              <WithNavigate>
                {(n) => (
                  <>
                    <Landing goToHome={() => n('/home')} />
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
  );
}

export function App() {
  const word = faker.random.word();
  const [n, setName] = useState(word.charAt(0).toUpperCase() + word.slice(1));

  const discoverSystem = useCallback(() => {
    fetch('https://end.fly.dev/system', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: n }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error(error));
  }, [n]);

  return (
    <DatabaseProvider database={database}>
      <Providers baseUrl={process.env.API_BASE_URL as string}>
        <AppRoutes />
      </Providers>
    </DatabaseProvider>
  );
}

export default App;
