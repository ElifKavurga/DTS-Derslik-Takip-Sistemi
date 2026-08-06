import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Landmark, Mail, Phone, User, Award } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { PageTitle } from '@/components/layout/PageTitle';
import { profileService } from '@/services/profileService';
import { useAuthStore } from '@/store/useAuthStore';
import { UpdateProfileRequest } from '@/types';

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

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      title: '',
    },
  });

  // Populate form defaults when data is loaded
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
      });
    }
  }, [profile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdateProfileRequest) => profileService.updateProfile(values),
    onSuccess: (data) => {
      toast.success('Profil bilgileriniz başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Sync Zustand session so Header avatar name updates instantly
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

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
      title: values.title || null,
      avatarUrl: profile?.avatarUrl || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="h-96 rounded-[24px] bg-slate-200" />
          <div className="h-96 rounded-[24px] bg-slate-200 lg:col-span-2" />
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
      <PageTitle title="Profil" description="Kişisel bilgilerinizi ve hesap detaylarınızı buradan yönetebilirsiniz." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left Side: Profile Card */}
        <section className="dts-card flex flex-col items-center text-center p-6 h-fit lg:col-span-1">
          <div className="relative">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-20 w-20 rounded-full border border-slate-100 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#006482] text-2xl font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-green-500 p-1.5" />
          </div>

          <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
            {profile?.fullName}
          </h2>
          <p className="text-xs font-semibold text-[#006482] mt-0.5">
            {profile?.role ? roleLabels[profile.role] : 'Kullanıcı'}
          </p>

          <div className="mt-6 w-full border-t border-slate-100 pt-5 space-y-3.5 text-left">
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

        {/* Right Side: Edit Form */}
        <section className="dts-card lg:col-span-2">
          <h3 className="text-base font-bold tracking-tight text-slate-900 border-b border-slate-100 pb-3 mb-5">
            Profil Bilgileri
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.firstName.message}</p>
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
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.lastName.message}</p>
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
                    {...register('phone')}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone.message}</p>
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
                    {...register('title')}
                  />
                </div>
                {errors.title && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title.message}</p>
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
                disabled={!isDirty || updateProfileMutation.isPending}
                className="dts-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
