import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
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
    <AuthShell
      eyebrow="Kurumsal erişim"
      title="DTS"
      description="Derslik planlama ve yönetim işlemleri için güvenli erişim."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-800">
            Kurumsal E-posta
          </label>
          <div className="group relative">
            <EnvelopeIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#006482]"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@inonu.edu.tr"
              className="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-11 text-[15px] text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#006482]/45 focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm font-medium text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-800">
            Şifre
          </label>
          <div className="group relative">
            <LockClosedIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#006482]"
              aria-hidden="true"
            />
            <input
              id="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-11 text-[15px] text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#006482]/45 focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-[#006482] focus:outline-none focus:ring-4 focus:ring-[#006482]/10"
              onClick={() => setIsPasswordVisible((value) => !value)}
              aria-label={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
              title={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              <span className="transition duration-200 ease-out">
                {isPasswordVisible ? (
                  <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm font-medium text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            to="/sifremi-unuttum"
            className="text-sm font-medium text-[#006482] transition duration-200 hover:text-[#004b62]"
          >
            Şifremi Unuttum
          </Link>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#006482] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,100,130,0.22)] transition duration-200 before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] before:translate-x-[-120%] before:transition before:duration-700 hover:-translate-y-0.5 hover:bg-[#004b62] hover:shadow-[0_18px_34px_rgba(0,100,130,0.28)] hover:before:translate-x-[120%] focus:outline-none focus:ring-4 focus:ring-[#006482]/18 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
        >
          <span className="relative">{loginMutation.isPending ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
        </button>
      </form>
    </AuthShell>
  );
};
