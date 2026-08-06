import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Landmark, Mail, Phone, User, Award, Lock, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { PageTitle } from '@/components/layout/PageTitle';
import { profileService } from '@/services/profileService';
import { useAuthStore } from '@/store/useAuthStore';
import { UpdateProfileRequest, ChangePasswordRequest } from '@/types';

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

  // Profile Information Form
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
    },
  });

  // Password Change Form
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

  // Populate profile form defaults when data is loaded
  useEffect(() => {
    if (profile) {
      resetProfile({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
      });
    }
  }, [profile, resetProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdateProfileRequest) => profileService.updateProfile(values),
    onSuccess: (data) => {
      toast.success('Profil bilgileriniz başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      setUser({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
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
    updateProfileMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      title: values.title || null,
      avatarUrl: profile?.avatarUrl || null,
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
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          <div className="h-96 rounded-[24px] bg-slate-200 lg:col-span-1" />
          <div className="h-96 rounded-[24px] bg-slate-200 lg:col-span-3" />
        </div>
      </div>
    );
  }

  const initials =
    profile?.fullName
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('tr-TR') ?? 'D';

  return (
    <div className="space-y-5">
      <PageTitle title="Hesap Ayarları" description="Kişisel bilgilerinizi güncelleyin ve hesap şifrenizi yönetin." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        {/* Left Side: Profile Summary Panel */}
        <aside className="lg:col-span-1 space-y-4">
          <section className="dts-card p-5">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="relative shrink-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="h-14 w-14 rounded-full border border-slate-100 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#006482] text-lg font-bold text-white shadow-sm">
                    {initials}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-green-500 p-1" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                  {profile?.fullName}
                </h2>
                <p className="text-xs font-semibold text-[#006482] mt-0.5">
                  {profile?.role ? roleLabels[profile.role] : 'Kullanıcı'}
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-posta</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Landmark className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fakülte</p>
                  <p className="text-xs font-semibold text-slate-700">{profile?.faculty ?? 'Mühendislik Fakültesi'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bölüm</p>
                  <p className="text-xs font-semibold text-slate-700">{profile?.department ?? 'Bilgisayar Mühendisliği'}</p>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Right Side: Unified Settings Card */}
        <main className="lg:col-span-3">
          <section className="dts-card p-6 lg:p-8 space-y-8">
            
            {/* Part 1: Profile Details Form */}
            <div>
              <div className="mb-5">
                <h3 className="text-base font-bold tracking-tight text-slate-900">Profil Bilgileri</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kişisel ve iletişim bilgilerinizi güncelleyin.</p>
              </div>

              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="dts-input-label">Ad</label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="firstName"
                        type="text"
                        placeholder="Adınız"
                        className="dts-input pl-10"
                        {...registerProfile('firstName')}
                      />
                    </div>
                    {profileErrors.firstName && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="dts-input-label">Soyad</label>
                    <div className="group relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="lastName"
                        type="text"
                        placeholder="Soyadınız"
                        className="dts-input pl-10"
                        {...registerProfile('lastName')}
                      />
                    </div>
                    {profileErrors.lastName && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="phone" className="dts-input-label">Telefon</label>
                    <div className="group relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="phone"
                        type="text"
                        placeholder="+90 555 123 45 67"
                        className="dts-input pl-10"
                        {...registerProfile('phone')}
                      />
                    </div>
                    {profileErrors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="title" className="dts-input-label">Unvan</label>
                    <div className="group relative">
                      <Award className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="title"
                        type="text"
                        placeholder="Örn. Prof. Dr."
                        className="dts-input pl-10"
                        {...registerProfile('title')}
                      />
                    </div>
                    {profileErrors.title && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{profileErrors.title.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="dts-input-label">Kurumsal E-posta (Salt Okunur)</label>
                  <div className="relative bg-slate-50/50 rounded-2xl">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      id="email"
                      type="email"
                      value={profile?.email ?? ''}
                      disabled
                      className="dts-input pl-10 bg-slate-50/80 text-slate-400 cursor-not-allowed border-slate-200/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!isProfileDirty || updateProfileMutation.isPending}
                    className="dts-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </form>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Part 2: Change Password Form */}
            <div>
              <div className="mb-5">
                <h3 className="text-base font-bold tracking-tight text-slate-900">Şifre Değiştir</h3>
                <p className="text-xs text-slate-500 mt-0.5">Hesap güvenliğiniz için şifrenizi güncelleyin.</p>
              </div>

              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="currentPassword" className="dts-input-label">Mevcut Şifre</label>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="dts-input pl-10 pr-10"
                        {...registerPassword('currentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="dts-input-label">Yeni Şifre</label>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="dts-input pl-10 pr-10"
                        {...registerPassword('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="dts-input-label">Yeni Şifre (Tekrar)</label>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#006482]" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="dts-input pl-10 pr-10"
                        {...registerPassword('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
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
            </div>

          </section>
        </main>
      </div>
    </div>
  );
};
