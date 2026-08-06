import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Landmark, Building2, Layers, MapPinned, ChevronLeft } from 'lucide-react';
import { AxiosError } from 'axios';

import { PageHeader } from '@/components/ui/PageHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { RichList } from '@/components/ui/RichList';
import { RichListItem } from '@/components/ui/RichListItem';
import { MoreActionsMenu } from '@/components/ui/MoreActionsMenu';
import { buildingService } from '@/services/buildingService';
import { floorService } from '@/services/floorService';
import { useHeaderStore } from '@/store/useHeaderStore';
import { FloorResponse, CreateFloorRequest, UpdateFloorRequest } from '@/types';

// Zod validation schema
const floorSchema = z.object({
  name: z
    .string()
    .min(1, 'Kat adı zorunludur.')
    .max(100, 'Kat adı en fazla 100 karakter olabilir.'),
  level: z
    .number({ invalid_type_error: 'Kat numarası zorunludur.' })
    .int('Kat numarası tam sayı olmalıdır.'),
});

type FloorFormValues = z.infer<typeof floorSchema>;

export const BuildingDetailPage = () => {
  const { id: buildingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setMeta = useHeaderStore((state) => state.setMeta);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorResponse | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<FloorResponse | null>(null);

  // Fetch Building Details
  const { data: building, isLoading: isBuildingLoading } = useQuery({
    queryKey: ['building', buildingId],
    queryFn: () => buildingService.getById(buildingId || ''),
    enabled: !!buildingId,
  });

  // Fetch Floors
  const { data: floorsData, isLoading: isFloorsLoading } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: () => floorService.getByBuildingId(buildingId || ''),
    enabled: !!buildingId,
  });

  // Sync breadcrumbs with building and faculty hierarchy
  useEffect(() => {
    if (building) {
      setMeta(building.name, [
        'Ana Ekran',
        'Kampüs Yönetimi',
        'Fakülteler',
        building.facultyName,
        building.name,
      ]);
    }
  }, [building, setMeta]);

  const floorsList = useMemo(() => floorsData?.floors || [], [floorsData?.floors]);

  // Filter floors by search query (level number or name)
  const filteredFloors = useMemo(() => {
    return floorsList.filter(
      (f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.level.toString() === searchQuery.trim()
    );
  }, [floorsList, searchQuery]);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      name: '',
      level: 0,
    },
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingFloor(null);
    reset({ name: '', level: 0 });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (floor: FloorResponse) => {
    setEditingFloor(floor);
    reset({ name: floor.name, level: floor.level });
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateFloorRequest) =>
      floorService.create(buildingId || '', payload),
    onSuccess: () => {
      toast.success('Kat başarıyla eklendi.');
      queryClient.invalidateQueries({ queryKey: ['floors', buildingId] });
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Kat eklenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFloorRequest }) =>
      floorService.update(id, payload),
    onSuccess: () => {
      toast.success('Kat başarıyla güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['floors', buildingId] });
      setIsModalOpen(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Kat güncellenirken hata oluştu.';
      toast.error(message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => floorService.delete(id),
    onSuccess: () => {
      toast.success('Kat başarıyla silindi.');
      queryClient.invalidateQueries({ queryKey: ['floors', buildingId] });
      queryClient.invalidateQueries({ queryKey: ['building', buildingId] });
      setDeletingFloor(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      const message = err.response?.data?.message || 'Kat silinirken hata oluştu.';
      toast.error(message);
    },
  });

  const onSubmit = (values: FloorFormValues) => {
    if (editingFloor) {
      updateMutation.mutate({ id: editingFloor.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingFloor) {
      deleteMutation.mutate(deletingFloor.id);
    }
  };

  const isLoading = isBuildingLoading || isFloorsLoading;

  if (isLoading && !building) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3.5 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation and header */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate(`/super-admin/fakulteler/${building?.facultyId}`)}
          className="flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition select-none group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Fakülte Detayına Dön
        </button>

        <PageHeader
          title={building?.name || ''}
          description="Bu binaya ait katları görüntüleyebilir ve yönetebilirsiniz."
          action={
            floorsList.length > 0 ? (
              <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
                Yeni Kat Ekle
              </PrimaryButton>
            ) : null
          }
        />
      </div>

      {/* Building Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="dts-card p-4 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bina Adı</span>
          <span className="text-xs font-bold text-slate-800 mt-1.5 truncate">{building?.name}</span>
        </div>
        <div className="dts-card p-4 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bina Kodu</span>
          <span className="text-xs font-bold text-slate-800 mt-1.5">{building?.code}</span>
        </div>
        <div className="dts-card p-4 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bağlı Fakülte</span>
          <span className="text-xs font-bold text-slate-800 mt-1.5 truncate">{building?.facultyName}</span>
        </div>
        <div className="dts-card p-4 flex flex-col justify-center">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Toplam Kat</span>
          <span className="text-sm font-extrabold text-slate-800 mt-1.5">{building?.totalFloors}</span>
        </div>
        <div className="dts-card p-4 flex flex-col justify-center col-span-2 md:col-span-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Toplam Derslik</span>
          <span className="text-sm font-extrabold text-slate-800 mt-1.5">{building?.totalClassrooms}</span>
        </div>
      </div>

      {/* Floors List Area */}
      <div className="space-y-4">
        {floorsList.length > 0 && (
          <div className="dts-filter-bar">
            <SearchInput
              onSearchChange={setSearchQuery}
              placeholder="Kat adı veya numarası ara..."
            />
          </div>
        )}

        {filteredFloors.length === 0 ? (
          <EmptyState
            title="Bu binaya henüz kat eklenmemiştir."
            description="Dersliklerin bulunacağı katları ekleyerek başlayın. Daha sonra katlara ait derslikleri tanımlayabilirsiniz."
            action={
              <PrimaryButton onClick={handleOpenCreate} icon={<Plus className="h-4.5 w-4.5" />}>
                İlk Katı Oluştur
              </PrimaryButton>
            }
          />
        ) : (
          <RichList>
            {filteredFloors.map((floor) => {
              const actions = [
                {
                  label: 'Düzenle',
                  icon: <Edit2 className="h-3.5 w-3.5" />,
                  onClick: () => handleOpenEdit(floor),
                },
                {
                  label: 'Sil',
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: () => setDeletingFloor(floor),
                  variant: 'danger' as const,
                },
              ];

              return (
                <RichListItem
                  key={floor.id}
                  onClick={() => navigate(`/super-admin/katlar/${floor.id}`)}
                  actionMenu={<MoreActionsMenu actions={actions} />}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Floor Name & Level */}
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 border border-slate-100 group-hover:bg-[#eff8ff] group-hover:text-[#006482] transition duration-200">
                        <Layers className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-[#006482] transition-colors duration-150">
                          {floor.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">Kat Numarası: {floor.level}</p>
                      </div>
                    </div>

                    {/* Floor Metrics */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 md:mr-6">
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-slate-50/50 rounded-xl px-3 py-1.5 min-w-[85px]">
                        <MapPinned className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">Derslik</span>
                          <span className="text-xs font-extrabold text-slate-700 mt-0.5 leading-none">{floor.totalClassrooms}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </RichListItem>
              );
            })}
          </RichList>
        )}
      </div>

      {/* Create/Edit Floor Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFloor ? 'Katı Düzenle' : 'Yeni Kat Ekle'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="name" className="dts-input-label">
              Kat Adı
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              placeholder="Örn. 1. Kat, Zemin Kat"
              className={`dts-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.name && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="level" className="dts-input-label">
              Kat Numarası
            </label>
            <input
              id="level"
              type="number"
              onChange={(e) => setValue('level', parseInt(e.target.value, 10))}
              placeholder="Örn. 1, 0, -1"
              className={`dts-input ${errors.level ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
            />
            {errors.level && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.level.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
              İptal
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingFloor ? 'Güncelle' : 'Kaydet'}
            </PrimaryButton>
          </div>
        </form>
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingFloor}
        onClose={() => setDeletingFloor(null)}
        onConfirm={handleConfirmDelete}
        title="Katı Sil"
        message={`"${deletingFloor?.name}" kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLoading={deleteMutation.isPending}
        confirmText="Sil"
        cancelText="İptal"
      />
    </div>
  );
};
