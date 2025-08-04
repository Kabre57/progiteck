import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - toujours en haut */}
      <Header />
      
      <div className="flex pt-16">
        {/* Sidebar - à gauche, sous le header */}
        <Sidebar />
        
        {/* Contenu principal - à droite du sidebar, sous le header */}
        <main className="flex-1 ml-64 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}