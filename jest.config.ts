import { getJestProjects } from '@nx/jest';

export default {
  projects: getJestProjects(),
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
