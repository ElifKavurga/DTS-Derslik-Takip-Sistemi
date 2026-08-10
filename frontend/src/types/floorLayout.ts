// ─── Space Object Types ───────────────────────────────────────────────────────
export type SpaceObjectType =
  | 'CLASSROOM'
  | 'LABORATORY'
  | 'AMPHITHEATER'
  | 'ACADEMICIAN_OFFICE'
  | 'ADMINISTRATIVE_OFFICE'
  | 'MALE_WC'
  | 'FEMALE_WC'
  | 'DISABLED_WC'
  | 'MOSQUE'
  | 'REST_AREA'
  | 'LIBRARY'
  | 'STORAGE'
  | 'TECHNICAL_ROOM'
  | 'ELECTRICAL_ROOM'
  | 'SERVER_ROOM'
  | 'ELEVATOR'
  | 'STAIRS'
  | 'EMERGENCY_EXIT'
  | 'FIRE_CABINET'
  | 'FIRST_AID';

export type SpaceObjectStatus = 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

// ─── Equipment / extra fields stored per node ─────────────────────────────────
export interface ClassroomEquipment {
  hasAirConditioning?: boolean;
  hasProjector?: boolean;
  hasSmartBoard?: boolean;
  computerCount?: number;
  hasPrinter?: boolean;
  hasInternet?: boolean;
  hasSoundSystem?: boolean;
}

export interface LaboratoryEquipment {
  computerCount?: number;
  hasAirConditioning?: boolean;
  hasProjector?: boolean;
  hasSmartBoard?: boolean;
  hasPrinter?: boolean;
  hasServer?: boolean;
  specialEquipment?: string;
}

export interface AmphitheaterEquipment {
  hasProjector?: boolean;
  hasSoundSystem?: boolean;
  hasMicrophone?: boolean;
  hasAirConditioning?: boolean;
}

// ─── Node data (stored in React Flow node.data) ───────────────────────────────
export interface SpaceObjectData extends Record<string, unknown> {
  classroomId?: string;
  type: SpaceObjectType;
  status: SpaceObjectStatus;
  label: string;
  code?: string;
  capacity?: number;
  // Extra info per type
  occupantName?: string;   // akademisyen adı, birim adı vb.
  occupantTitle?: string;  // unvan
  description?: string;
  elevatorNo?: string;
  equipment?: ClassroomEquipment | LaboratoryEquipment | AmphitheaterEquipment | Record<string, unknown>;
  // Canvas meta
  isLocked?: boolean;
  isHidden?: boolean;
  // Future: reservation hooks
  reservationId?: string;
  metadataJson?: string;
}

// ─── Background image state ───────────────────────────────────────────────────
export interface BackgroundImageState {
  base64: string;
  type: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  opacity: number;
  isLocked: boolean;
}

// ─── API Response / Request shapes ───────────────────────────────────────────
export interface SpaceObjectResponse {
  id: string;
  classroomId?: string;
  type: SpaceObjectType;
  status: SpaceObjectStatus;
  label: string;
  code?: string;
  capacity?: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  metadataJson?: string;
}

export interface FloorDetailResponse {
  id: string;
  name: string;
  level: number;
  buildingId: string;
  buildingName: string;
  facultyId: string;
  facultyName: string;
  backgroundImageBase64?: string;
  backgroundImageType?: string;
  backgroundX: number;
  backgroundY: number;
  backgroundWidth?: number;
  backgroundHeight?: number;
  backgroundOpacity: number;
  backgroundLocked: boolean;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  objects: SpaceObjectResponse[];
}

export interface SpaceObjectRequest {
  id: string;
  classroomId?: string;
  type: SpaceObjectType;
  status: SpaceObjectStatus;
  label: string;
  code?: string;
  capacity?: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  metadataJson?: string;
}

export interface SaveFloorLayoutRequest {
  backgroundImageBase64?: string;
  backgroundImageType?: string;
  backgroundX: number;
  backgroundY: number;
  backgroundWidth?: number;
  backgroundHeight?: number;
  backgroundOpacity: number;
  backgroundLocked: boolean;
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  objects: SpaceObjectRequest[];
}

// ─── Palette item (left panel metadata) ──────────────────────────────────────
export interface PaletteItem {
  type: SpaceObjectType;
  label: string;
  iconName: string;   // Lucide icon name
  category: 'classroom' | 'office' | 'wc' | 'service' | 'infrastructure';
  defaultWidth: number;
  defaultHeight: number;
  /** If true, drop creates the node immediately without a form */
  quickDrop?: boolean;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'CLASSROOM',             label: 'Derslik',            iconName: 'BookOpen',       category: 'classroom',      defaultWidth: 160, defaultHeight: 100 },
  { type: 'LABORATORY',            label: 'Laboratuvar',         iconName: 'FlaskConical',   category: 'classroom',      defaultWidth: 180, defaultHeight: 120 },
  { type: 'AMPHITHEATER',          label: 'Amfi',                iconName: 'Presentation',   category: 'classroom',      defaultWidth: 220, defaultHeight: 140 },
  { type: 'ACADEMICIAN_OFFICE',    label: 'Akademisyen Odası',   iconName: 'UserRound',      category: 'office',         defaultWidth: 140, defaultHeight: 100 },
  { type: 'ADMINISTRATIVE_OFFICE', label: 'İdari Ofis',          iconName: 'Briefcase',      category: 'office',         defaultWidth: 140, defaultHeight: 100 },
  { type: 'LIBRARY',               label: 'Kütüphane',           iconName: 'Library',        category: 'service',        defaultWidth: 200, defaultHeight: 140 },
  { type: 'REST_AREA',             label: 'Dinlenme Alanı',      iconName: 'Coffee',         category: 'service',        defaultWidth: 160, defaultHeight: 120 },
  { type: 'MOSQUE',                label: 'Mescit',              iconName: 'Moon',           category: 'service',        defaultWidth: 160, defaultHeight: 120 },
  { type: 'MALE_WC',               label: 'Erkek WC',            iconName: 'PersonStanding', category: 'wc',             defaultWidth: 100, defaultHeight: 80, quickDrop: true },
  { type: 'FEMALE_WC',             label: 'Kadın WC',            iconName: 'PersonStanding', category: 'wc',             defaultWidth: 100, defaultHeight: 80, quickDrop: true },
  { type: 'DISABLED_WC',           label: 'Engelli WC',          iconName: 'Accessibility',  category: 'wc',             defaultWidth: 100, defaultHeight: 80, quickDrop: true },
  { type: 'STORAGE',               label: 'Depo',                iconName: 'Package',        category: 'service',        defaultWidth: 120, defaultHeight: 100 },
  { type: 'TECHNICAL_ROOM',        label: 'Teknik Oda',          iconName: 'Wrench',         category: 'infrastructure', defaultWidth: 120, defaultHeight: 100 },
  { type: 'ELECTRICAL_ROOM',       label: 'Elektrik Odası',      iconName: 'Zap',            category: 'infrastructure', defaultWidth: 120, defaultHeight: 100 },
  { type: 'SERVER_ROOM',           label: 'Sunucu Odası',        iconName: 'Server',         category: 'infrastructure', defaultWidth: 140, defaultHeight: 100 },
  { type: 'ELEVATOR',              label: 'Asansör',             iconName: 'ArrowUpDown',    category: 'infrastructure', defaultWidth: 80,  defaultHeight: 80,  quickDrop: true },
  { type: 'STAIRS',                label: 'Merdiven',            iconName: 'MoveUp',         category: 'infrastructure', defaultWidth: 100, defaultHeight: 80,  quickDrop: true },
  { type: 'EMERGENCY_EXIT',        label: 'Acil Çıkış',          iconName: 'DoorOpen',       category: 'infrastructure', defaultWidth: 80,  defaultHeight: 60,  quickDrop: true },
  { type: 'FIRE_CABINET',          label: 'Yangın Dolabı',       iconName: 'Flame',          category: 'infrastructure', defaultWidth: 60,  defaultHeight: 60,  quickDrop: true },
  { type: 'FIRST_AID',             label: 'İlk Yardım',          iconName: 'HeartPulse',     category: 'infrastructure', defaultWidth: 60,  defaultHeight: 60,  quickDrop: true },
];

export const PALETTE_ITEM_MAP: Record<SpaceObjectType, PaletteItem> = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.type, item])
) as Record<SpaceObjectType, PaletteItem>;

// ─── Editor modes ─────────────────────────────────────────────────────────────
export type EditorMode = 'edit' | 'view';

// ─── Left panel tabs ─────────────────────────────────────────────────────────
export type LeftPanelTab = 'objects' | 'layers';
