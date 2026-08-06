import { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Lock, Move } from 'lucide-react';

/**
 * BackgroundNode – renders the floor plan image as a React Flow node.
 * This way it participates in the canvas coordinate system (zoom/pan)
 * and can be dragged/resized natively via React Flow.
 *
 * node.data shape:
 *   base64: string
 *   type:   string (MIME type e.g. 'image/png')
 *   opacity: number (0-1)
 *   isLocked: boolean
 *   bgEditMode: boolean (controls whether resizer handles appear)
 */
export const BackgroundNode = memo(({ data, selected }: NodeProps) => {
  const d          = data as Record<string, unknown>;
  const base64     = d['base64']     as string;
  const mimeType   = d['mimeType']   as string ?? 'image/png';
  const opacity    = (d['opacity']   as number) ?? 0.35;
  const isLocked   = (d['isLocked']  as boolean) ?? true;
  const bgEditMode = (d['bgEditMode'] as boolean) ?? false;

  const showResizer = bgEditMode && !isLocked && selected;

  return (
    <>
      {/* Resize handles – only visible in bg edit mode, when unlocked & selected */}
      <NodeResizer
        isVisible={showResizer}
        minWidth={100}
        minHeight={80}
        lineStyle={{ borderColor: '#f59e0b', borderWidth: 1.5 }}
        handleStyle={{ borderColor: '#f59e0b', backgroundColor: '#fff', width: 8, height: 8, borderRadius: 3 }}
        keepAspectRatio
      />

      {/* Image container */}
      <div
        style={{ width: '100%', height: '100%', opacity, cursor: isLocked ? 'default' : 'move', position: 'relative' }}
      >
        <img
          src={`data:${mimeType};base64,${base64}`}
          alt="Kat Planı"
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', userSelect: 'none' }}
        />

        {/* Overlay when in bg edit mode – shows the edit affordances */}
        {bgEditMode && (
          <div
            style={{
              position: 'absolute', inset: 0,
              border: isLocked ? '2px dashed rgba(251,146,60,0.4)' : '2px solid #f59e0b',
              borderRadius: 4,
              background: selected && !isLocked ? 'rgba(245,158,11,0.06)' : 'transparent',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Status badge */}
        {bgEditMode && (
          <div
            style={{
              position: 'absolute', top: 6, left: 6,
              background: isLocked ? 'rgba(100,116,139,0.85)' : 'rgba(245,158,11,0.9)',
              color: '#fff',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {isLocked
              ? <><Lock style={{ width: 9, height: 9 }} /> Kilitli</>
              : <><Move style={{ width: 9, height: 9 }} /> Sürükle</>
            }
          </div>
        )}
      </div>
    </>
  );
});

BackgroundNode.displayName = 'BackgroundNode';

/** Sentinel ID for the background node */
export const BG_NODE_ID = '__floor_background__';
