import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  ArrowRightIcon,
  BuildingLibraryIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import dtsLogo from '@/assets/dts-logo.png';
import { getDashboardPathByRole } from '@/router/roleRoutes';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginRequest } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'E-posta boş olamaz.').email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(1, 'Şifre boş olamaz.'),
});

type ApiError = {
  message?: string;
};

const getLoginErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message;

  if (message === 'Account is inactive') {
    return 'Hesabınız pasif durumda.';
  }

  if (message === 'Invalid email or password' || axiosError.response?.status === 401) {
    return 'E-posta veya şifre hatalı.';
  }

  return 'Beklenmeyen sistem hatası oluştu.';
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const login = useAuthStore((state) => state.login);
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      login(response);
      toast.success('Giriş başarılı.');
      const roleDashboardPath = getDashboardPathByRole(response.user.role);
      const redirectTo = fromPath && fromPath !== '/dashboard' ? fromPath : roleDashboardPath;
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => {
      toast.error(getLoginErrorMessage(error));
    },
  });

  const onSubmit = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  return (
    <main className="flex min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <section className="relative hidden w-1/2 overflow-hidden bg-[#006482] px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-[#004b62] opacity-25 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-[#88d0f2] opacity-20 blur-3xl" />

        <div className="relative z-10 max-w-xl">
          <img
            src={dtsLogo}
            alt="DTS Logo"
            className="mb-14 w-48 rounded-lg bg-white p-3 shadow-sm"
          />
          <h1 className="text-5xl font-bold leading-tight text-white">
            Derslik Takip Sistemi
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[#bfe9ff]">
            İnönü Üniversitesi derslik yönetimi için güvenli, hızlı ve kurumsal erişim.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-[#dce9ff]">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/12">
            <BuildingLibraryIcon className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">İnönü Üniversitesi</p>
            <p className="text-sm">Dijital Dönüşüm Ofisi</p>
          </div>
        </div>
      </section>

      <section className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center lg:hidden">
            <img src={dtsLogo} alt="DTS Logo" className="w-36 rounded-lg bg-white p-2 shadow-sm" />
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(0,100,130,0.10)] sm:p-10"
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold text-[#006482]">Hoş Geldiniz</h2>
              <p className="mt-2 text-base text-[#3f484d]">
                Kurumsal kimlik bilgilerinizle giriş yapın.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#0b1c30]">
                  Kurumsal E-posta
                </label>
                <div className="relative">
                  <EnvelopeIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70787e]"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@inonu.edu.tr"
                    className="block h-12 w-full rounded-lg border border-[#bfc8ce] bg-white px-10 text-base text-[#0b1c30] outline-none transition focus:border-[#fdbc07] focus:ring-2 focus:ring-[#fdbc07]/30"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm font-medium text-[#ba1a1a]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#0b1c30]">
                  Şifre
                </label>
                <div className="relative">
                  <LockClosedIcon
                    className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#70787e]"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="block h-12 w-full rounded-lg border border-[#bfc8ce] bg-white px-10 text-base text-[#0b1c30] outline-none transition focus:border-[#fdbc07] focus:ring-2 focus:ring-[#fdbc07]/30"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[#70787e] transition hover:text-[#006482] focus:outline-none focus:ring-2 focus:ring-[#fdbc07]/40"
                    onClick={() => setIsPasswordVisible((value) => !value)}
                    aria-label={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    title={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {isPasswordVisible ? (
                      <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm font-medium text-[#ba1a1a]">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-[#006482] transition hover:text-[#004b62]"
              >
                Şifremi Unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#006482] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004b62] hover:shadow-[0_8px_28px_rgba(0,100,130,0.18)] focus:outline-none focus:ring-2 focus:ring-[#fdbc07] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              {!loginMutation.isPending && <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-[#70787e]">
            © 2026 İnönü Üniversitesi Dijital Dönüşüm Ofisi
          </p>
        </div>
      </section>
    </main>
  );
};
