export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/app-source/index.html', // or '/index' if it's a Next.js page
      permanent: true, // Set to true for a 301 redirect
    },
  };
}
 export default function App() {
  return null;
 }
