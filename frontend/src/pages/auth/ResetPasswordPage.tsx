import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { authService } from '@/services/authService';

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
    confirmPassword: z.string().min(1, 'Şifre tekrar alanı boş olamaz.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Şifre tekrar alanı eşleşmelidir.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

type ApiError = {
  message?: string;
};

const getResetPasswordErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message;

  if (message === 'Expired reset token') {
    return 'Şifre sıfırlama bağlantısının süresi dolmuş.';
  }

  if (message === 'Invalid reset token' || message === 'User not found') {
    return 'Şifre sıfırlama bağlantısı geçersiz.';
  }

  return 'Beklenmeyen sistem hatası oluştu.';
};

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => {
      toast.success('Şifreniz başarıyla güncellendi.');
    },
    onError: (error) => {
      toast.error(getResetPasswordErrorMessage(error));
    },
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Şifre sıfırlama bağlantısı geçersiz.');
      return;
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: values.newPassword,
    });
  };

  return (
    <AuthShell
      eyebrow="Yeni şifre"
      title="Şifreyi Sıfırla"
      description="DTS hesabınız için yeni ve güvenli bir şifre belirleyin."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {!token && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            Şifre sıfırlama bağlantısı geçersiz.
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-800">
            Yeni Şifre
          </label>
          <div className="group relative">
            <LockClosedIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#006482]"
              aria-hidden="true"
            />
            <input
              id="newPassword"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              className="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-11 text-[15px] text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#006482]/45 focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
              {...register('newPassword')}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-[#006482] focus:outline-none focus:ring-4 focus:ring-[#006482]/10"
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
          {errors.newPassword && (
            <p className="mt-2 text-sm font-medium text-red-600">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-800">
            Yeni Şifre (Tekrar)
          </label>
          <div className="group relative">
            <LockClosedIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#006482]"
              aria-hidden="true"
            />
            <input
              id="confirmPassword"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              className="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-11 text-[15px] text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#006482]/45 focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-[#006482] focus:outline-none focus:ring-4 focus:ring-[#006482]/10"
              onClick={() => setIsConfirmPasswordVisible((value) => !value)}
              aria-label={isConfirmPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
              title={isConfirmPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {isConfirmPasswordVisible ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm font-medium text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {isSubmitSuccessful && resetPasswordMutation.isSuccess && (
          <div className="rounded-2xl border border-[#88d0f2]/70 bg-[#eff8ff] px-4 py-3 text-sm leading-6 text-[#004d65]">
            Şifreniz başarıyla güncellendi. Giriş ekranından yeni şifrenizle oturum açabilirsiniz.
          </div>
        )}

        <button
          type="submit"
          disabled={!token || resetPasswordMutation.isPending || resetPasswordMutation.isSuccess}
          className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#006482] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,100,130,0.22)] transition duration-200 before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] before:translate-x-[-120%] before:transition before:duration-700 hover:-translate-y-0.5 hover:bg-[#004b62] hover:shadow-[0_18px_34px_rgba(0,100,130,0.28)] hover:before:translate-x-[120%] focus:outline-none focus:ring-4 focus:ring-[#006482]/18 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
        >
          <span className="relative">
            {resetPasswordMutation.isPending ? 'Şifre güncelleniyor...' : 'Şifreyi Güncelle'}
          </span>
        </button>

        <Link
          to="/giris"
          className="flex items-center justify-center gap-2 text-sm font-medium text-slate-600 transition duration-200 hover:text-slate-950"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Giriş Ekranına Dön
        </Link>
      </form>
    </AuthShell>
  );
};
