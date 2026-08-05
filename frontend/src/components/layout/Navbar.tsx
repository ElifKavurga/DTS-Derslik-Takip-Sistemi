import { useAuthStore } from '@/store/useAuthStore';

export const Navbar = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <header>
      Navbar
      <button type="button" onClick={logout}>
        Logout
      </button>
    </header>
  );
};
