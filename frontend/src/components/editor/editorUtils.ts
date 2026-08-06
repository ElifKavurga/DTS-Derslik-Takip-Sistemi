import { SpaceObjectType } from '@/types';

/** Types that require a form modal before being added to the canvas */
const TYPES_NEEDING_FORM = new Set<SpaceObjectType>([
  'CLASSROOM', 'LABORATORY', 'AMPHITHEATER',
  'ACADEMICIAN_OFFICE', 'ADMINISTRATIVE_OFFICE',
  'LIBRARY', 'REST_AREA', 'MOSQUE',
  'STORAGE', 'TECHNICAL_ROOM', 'ELECTRICAL_ROOM', 'SERVER_ROOM',
  'ELEVATOR',
]);

export function needsAddForm(type: SpaceObjectType): boolean {
  return TYPES_NEEDING_FORM.has(type);
}
