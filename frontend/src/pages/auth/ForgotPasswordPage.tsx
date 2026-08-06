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

        {forgotPasswordMutation.isSuccess && (
          <div className="rounded-2xl border border-[#88d0f2]/70 bg-[#eff8ff] px-4 py-3 text-sm leading-6 text-[#004d65]">
            Eğer bu e-posta adresi sistemde kayıtlıysa şifre sıfırlama bağlantısı oluşturuldu.
          </div>
        )}

        <button
          type="submit"
          disabled={forgotPasswordMutation.isPending}
          className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#006482] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,100,130,0.22)] transition duration-200 before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] before:translate-x-[-120%] before:transition before:duration-700 hover:-translate-y-0.5 hover:bg-[#004b62] hover:shadow-[0_18px_34px_rgba(0,100,130,0.28)] hover:before:translate-x-[120%] focus:outline-none focus:ring-4 focus:ring-[#006482]/18 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
        >
          <span className="relative">
            {forgotPasswordMutation.isPending
              ? 'Bağlantı oluşturuluyor...'
              : 'Şifre Sıfırlama Bağlantısı Oluştur'}
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
