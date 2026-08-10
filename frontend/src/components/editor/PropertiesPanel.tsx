import { useCallback } from 'react';
import { Check, Layers3, Settings2, MousePointer2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { PALETTE_ITEM_MAP, SpaceObjectType } from '@/types';
import { AppSelect } from '@/components/ui/AppSelect';
import { SPACE_ICONS, SPACE_PROPERTY_FIELDS, PropertyField } from './spaceNodeConfig';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedCount?: number;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onGeometryUpdate: (id: string, patch: {
    position?: { x?: number; y?: number };
    size?: { width?: number; height?: number };
  }) => void;
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const parts = key.split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const parts = key.split('.');
  if (parts.length === 1) return { ...obj, [key]: value };
  const [head, ...rest] = parts;
  return {
    ...obj,
    [head]: setNestedValue((obj[head] as Record<string, unknown>) ?? {}, rest.join('.'), value),
  };
}

function readSize(node: Node, key: 'width' | 'height', fallback: number): number {
  const measured = (node as Node & { measured?: { width?: number; height?: number } }).measured;
  const direct = node[key];
  if (typeof direct === 'number') return Math.round(direct);
  const measuredValue = measured?.[key];
  if (typeof measuredValue === 'number') return Math.round(measuredValue);
  const styled = node.style?.[key];
  return typeof styled === 'number' ? Math.round(styled) : fallback;
}

function renderField(
  field: PropertyField,
  nodeData: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  disabled = false
) {
  const rawValue = getNestedValue(nodeData, field.key);

  switch (field.type) {
    case 'text':
      return (
        <input
          key={field.key}
          type="text"
          placeholder={field.placeholder}
          defaultValue={(rawValue as string) ?? ''}
          disabled={disabled}
          className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          key={field.key}
          type="number"
          min={0}
          placeholder={field.placeholder}
          defaultValue={(rawValue as number) ?? ''}
          disabled={disabled}
          className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
          onChange={(e) => onChange(field.key, e.target.value ? Number(e.target.value) : undefined)}
        />
      );
    case 'textarea':
      return (
        <textarea
          key={field.key}
          rows={3}
          placeholder={field.placeholder}
          defaultValue={(rawValue as string) ?? ''}
          disabled={disabled}
          className="dts-input text-xs resize-none disabled:bg-slate-50 disabled:text-slate-400"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <label
          key={field.key}
          className={`group flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
            disabled
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-70'
              : 'cursor-pointer border-slate-200 bg-white hover:border-[#88d0f2] hover:bg-[#eff8ff]/40'
          }`}
        >
          <input
            type="checkbox"
            defaultChecked={(rawValue as boolean) ?? false}
            disabled={disabled}
            className="peer sr-only"
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-white transition peer-checked:border-[#006482] peer-checked:bg-[#006482] peer-focus-visible:ring-2 peer-focus-visible:ring-[#006482]/25 peer-disabled:bg-slate-100">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="text-xs font-semibold text-slate-700 transition group-hover:text-slate-900 peer-disabled:text-slate-400">
            {field.label}
          </span>
        </label>
      );
    case 'select':
      return (
        <AppSelect
          key={field.key}
          value={(rawValue as string) ?? ''}
          onChange={(value) => onChange(field.key, value)}
          options={field.options?.map((opt) => ({ label: opt.label, value: opt.value })) ?? []}
          disabled={disabled}
          className="text-xs"
        />
      );
    default:
      return null;
  }
}

export function PropertiesPanel({
  selectedNode,
  selectedCount = 0,
  onUpdate,
  onGeometryUpdate,
}: PropertiesPanelProps) {
  const handleFieldChange = useCallback((key: string, value: unknown) => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, unknown>;
    onUpdate(selectedNode.id, setNestedValue(d, key, value));
  }, [selectedNode, onUpdate]);

  if (selectedCount > 1) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-[#eff8ff] flex items-center justify-center border border-[#88d0f2]/30">
          <Layers3 className="h-5 w-5 text-[#006482]" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{selectedCount} alan seçildi</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Çoklu seçimde taşıma ve silme işlemleri desteklenir. Tek nesne özelliklerini düzenlemek için bir alan seçin.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
          <MousePointer2 className="h-5 w-5 text-slate-300" />
        </div>
        <p className="text-xs font-semibold text-slate-400 leading-relaxed">
          Bir nesne seçin veya sol panelden sürükleyerek canvas'a ekleyin
        </p>
      </div>
    );
  }

  const d = selectedNode.data as Record<string, unknown>;
  const type = (d['type'] as SpaceObjectType) ?? 'CLASSROOM';
  const Icon = SPACE_ICONS[type];
  const paletteItem = PALETTE_ITEM_MAP[type];
  const fields = SPACE_PROPERTY_FIELDS[type] ?? [];
  const mainFields = fields.filter((f) => f.section === 'main');
  const equipFields = fields.filter((f) => f.section === 'equipment');
  const isLocked = d['isLocked'] === true;
  const isClassroomLinked = typeof d['classroomId'] === 'string';
  const readOnlySourceFields = new Set(['code', 'label', 'capacity']);

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      <div className="flex items-center gap-2 p-3 mx-3 mt-3 rounded-2xl bg-[#eff8ff] border border-[#88d0f2]/30 flex-shrink-0">
        {Icon && <Icon className="h-5 w-5 text-[#006482] flex-shrink-0" strokeWidth={1.8} />}
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#006482] leading-tight">{paletteItem?.label ?? type}</p>
          <p className="text-[9px] text-slate-400">Seçili nesne · {selectedNode.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {fields.length === 0 ? (
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Bu nesne türü için ek özellik bulunmamaktadır.</p>
          </div>
        ) : (
          <>
            {mainFields.length > 0 && (
              <div className="space-y-3">
                {mainFields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    {field.type !== 'checkbox' && (
                      <label className="dts-input-label">{field.label}</label>
                    )}
                    {renderField(field, d, handleFieldChange, isClassroomLinked && readOnlySourceFields.has(field.key))}
                  </div>
                ))}
              </div>
            )}

            {equipFields.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 pt-1">
                  <Settings2 className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Donanımlar</span>
                </div>
                <div className="space-y-2 pl-1">
                  {equipFields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      {field.type !== 'checkbox' && (
                        <label className="dts-input-label">{field.label}</label>
                      )}
                      {renderField(field, d, handleFieldChange, isLocked)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <MousePointer2 className="h-3 w-3 text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Yerleşim</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="dts-input-label">X</label>
              <input
                type="number"
                value={Math.round(selectedNode.position.x)}
                disabled={isLocked}
                className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
                onChange={(e) => onGeometryUpdate(selectedNode.id, { position: { x: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Y</label>
              <input
                type="number"
                value={Math.round(selectedNode.position.y)}
                disabled={isLocked}
                className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
                onChange={(e) => onGeometryUpdate(selectedNode.id, { position: { y: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Genişlik</label>
              <input
                type="number"
                min={60}
                value={readSize(selectedNode, 'width', 160)}
                disabled={isLocked}
                className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
                onChange={(e) => onGeometryUpdate(selectedNode.id, { size: { width: Number(e.target.value) } })}
              />
            </div>
            <div className="space-y-1">
              <label className="dts-input-label">Yükseklik</label>
              <input
                type="number"
                min={50}
                value={readSize(selectedNode, 'height', 100)}
                disabled={isLocked}
                className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
                onChange={(e) => onGeometryUpdate(selectedNode.id, { size: { height: Number(e.target.value) } })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="dts-input-label">Rotation</label>
            <input
              type="number"
              min={0}
              max={360}
              value={(d['rotation'] as number | undefined) ?? 0}
              disabled={isLocked}
              className="dts-input text-xs disabled:bg-slate-50 disabled:text-slate-400"
              onChange={(e) => handleFieldChange('rotation', e.target.value ? Number(e.target.value) : 0)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
