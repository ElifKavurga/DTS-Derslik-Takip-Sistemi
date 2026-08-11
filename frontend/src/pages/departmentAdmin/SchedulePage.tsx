import { Fragment, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, Clock, Edit2, MapPin, Plus, Settings, Trash2, User, XCircle } from 'lucide-react';
import { AppSelect } from '@/components/ui/AppSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormModal } from '@/components/ui/FormModal';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { courseService } from '@/services/courseService';
import { scheduleService } from '@/services/scheduleService';
import {
  AvailableClassroomResponse,
  CourseScheduleStatusItemResponse,
  CourseResponse,
  ScheduleDay,
  ScheduleCompletionResponse,
  ScheduleTimeConfigurationRequest,
  Semester,
  WeeklyScheduleResponse,
  classroomTypeLabels,
  scheduleDays,
} from '@/types';
import { cn } from '@/utils/cn';

const semesterOptions: { label: string; value: Semester | '' }[] = [
  { label: 'Tüm Dönemler', value: '' },
  { label: 'Güz', value: 'GUZ' },
  { label: 'Bahar', value: 'BAHAR' },
  { label: 'Yaz', value: 'YAZ_OKULU' },
];

type ScheduleFormState = {
  courseId: string;
  dayOfWeek: ScheduleDay | '';
  timeSlot: string;
  slotCount: number;
  classroomId: string;
};

const initialForm: ScheduleFormState = {
  courseId: '',
  dayOfWeek: '',
  timeSlot: '',
  slotCount: 1,
  classroomId: '',
};

const initialTimeConfig: ScheduleTimeConfigurationRequest = {
  startTime: '08:15',
  endTime: '17:00',
  lessonDurationMinutes: 45,
  breakDurationMinutes: 10,
  lunchBreakEnabled: true,
  lunchBreakStart: '12:40',
  lunchBreakEnd: '13:30',
};

const dayLabel = (day: string) => scheduleDays.find((item) => item.value === day)?.label ?? day;

const formatSlot = (slot: string) => slot.replace('-', ' - ');

type ScheduleGroupMeta = {
  firstScheduleId: string;
  slotCount: number;
  timeRange: string;
};

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<Semester | ''>('GUZ');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTimeConfigModalOpen, setIsTimeConfigModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<WeeklyScheduleResponse | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(initialForm);
  const [timeConfigForm, setTimeConfigForm] = useState<ScheduleTimeConfigurationRequest>(initialTimeConfig);

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['weeklySchedules', selectedSemester],
    queryFn: () => scheduleService.getAll(selectedSemester || undefined),
  });

  const { data: scheduleStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ['scheduleStatus', selectedSemester],
    queryFn: () => scheduleService.getStatus(selectedSemester || undefined),
  });

  const { data: timeConfiguration } = useQuery({
    queryKey: ['scheduleTimeConfiguration'],
    queryFn: scheduleService.getTimeConfiguration,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getAll,
  });

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId) ?? null,
    [courses, form.courseId],
  );

  const selectedCourseStatus = useMemo(
    () => scheduleStatus?.courses.find((course) => course.courseId === form.courseId) ?? null,
    [form.courseId, scheduleStatus],
  );

  const editingGroupSlotCount = useMemo(() => {
    if (!editingSchedule) return 0;
    if (!editingSchedule.scheduleGroupId) return 1;
    return Math.max(1, schedules.filter((schedule) => schedule.scheduleGroupId === editingSchedule.scheduleGroupId).length);
  }, [editingSchedule, schedules]);

  const timeSlots = useMemo(
    () => timeConfiguration?.slots.map((slot) => slot.value) ?? [],
    [timeConfiguration],
  );

  const selectedSlot = useMemo(
    () => timeConfiguration?.slots.find((slot) => slot.value === form.timeSlot) ?? null,
    [form.timeSlot, timeConfiguration],
  );
  const selectedSlotIndex = selectedSlot?.index ?? -1;
  const courseRemainingHours = selectedCourseStatus
    ? Math.max(0, selectedCourseStatus.remainingHours + (editingSchedule?.courseId === form.courseId ? editingGroupSlotCount : 0))
    : selectedCourse
      ? selectedCourse.theoreticalHours + selectedCourse.practicalHours
      : 0;
  const consecutiveSlotCount = selectedSlotIndex >= 0 ? Math.max(1, timeSlots.length - selectedSlotIndex) : 0;
  const maxSlotCount = Math.min(consecutiveSlotCount, courseRemainingHours);
  const slotCountOptions = useMemo(
    () => Array.from({ length: Math.min(maxSlotCount, 12) }, (_, index) => ({
      label: `${index + 1} ders saati`,
      value: String(index + 1),
    })),
    [maxSlotCount],
  );
  const selectedSlots = selectedSlotIndex >= 0
    ? timeSlots.slice(selectedSlotIndex, selectedSlotIndex + Math.min(form.slotCount, maxSlotCount))
    : [];

  useEffect(() => {
    if (!form.timeSlot) return;
    if (maxSlotCount > 0 && form.slotCount > maxSlotCount) {
      updateForm({ slotCount: maxSlotCount });
    }
    if (maxSlotCount === 0 && form.slotCount !== 1) {
      updateForm({ slotCount: 1 });
    }
  }, [form.timeSlot, form.slotCount, maxSlotCount]);

  const canQueryClassrooms = Boolean(form.courseId && form.dayOfWeek && form.timeSlot && form.slotCount && maxSlotCount > 0);

  const { data: classrooms = [], isFetching: isClassroomsLoading } = useQuery({
    queryKey: ['availableClassrooms', form.courseId, form.dayOfWeek, form.timeSlot, form.slotCount, editingSchedule?.id],
    queryFn: () => scheduleService.getAvailableClassrooms({
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
      slotCount: form.slotCount,
      courseId: form.courseId,
      excludeScheduleId: editingSchedule?.id,
    }),
    enabled: canQueryClassrooms,
  });

  const availableClassrooms = useMemo(
    () => classrooms.filter((classroom) => classroom.selectable),
    [classrooms],
  );

  const busyClassrooms = useMemo(
    () => classrooms.filter((classroom) => !classroom.selectable),
    [classrooms],
  );

  const schedulesByCell = useMemo(() => {
    const map = new Map<string, WeeklyScheduleResponse[]>();
    schedules.forEach((schedule) => {
      const key = `${schedule.dayOfWeek}:${schedule.timeSlot}`;
      map.set(key, [...(map.get(key) ?? []), schedule]);
    });
    return map;
  }, [schedules]);

  const scheduleGroupMetaById = useMemo(() => {
    const groups = new Map<string, WeeklyScheduleResponse[]>();
    schedules.forEach((schedule) => {
      const groupKey = schedule.scheduleGroupId ?? schedule.id;
      groups.set(groupKey, [...(groups.get(groupKey) ?? []), schedule]);
    });

    const metaById = new Map<string, ScheduleGroupMeta>();
    groups.forEach((groupSchedules) => {
      const sortedSchedules = [...groupSchedules].sort((a, b) => timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot));
      const firstSchedule = sortedSchedules[0];
      const lastSchedule = sortedSchedules[sortedSchedules.length - 1];
      if (!firstSchedule || !lastSchedule) return;
      const startTime = firstSchedule.timeSlot.split('-')[0]?.trim() ?? firstSchedule.timeSlot;
      const endTime = lastSchedule.timeSlot.split('-')[1]?.trim() ?? lastSchedule.timeSlot;
      const meta = {
        firstScheduleId: firstSchedule.id,
        slotCount: sortedSchedules.length,
        timeRange: `${startTime} - ${endTime}`,
      };
      sortedSchedules.forEach((schedule) => metaById.set(schedule.id, meta));
    });
    return metaById;
  }, [schedules, timeSlots]);

  const courseOptions = useMemo(
    () => courses
      .filter((course) => course.active)
      .filter((course) => !selectedSemester || course.semester === selectedSemester)
      .filter((course) => {
        if (editingSchedule?.courseId === course.id) return true;
        const status = scheduleStatus?.courses.find((item) => item.courseId === course.id);
        return !status || status.remainingHours > 0;
      })
      .map((course) => ({ label: `${course.code} - ${course.name}`, value: course.id })),
    [courses, editingSchedule, scheduleStatus, selectedSemester],
  );

  const incompleteCourses = useMemo(
    () => scheduleStatus?.courses.filter((course) => course.status === 'INCOMPLETE' || course.status === 'OVER_SCHEDULED') ?? [],
    [scheduleStatus],
  );

  const notScheduledCourses = useMemo(
    () => scheduleStatus?.courses.filter((course) => course.status === 'NOT_SCHEDULED') ?? [],
    [scheduleStatus],
  );

  const openCreate = (courseId = '') => {
    setEditingSchedule(null);
    setForm({ ...initialForm, courseId });
    setIsModalOpen(true);
  };

  const openEdit = (schedule: WeeklyScheduleResponse) => {
    const groupedSchedules = schedule.scheduleGroupId
      ? schedules
        .filter((item) => item.scheduleGroupId === schedule.scheduleGroupId)
        .sort((a, b) => timeSlots.indexOf(a.timeSlot) - timeSlots.indexOf(b.timeSlot))
      : [schedule];
    const firstSchedule = groupedSchedules[0] ?? schedule;
    setEditingSchedule(schedule);
    setForm({
      courseId: firstSchedule.courseId,
      dayOfWeek: firstSchedule.dayOfWeek,
      timeSlot: firstSchedule.timeSlot,
      slotCount: groupedSchedules.length,
      classroomId: firstSchedule.classroomId,
    });
    setIsModalOpen(true);
  };

  const openTimeConfig = () => {
    setTimeConfigForm(timeConfiguration ? {
      startTime: timeConfiguration.startTime,
      endTime: timeConfiguration.endTime,
      lessonDurationMinutes: timeConfiguration.lessonDurationMinutes,
      breakDurationMinutes: timeConfiguration.breakDurationMinutes,
      lunchBreakEnabled: timeConfiguration.lunchBreakEnabled,
      lunchBreakStart: timeConfiguration.lunchBreakStart,
      lunchBreakEnd: timeConfiguration.lunchBreakEnd,
    } : initialTimeConfig);
    setIsTimeConfigModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setForm(initialForm);
  };

  const updateForm = (patch: Partial<ScheduleFormState>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      if ('dayOfWeek' in patch || 'timeSlot' in patch || 'slotCount' in patch) {
        next.classroomId = '';
      }
      if ('courseId' in patch) {
        next.classroomId = '';
      }
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: scheduleService.create,
    onSuccess: async (createdSchedules) => {
      toast.success('Ders programı eklendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      await notifyCourseStatus(createdSchedules[0]?.courseId ?? form.courseId);
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı eklenemedi.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleFormState }) => scheduleService.update(id, {
      courseId: payload.courseId,
      classroomId: payload.classroomId,
      dayOfWeek: payload.dayOfWeek as ScheduleDay,
      timeSlot: payload.timeSlot,
      slotCount: payload.slotCount,
    }),
    onSuccess: async (updatedSchedules) => {
      toast.success('Ders programı güncellendi.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      await notifyCourseStatus(updatedSchedules[0]?.courseId ?? form.courseId);
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: scheduleService.delete,
    onSuccess: () => {
      toast.success('Ders programı kaldırıldı.');
      queryClient.invalidateQueries({ queryKey: ['weeklySchedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStatus'] });
      setDeletingSchedule(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders programı kaldırılamadı.'),
  });

  const updateTimeConfigMutation = useMutation({
    mutationFn: scheduleService.updateTimeConfiguration,
    onSuccess: (config) => {
      toast.success('Ders saatleri gÃ¼ncellendi.');
      if (config.affectedScheduleCount > 0) {
        toast.error(`${config.affectedScheduleCount} mevcut program kaydÄ± yeni saat aralÄ±klarÄ±nÄ±n dÄ±ÅŸÄ±nda kaldÄ±.`);
      }
      queryClient.invalidateQueries({ queryKey: ['scheduleTimeConfiguration'] });
      queryClient.invalidateQueries({ queryKey: ['availableClassrooms'] });
      setIsTimeConfigModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ders saatleri gÃ¼ncellenemedi.'),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.courseId || !form.dayOfWeek || !form.timeSlot || !form.slotCount || !form.classroomId) {
      toast.error('Ders, gün, saat ve sınıf seçimi zorunludur.');
      return;
    }

    if (slotCountOptions.length === 0 || form.slotCount > maxSlotCount) {
      toast.error('Seçilen ders için bu başlangıç saatinde programlanabilir ders saati kalmadı.');
      return;
    }

    const payload = {
      courseId: form.courseId,
      classroomId: form.classroomId,
      dayOfWeek: form.dayOfWeek,
      timeSlot: form.timeSlot,
      slotCount: form.slotCount,
    };

    if (editingSchedule) updateMutation.mutate({ id: editingSchedule.id, payload });
    else createMutation.mutate(payload);
  };

  const submitTimeConfig = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateTimeConfigMutation.mutate(timeConfigForm);
  };

  const notifyCourseStatus = async (courseId: string) => {
    const status = await scheduleService.getStatus(selectedSemester || undefined);
    const course = status.courses.find((item) => item.courseId === courseId);
    if (!course) return;
    if (course.status === 'INCOMPLETE') {
      toast.error(`${course.courseCode} için ${course.remainingHours} saat eksik.`);
    }
    if (course.status === 'OVER_SCHEDULED') {
      toast.error(`${course.courseCode} için haftalık ders saati ${Math.abs(course.remainingHours)} saat aşılmıştır.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Ders Programı</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">Bölüm derslerini haftalık takvime manuel yerleştirin.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <SecondaryButton type="button" onClick={openTimeConfig} icon={<Settings className="h-4 w-4" />}>Saat Ayarları</SecondaryButton>
          <div className="flex w-full min-w-[180px] items-center gap-2 sm:w-44">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <AppSelect
              value={selectedSemester}
              onChange={(value) => setSelectedSemester(value as Semester | '')}
              options={semesterOptions}
              placeholder="Dönem seçiniz"
              className="min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {scheduleStatus && (
        <ScheduleStatusOverview
          status={scheduleStatus}
          isLoading={isStatusLoading}
          incompleteCourses={incompleteCourses}
          notScheduledCourses={notScheduledCourses}
          onShowDetails={() => setIsStatusModalOpen(true)}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">Haftalık Ders Programı</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Oluşturulmuş ders programı kayıtları takvimde gösterilir.</p>
        </div>
        <PrimaryButton onClick={() => openCreate()} icon={<Plus className="h-4 w-4" />}>Programa Ders Ekle</PrimaryButton>
      </div>

      {isLoading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-200/50 bg-white" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-red-700">Haftalık ders programı yüklenirken bir hata oluştu.</p>
        </div>
      ) : timeSlots.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-8 text-center">
          <p className="text-sm font-bold text-amber-800">Ders saatleri oluÅŸturulamadÄ±. Saat ayarlarÄ±nÄ± kontrol edin.</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Henüz haftalık ders programı oluşturulmadı.</h3>
          <PrimaryButton onClick={() => openCreate()} className="mt-5" icon={<Plus className="h-4 w-4" />}>Programa Ders Ekle</PrimaryButton>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white">
          <div className="grid min-w-[980px]" style={{ gridTemplateColumns: '116px repeat(5, minmax(160px, 1fr))' }}>
            <div className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">Saat</div>
            {scheduleDays.map((day) => (
              <div key={day.value} className="border-b border-r border-slate-100 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                {day.label}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <Fragment key={slot}>
                <div key={`${slot}-label`} className="border-b border-r border-slate-100 px-3 py-4 text-xs font-bold text-slate-500">
                  {formatSlot(slot)}
                </div>
                {scheduleDays.map((day) => {
                  const cellSchedules = schedulesByCell.get(`${day.value}:${slot}`) ?? [];
                  const visibleSchedules = cellSchedules.filter((schedule) => scheduleGroupMetaById.get(schedule.id)?.firstScheduleId === schedule.id);
                  const hasConflict = cellSchedules.some((schedule, index) =>
                    cellSchedules.findIndex((other) => other.classroomId === schedule.classroomId) !== index
                  );

                  return (
                    <div key={`${day.value}-${slot}`} className="min-h-28 border-b border-r border-slate-100 p-2">
                      <div className="space-y-2">
                        {visibleSchedules.map((schedule) => (
                          <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            groupMeta={scheduleGroupMetaById.get(schedule.id)}
                            hasConflict={hasConflict}
                            onEdit={() => openEdit(schedule)}
                            onDelete={() => setDeletingSchedule(schedule)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={closeModal} title={editingSchedule ? 'Ders Programını Düzenle' : 'Ders Programı Ekle'}>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="dts-input-label">Ders</label>
            <AppSelect
              value={form.courseId}
              onChange={(courseId) => updateForm({ courseId })}
              options={courseOptions}
              searchable
              placeholder="Ders seçiniz"
              emptyText="Bu dönem için ders bulunamadı"
            />
          </div>

          <ReadonlyLecturer course={selectedCourse} />
          <CourseSummary course={selectedCourse} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="dts-input-label">Gün</label>
              <AppSelect
                value={form.dayOfWeek}
                onChange={(dayOfWeek) => updateForm({ dayOfWeek: dayOfWeek as ScheduleDay })}
                options={scheduleDays.map((day) => ({ label: day.label, value: day.value }))}
                placeholder="Gün seçiniz"
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Saat</label>
              <AppSelect
                value={form.timeSlot}
                onChange={(timeSlot) => updateForm({ timeSlot, slotCount: 1 })}
                options={(timeConfiguration?.slots ?? []).map((slot) => ({ label: slot.startTime, value: slot.value }))}
                placeholder="Saat seçiniz"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1">
              <label className="dts-input-label">Ders Saati</label>
              <AppSelect
                value={String(form.slotCount)}
                onChange={(slotCount) => updateForm({ slotCount: Number(slotCount) })}
                options={slotCountOptions}
                placeholder="Saat"
                disabled={!form.timeSlot || slotCountOptions.length === 0}
              />
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Oluşacak Bloklar</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {selectedSlots.length === 0 ? (
                  <span className="text-xs font-semibold text-slate-400">Başlangıç saati seçiniz</span>
                ) : selectedSlots.map((slot) => (
                  <span key={slot} className="rounded-full border border-[#006482]/15 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                    {formatSlot(slot)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ClassroomPicker
            selectedClassroomId={form.classroomId}
            availableClassrooms={availableClassrooms}
            unavailableClassrooms={busyClassrooms}
            loading={isClassroomsLoading}
            canQuery={canQueryClassrooms}
            onSelect={(classroomId) => updateForm({ classroomId })}
          />

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={closeModal}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={createMutation.isPending || updateMutation.isPending}>Kaydet</PrimaryButton>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={() => deletingSchedule && deleteMutation.mutate(deletingSchedule.id)}
        title="Ders Programını Kaldır"
        message="Bu ders programını kaldırmak istediğinize emin misiniz?"
        confirmText="Kaldır"
        cancelText="Vazgeç"
        confirmLoading={deleteMutation.isPending}
      />

      <FormModal isOpen={isTimeConfigModalOpen} onClose={() => setIsTimeConfigModalOpen(false)} title="Ders Saatleri">
        <form onSubmit={submitTimeConfig} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Başlangıç" value={timeConfigForm.startTime} onChange={(startTime) => setTimeConfigForm((current) => ({ ...current, startTime }))} />
            <TimeInput label="Bitiş" value={timeConfigForm.endTime} onChange={(endTime) => setTimeConfigForm((current) => ({ ...current, endTime }))} />
            <NumberInput label="Ders Süresi" value={timeConfigForm.lessonDurationMinutes} onChange={(lessonDurationMinutes) => setTimeConfigForm((current) => ({ ...current, lessonDurationMinutes }))} />
            <NumberInput label="Ara Süresi" value={timeConfigForm.breakDurationMinutes} onChange={(breakDurationMinutes) => setTimeConfigForm((current) => ({ ...current, breakDurationMinutes }))} />
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={timeConfigForm.lunchBreakEnabled}
              onChange={(event) => setTimeConfigForm((current) => ({ ...current, lunchBreakEnabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-[#006482] focus:ring-[#006482]"
            />
            Öğle arası kullan
          </label>
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Öğle Başlangıç" value={timeConfigForm.lunchBreakStart} onChange={(lunchBreakStart) => setTimeConfigForm((current) => ({ ...current, lunchBreakStart }))} />
            <TimeInput label="Öğle Bitiş" value={timeConfigForm.lunchBreakEnd} onChange={(lunchBreakEnd) => setTimeConfigForm((current) => ({ ...current, lunchBreakEnd }))} />
          </div>
          {timeConfiguration && timeConfiguration.affectedScheduleCount > 0 && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {timeConfiguration.affectedScheduleCount} mevcut program kaydı geçerli saat bloklarının dışında. Ayarlar değişirse kayıtlar silinmez veya taşınmaz.
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <SecondaryButton type="button" onClick={() => setIsTimeConfigModalOpen(false)}>İptal</SecondaryButton>
            <PrimaryButton type="submit" loading={updateTimeConfigMutation.isPending}>Kaydet</PrimaryButton>
          </div>
        </form>
      </FormModal>

      {scheduleStatus && (
        <FormModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Program Durumu">
          <div className="space-y-3">
            {incompleteCourses.length === 0 && notScheduledCourses.length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                Seçili dönemde programı eksik ders bulunmuyor.
              </div>
            ) : (
              <>
                {incompleteCourses.length > 0 && (
                  <CourseStatusPanel title="Programı Tamamlanmayan Dersler" courses={incompleteCourses} onOpenCourse={(courseId) => { setIsStatusModalOpen(false); openCreate(courseId); }} />
                )}
                {notScheduledCourses.length > 0 && (
                  <CourseStatusPanel title="Henüz Programa Eklenmeyen Dersler" courses={notScheduledCourses} onOpenCourse={(courseId) => { setIsStatusModalOpen(false); openCreate(courseId); }} />
                )}
              </>
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
};

const TimeInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className="space-y-1">
    <label className="dts-input-label">{label}</label>
    <input
      type="time"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="dts-input"
      required
    />
  </div>
);

const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
  <div className="space-y-1">
    <label className="dts-input-label">{label} (dk)</label>
    <input
      type="number"
      min={0}
      max={240}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="dts-input"
      required
    />
  </div>
);

const ReadonlyLecturer = ({ course }: { course: CourseResponse | null }) => (
  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-3 py-2.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akademisyen</p>
    <p className={cn('mt-1 text-sm font-semibold', course ? 'text-slate-700' : 'text-slate-400')}>
      {course?.academicianName ?? 'Ders seçildiğinde otomatik gösterilir'}
    </p>
  </div>
);

const CourseSummary = ({ course }: { course: CourseResponse | null }) => {
  if (!course) return null;
  const weeklyHours = course.theoreticalHours + course.practicalHours;
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200/70 bg-white p-3 text-[11px] font-semibold text-slate-500">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ders</p>
        <p className="mt-1 truncate text-slate-800">{course.code} · {course.name}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sınıf / Saat</p>
        <p className="mt-1 text-slate-800">{course.grade}. Sınıf · {weeklyHours} saat/hafta</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Öğrenci</p>
        <p className="mt-1 text-slate-500">Veri yok</p>
      </div>
    </div>
  );
};

const ClassroomPicker = ({
  selectedClassroomId,
  availableClassrooms,
  unavailableClassrooms,
  loading,
  canQuery,
  onSelect,
}: {
  selectedClassroomId: string;
  availableClassrooms: AvailableClassroomResponse[];
  unavailableClassrooms: AvailableClassroomResponse[];
  loading: boolean;
  canQuery: boolean;
  onSelect: (classroomId: string) => void;
}) => {
  const selectedClassroom = [...availableClassrooms, ...unavailableClassrooms].find((classroom) => classroom.id === selectedClassroomId);
  return (
    <div className="space-y-2">
      <label className="dts-input-label">Sınıf</label>
      {!canQuery ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
          Önce ders, gün ve saat seçiniz.
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-400">
          Sınıflar kontrol ediliyor...
        </div>
      ) : (
        <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white p-3">
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
            Öğrenci sayısı bulunamadığı için kapasite kontrolü yapılamıyor.
          </p>
          <ClassroomGroup title="Uygun Sınıflar" classrooms={availableClassrooms} selectedClassroomId={selectedClassroomId} onSelect={onSelect} />
          <ClassroomGroup title="Uygun Olmayan Sınıflar" classrooms={unavailableClassrooms} selectedClassroomId={selectedClassroomId} onSelect={onSelect} disabled />
        </div>
      )}
      {selectedClassroom && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-700">
          {selectedClassroom.code} seçildi · Kapasite: {selectedClassroom.capacity} kişi · Zaman dilimi uygun
        </div>
      )}
    </div>
  );
};

const ClassroomGroup = ({
  title,
  classrooms,
  selectedClassroomId,
  disabled = false,
  onSelect,
}: {
  title: string;
  classrooms: AvailableClassroomResponse[];
  selectedClassroomId: string;
  disabled?: boolean;
  onSelect: (classroomId: string) => void;
}) => (
  <div className="space-y-2">
    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{title}</p>
    {classrooms.length === 0 ? (
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">Kayıt yok</p>
    ) : (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {classrooms.map((classroom) => {
      const selected = selectedClassroomId === classroom.id;
      return (
        <button
          key={classroom.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(classroom.id)}
          className={cn(
            'flex min-h-24 w-full items-start justify-between gap-2 rounded-xl border px-3 py-2 text-left transition',
            selected ? 'border-[#006482] bg-[#eff8ff] ring-2 ring-[#006482]/10' : 'border-slate-200 bg-white',
            disabled ? 'cursor-not-allowed opacity-75' : 'hover:border-[#006482]/30 hover:bg-[#eff8ff]',
          )}
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-800">{classroom.code} · {classroom.name}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
              {classroom.capacity} kişi · {classroomTypeLabels[classroom.type] ?? classroom.type}
            </span>
            <span className={cn('mt-1 line-clamp-2 text-[11px] font-semibold', disabled ? 'block text-amber-700' : 'hidden')}>
              {classroom.conflictMessage ?? (classroom.capacitySufficient === null || classroom.capacitySufficient === undefined ? 'Kapasite için öğrenci sayısı verisi yok; zaman dilimi uygun.' : 'Kapasite ve zaman dilimi uygun.')}
            </span>
          </span>
          <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-black', selected ? 'border-[#006482] bg-[#006482] text-white' : 'border-slate-300 text-transparent')}>
            ✓
          </span>
        </button>
      );
        })}
      </div>
    )}
  </div>
);

const ScheduleStatusOverview = ({
  status,
  isLoading,
  incompleteCourses,
  notScheduledCourses,
  onShowDetails,
}: {
  status: ScheduleCompletionResponse;
  isLoading: boolean;
  incompleteCourses: CourseScheduleStatusItemResponse[];
  notScheduledCourses: CourseScheduleStatusItemResponse[];
  onShowDetails: () => void;
}) => {
  const hasWarnings = status.incompleteCourses > 0 || status.notScheduledCourses > 0 || status.overScheduledCourses > 0;

  return (
    <section className={cn('rounded-2xl border px-4 py-3', hasWarnings ? 'border-amber-100 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/70')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {hasWarnings ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
          <div className="min-w-0">
            <p className={cn('text-sm font-bold', hasWarnings ? 'text-amber-800' : 'text-emerald-800')}>
              {hasWarnings ? 'Ders programı tamamlanmadı' : 'Ders programı tamamlandı'}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {isLoading ? 'Program durumu hesaplanıyor...' : `${status.completedCourses} tamamlandı · ${status.incompleteCourses} eksik · ${status.notScheduledCourses} programlanmadı · ${status.overScheduledCourses} fazla saat`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28">
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-[#006482]" style={{ width: `${status.completionPercentage}%` }} />
            </div>
            <p className="mt-1 text-right text-[11px] font-bold text-slate-500">{status.completionPercentage}%</p>
          </div>
          <SecondaryButton type="button" onClick={onShowDetails}>Detayları Gör</SecondaryButton>
        </div>
      </div>
    </section>
  );
};

const CourseStatusPanel = ({
  title,
  courses,
  onOpenCourse,
}: {
  title: string;
  courses: CourseScheduleStatusItemResponse[];
  onOpenCourse: (courseId: string) => void;
}) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{title}</h2>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{courses.length}</span>
    </div>
    <div className="space-y-2">
      {courses.map((course) => (
        <div key={course.courseId} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{course.courseCode} - {course.courseName}</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{course.academicianName} · {course.grade}. Sınıf</p>
            </div>
            <StatusBadge status={course.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-500">
            <span>Gereken: <b className="text-slate-800">{course.requiredHours}</b></span>
            <span>Planlanan: <b className="text-slate-800">{course.scheduledHours}</b></span>
            <span>{course.remainingHours < 0 ? 'Fazla' : 'Eksik'}: <b className="text-slate-800">{Math.abs(course.remainingHours)}</b></span>
          </div>
          <div className="mt-3 flex justify-end">
            <SecondaryButton type="button" onClick={() => onOpenCourse(course.courseId)}>Programa Git</SecondaryButton>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: CourseScheduleStatusItemResponse['status'] }) => {
  const meta = {
    COMPLETE: { label: 'Tamamlandı', cls: 'border-emerald-100 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
    INCOMPLETE: { label: 'Eksik', cls: 'border-amber-100 bg-amber-50 text-amber-700', icon: AlertTriangle },
    NOT_SCHEDULED: { label: 'Programlanmadı', cls: 'border-slate-200 bg-white text-slate-500', icon: Circle },
    OVER_SCHEDULED: { label: 'Fazla Saat', cls: 'border-rose-100 bg-rose-50 text-rose-700', icon: AlertTriangle },
  }[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', meta.cls)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

const ScheduleCard = ({
  schedule,
  groupMeta,
  hasConflict,
  onEdit,
  onDelete,
}: {
  schedule: WeeklyScheduleResponse;
  groupMeta?: ScheduleGroupMeta;
  hasConflict: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <article className={cn('rounded-xl border p-2.5 shadow-sm', hasConflict ? 'border-red-200 bg-red-50' : 'border-[#006482]/15 bg-[#eff8ff]')}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-slate-900">{schedule.courseCode}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-600">{schedule.courseName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onEdit} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-[#006482]" aria-label="Düzenle">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-red-600" aria-label="Sil">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
    <div className="mt-2 space-y-1 text-[10px] font-semibold text-slate-500">
      <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> <span className="truncate">{schedule.academicianName}</span></p>
      <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> <span className="truncate">{schedule.classroomCode} · {schedule.classroomName}</span></p>
      <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {groupMeta && groupMeta.slotCount > 1 ? `${groupMeta.slotCount} ders saati · ${groupMeta.timeRange}` : formatSlot(schedule.timeSlot)}</p>
      {hasConflict && <p className="flex items-center gap-1.5 font-bold text-red-600"><XCircle className="h-3 w-3" /> Çakışma</p>}
    </div>
  </article>
);
