import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div>
        <Navbar />
        <MainContent />
      </div>
    </div>
  );
};
