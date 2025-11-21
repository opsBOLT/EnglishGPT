import { ReactNode } from 'react';
import NavigationBar from './NavigationBar';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#f1e8ff,transparent_35%),radial-gradient(circle_at_90%_10%,#eaf2ff,transparent_30%),#f8f9ff]">
      <NavigationBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
