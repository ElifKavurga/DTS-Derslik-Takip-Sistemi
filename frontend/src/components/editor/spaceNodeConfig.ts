/**
 * spaceNodeConfig.ts
 * Central configuration for all space object types:
 * - Lucide icon component mapping
 * - Dynamic property panel field definitions per type
 * - Status colors
 */

import {
  BookOpen, FlaskConical, Presentation, UserRound, Briefcase,
  Library, Coffee, Moon, PersonStanding, Accessibility,
  Package, Wrench, Zap, Server, ArrowUpDown, MoveUp,
  DoorOpen, Flame, HeartPulse, LucideIcon,
} from 'lucide-react';
import { SpaceObjectType } from '@/types';

// ─── Icon map ─────────────────────────────────────────────────────────────────
export const SPACE_ICONS: Record<SpaceObjectType, LucideIcon> = {
  CLASSROOM:             BookOpen,
  LABORATORY:            FlaskConical,
  AMPHITHEATER:          Presentation,
  ACADEMICIAN_OFFICE:    UserRound,
  ADMINISTRATIVE_OFFICE: Briefcase,
  LIBRARY:               Library,
  REST_AREA:             Coffee,
  MOSQUE:                Moon,
  MALE_WC:               PersonStanding,
  FEMALE_WC:             PersonStanding,
  DISABLED_WC:           Accessibility,
  STORAGE:               Package,
  TECHNICAL_ROOM:        Wrench,
  ELECTRICAL_ROOM:       Zap,
  SERVER_ROOM:           Server,
  ELEVATOR:              ArrowUpDown,
  STAIRS:                MoveUp,
  EMERGENCY_EXIT:        DoorOpen,
  FIRE_CABINET:          Flame,
  FIRST_AID:             HeartPulse,
};

// ─── Property field definitions ───────────────────────────────────────────────
export type FieldType = 'text' | 'number' | 'checkbox' | 'select' | 'textarea';

export interface PropertyField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  section?: 'main' | 'equipment';
}

const STATUS_OPTIONS = [
  { value: 'EMPTY',       label: 'Boş' },
  { value: 'OCCUPIED',    label: 'Dolu' },
  { value: 'RESERVED',    label: 'Rezerve' },
  { value: 'MAINTENANCE', label: 'Bakımda' },
];

// ─── Per-type field configs ───────────────────────────────────────────────────
const classroomFields: PropertyField[] = [
  { key: 'code',     label: 'Derslik Kodu', type: 'text',   placeholder: 'D101',       section: 'main' },
  { key: 'label',    label: 'Derslik Adı',  type: 'text',   placeholder: 'D101 Dersl.', section: 'main' },
  { key: 'capacity', label: 'Kapasite',     type: 'number', placeholder: '40',          section: 'main' },
  { key: 'status',   label: 'Durum',        type: 'select', options: STATUS_OPTIONS,     section: 'main' },
  { key: 'equipment.hasAirConditioning', label: 'Klima',        type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasProjector',       label: 'Projeksiyon',  type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasSmartBoard',      label: 'Akıllı Tahta', type: 'checkbox', section: 'equipment' },
  { key: 'equipment.computerCount',      label: 'Bilgisayar Sayısı', type: 'number', placeholder: '0', section: 'equipment' },
  { key: 'equipment.hasPrinter',         label: 'Yazıcı',       type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasInternet',        label: 'İnternet',     type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasSoundSystem',     label: 'Ses Sistemi',  type: 'checkbox', section: 'equipment' },
];

const laboratoryFields: PropertyField[] = [
  { key: 'code',     label: 'Lab Kodu', type: 'text',   placeholder: 'LAB-1',       section: 'main' },
  { key: 'label',    label: 'Lab Adı',  type: 'text',   placeholder: 'Bilg. Lab.',  section: 'main' },
  { key: 'capacity', label: 'Kapasite', type: 'number', placeholder: '30',          section: 'main' },
  { key: 'status',   label: 'Durum',    type: 'select', options: STATUS_OPTIONS,     section: 'main' },
  { key: 'equipment.computerCount',  label: 'Bilgisayar Sayısı', type: 'number', placeholder: '0',  section: 'equipment' },
  { key: 'equipment.hasAirConditioning', label: 'Klima',         type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasProjector',       label: 'Projeksiyon',   type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasSmartBoard',      label: 'Akıllı Tahta',  type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasPrinter',         label: 'Yazıcı',        type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasServer',          label: 'Sunucu',        type: 'checkbox', section: 'equipment' },
  { key: 'equipment.specialEquipment',   label: 'Özel Ekipman',  type: 'text', placeholder: 'Açıklayın', section: 'equipment' },
];

const amphitheaterFields: PropertyField[] = [
  { key: 'label',    label: 'Amfi Adı', type: 'text',   placeholder: 'Büyük Amfi', section: 'main' },
  { key: 'capacity', label: 'Kapasite', type: 'number', placeholder: '200',         section: 'main' },
  { key: 'status',   label: 'Durum',    type: 'select', options: STATUS_OPTIONS,     section: 'main' },
  { key: 'equipment.hasProjector',   label: 'Projeksiyon',  type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasSoundSystem', label: 'Ses Sistemi',  type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasMicrophone',  label: 'Mikrofon',     type: 'checkbox', section: 'equipment' },
  { key: 'equipment.hasAirConditioning', label: 'Klima',    type: 'checkbox', section: 'equipment' },
];

const academicianOfficeFields: PropertyField[] = [
  { key: 'code',          label: 'Oda No',          type: 'text', placeholder: 'K-201',      section: 'main' },
  { key: 'label',         label: 'Oda Adı',          type: 'text', placeholder: 'Prof. Dr. Ahmet Yılmaz', section: 'main' },
  { key: 'occupantName',  label: 'Akademisyen Adı',  type: 'text', placeholder: 'Adı Soyadı', section: 'main' },
  { key: 'occupantTitle', label: 'Unvan',            type: 'text', placeholder: 'Prof. Dr.', section: 'main' },
];

const administrativeOfficeFields: PropertyField[] = [
  { key: 'label',        label: 'Ofis Adı', type: 'text', placeholder: 'Dekanlık',  section: 'main' },
  { key: 'occupantName', label: 'Birim',    type: 'text', placeholder: 'Birim adı', section: 'main' },
];

const libraryFields: PropertyField[] = [
  { key: 'label',       label: 'Ad',       type: 'text',     placeholder: 'Kütüphane', section: 'main' },
  { key: 'description', label: 'Açıklama', type: 'textarea', placeholder: 'Açıklama', section: 'main' },
];

const restAreaFields: PropertyField[] = [
  { key: 'label',       label: 'Ad',       type: 'text',     placeholder: 'Kantin',   section: 'main' },
  { key: 'description', label: 'Açıklama', type: 'textarea', placeholder: 'Açıklama', section: 'main' },
];

const storageFields: PropertyField[] = [
  { key: 'label', label: 'Depo Adı', type: 'text', placeholder: 'Depo 1', section: 'main' },
];

const technicalRoomFields: PropertyField[] = [
  { key: 'label', label: 'Oda Adı', type: 'text', placeholder: 'Teknik Oda', section: 'main' },
];

const electricalRoomFields: PropertyField[] = [
  { key: 'label', label: 'Oda Adı', type: 'text', placeholder: 'Elektrik Odası', section: 'main' },
];

const serverRoomFields: PropertyField[] = [
  { key: 'label', label: 'Oda Adı', type: 'text', placeholder: 'Sunucu Odası', section: 'main' },
];

const mosqueFields: PropertyField[] = [
  { key: 'label',    label: 'Ad',       type: 'text',   placeholder: 'Mescit',  section: 'main' },
  { key: 'capacity', label: 'Kapasite', type: 'number', placeholder: '50',      section: 'main' },
];

const wcFields: PropertyField[] = [
  { key: 'description', label: 'Açıklama', type: 'textarea', placeholder: 'İsteğe bağlı', section: 'main' },
];

const elevatorFields: PropertyField[] = [
  { key: 'elevatorNo',  label: 'Asansör No', type: 'text', placeholder: 'A1', section: 'main' },
];

const noFields: PropertyField[] = [];

// ─── Master config map ────────────────────────────────────────────────────────
export const SPACE_PROPERTY_FIELDS: Record<SpaceObjectType, PropertyField[]> = {
  CLASSROOM:             classroomFields,
  LABORATORY:            laboratoryFields,
  AMPHITHEATER:          amphitheaterFields,
  ACADEMICIAN_OFFICE:    academicianOfficeFields,
  ADMINISTRATIVE_OFFICE: administrativeOfficeFields,
  LIBRARY:               libraryFields,
  REST_AREA:             restAreaFields,
  MOSQUE:                mosqueFields,
  STORAGE:               storageFields,
  TECHNICAL_ROOM:        technicalRoomFields,
  ELECTRICAL_ROOM:       electricalRoomFields,
  SERVER_ROOM:           serverRoomFields,
  MALE_WC:               wcFields,
  FEMALE_WC:             wcFields,
  DISABLED_WC:           wcFields,
  ELEVATOR:              elevatorFields,
  STAIRS:                noFields,
  EMERGENCY_EXIT:        noFields,
  FIRE_CABINET:          noFields,
  FIRST_AID:             noFields,
};

// ─── Status color helpers ─────────────────────────────────────────────────────
export const STATUS_BORDER_CLASS: Record<string, string> = {
  EMPTY:       'border-slate-300',
  OCCUPIED:    'border-emerald-400',
  RESERVED:    'border-amber-400',
  MAINTENANCE: 'border-red-400',
};

export const STATUS_BG_CLASS: Record<string, string> = {
  EMPTY:       'bg-white',
  OCCUPIED:    'bg-emerald-50',
  RESERVED:    'bg-amber-50',
  MAINTENANCE: 'bg-red-50',
};

export const STATUS_DOT_CLASS: Record<string, string> = {
  EMPTY:       'bg-slate-300',
  OCCUPIED:    'bg-emerald-400',
  RESERVED:    'bg-amber-400',
  MAINTENANCE: 'bg-red-400',
};

export const STATUS_LABELS: Record<string, string> = {
  EMPTY:       'Boş',
  OCCUPIED:    'Dolu',
  RESERVED:    'Rezerve',
  MAINTENANCE: 'Bakımda',
};
