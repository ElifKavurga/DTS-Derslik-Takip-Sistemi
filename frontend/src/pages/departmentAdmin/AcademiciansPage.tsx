import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Edit2, Mail, Phone, Plus, Trash2, UserRound, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
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

  const columns: Column<UserResponse>[] = [
    {
      header: 'Ad Soyad',
      accessor: (academician) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff8ff] text-[#006482]">
            <UserRound className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{fullName(academician)}</p>
            <p className="truncate text-[11px] text-slate-400">{academician.department}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'E-posta',
      accessor: (academician) => (
        <span className="inline-flex max-w-[240px] items-center gap-1.5 truncate text-xs text-slate-600">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{academician.email}</span>
        </span>
      ),
    },
    {
      header: 'Unvan',
      accessor: (academician) => <span className="text-xs font-semibold text-slate-700">{displayAcademicTitle(academician.title)}</span>,
    },
    {
      header: 'Telefon',
      accessor: (academician) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {academician.phone || '-'}
        </span>
      ),
    },
    {
      header: 'Durum',
      accessor: (academician) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          academician.active
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {academician.active ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
    {
      header: 'Islemler',
      className: 'text-right',
      accessor: (academician) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton type="button" onClick={() => openEditModal(academician)} icon={<Edit2 className="h-3.5 w-3.5" />}>
            Duzenle
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={() => setDeletingAcademician(academician)}
            icon={<Trash2 className="h-3.5 w-3.5" />}
            disabled={!academician.active}
            className="text-red-600 hover:text-red-700"
          >
            Kaldir
          </SecondaryButton>
        </div>
      ),
    },
  ];

  const renderMobileCard = (academician: UserResponse) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{fullName(academician)}</p>
          <p className="text-xs text-slate-400">{displayAcademicTitle(academician.title)}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
          academician.active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
        }`}>
          {academician.active ? 'Aktif' : 'Pasif'}
        </span>
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <p>{academician.email}</p>
        <p>{academician.phone}</p>
        <p>{academician.department}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <SecondaryButton type="button" onClick={() => openEditModal(academician)} icon={<Edit2 className="h-3.5 w-3.5" />}>
          Duzenle
        </SecondaryButton>
        <SecondaryButton
          type="button"
          onClick={() => setDeletingAcademician(academician)}
          icon={<Trash2 className="h-3.5 w-3.5" />}
          disabled={!academician.active}
          className="text-red-600 hover:text-red-700"
        >
          Kaldir
        </SecondaryButton>
      </div>
    </div>
  );

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Akademisyenler
            {academicians.length > 0 && (
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                {academicians.length}
              </span>
            )}
          </h1>
        </div>
        <PrimaryButton type="button" onClick={openCreateModal} icon={<Plus className="h-4 w-4" />}>
          Akademisyen Ekle
        </PrimaryButton>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Ad, soyad veya e-posta ara..."
          className="max-w-full md:max-w-sm"
        />
        <div className="w-full md:w-72">
          <AppSelect
            value={titleFilter}
            onChange={setTitleFilter}
            options={TITLE_FILTER_OPTIONS}
            searchable
            placeholder="Tum unvanlar"
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
          >
            Temizle
          </SecondaryButton>
        )}
      </div>

      <DataTable
        data={academicians}
        columns={columns}
        isLoading={academiciansQuery.isLoading}
        mobileCardRender={renderMobileCard}
        emptyState={
          <EmptyState
            title={searchQuery || titleFilter ? 'Eslesen akademisyen bulunamadi.' : 'Henuz akademisyen bulunmuyor.'}
            description={searchQuery || titleFilter ? 'Arama veya filtre kriterlerini degistirin.' : 'Bu bolume ilk akademisyeni ekleyebilirsiniz.'}
            action={!searchQuery && !titleFilter ? (
              <PrimaryButton type="button" onClick={openCreateModal} icon={<Plus className="h-4 w-4" />}>
                Akademisyen Ekle
              </PrimaryButton>
            ) : undefined}
          />
        }
      />

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAcademician ? 'Akademisyeni Duzenle' : 'Akademisyen Ekle'}
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
                <label className="dts-input-label">Gecici Sifre</label>
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
                    placeholder="Unvan seciniz"
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
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>Iptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingAcademician ? 'Guncelle' : 'Kaydet'}
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
        title="Akademisyeni Kaldir"
        message={`"${deletingAcademician ? fullName(deletingAcademician) : ''}" kaydini pasif hale getirmek istediginize emin misiniz?`}
        confirmText="Kaldir"
        cancelText="Vazgec"
        confirmLoading={deactivateMutation.isPending}
      />
    </div>
  );
};
