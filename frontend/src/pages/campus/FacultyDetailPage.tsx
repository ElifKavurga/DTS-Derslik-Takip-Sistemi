import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Building2, Layers, MapPinned, ChevronLeft, X } from 'lucide-react';
import { AxiosError } from 'axios';

import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { MoreActionsMenu } from '@/components/ui/MoreActionsMenu';
import { facultyService } from '@/services/facultyService';
import { buildingService } from '@/services/buildingService';
import { useHeaderStore } from '@/store/useHeaderStore';
import { BuildingResponse, CreateBuildingRequest, UpdateBuildingRequest } from '@/types';

// Zod validation schema
const buildingSchema = z.object({
  name: z
    .string()
    .min(1, 'Bina adı zorunludur.')
    .max(255, 'Bina adı en fazla 255 karakter olabilir.'),
  code: z
    .string()
    .min(1, 'Bina kodu zorunludur.')
    .max(50, 'Bina kodu en fazla 50 karakter olabilir.'),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

export const FacultyDetailPage = () => {
  const { id: facultyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingResponse | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingResponse | null>(null);

  // Fetch Faculty Detail
  const { data: faculty, isLoading: isFacultyLoading } = useQuery({
    queryKey: ['faculty', facultyId],
    queryFn: () => facultyService.getById(facultyId || ''),
    enabled: !!facultyId,
  });

  // Fetch Buildings
  const { data: buildingsData, isLoading: isBuildingsLoading } = useQuery({
    queryKey: ['buildings', facultyId],
    queryFn: () => buildingService.getByFacultyId(facultyId || ''),
    enabled: !!facultyId,
  });

  // Sync breadcrumbs with active faculty name
  useEffect(() => {
    if (faculty) {
      setMeta(faculty.name, ['Ana Ekran', 'Fakülte Yönetimi', faculty.name]);
    }
  }, [faculty, setMeta]);

  const buildingsList = useMemo(() => buildingsData?.buildings || [], [buildingsData?.buildings]);

  // Filter buildings by search query
  const filteredBuildings = useMemo(() => {
    return buildingsList.filter(
      (b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [buildingsList, searchQuery]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingBuilding(null);
    reset({ name: '', code: '' });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (building: BuildingResponse) => {
    setEditingBuilding(building);
    reset({ name: building.name, code: building.code });
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateBuildingRequest) =>
      buildingService.create(facultyId || '', payload),
    onSuccess: () => {
      toast.success('Bina başarıyla eklendi.');
      queryClient.invalidateQueries({ queryKey: ['buildings', facultyId] });
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Bina eklenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBuildingRequest }) =>
      buildingService.update(id, payload),
    onSuccess: () => {
      toast.success('Bina başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['buildings', facultyId] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Bina güncellenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => buildingService.delete(id),
    onSuccess: () => {
      toast.success('Bina başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['buildings', facultyId] });
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
      setDeletingBuilding(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Bina silinirken hata oluştu.';
      toast.error(message);
    },
  });

  const onSubmit = (values: BuildingFormValues) => {
    if (editingBuilding) {
      updateMutation.mutate({ id: editingBuilding.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingBuilding) {
      deleteMutation.mutate(deletingBuilding.id);
    }
  };

  const isLoading = isFacultyLoading || isBuildingsLoading;

  if (isLoading && !faculty) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-200" />
        <div className="h-24 rounded-2xl bg-slate-200" />
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={faculty?.name || ''}
        backAction={
          <button
            onClick={() => navigate('/super-admin/fakulteler')}
            className="flex w-fit items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition select-none group"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Fakülte Yönetimine Dön
          </button>
        }
        badge={
          faculty?.code ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              Kod: {faculty.code}
            </span>
          ) : null
        }
        action={
          buildingsList.length > 0 ? (
            <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
              Yeni Bina Ekle
            </PrimaryButton>
          ) : null
        }
      />

      {/* Faculty Summary Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] p-3.5 sm:p-4 shadow-xs">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fakülte Adı</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1 truncate">{faculty?.name}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Fakülte Kodu</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1 truncate">{faculty?.code}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bağlı Bina</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1">{faculty?.totalBuildings}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Toplam Kat</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1">{faculty?.totalFloors}</span>
          </div>
          <div className="flex flex-col justify-center min-w-0 col-span-2 md:col-span-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Toplam Derslik</span>
            <span className="text-xs font-extrabold text-slate-800 mt-1">{faculty?.totalClassrooms}</span>
          </div>
        </div>
      </section>

      {/* Buildings List Area */}
      <div className="space-y-4">
        {buildingsList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative min-w-0 flex-1 max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bina adı veya kodu ara..."
                className="dts-input pl-9 h-10 py-1.5 text-xs sm:text-sm rounded-xl hover:border-[#88d0f2] focus:border-[#006482] focus:ring-2 focus:ring-[#006482]/10"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {buildingsList.length === 0 ? (
          <EmptyState
            title="Bu fakülteye henüz bina eklenmemiştir."
            description="Fakültede dersliklerin bulunacağı binaları oluşturarak başlayın. Daha sonra binalara ait katları ve derslikleri tanımlayabilirsiniz."
            action={
              <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
                İlk Binayı Oluştur
              </PrimaryButton>
            }
          />
        ) : filteredBuildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-600">Eşleşen bina bulunamadı</h3>
            <p className="mt-1 text-[13px] text-slate-400">Arama kelimesini değiştirmeyi veya temizlemeyi deneyin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBuildings.map((building) => {
              const actions = [
                {
                  label: 'Düzenle',
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => handleOpenEdit(building),
                },
                {
                  label: 'Sil',
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: () => setDeletingBuilding(building),
                  variant: 'danger' as const,
                },
              ];

              return (
                <div
                  key={building.id}
                  onClick={() => navigate(`/super-admin/binalar/${building.id}`)}
                  className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-[#f6fbfe] via-white to-[#e2f3fa] shadow-xs cursor-pointer select-none transition-all duration-200 ease-out dts-interactive-card"
                >
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-3.5 pr-3">
                    {/* Building Name & Code */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-500 border border-slate-100/90 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                        <Building2 className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#006482] transition-colors duration-150 truncate">
                          {building.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Bina Kodu: {building.code}</p>
                      </div>
                    </div>

                    {/* Building Metrics */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                        <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Kat</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{building.totalFloors}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white/95 rounded-xl px-2.5 py-1 min-w-[75px] shadow-xs">
                        <MapPinned className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Derslik</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{building.totalClassrooms}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <MoreActionsMenu actions={actions} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Building Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBuilding ? 'Binayı Düzenle' : 'Yeni Bina Ekle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="dts-input-label text-[10px] mb-1">
              Bina Adı
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Örn. A Blok, Mühendislik Binası"
              className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="code" className="dts-input-label text-[10px] mb-1">
              Bina Kodu
            </label>
            <input
              id="code"
              type="text"
              {...register('code')}
              placeholder="Örn. A-BLOK"
              className={`dts-input ${errors.code ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.code && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.code.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBuilding ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingBuilding}
        onClose={() => setDeletingBuilding(null)}
        onConfirm={handleConfirmDelete}
        title="Binayı Sil"
        message={`"${deletingBuilding?.name}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLoading={deleteMutation.isPending}
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};
