import { useCallback } from 'react';
import { Settings2, MousePointer2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { PALETTE_ITEM_MAP, SpaceObjectType } from '@/types';
import { AppSelect } from '@/components/ui/AppSelect';
import { SPACE_ICONS, SPACE_PROPERTY_FIELDS, PropertyField } from './spaceNodeConfig';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
}

// Resolve nested key like "equipment.hasProjector" into object path
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

function renderField(field: PropertyField, nodeData: Record<string, unknown>, onChange: (key: string, value: unknown) => void) {
  const rawValue = getNestedValue(nodeData, field.key);

  switch (field.type) {
    case 'text':
      return (
        <input
          key={field.key}
          type="text"
          placeholder={field.placeholder}
          defaultValue={(rawValue as string) ?? ''}
          className="dts-input text-xs"
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
          className="dts-input text-xs"
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
          className="dts-input text-xs resize-none"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <label key={field.key} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={(rawValue as boolean) ?? false}
            className="h-3.5 w-3.5 rounded accent-[#006482]"
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
          <span className="text-xs text-slate-700 font-medium">{field.label}</span>
        </label>
      );
    case 'select':
      return (
        <AppSelect
          key={field.key}
          value={(rawValue as string) ?? ''}
          onChange={(value) => onChange(field.key, value)}
          options={field.options?.map((opt) => ({ label: opt.label, value: opt.value })) ?? []}
          className="text-xs"
        />
      );
    default:
      return null;
  }
}

export function PropertiesPanel({ selectedNode, onUpdate }: PropertiesPanelProps) {
  // Always declare hooks before any early return
  const handleFieldChange = useCallback((key: string, value: unknown) => {
    if (!selectedNode) return;
    const d = selectedNode.data as Record<string, unknown>;
    const newData = setNestedValue(d, key, value);
    onUpdate(selectedNode.id, newData);
  }, [selectedNode, onUpdate]);

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

  const mainFields  = fields.filter((f) => f.section === 'main');
  const equipFields = fields.filter((f) => f.section === 'equipment');

  return (
    <div className="flex flex-col overflow-y-auto flex-1">
      {/* Type header */}
      <div className="flex items-center gap-2 p-3 mx-3 mt-3 rounded-2xl bg-[#eff8ff] border border-[#88d0f2]/30 flex-shrink-0">
        {Icon && <Icon className="h-5 w-5 text-[#006482] flex-shrink-0" strokeWidth={1.8} />}
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#006482] leading-tight">{paletteItem?.label ?? type}</p>
          <p className="text-[9px] text-slate-400">Seçili nesne · {selectedNode.id.slice(0, 8)}</p>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-[10px] text-slate-400">Bu nesne türü için ek özellik bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="p-3 space-y-4">
          {/* Main fields */}
          {mainFields.length > 0 && (
            <div className="space-y-3">
              {mainFields.map((field) => (
                <div key={field.key} className="space-y-1">
                  {field.type !== 'checkbox' && (
                    <label className="dts-input-label">{field.label}</label>
                  )}
                  {renderField(field, d, handleFieldChange)}
                </div>
              ))}
            </div>
          )}

          {/* Equipment fields */}
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
                    {renderField(field, d, handleFieldChange)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
