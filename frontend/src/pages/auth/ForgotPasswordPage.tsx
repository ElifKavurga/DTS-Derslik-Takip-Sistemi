import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { AuthShell } from '@/components/auth/AuthShell';
import { authService } from '@/services/authService';
import { ForgotPasswordRequest } from '@/types';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'E-posta boş olamaz.').email('Geçerli bir e-posta adresi giriniz.'),
});

export const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      toast.success('Eğer bu e-posta adresi sistemde kayıtlıysa şifre sıfırlama bağlantısı oluşturuldu.');
    },
    onError: () => {
      toast.error('Beklenmeyen sistem hatası oluştu.');
    },
  });

  const onSubmit = (values: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <AuthShell
      eyebrow="Hesap kurtarma"
      title="Şifremi Unuttum"
      description="Kurumsal e-posta adresinizi girerek güvenli şifre sıfırlama talebi oluşturun."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-800">
            Kurumsal E-posta
          </label>
          <div className="group relative rounded-2xl p-[1.5px] shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
            />
            <EnvelopeIcon
              className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-hover:text-[#006482] group-focus-within:text-[#006482]"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@inonu.edu.tr"
              className="relative block h-11 w-full rounded-[14px] border border-slate-200 bg-slate-50/70 px-11 text-[15px] text-slate-950 outline-none transition duration-300 placeholder:text-slate-400 group-hover:border-transparent group-hover:bg-[#f6fbfe] focus:border-transparent focus:bg-white focus:ring-4 focus:ring-[#006482]/10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm font-medium text-red-600">{errors.email.message}</p>
          )}
        </div>

        {forgotPasswordMutation.isSuccess && (
          <div className="rounded-2xl border border-[#88d0f2]/70 bg-[#eff8ff] px-4 py-3 text-sm leading-6 text-[#004d65]">
            Eğer bu e-posta adresi sistemde kayıtlıysa şifre sıfırlama bağlantısı oluşturuldu.
          </div>
        )}

        <div className="group relative rounded-2xl p-[1.5px] shadow-[0_14px_28px_rgba(0,100,130,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(0,100,130,0.28)] focus-within:-translate-y-0.5 focus-within:shadow-[0_18px_34px_rgba(0,100,130,0.28)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-[#006482] via-[#00a896] to-[#fabc07] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
          />
          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="relative flex h-11 w-full items-center justify-center rounded-[14px] border border-transparent bg-[#006482] px-4 text-sm font-semibold text-white transition duration-300 hover:bg-[#004b62] focus:outline-none focus:ring-4 focus:ring-[#006482]/18 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
          >
            <span className="relative">
              {forgotPasswordMutation.isPending
                ? 'Bağlantı oluşturuluyor...'
                : 'Şifre Sıfırlama Bağlantısı Oluştur'}
            </span>
          </button>
        </div>

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
