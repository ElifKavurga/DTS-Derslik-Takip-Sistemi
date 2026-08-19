import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Edit2, Mail, Phone, Plus, Trash2, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { cn } from '@/utils/cn';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppSelect } from '@/components/ui/AppSelect';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { academicianService } from '@/services/academicianService';
import { UserResponse } from '@/types';

const academicianSchema = z.object({
  firstName: z.string().min(1, 'Ad zorunludur.'),
  lastName: z.string().min(1, 'Soyad zorunludur.'),
  email: z.string().min(1, 'E-posta zorunludur.').email('Gecerli bir e-posta giriniz.'),
  password: z.string().optional(),
  phone: z.string().min(1, 'Telefon zorunludur.'),
  title: z.string().min(1, 'Lutfen bir unvan seciniz.'),
  active: z.boolean().optional(),
});

const ACADEMIC_TITLE_OPTIONS = [
  { label: 'Profesör Dr.', value: 'Profesör Dr.' },
  { label: 'Doçent Dr.', value: 'Doçent Dr.' },
  { label: 'Dr. Öğretim Üyesi', value: 'Dr. Öğretim Üyesi' },
  { label: 'Araştırma Görevlisi', value: 'Araştırma Görevlisi' },
];

const TITLE_FILTER_OPTIONS = [{ label: 'Tum unvanlar', value: '' }, ...ACADEMIC_TITLE_OPTIONS];

const LEGACY_TITLE_MAP: Record<string, string> = {
  PROFESOR: 'Profesör Dr.',
  DOCENT: 'Doçent Dr.',
  DR_OGRETIM_UYESI: 'Dr. Öğretim Üyesi',
  ARASTIRMA_GOREVLISI: 'Araştırma Görevlisi',
  'Prof. Dr.': 'Profesör Dr.',
  'Doç. Dr.': 'Doçent Dr.',
  'Dr. Öğr. Üyesi': 'Dr. Öğretim Üyesi',
  'Arş. Gör.': 'Araştırma Görevlisi',
};

const normalizeAcademicTitle = (title?: string | null) => {
  const trimmed = title?.trim();
  if (!trimmed) return '';
  return LEGACY_TITLE_MAP[trimmed] ?? (ACADEMIC_TITLE_OPTIONS.some((option) => option.value === trimmed) ? trimmed : '');
};

const displayAcademicTitle = (title?: string | null) => normalizeAcademicTitle(title) || title || '-';

type AcademicianFormValues = z.infer<typeof academicianSchema>;
type ApiError = { message?: string };

const getErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message || 'Islem sirasinda bir hata olustu.';
};

const fullName = (academician: UserResponse) => `${academician.firstName} ${academician.lastName}`;

export const AcademiciansPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [editingAcademician, setEditingAcademician] = useState<UserResponse | null>(null);
  const [deletingAcademician, setDeletingAcademician] = useState<UserResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors }, setError } = useForm<AcademicianFormValues>({
    resolver: zodResolver(academicianSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      title: '',
      active: true,
    },
  });

  const academiciansQuery = useQuery({
    queryKey: ['managedAcademicians', searchQuery, titleFilter],
    queryFn: () => academicianService.getManaged({
      search: searchQuery || undefined,
      title: titleFilter || undefined,
    }),
  });

  const academicians = academiciansQuery.data ?? [];

  const openCreateModal = () => {
    setEditingAcademician(null);
    reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      title: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (academician: UserResponse) => {
    setEditingAcademician(academician);
    reset({
      firstName: academician.firstName,
      lastName: academician.lastName,
      email: academician.email,
      password: '',
      phone: academician.phone ?? '',
      title: normalizeAcademicTitle(academician.title),
      active: academician.active,
    });
    setIsModalOpen(true);
  };

  const invalidateAcademicians = () => {
    queryClient.invalidateQueries({ queryKey: ['managedAcademicians'] });
    queryClient.invalidateQueries({ queryKey: ['departmentAdminDashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: academicianService.createManaged,
    onSuccess: () => {
      toast.success('Akademisyen eklendi.');
      invalidateAcademicians();
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => academicianService.updateManaged(id, payload),
    onSuccess: () => {
      toast.success('Akademisyen guncellendi.');
      invalidateAcademicians();
      setIsModalOpen(false);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deactivateMutation = useMutation({
    mutationFn: academicianService.deactivateManaged,
    onSuccess: () => {
      toast.success('Akademisyen pasif hale getirildi.');
      invalidateAcademicians();
      setDeletingAcademician(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onSubmit = (values: AcademicianFormValues) => {
    if (!editingAcademician && !values.password?.trim()) {
      setError('password', { type: 'manual', message: 'Sifre zorunludur.' });
      return;
    }

    if (editingAcademician) {
      updateMutation.mutate({
        id: editingAcademician.id,
        payload: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          title: values.title,
          active: values.active ?? true,
        },
      });
      return;
    }

    createMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password ?? '',
      phone: values.phone,
      title: values.title,
    });
  };

  if (academiciansQuery.isError) {
    return (
      <div className="dts-card py-12 text-center">
        <h3 className="text-lg font-bold text-red-600">Akademisyenler yuklenirken bir hata olustu.</h3>
        <p className="mt-2 text-sm text-slate-500">Lutfen daha sonra tekrar deneyiniz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sayfa Header'ı */}
      <PageHeader
        title="Akademisyenler"
        badge={
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
            {academicians.length}
          </span>
        }
        action={
          <PrimaryButton type="button" onClick={openCreateModal} icon={<Plus className="h-4 w-4" />}>
            Akademisyen Ekle
          </PrimaryButton>
        }
      />

      {/* Arama ve Filtre Toolbarı */}
      <section className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1 max-w-full md:max-w-md">
            <SearchInput
              value={searchQuery}
              onSearchChange={setSearchQuery}
              placeholder="Ad, soyad veya e-posta ara..."
              className="w-full"
            />
          </div>
          <div className="w-full md:w-72">
            <AppSelect
              value={titleFilter}
              onChange={setTitleFilter}
              options={TITLE_FILTER_OPTIONS}
              placeholder="Tüm unvanlar"
              className="w-full"
            />
          </div>
          {(searchQuery || titleFilter) && (
            <SecondaryButton
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTitleFilter('');
              }}
              icon={<X className="h-4 w-4" />}
              className="w-full md:w-auto h-10 rounded-xl"
            >
              Temizle
            </SecondaryButton>
          )}
        </div>
      </section>

      {/* Akademisyen Listesi */}
      {academiciansQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-2xl border border-slate-200/50 bg-white" />
          ))}
        </div>
      ) : academicians.length === 0 ? (
        <EmptyState
          title={searchQuery || titleFilter ? 'Eşleşen akademisyen bulunamadı.' : 'Henüz akademisyen bulunmuyor.'}
          description={searchQuery || titleFilter ? 'Arama veya filtre kriterlerini değiştirin.' : 'Bu bölüme ilk akademisyeni ekleyebilirsiniz.'}
          action={!searchQuery && !titleFilter ? (
            <PrimaryButton type="button" onClick={openCreateModal} icon={<Plus className="h-4 w-4" />}>
              Akademisyen Ekle
            </PrimaryButton>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-[1.5fr_1.2fr_1fr_1fr_0.8fr_1fr] gap-4 px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <div>Ad Soyad</div>
            <div>E-posta</div>
            <div>Unvan</div>
            <div>Telefon</div>
            <div>Durum</div>
            <div className="text-right">İşlemler</div>
          </div>

          {/* List Items */}
          <div className="space-y-2.5">
            {academicians.map((academician) => (
              <article
                key={academician.id}
                className="dts-interactive-card relative grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1fr_1fr_0.8fr_1fr] gap-3 md:gap-4 items-center rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] px-4 py-3.5 sm:px-5 sm:py-4 shadow-xs"
              >
                {/* Ad Soyad */}
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482] border border-[#006482]/10">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{fullName(academician)}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-400">{academician.department || 'Bilgisayar Mühendisliği'}</p>
                  </div>
                </div>

                {/* E-posta */}
                <div className="min-w-0 flex items-center gap-1.5">
                  <span className="md:hidden text-[9px] font-extrabold uppercase text-slate-400 tracking-wider w-16 shrink-0">E-posta:</span>
                  <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-600">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 hidden md:inline" />
                    <span className="truncate">{academician.email}</span>
                  </span>
                </div>

                {/* Unvan */}
                <div className="flex items-center gap-1.5">
                  <span className="md:hidden text-[9px] font-extrabold uppercase text-slate-400 tracking-wider w-16 shrink-0">Unvan:</span>
                  <span className="text-xs font-semibold text-slate-700">{displayAcademicTitle(academician.title)}</span>
                </div>

                {/* Telefon */}
                <div className="flex items-center gap-1.5">
                  <span className="md:hidden text-[9px] font-extrabold uppercase text-slate-400 tracking-wider w-16 shrink-0">Telefon:</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400 hidden md:inline" />
                    {academician.phone || '-'}
                  </span>
                </div>

                {/* Durum */}
                <div className="flex items-center gap-1.5">
                  <span className="md:hidden text-[9px] font-extrabold uppercase text-slate-400 tracking-wider w-16 shrink-0">Durum:</span>
                  <span className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold',
                    academician.active
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-rose-100 bg-rose-50 text-rose-700'
                  )}>
                    {academician.active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* İşlemler */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0 z-20">
                  <SecondaryButton 
                    type="button" 
                    onClick={() => openEditModal(academician)} 
                    icon={<Edit2 className="h-3.5 w-3.5" />}
                    className="h-8.5 text-xs rounded-xl"
                  >
                    Düzenle
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => setDeletingAcademician(academician)}
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    disabled={!academician.active}
                    className="h-8.5 text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:text-slate-300"
                  >
                    Kaldır
                  </SecondaryButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAcademician ? 'Akademisyeni Düzenle' : 'Akademisyen Ekle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="dts-input-label">Ad</label>
              <input className={`dts-input ${errors.firstName ? 'border-red-300' : ''}`} {...register('firstName')} />
              {errors.firstName && <p className="text-[11px] text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Soyad</label>
              <input className={`dts-input ${errors.lastName ? 'border-red-300' : ''}`} {...register('lastName')} />
              {errors.lastName && <p className="text-[11px] text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="dts-input-label">Kurumsal E-posta</label>
              <input type="email" className={`dts-input ${errors.email ? 'border-red-300' : ''}`} {...register('email')} />
              {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
            </div>
            {!editingAcademician && (
              <div className="space-y-1">
                <label className="dts-input-label">Geçici Şifre</label>
                <input type="password" className={`dts-input ${errors.password ? 'border-red-300' : ''}`} {...register('password')} />
                {errors.password && <p className="text-[11px] text-red-500">{errors.password.message}</p>}
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="dts-input-label">Unvan</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={ACADEMIC_TITLE_OPTIONS}
                    searchable
                    hasError={!!errors.title}
                    placeholder="Unvan seçiniz"
                  />
                )}
              />
              {errors.title && <p className="text-[11px] text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Telefon</label>
              <input className={`dts-input ${errors.phone ? 'border-red-300' : ''}`} {...register('phone')} />
              {errors.phone && <p className="text-[11px] text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          {editingAcademician && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#006482]" {...register('active')} />
              Hesap aktif
            </label>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingAcademician ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingAcademician}
        onClose={() => setDeletingAcademician(null)}
        onConfirm={() => {
          if (deletingAcademician) {
            deactivateMutation.mutate(deletingAcademician.id);
          }
        }}
        title="Akademisyeni Kaldır"
        message={`"${deletingAcademician ? fullName(deletingAcademician) : ''}" kaydını pasif hale getirmek istediğinize emin misiniz?`}
        confirmText="Kaldır"
        cancelText="Vazgeç"
        confirmLoading={deactivateMutation.isPending}
      />
    </div>
  );
};
