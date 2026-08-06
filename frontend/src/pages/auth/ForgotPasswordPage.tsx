import { Link } from 'react-router-dom';
import dtsLogo from '@/assets/dts-logo.png';

export const ForgotPasswordPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9ff] px-4 py-8 text-[#0b1c30]">
      <section className="w-full max-w-md rounded-[20px] bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,100,130,0.10)]">
        <img src={dtsLogo} alt="DTS Logo" className="mx-auto mb-8 w-36 rounded-lg bg-white p-2" />
        <h1 className="text-2xl font-semibold text-[#006482]">Şifremi Unuttum</h1>
        <p className="mt-3 text-sm leading-6 text-[#3f484d]">
          Şifre yenileme modülü sonraki sprintlerde etkinleştirilecektir.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-2xl bg-[#006482] px-5 text-sm font-semibold text-white transition hover:bg-[#004b62]"
        >
          Giriş Ekranına Dön
        </Link>
      </section>
    </main>
  );
};
