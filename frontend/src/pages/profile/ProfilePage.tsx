import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Phone, User, Landmark, GraduationCap, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { PageTitle } from '@/components/layout/PageTitle';
import { profileService } from '@/services/profileService';
import { useAuthStore } from '@/store/useAuthStore';
import { ChangePasswordRequest, UpdateProfileRequest } from '@/types';
import { cn } from '@/utils/cn';

const roleLabels = {
  SUPER_ADMIN: 'Süper Admin',
  DEPARTMENT_ADMIN: 'Bölüm Admini',
  ACADEMICIAN: 'Akademisyen',
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'Ad alanı boş olamaz.').max(100, 'Ad en fazla 100 karakter olabilir.'),
  lastName: z.string().min(1, 'Soyad alanı boş olamaz.').max(100, 'Soyad en fazla 100 karakter olabilir.'),
  phone: z
    .string()
    .max(20, 'Telefon numarası en fazla 20 karakter olabilir.')
    .nullable()
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .max(100, 'Unvan en fazla 100 karakter olabilir.')
    .nullable()
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .max(255, 'Avatar URL en fazla 255 karakter olabilir.')
    .nullable()
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre alanı boş olamaz.'),
    newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır.'),
    confirmPassword: z.string().min(1, 'Yeni şifre tekrarı boş olamaz.'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Yeni şifre mevcut şifre ile aynı olamaz.',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yeni şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      title: '',
      avatarUrl: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isDirty: isPasswordDirty, isValid: isPasswordValid },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (profile) {
      resetProfile({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
        avatarUrl: profile.avatarUrl ?? '',
      });
    }
  }, [profile, resetProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdateProfileRequest) => profileService.updateProfile(values),
    onSuccess: (data) => {
      toast.success('Profil bilgileriniz başarıyla güncellendi.');
      resetProfile({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        phone: data.phone ?? '',
        title: data.title ?? '',
        avatarUrl: data.avatarUrl ?? '',
      });
      queryClient.setQueryData(['profile'], data);

      setUser({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        roles: data.roles,
      });
    },
    onError: () => {
      toast.error('Profil güncellenirken bir hata oluştu.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordRequest) => profileService.changePassword(values),
    onSuccess: () => {
      toast.success('Şifreniz başarıyla değiştirildi. Oturumunuz kapatılıyor...');
      resetPassword();
      setTimeout(() => {
        logout();
        navigate('/giris');
      }, 1500);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Mevcut şifreniz hatalı veya şifre değiştirilemedi.';
      toast.error(errorMessage);
    },
  });

  const onProfileSubmit = (values: ProfileFormValues) => {
    if (!isProfileDirty) {
      toast.success('Profil bilgileriniz güncel.');
      return;
    }

    updateProfileMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      title: values.title || null,
      avatarUrl: values.avatarUrl || null,
    });
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-40 rounded-[24px] bg-slate-200" />
        <div className="h-96 rounded-[24px] bg-slate-200" />
      </div>
    );
  }

  const isAcademician = profile?.role === 'ACADEMICIAN';

  const initials =
    profile?.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('tr-TR') ?? 'D';

  const profileMeta = [profile?.role ? roleLabels[profile.role] : 'Kullanıcı', profile?.faculty, profile?.department]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageTitle title="Hesap Ayarları" description="Profil bilgilerinizi ve şifrenizi buradan güncelleyin." />

      <section className="dts-card p-5 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-16 w-16 rounded-full border border-slate-100 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#006482] text-lg font-bold text-white shadow-sm">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-950">{profile?.fullName}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">{profileMeta}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </span>
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#006482]/10 px-3 py-2 text-xs font-bold text-[#006482]">
            <User className="h-4 w-4" />
            Profil Ayarları
          </span>
        </div>
      </section>

      <section className="dts-card p-6 lg:p-8">
        <div className="mb-6">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">Profil Bilgileri</h3>
          <p className="mt-1 text-xs text-slate-500">Profil bilgilerinizi buradan görüntüleyebilir ve kişisel bilgilerinizi güncelleyebilirsiniz.</p>
        </div>

        <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Kişisel Bilgiler</h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="dts-input-label">
                Telefon
              </label>
              <input
                id="phone"
                type="text"
                placeholder="+90 555 123 45 67"
                className="dts-input"
                {...registerProfile('phone')}
              />
              {profileErrors.phone && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="avatarUrl" className="dts-input-label">
                Profil Fotoğrafı URL
              </label>
              <input
                id="avatarUrl"
                type="text"
                placeholder="https://example.com/photo.jpg"
                className="dts-input"
                {...registerProfile('avatarUrl')}
              />
              {profileErrors.avatarUrl && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.avatarUrl.message}</p>
              )}
            </div>
          </div>

          <div className="border-b border-slate-100 pb-3 pt-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">İdari ve Akademik Bilgiler</h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="dts-input-label">
                Ad
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="Adınız"
                readOnly={isAcademician}
                className={cn(
                  "dts-input",
                  isAcademician && "cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
                )}
                {...registerProfile('firstName')}
              />
              {profileErrors.firstName && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="dts-input-label">
                Soyad
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Soyadınız"
                readOnly={isAcademician}
                className={cn(
                  "dts-input",
                  isAcademician && "cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
                )}
                {...registerProfile('lastName')}
              />
              {profileErrors.lastName && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="dts-input-label">
                Unvan
              </label>
              <input
                id="title"
                type="text"
                placeholder="Örn. Prof. Dr."
                readOnly={isAcademician}
                className={cn(
                  "dts-input",
                  isAcademician && "cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
                )}
                {...registerProfile('title')}
              />
              {profileErrors.title && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="dts-input-label">
                Kurumsal E-posta
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email ?? ''}
                readOnly
                className="dts-input cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="faculty" className="dts-input-label">
                Fakülte
              </label>
              <input
                id="faculty"
                type="text"
                value={profile?.faculty ?? ''}
                readOnly
                className="dts-input cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label htmlFor="department" className="dts-input-label">
                Bölüm
              </label>
              <input
                id="department"
                type="text"
                value={profile?.department ?? ''}
                readOnly
                className="dts-input cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="dts-input-label">
              Sistem Rolü
            </label>
            <input
              id="role"
              type="text"
              value={profile?.role ? roleLabels[profile.role] : ''}
              readOnly
              className="dts-input cursor-default border-slate-200/70 bg-slate-50 text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (profile) {
                  resetProfile({
                    firstName: profile.firstName ?? '',
                    lastName: profile.lastName ?? '',
                    phone: profile.phone ?? '',
                    title: profile.title ?? '',
                    avatarUrl: profile.avatarUrl ?? '',
                  });
                  toast.success('Değişiklikler iptal edildi.');
                }
              }}
              disabled={!isProfileDirty || updateProfileMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!isProfileDirty || updateProfileMutation.isPending}
              className="dts-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </section>

      <section className="dts-card p-6 lg:p-8">
        <div className="mb-6">
          <h3 className="text-sm font-bold tracking-tight text-slate-900">Şifre Değiştir</h3>
          <p className="mt-1 text-xs text-slate-500">Mevcut şifrenizi doğrulayarak yeni şifrenizi belirleyin.</p>
        </div>

        <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="currentPassword" className="dts-input-label">
                Mevcut Şifre
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input pr-10"
                  {...registerPassword('currentPassword')}
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Mevcut şifreyi gizle' : 'Mevcut şifreyi göster'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="dts-input-label">
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input pr-10"
                  {...registerPassword('newPassword')}
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Yeni şifreyi gizle' : 'Yeni şifreyi göster'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="dts-input-label">
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input pr-10"
                  {...registerPassword('confirmPassword')}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Yeni şifre tekrarını gizle' : 'Yeni şifre tekrarını göster'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!isPasswordDirty || !isPasswordValid || changePasswordMutation.isPending}
              className="dts-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? 'Değiştiriliyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
