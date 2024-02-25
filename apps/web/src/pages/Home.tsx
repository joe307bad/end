import { Home as H } from '@end/components';
import { database, sync } from '@end/wm/web';

export default function Home() {
  return <H database={database} sync={sync} />;
}
