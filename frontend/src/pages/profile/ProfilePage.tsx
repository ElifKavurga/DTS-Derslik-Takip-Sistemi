import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Mail, Phone, User, KeyRound } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { profileService } from '@/services/profileService';
import { facultyService } from '@/services/facultyService';
import { departmentService } from '@/services/departmentService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/useAuthStore';
import { ChangePasswordRequest } from '@/types';
import { cn } from '@/utils/cn';
import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  DEPARTMENT_ADMIN: 'Bölüm Admini',
  ACADEMICIAN: 'Akademisyen',
};

const roleBadgeClasses: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-200/80',
  DEPARTMENT_ADMIN: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  ACADEMICIAN: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
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
  facultyId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  role: z.string().min(1, 'Rol alanı boş olamaz.'),
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

  // Warning state for Super Admin role changes
  const [showConfirmLeaveAdmin, setShowConfirmLeaveAdmin] = useState(false);
  const [pendingValues, setPendingValues] = useState<ProfileFormValues | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
  });

  const { data: facultiesData } = useQuery({
    queryKey: ['faculties'],
    queryFn: facultyService.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getAll,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    watch: watchProfile,
    control: controlProfile,
    setValue: setValueProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      title: '',
      avatarUrl: '',
      facultyId: '',
      departmentId: '',
      role: '',
    },
  });

  const selectedFacultyId = watchProfile('facultyId');
  const filteredDepartments = useMemo(() => {
    if (!selectedFacultyId) return [];
    return departments?.filter((d: any) => d.facultyId === selectedFacultyId) ?? [];
  }, [selectedFacultyId, departments]);

  const facultyOptions = useMemo(() => {
    return facultiesData?.faculties?.map((f: any) => ({
      value: f.id,
      label: f.name,
    })) ?? [];
  }, [facultiesData]);

  const departmentOptions = useMemo(() => {
    return filteredDepartments?.map((d: any) => ({
      value: d.id,
      label: d.name,
    })) ?? [];
  }, [filteredDepartments]);

  const roleOptions = [
    { value: 'SUPER_ADMIN', label: 'Süper Admin' },
    { value: 'DEPARTMENT_ADMIN', label: 'Bölüm Admini' },
    { value: 'ACADEMICIAN', label: 'Akademisyen' },
  ];

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
    if (profile && facultiesData && departments) {
      const currentFaculty = facultiesData.faculties?.find((f: any) => f.name === profile.faculty);
      const currentDepartment = departments?.find((d: any) => d.name === profile.department);

      resetProfile({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        title: profile.title ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        facultyId: currentFaculty?.id ?? '',
        departmentId: currentDepartment?.id ?? '',
        role: profile.role ?? '',
      });
    }
  }, [profile, facultiesData, departments, resetProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (profile?.role === 'SUPER_ADMIN') {
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: profile.email,
          roles: [values.role],
          phone: values.phone || null,
          active: true,
          title: values.title || null,
          facultyId: values.facultyId || null,
          departmentId: values.departmentId || null,
          office: null,
        };
        return userService.update(profile.id, payload);
      } else {
        return profileService.updateProfile({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || null,
          title: values.title || null,
          avatarUrl: values.avatarUrl || null,
        });
      }
    },
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
        roles: data.roles,
      });

      if (profile?.role === 'SUPER_ADMIN' && data.role !== 'SUPER_ADMIN') {
        toast.success('Rol yetkileriniz değişti. Oturum yenileniyor...');
        setTimeout(() => {
          logout();
          navigate('/giris');
        }, 1500);
      }
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
    if (profile?.role === 'SUPER_ADMIN' && values.role !== 'SUPER_ADMIN') {
      setPendingValues(values);
      setShowConfirmLeaveAdmin(true);
    } else {
      updateProfileMutation.mutate(values);
    }
  };

  const handleConfirmLeaveAdmin = () => {
    if (pendingValues) {
      updateProfileMutation.mutate(pendingValues);
      setPendingValues(null);
    }
    setShowConfirmLeaveAdmin(false);
  };

  const handleCancelLeaveAdmin = () => {
    setPendingValues(null);
    setShowConfirmLeaveAdmin(false);
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
      <div className="mx-auto w-full space-y-3.5 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-200" />
        <div className="h-32 rounded-2xl bg-slate-200" />
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

  const userRole = profile?.role ? roleLabels[profile.role] : 'Kullanıcı';
  const roleBadgeClass = profile?.role ? roleBadgeClasses[profile.role] : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="mx-auto w-full space-y-[20px]">
      {/* 1. Profil Özet Kartı */}
      <section className="dts-card dts-interactive-card relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3 sm:p-3.5 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-slate-100 object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#006482] text-xs sm:text-sm font-bold text-white shadow-xs">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm sm:text-base font-bold text-slate-900">{profile?.fullName}</h2>
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${roleBadgeClass}`}>
                  {userRole}
                </span>
              </div>
              {(profile?.faculty || profile?.department) && (
                <p className="mt-0.5 text-xs font-medium text-slate-500 truncate">
                  {[profile?.faculty, profile?.department].filter(Boolean).join(' • ')}
                </p>
              )}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.email}</span>
                </span>
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{profile.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#eff8ff] border border-[#006482]/20 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-[#006482] shrink-0 self-start sm:self-auto">
            <User className="h-3 w-3" />
            Profil Özeti
          </span>
        </div>
      </section>

      {/* 2. Profil Bilgileri Form Kartı */}
      <section className="dts-card dts-interactive-card p-3 sm:p-3.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
        <div className="mb-2 flex items-center gap-2 border-b border-slate-100/90 pb-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
            <User className="h-3 w-3" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900">Profil Bilgileri</h3>
        </div>

        <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-2.5">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kişisel Bilgiler</h4>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="dts-input-label text-[10px] mb-1">
                Telefon
              </label>
              <input
                id="phone"
                type="text"
                placeholder="+90 555 123 45 67"
                className="dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
                {...registerProfile('phone')}
              />
              {profileErrors.phone && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{profileErrors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="avatarUrl" className="dts-input-label text-[10px] mb-1">
                Profil Fotoğrafı URL
              </label>
              <input
                id="avatarUrl"
                type="text"
                placeholder="https://example.com/photo.jpg"
                className="dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
                {...registerProfile('avatarUrl')}
              />
              {profileErrors.avatarUrl && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{profileErrors.avatarUrl.message}</p>
              )}
            </div>
          </div>

          <div className="pt-0.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">İdari ve Akademik Bilgiler</h4>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="dts-input-label text-[10px] mb-1">
                Ad
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="Adınız"
                readOnly={isAcademician}
                className={cn(
                  "dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10",
                  isAcademician ? "cursor-default border-slate-200/70 bg-slate-50/80 text-slate-600" : "hover:border-[#88d0f2]"
                )}
                {...registerProfile('firstName')}
              />
              {profileErrors.firstName && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{profileErrors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="dts-input-label text-[10px] mb-1">
                Soyad
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Soyadınız"
                readOnly={isAcademician}
                className={cn(
                  "dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10",
                  isAcademician ? "cursor-default border-slate-200/70 bg-slate-50/80 text-slate-600" : "hover:border-[#88d0f2]"
                )}
                {...registerProfile('lastName')}
              />
              {profileErrors.lastName && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{profileErrors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="dts-input-label text-[10px] mb-1">
                Unvan
              </label>
              <input
                id="title"
                type="text"
                placeholder="Örn. Prof. Dr."
                readOnly={isAcademician}
                className={cn(
                  "dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10",
                  isAcademician ? "cursor-default border-slate-200/70 bg-slate-50/80 text-slate-600" : "hover:border-[#88d0f2]"
                )}
                {...registerProfile('title')}
              />
              {profileErrors.title && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{profileErrors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="dts-input-label text-[10px] mb-1">
                Kurumsal E-posta
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email ?? ''}
                readOnly
                className="dts-input cursor-default border-slate-200/70 bg-slate-50/80 text-slate-600 text-xs sm:text-sm h-10 py-1.5 px-3 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="dts-input-label text-[10px] mb-1">
                Fakülte
              </label>
              <Controller
                name="facultyId"
                control={controlProfile}
                render={({ field }) => (
                  <AppSelect
                    options={facultyOptions}
                    value={field.value ?? ''}
                    onChange={(val) => {
                      field.onChange(val);
                      setValueProfile('departmentId', '', { shouldDirty: true });
                    }}
                    disabled={profile?.role !== 'SUPER_ADMIN'}
                    placeholder="Fakülte Seçin"
                  />
                )}
              />
            </div>

            <div>
              <label className="dts-input-label text-[10px] mb-1">
                Bölüm
              </label>
              <Controller
                name="departmentId"
                control={controlProfile}
                render={({ field }) => (
                  <AppSelect
                    options={departmentOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    disabled={profile?.role !== 'SUPER_ADMIN' || !selectedFacultyId}
                    placeholder={selectedFacultyId ? 'Bölüm Seçin' : 'Önce fakülte seçin'}
                  />
                )}
              />
            </div>
          </div>

          <div>
            <label className="dts-input-label text-[10px] mb-1">
              Sistem Rolü
            </label>
            <Controller
              name="role"
              control={controlProfile}
              render={({ field }) => (
                <AppSelect
                  options={roleOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={profile?.role !== 'SUPER_ADMIN'}
                  placeholder="Rol Seçin"
                />
              )}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100/90">
            <button
              type="button"
              onClick={() => {
                if (profile && facultiesData && departments) {
                  const currentFaculty = facultiesData.faculties?.find((f: any) => f.name === profile.faculty);
                  const currentDepartment = departments?.find((d: any) => d.name === profile.department);
                  resetProfile({
                    firstName: profile.firstName ?? '',
                    lastName: profile.lastName ?? '',
                    phone: profile.phone ?? '',
                    title: profile.title ?? '',
                    avatarUrl: profile.avatarUrl ?? '',
                    facultyId: currentFaculty?.id ?? '',
                    departmentId: currentDepartment?.id ?? '',
                    role: profile.role ?? '',
                  });
                  toast.success('Değişiklikler iptal edildi.');
                }
              }}
              disabled={!isProfileDirty || updateProfileMutation.isPending}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!isProfileDirty || updateProfileMutation.isPending}
              className="w-full sm:w-auto dts-btn-primary rounded-xl text-xs py-1.5 px-3 shadow-xs hover:shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Şifre Değiştir Form Kartı */}
      <section className="dts-card dts-interactive-card p-3 sm:p-3.5 border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa]">
        <div className="mb-2 flex items-center gap-2 border-b border-slate-100/90 pb-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eff8ff] text-[#006482]">
            <KeyRound className="h-3 w-3" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900">Şifre Değiştir</h3>
        </div>

        <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-2.5">
          <div className="grid gap-2.5 md:grid-cols-3">
            <div>
              <label htmlFor="currentPassword" className="dts-input-label text-[10px] mb-1">
                Mevcut Şifre
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
                  {...registerPassword('currentPassword')}
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Mevcut şifreyi gizle' : 'Mevcut şifreyi göster'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="dts-input-label text-[10px] mb-1">
                Yeni Şifre
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
                  {...registerPassword('newPassword')}
                />
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Yeni şifreyi gizle' : 'Yeni şifreyi göster'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="dts-input-label text-[10px] mb-1">
                Yeni Şifre (Tekrar)
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="dts-input h-10 py-1.5 px-3 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
                  {...registerPassword('confirmPassword')}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Yeni şifre tekrarını gizle' : 'Yeni şifre tekrarını göster'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="mt-0.5 text-[10px] font-medium text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!isPasswordDirty || !isPasswordValid || changePasswordMutation.isPending}
              className="w-full sm:w-auto dts-btn-primary rounded-xl text-xs py-1.5 px-3 shadow-xs hover:shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? 'Değiştiriliyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </section>

      {/* Warning ConfirmDialog */}
      <ConfirmDialog
        isOpen={showConfirmLeaveAdmin}
        onClose={handleCancelLeaveAdmin}
        onConfirm={handleConfirmLeaveAdmin}
        title="Süper Admin Rolünden Çıkış"
        message="Süper Admin yetkilerini bırakmak üzeresiniz. Bu işlemden sonra sistemdeki tüm yönetici yetkilerinizi kaybedeceksiniz. Devam etmek istiyor musunuz?"
        confirmText="Evet, Değiştir"
        cancelText="Vazgeç"
      />
    </div>
  );
};
