import { useAuthStore } from '@/store/useAuthStore';

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  return <div>Dashboard {user ? `- ${user.fullName}` : ''}</div>;
};
