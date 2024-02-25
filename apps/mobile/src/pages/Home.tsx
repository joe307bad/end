import { Home as H, PrimaryButton } from '@end/components';
import { database, sync } from '@end/wm/rn';

export default function Home({ logOut }: { logOut: () => void }) {
  return (
    <>
      <H database={database} sync={sync} />
      <PrimaryButton onPress={logOut}>Logout</PrimaryButton>
    </>
  );
}
