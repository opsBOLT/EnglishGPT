import { ReactNode } from 'react';
import NavigationBar from './NavigationBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)" }}>
      <NavigationBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
