import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
  type Node,
  type Edge,
  type NodeChange,
  type NodeTypes,
  type Viewport,
  type NodeMouseHandler,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Save, ChevronLeft, Grid3X3, MousePointer2,
  Eye, Pencil, Settings2, Image as ImageIcon,
  Lock, Unlock, HelpCircle, FrameIcon,
} from 'lucide-react';
import { AxiosError } from 'axios';

import { SpaceNode }          from '@/components/editor/SpaceNode';
import { BackgroundNode, BG_NODE_ID } from '@/components/editor/BackgroundNode';
import { AddNodeModal }        from '@/components/editor/AddNodeModal';
import { needsAddForm }        from '@/components/editor/editorUtils';
import { ContextMenu }         from '@/components/editor/ContextMenu';
import { ObjectPalette }       from '@/components/editor/ObjectPalette';
import { PropertiesPanel }     from '@/components/editor/PropertiesPanel';
import { BackgroundPanel }     from '@/components/editor/BackgroundPanel';
import { SlotLayoutEditor }    from '@/components/editor/SlotLayoutEditor';
import { PrimaryButton }       from '@/components/ui/PrimaryButton';
import { floorLayoutService }  from '@/services/floorLayoutService';
import { useHeaderStore }      from '@/store/useHeaderStore';
import {
  type SpaceObjectType, type SpaceObjectStatus,
  type SpaceObjectRequest, type SaveFloorLayoutRequest,
  type BackgroundImageState, type EditorMode,
  type ClassroomPlacement,
  PALETTE_ITEM_MAP,
} from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_TYPES: NodeTypes = {
  spaceNode:       SpaceNode,
  backgroundNode:  BackgroundNode,
};
const GRID_SIZE        = 20;
const DEFAULT_OPACITY  = 0.35;
const DUPLICATE_OFFSET = 20;
const BG_NODE_ZINDEX   = -1000;
const MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_INITIAL_BACKGROUND_WIDTH = 1200;
const ACCEPTED_BACKGROUND_TYPES = new Set(['image/png', 'image/jpeg']);
const ACCEPTED_BACKGROUND_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);
const SPACE_METADATA_KEYS = [
  'equipment',
  'occupantName',
  'occupantTitle',
  'description',
  'elevatorNo',
  'isLocked',
  'isHidden',
  'reservationId',
] as const;

// ─── Keyboard hint items ──────────────────────────────────────────────────────
const SHORTCUTS = [
  { key: 'Del',      desc: 'Sil' },
  { key: 'Ctrl+D',   desc: 'Çoğalt' },
  { key: 'Ctrl+C/V', desc: 'Kopyala / Yapıştır' },
  { key: 'Ctrl+S',   desc: 'Kaydet' },
  { key: 'Shift+🖱',  desc: 'Çoklu seçim' },
];

// ─── Helper: build a background node from BackgroundImageState ────────────────
function buildBgNode(bgState: BackgroundImageState, bgEditMode: boolean): Node {
  return {
    id:   BG_NODE_ID,
    type: 'backgroundNode',
    position: { x: bgState.x, y: bgState.y },
    width:  bgState.width  ?? 800,
    height: bgState.height ?? 600,
    style: {
      zIndex: bgEditMode ? 0 : BG_NODE_ZINDEX,
    },
    draggable:   bgEditMode && !bgState.isLocked,
    selectable:  bgEditMode,
    selected:    bgEditMode && !bgState.isLocked,
    focusable:   false,
    deletable:   false,
    data: {
      base64:     bgState.base64,
      mimeType:   bgState.type,
      opacity:    bgState.opacity,
      isLocked:   bgState.isLocked,
      bgEditMode,
    },
  };
}

// ─── Inner editor ─────────────────────────────────────────────────────────────
function parseSpaceMetadata(metadataJson?: string): Record<string, unknown> {
  if (!metadataJson) return {};
  try {
    const parsed = JSON.parse(metadataJson);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function buildSpaceMetadata(data: Record<string, unknown>): string | undefined {
  const metadata = SPACE_METADATA_KEYS.reduce<Record<string, unknown>>((acc, key) => {
    if (data[key] !== undefined) acc[key] = data[key];
    return acc;
  }, {});
  return Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined;
}

function isAcceptedBackgroundExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return !!ext && ACCEPTED_BACKGROUND_EXTENSIONS.has(ext);
}

function getNodeDimension(node: Node, key: 'width' | 'height', fallback: number): number {
  const measured = (node as Node & { measured?: { width?: number; height?: number } }).measured;
  const candidates = [
    node[key],
    measured?.[key],
    typeof node.style?.[key] === 'number' ? node.style[key] : undefined,
  ];
  const value = candidates.find((candidate) => typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0);
  return value ?? fallback;
}

const EditorInner = () => {
  const { id: floorId } = useParams<{ id: string }>();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const reactFlow        = useReactFlow();
  const setMeta          = useHeaderStore((s) => s.setMeta);
  const wrapperRef       = useRef<HTMLDivElement>(null);
  const emptyBgInputRef  = useRef<HTMLInputElement>(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [nodes, setNodes, applyNodesChange] = useNodesState<Node>([]);
  const [edges, , onEdgesChange]          = useEdgesState<Edge>([]);

  const [bgState, setBgState]         = useState<BackgroundImageState | null>(null);
  const [bgEditMode, setBgEditMode]   = useState(false);

  const [editorMode, setEditorMode]   = useState<EditorMode>('edit');
  const [showGrid, setShowGrid]       = useState(true);
  const [snapToGrid, setSnapToGrid]   = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // single-node tracking (for property panel)
  const [selectedNodeId, setSelectedNodeId]     = useState<string | null>(null);
  // multi-node tracking (for bulk ops)
  const [selectedNodeIds, setSelectedNodeIds]   = useState<string[]>([]);

  const [clipboard, setClipboard]     = useState<Node | null>(null);
  const [ctxMenu, setCtxMenu]         = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'background'>('properties');

  const [pendingDrop, setPendingDrop] = useState<{
    type: SpaceObjectType;
    position: { x: number; y: number };
    width: number; height: number;
  } | null>(null);

  const isViewMode = editorMode === 'view';

  const onNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    const lockedNodeIds = new Set(nodes
      .filter((node) => node.id !== BG_NODE_ID && node.data['isLocked'] === true)
      .map((node) => node.id)
    );
    applyNodesChange(changes.filter((change) => {
      if (!('id' in change)) return true;
      if (change.id === BG_NODE_ID && bgState?.isLocked) {
        return change.type !== 'position' && change.type !== 'dimensions';
      }
      if (lockedNodeIds.has(change.id)) {
        return change.type !== 'position' && change.type !== 'dimensions';
      }
      return true;
    }));
  }, [applyNodesChange, bgState?.isLocked, nodes]);

  // ── Data loading ──────────────────────────────────────────────────────────
  const { data: floor, isLoading } = useQuery({
    queryKey: ['floorDetail', floorId],
    queryFn:  () => floorLayoutService.getFloorDetail(floorId!),
    enabled:  !!floorId,
  });

  const { data: classrooms = [] } = useQuery<ClassroomPlacement[]>({
    queryKey: ['floorClassrooms', floorId],
    queryFn:  () => floorLayoutService.getClassroomsForPlacement(floorId!),
    enabled:  !!floorId,
  });

  useEffect(() => {
    if (!floor) return;
    setMeta(`${floor.name} – Kat Planı`, [
      'Ana Ekran', 'Kampüs Yönetimi', 'Fakülteler',
      floor.facultyName, floor.buildingName, floor.name,
    ]);

    // Restore space object nodes
    const hydrated: Node[] = floor.objects.map((obj) => {
      const metadata = parseSpaceMetadata(obj.metadataJson);
      return {
        id:       obj.id,
        type:     'spaceNode',
        position: { x: obj.positionX, y: obj.positionY },
        width:    obj.width,
        height:   obj.height,
        style:    { width: obj.width, height: obj.height },
        draggable: metadata.isLocked !== true,
        hidden:    metadata.isHidden === true,
        data: {
          ...metadata,
          classroomId: obj.classroomId,
          type: obj.type, status: obj.status,
          label: obj.label, code: obj.code, capacity: obj.capacity,
          rotation: obj.rotation,
          slotRow: obj.slotRow,
          slotColumn: obj.slotColumn,
        },
      };
    });

    // Restore background
    if (floor.backgroundImageBase64) {
      const bg: BackgroundImageState = {
        base64:   floor.backgroundImageBase64,
        type:     floor.backgroundImageType ?? 'image/png',
        x:        floor.backgroundX ?? 0,
        y:        floor.backgroundY ?? 0,
        width:    floor.backgroundWidth  ?? 800,
        height:   floor.backgroundHeight ?? 600,
        opacity:  floor.backgroundOpacity  ?? DEFAULT_OPACITY,
        isLocked: floor.backgroundLocked   ?? true,
      };
      setBgState(bg);
      setNodes([buildBgNode(bg, false), ...hydrated]);
    } else {
      setNodes(hydrated);
    }

    reactFlow.setViewport({ x: floor.viewportX, y: floor.viewportY, zoom: floor.viewportZoom });
  }, [floor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync bgEditMode into background node ─────────────────────────────────
  useEffect(() => {
    if (!bgState) return;
    setNodes((prev) => {
      const hasBg = prev.some((n) => n.id === BG_NODE_ID);
      if (!hasBg) return prev;
      return prev.map((n) =>
        n.id === BG_NODE_ID
          ? {
              ...n,
              draggable: bgEditMode && !bgState.isLocked,
              selectable: bgEditMode,
              selected: bgEditMode && !bgState.isLocked,
              style: {
                ...n.style,
                zIndex: bgEditMode ? 0 : BG_NODE_ZINDEX,
              },
              data: { ...n.data, isLocked: bgState.isLocked, bgEditMode, opacity: bgState.opacity }
            }
          : n
      );
    });
  }, [bgEditMode, bgState, setNodes]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: SaveFloorLayoutRequest) => floorLayoutService.saveLayout(floorId!, payload),
    onSuccess: () => {
      toast.success('Kat planı kaydedildi.');
      queryClient.invalidateQueries({ queryKey: ['floorDetail', floorId] });
      queryClient.invalidateQueries({ queryKey: ['floorClassrooms', floorId] });
    },
    onError: (err: AxiosError<{ message: string }>) =>
      toast.error(err.response?.data?.message ?? 'Kaydetme sırasında hata oluştu.'),
  });

  const handleSave = useCallback(() => {
    const viewport: Viewport = reactFlow.getViewport();

    // Extract bg node's current position/size from canvas state
    const bgNode = nodes.find((n) => n.id === BG_NODE_ID);
    const currentBg = bgState ? {
      ...bgState,
      x:      bgNode?.position.x  ?? bgState.x,
      y:      bgNode?.position.y  ?? bgState.y,
      width:  bgNode?.width ?? (typeof bgNode?.style?.width === 'number' ? bgNode.style.width : (bgState.width ?? 800)),
      height: bgNode?.height ?? (typeof bgNode?.style?.height === 'number' ? bgNode.style.height : (bgState.height ?? 600)),
    } : null;

    const objects: SpaceObjectRequest[] = nodes
      .filter((n) => n.id !== BG_NODE_ID)
      .map((n) => {
        const d = n.data as Record<string, unknown>;
        return {
          id:        n.id,
          classroomId: d['classroomId'] as string | undefined,
          type:      (d['type']   as SpaceObjectType)   ?? 'CLASSROOM',
          status:    (d['status'] as SpaceObjectStatus) ?? 'EMPTY',
          label:     (d['label']  as string)            ?? '',
          code:      d['code']     as string | undefined,
          capacity:  d['capacity'] as number | undefined,
          positionX: n.position.x,
          positionY: n.position.y,
          width:     getNodeDimension(n, 'width', 160),
          height:    getNodeDimension(n, 'height', 100),
          rotation:  (d['rotation'] as number | undefined) ?? 0,
          slotRow:   d['slotRow'] as number | undefined,
          slotColumn: d['slotColumn'] as number | undefined,
          metadataJson: buildSpaceMetadata(d),
        };
      });

    saveMutation.mutate({
      backgroundImageBase64: currentBg?.base64,
      backgroundImageType:   currentBg?.type,
      backgroundX:      currentBg?.x       ?? 0,
      backgroundY:      currentBg?.y       ?? 0,
      backgroundWidth:  currentBg?.width   ?? undefined,
      backgroundHeight: currentBg?.height  ?? undefined,
      backgroundOpacity: currentBg?.opacity ?? DEFAULT_OPACITY,
      backgroundLocked:  currentBg?.isLocked ?? true,
      viewportX:   viewport.x,
      viewportY:   viewport.y,
      viewportZoom: viewport.zoom,
      objects,
    });
  }, [nodes, bgState, reactFlow, saveMutation]);

  // ── Background management ──────────────────────────────────────────────────
  const handleBgUpload = useCallback((file: File) => {
    if (file.size === 0) {
      toast.error('Boş dosya yüklenemez.');
      return;
    }
    if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
      toast.error('Kat krokisi en fazla 5 MB olabilir.');
      return;
    }
    if (!ACCEPTED_BACKGROUND_TYPES.has(file.type) || !isAcceptedBackgroundExtension(file.name)) {
      toast.error('Kat krokisi için yalnızca PNG veya JPG/JPEG desteklenir.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.replace('data:', '').replace(';base64', '');
      if (!data || !ACCEPTED_BACKGROUND_TYPES.has(mimeType)) {
        toast.error('Kat krokisi geçerli bir PNG/JPG görseli değil.');
        return;
      }

      const image = new Image();
      image.onload = () => {
        const scale = image.naturalWidth > MAX_INITIAL_BACKGROUND_WIDTH
          ? MAX_INITIAL_BACKGROUND_WIDTH / image.naturalWidth
          : 1;
        const newBg: BackgroundImageState = {
          base64:   data,
          type:     mimeType,
          x:        bgState?.x ?? 0,
          y:        bgState?.y ?? 0,
          width:    Math.round(image.naturalWidth * scale),
          height:   Math.round(image.naturalHeight * scale),
          opacity:  bgState?.opacity  ?? DEFAULT_OPACITY,
          isLocked: false,
        };
        setBgState(newBg);
        setBgEditMode(true);
        setNodes((prev) => {
          const withoutOld = prev.filter((n) => n.id !== BG_NODE_ID);
          return [buildBgNode(newBg, true), ...withoutOld];
        });
      };
      image.onerror = () => toast.error('Kat krokisi görseli okunamadı.');
      image.src = result;
    };
    reader.onerror = () => toast.error('Kat krokisi dosyası okunamadı.');
    reader.readAsDataURL(file);
  }, [bgState, setNodes]);

  const handleEmptyBgFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleBgUpload(file);
    e.target.value = '';
  }, [handleBgUpload]);

  const handleBgRemove = useCallback(() => {
    setBgState(null);
    setNodes((prev) => prev.filter((n) => n.id !== BG_NODE_ID));
    setBgEditMode(false);
  }, [setNodes]);

  const handleBgToggleLock = useCallback(() => {
    setBgState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, isLocked: !prev.isLocked };
      setNodes((nds) => nds.map((n) =>
        n.id === BG_NODE_ID
          ? {
              ...n,
              draggable: bgEditMode && !next.isLocked,
              selectable: bgEditMode,
              selected: bgEditMode && !next.isLocked,
              data: { ...n.data, isLocked: next.isLocked },
            }
          : n
      ));
      return next;
    });
  }, [bgEditMode, setNodes]);

  const handleBgOpacity = useCallback((opacity: number) => {
    const nextOpacity = Math.min(1, Math.max(0.1, opacity));
    setBgState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, opacity: nextOpacity };
      setNodes((nds) => nds.map((n) =>
        n.id === BG_NODE_ID ? { ...n, data: { ...n.data, opacity: nextOpacity } } : n
      ));
      return next;
    });
  }, [setNodes]);

  const toggleBgEditMode = useCallback(() => {
    if (!bgState) return;
    setBgEditMode((v) => {
      const next = !v;
      setNodes((nds) => nds.map((n) =>
        n.id === BG_NODE_ID
          ? {
              ...n,
              draggable: next && !bgState.isLocked,
              selectable: next,
              selected: next && !bgState.isLocked,
              style: { ...n.style, zIndex: next ? 0 : BG_NODE_ZINDEX },
              data: { ...n.data, bgEditMode: next },
            }
          : n
      ));
      return next;
    });
  }, [bgState, setNodes]);

  // ── Drag & drop from palette ───────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isViewMode) return;
    const type = e.dataTransfer.getData('application/dts-space-type') as SpaceObjectType;
    if (!type) return;
    const position = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const palette  = PALETTE_ITEM_MAP[type];
    const drop     = { type, position, width: palette?.defaultWidth ?? 160, height: palette?.defaultHeight ?? 100 };

    if (!needsAddForm(type)) {
      addNode({ label: palette?.label ?? type }, drop);
    } else {
      setPendingDrop(drop);
    }
  }, [isViewMode, reactFlow]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNode = useCallback((
    values: { classroomId?: string; label: string; code?: string; capacity?: number },
    drop:   typeof pendingDrop
  ) => {
    if (!drop) return;
    const id = crypto.randomUUID();
    const newNode: Node = {
      id, type: 'spaceNode',
      position: drop.position,
      width:    drop.width,
      height:   drop.height,
      style:    { width: drop.width, height: drop.height },
      data: {
        isLocked: false,
        isHidden: false,
        classroomId: values.classroomId,
        type: drop.type,
        status: 'EMPTY',
        label: values.label,
        code: values.code,
        capacity: values.capacity,
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setPendingDrop(null);
  }, [setNodes]);

  // ── Selection handlers ────────────────────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (node.id === BG_NODE_ID) return;  // don't show property panel for bg
    setSelectedNodeId(node.id);
    setCtxMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setCtxMenu(null);
  }, []);

  const onSelectionChange = useCallback(({ nodes: sel }: OnSelectionChangeParams) => {
    const ids = sel.filter((n) => n.id !== BG_NODE_ID).map((n) => n.id);
    setSelectedNodeIds(ids);
    if (ids.length === 1) setSelectedNodeId(ids[0]);
    else if (ids.length === 0) setSelectedNodeId(null);
  }, []);

  // ── Context menu ──────────────────────────────────────────────────────────
  const onNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault();
    if (node.id === BG_NODE_ID) return;
    if (!selectedNodeIds.includes(node.id)) {
      setSelectedNodeId(node.id);
      setSelectedNodeIds([node.id]);
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
  }, [selectedNodeIds]);

  const ctxNode = useMemo(
    () => nodes.find((n) => n.id === ctxMenu?.nodeId) ?? null,
    [nodes, ctxMenu]
  );

  const handleCtxCopy = useCallback(() => {
    if (ctxNode) { setClipboard(ctxNode); toast.success('Kopyalandı'); }
  }, [ctxNode]);

  const handleCtxDuplicate = useCallback(() => {
    if (!ctxNode) return;
    if (ctxNode.data['classroomId']) {
      toast.error('Classroom bağlantılı nesne çoğaltılamaz. Aynı derslik ikinci kez yerleştirilemez.');
      return;
    }
    const id = crypto.randomUUID();
    setNodes((prev) => [...prev, {
      ...ctxNode,
      id,
      selected: false,
      position: { x: ctxNode.position.x + DUPLICATE_OFFSET, y: ctxNode.position.y + DUPLICATE_OFFSET },
    }]);
    setSelectedNodeId(id);
  }, [ctxNode, setNodes]);

  const handleCtxDelete = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    setSelectedNodeIds((prev) => prev.filter((nodeId) => nodeId !== id));
  }, [selectedNodeId, setNodes]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeIds.length > 1) {
      const ok = window.confirm(
        `${selectedNodeIds.length} alanı kat planından kaldırmak istediğinize emin misiniz?\n\nFiziksel alan kayıtları silinmeyecek, yalnızca kat planındaki yerleşimleri kaldırılacak.`
      );
      if (!ok) return;
      setNodes((prev) => prev.filter((n) => !selectedNodeIds.includes(n.id) || n.id === BG_NODE_ID));
      setSelectedNodeIds([]);
      setSelectedNodeId(null);
    } else if (selectedNodeId) {
      handleCtxDelete(selectedNodeId);
    }
  }, [selectedNodeIds, selectedNodeId, handleCtxDelete, setNodes]);

  const handleCtxToggleLock = useCallback(() => {
    if (!ctxMenu?.nodeId) return;
    setNodes((prev) => prev.map((n) => {
      if (n.id !== ctxMenu.nodeId) return n;
      const locked = !(n.data['isLocked'] as boolean);
      return { ...n, draggable: !locked, data: { ...n.data, isLocked: locked } };
    }));
  }, [ctxMenu, setNodes]);

  const handleCtxToggleHide = useCallback(() => {
    if (!ctxMenu?.nodeId) return;
    setNodes((prev) => prev.map((n) => {
      if (n.id !== ctxMenu.nodeId) return n;
      const hidden = !(n.data['isHidden'] as boolean);
      return { ...n, hidden, data: { ...n.data, isHidden: hidden } };
    }));
  }, [ctxMenu, setNodes]);

  const handleCtxBringFront = useCallback(() => {
    if (!ctxMenu?.nodeId) return;
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === ctxMenu.nodeId);
      if (idx < 0) return prev;
      const arr = [...prev];
      const [node] = arr.splice(idx, 1);
      arr.push(node);
      return arr;
    });
  }, [ctxMenu, setNodes]);

  const handleCtxSendBack = useCallback(() => {
    if (!ctxMenu?.nodeId) return;
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === ctxMenu.nodeId);
      if (idx < 0) return prev;
      const arr = [...prev];
      const [node] = arr.splice(idx, 1);
      // Insert just after the background node
      const bgIdx = arr.findIndex((n) => n.id === BG_NODE_ID);
      arr.splice(bgIdx + 1, 0, node);
      return arr;
    });
  }, [ctxMenu, setNodes]);

  // ── Node data update (PropertiesPanel) ────────────────────────────────────
  const handleNodeDataUpdate = useCallback((id: string, newData: Record<string, unknown>) => {
    setNodes((prev) => prev.map((n) => n.id === id ? {
      ...n,
      draggable: newData['isLocked'] !== true,
      hidden: newData['isHidden'] === true,
      data: newData,
    } : n));
  }, [setNodes]);

  const handleNodeGeometryUpdate = useCallback((id: string, patch: {
    position?: { x?: number; y?: number };
    size?: { width?: number; height?: number };
  }) => {
    setNodes((prev) => prev.map((n) => {
      if (n.id !== id || n.data['isLocked'] === true) return n;
      return {
        ...n,
        width: Number.isFinite(patch.size?.width) ? Math.max(60, patch.size!.width!) : n.width,
        height: Number.isFinite(patch.size?.height) ? Math.max(50, patch.size!.height!) : n.height,
        position: {
          x: Number.isFinite(patch.position?.x) ? patch.position!.x! : n.position.x,
          y: Number.isFinite(patch.position?.y) ? patch.position!.y! : n.position.y,
        },
        style: {
          ...n.style,
          width: Number.isFinite(patch.size?.width) ? Math.max(60, patch.size!.width!) : n.style?.width,
          height: Number.isFinite(patch.size?.height) ? Math.max(50, patch.size!.height!) : n.style?.height,
        },
      };
    }));
  }, [setNodes]);

  // ── Layer panel helpers ───────────────────────────────────────────────────
  const handleFocusNode = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    setSelectedNodeId(id);
    reactFlow.setCenter(node.position.x + 80, node.position.y + 50, { zoom: 1.3, duration: 450 });
  }, [nodes, reactFlow]);

  const handleToggleHide = useCallback((id: string) => {
    setNodes((prev) => prev.map((n) => {
      if (n.id !== id) return n;
      const hidden = !(n.data['isHidden'] as boolean);
      return { ...n, hidden, data: { ...n.data, isHidden: hidden } };
    }));
  }, [setNodes]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const focused = document.activeElement;
      if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement || focused instanceof HTMLSelectElement) return;
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Delete') { e.preventDefault(); handleDeleteSelected(); return; }
      if (!ctrl) return;

      switch (e.key) {
        case 'c': {
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node) { setClipboard(node); toast.success('Kopyalandı'); }
          break;
        }
        case 'v': {
          if (!clipboard) return;
          if (clipboard.data['classroomId']) {
            toast.error('Classroom bağlantılı nesne kopyalanamaz. Aynı derslik ikinci kez yerleştirilemez.');
            return;
          }
          const id = crypto.randomUUID();
          setNodes((prev) => [...prev, {
            ...clipboard, id, selected: false,
            position: { x: clipboard.position.x + DUPLICATE_OFFSET, y: clipboard.position.y + DUPLICATE_OFFSET },
          }]);
          setSelectedNodeId(id);
          break;
        }
        case 'd': {
          e.preventDefault();
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (!node) break;
          if (node.data['classroomId']) {
            toast.error('Classroom bağlantılı nesne çoğaltılamaz. Aynı derslik ikinci kez yerleştirilemez.');
            break;
          }
          const id = crypto.randomUUID();
          setNodes((prev) => [...prev, {
            ...node, id, selected: false,
            position: { x: node.position.x + DUPLICATE_OFFSET, y: node.position.y + DUPLICATE_OFFSET },
          }]);
          setSelectedNodeId(id);
          break;
        }
        case 's': { e.preventDefault(); handleSave(); break; }
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedNodeId, nodes, clipboard, handleSave, handleDeleteSelected, setNodes]);

  // ── Selected node (for property panel) ───────────────────────────────────
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId && n.id !== BG_NODE_ID) ?? null,
    [nodes, selectedNodeId]
  );

  // Visible (non-background) nodes for layer panel
  const spaceNodes = useMemo(() => nodes.filter((n) => n.id !== BG_NODE_ID), [nodes]);

  const placedClassroomIds = useMemo(
    () => spaceNodes
      .map((n) => n.data['classroomId'])
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
    [spaceNodes]
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading && !floor) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#006482] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Kat planı yükleniyor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-[#eff8ff]/40 via-white to-white px-4 py-2.5 shadow-xs z-10 flex-shrink-0">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#004b62] via-[#006482] to-[#fabc07]" />

        {/* Back */}
        <button
          onClick={() => navigate(`/super-admin/binalar/${floor?.buildingId}`)}
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-800 transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Geri
        </button>
        <div className="h-4 w-px bg-slate-200" />

        {/* Floor info */}
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 leading-tight">{floor?.name}</span>
          <span className="text-[9px] text-slate-400 leading-none">{floor?.buildingName} · {floor?.facultyName}</span>
        </div>

        <div className="flex-1" />

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5">
          {([
            { mode: 'edit' as EditorMode, icon: <Pencil className="h-3 w-3" />, label: 'Düzenle' },
            { mode: 'view' as EditorMode, icon: <Eye    className="h-3 w-3" />, label: 'Görünüm' },
          ] as const).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => { setEditorMode(mode); if (mode === 'view') setBgEditMode(false); }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-bold transition-all ${
                editorMode === mode
                  ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Grid + Snap */}
        <button
          onClick={() => setShowGrid((v) => !v)}
          title="Grid Göster/Gizle"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${showGrid ? 'border-[#006482] bg-[#eff8ff] text-[#006482]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setSnapToGrid((v) => !v)}
          title="Snap to Grid"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${snapToGrid ? 'border-[#006482] bg-[#eff8ff] text-[#006482]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
        </button>

        {/* BG edit mode toggle (only when bg exists and in edit mode) */}
        {bgState && !isViewMode && (
          <button
            onClick={toggleBgEditMode}
            title="Arka Planı Düzenle"
            className={`flex items-center gap-1 h-7 rounded-lg border px-2.5 text-[9px] font-bold transition-all ${
              bgEditMode
                ? 'border-amber-400 bg-amber-50 text-amber-600'
                : 'border-slate-200 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <FrameIcon className="h-3 w-3" />
            <span className="hidden sm:inline">{bgEditMode ? 'Plan Düzeniyor' : 'Planı Düzenle'}</span>
          </button>
        )}

        {/* Help / Keyboard shortcuts tooltip */}
        <div className="relative">
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all"
            title="Klavye Kısayolları"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
          {showShortcuts && (
            <div className="absolute right-0 top-9 z-50 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Klavye Kısayolları</p>
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">{desc}</span>
                  <kbd className="text-[8px] font-mono bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">{key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <PrimaryButton onClick={handleSave} loading={saveMutation.isPending} icon={<Save className="h-3.5 w-3.5" />}>
          Kaydet
        </PrimaryButton>
      </div>

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Palette + Layers */}
        <ObjectPalette
          nodes={spaceNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => { setSelectedNodeId(id); handleFocusNode(id); }}
          onFocusNode={handleFocusNode}
          onToggleHide={handleToggleHide}
          onDeleteNode={handleCtxDelete}
        />

        {/* Center: Canvas */}
        <div ref={wrapperRef} className="flex-1 relative overflow-hidden">
          <input
            ref={emptyBgInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleEmptyBgFileChange}
            className="hidden"
          />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onSelectionChange={onSelectionChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            snapToGrid={snapToGrid}
            snapGrid={[GRID_SIZE, GRID_SIZE]}
            nodesDraggable={!isViewMode}
            nodesConnectable={false}
            elementsSelectable={!isViewMode}
            selectionMode={SelectionMode.Partial}
            multiSelectionKeyCode="Shift"
            selectionKeyCode={null}   // allow box select without holding key
            fitView
            deleteKeyCode={null}
            proOptions={{ hideAttribution: true }}
          >
            {showGrid && <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} size={1} color="#d1d5db" />}
            <Controls showInteractive={false} />
            <MiniMap
              nodeStrokeWidth={2}
              pannable zoomable
              nodeColor={(n) => n.id === BG_NODE_ID ? '#f8fafc' : '#006482'}
              style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
            />
          </ReactFlow>

          {!bgState && !isViewMode && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/90 p-6 text-center shadow-sm backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#88d0f2]/40 bg-[#eff8ff] text-[#006482]">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Kat krokisi yüklenmedi</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Bu katın şu anda bir kroki görseli bulunmuyor.
                  </p>
                </div>
                <button
                  onClick={() => emptyBgInputRef.current?.click()}
                  className="rounded-xl bg-[#006482] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#00516a]"
                >
                  Kat Krokisi Yükle
                </button>
                <p className="text-[10px] font-medium text-slate-400">PNG veya JPG/JPEG, en fazla 5 MB</p>
              </div>
            </div>
          )}

          {/* View-mode overlay badge */}
          {isViewMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-white shadow-lg pointer-events-none">
              <Eye className="h-3 w-3" />
              Görünüm Modu – Düzenleme devre dışı
            </div>
          )}

          {/* BG edit mode indicator */}
          {bgEditMode && !isViewMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-white shadow-lg pointer-events-none">
              <FrameIcon className="h-3 w-3" />
              Arka Plan Düzenleme Modu
              {bgState?.isLocked && <span className="opacity-75">· Kilitli</span>}
            </div>
          )}

          {/* Multi-selection count badge */}
          {selectedNodeIds.length > 1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-[#006482]/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold text-white shadow-lg pointer-events-none">
              {selectedNodeIds.length} nesne seçildi · Del → Sil · Ctrl+D → Çoğalt
            </div>
          )}
        </div>

        {/* Right: Properties + Background tabs */}
        <aside className="hidden lg:flex flex-col w-64 border-l border-slate-200 bg-white flex-shrink-0">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100 flex-shrink-0">
            {([
              { key: 'properties' as const, icon: <Settings2 className="h-3 w-3" />, label: 'Özellikler' },
              { key: 'background'  as const, icon: <ImageIcon  className="h-3 w-3" />, label: 'Arka Plan' },
            ]).map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setRightPanelTab(key)}
                className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  rightPanelTab === key
                    ? 'text-[#006482] border-b-2 border-[#006482] bg-[#eff8ff]/40'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {rightPanelTab === 'properties' ? (
            <PropertiesPanel
              key={selectedNode?.id ?? selectedNodeIds.join(',')}
              selectedNode={selectedNode}
              selectedCount={selectedNodeIds.length}
              onUpdate={handleNodeDataUpdate}
              onGeometryUpdate={handleNodeGeometryUpdate}
            />
          ) : (
            <div className="p-3 overflow-y-auto flex-1 space-y-4">
              {/* BG edit mode toggle inside panel */}
              {bgState && !isViewMode && (
                <div className="space-y-2">
                  <button
                    onClick={toggleBgEditMode}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                      bgEditMode
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FrameIcon className="h-3.5 w-3.5" />
                    {bgEditMode ? '✓ Düzenleme Modu Aktif' : 'Arka Planı Düzenle'}
                  </button>
                  {bgEditMode && bgState && (
                    <button
                      onClick={handleBgToggleLock}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        bgState.isLocked
                          ? 'border-slate-300 bg-slate-50 text-slate-600'
                          : 'border-[#006482] bg-[#eff8ff] text-[#006482]'
                      }`}
                    >
                      {bgState.isLocked
                        ? <><Lock className="h-3.5 w-3.5" /> Kilidi Kaldır</>
                        : <><Unlock className="h-3.5 w-3.5" /> Kilitle</>
                      }
                    </button>
                  )}
                </div>
              )}
              <BackgroundPanel
                bgState={bgState}
                onUpload={handleBgUpload}
                onRemove={handleBgRemove}
                onToggleLock={handleBgToggleLock}
                onOpacityChange={handleBgOpacity}
              />
            </div>
          )}
        </aside>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1 bg-white border-t border-slate-100 flex-shrink-0">
        <span className="text-[9px] text-slate-400">
          {spaceNodes.length} nesne · {isViewMode ? 'Görünüm Modu' : 'Düzenleme Modu'}
        </span>
        <span className="text-[9px] text-slate-300 font-mono">
          Shift+sürükle → çoklu seçim
        </span>
      </div>

      {/* ── Modals & overlays ─────────────────────────────────────────────── */}
      {pendingDrop && (
        <AddNodeModal
          pending={pendingDrop}
          classrooms={classrooms}
          placedClassroomIds={placedClassroomIds}
          onConfirm={(values) => addNode(values, pendingDrop)}
          onCancel={() => setPendingDrop(null)}
        />
      )}

      {ctxMenu && ctxNode && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          nodeId={ctxMenu.nodeId}
          isLocked={(ctxNode.data['isLocked'] as boolean) ?? false}
          isHidden={(ctxNode.data['isHidden'] as boolean) ?? false}
          isClassroomLinked={typeof ctxNode.data['classroomId'] === 'string'}
          selectedCount={selectedNodeIds.includes(ctxMenu.nodeId) ? Math.max(selectedNodeIds.length, 1) : 1}
          onEdit={() => { setSelectedNodeId(ctxMenu.nodeId); setRightPanelTab('properties'); }}
          onCopy={handleCtxCopy}
          onDuplicate={handleCtxDuplicate}
          onDelete={() => selectedNodeIds.includes(ctxMenu.nodeId) && selectedNodeIds.length > 1
            ? handleDeleteSelected()
            : handleCtxDelete(ctxMenu.nodeId)}
          onBringFront={handleCtxBringFront}
          onSendBack={handleCtxSendBack}
          onToggleLock={handleCtxToggleLock}
          onToggleHide={handleCtxToggleHide}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* Dismiss shortcut panel on outside click */}
      {showShortcuts && (
        <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};

// ─── Exported page ────────────────────────────────────────────────────────────
const FloorPlanEditorPage = () => (
  <ReactFlowProvider>
    <EditorInner />
  </ReactFlowProvider>
);

export const FloorEditorPage = () => {
  const { id: floorId } = useParams<{ id: string }>();

  const { data: floor, isLoading, isError } = useQuery({
    queryKey: ['floorDetail', floorId],
    queryFn:  () => floorLayoutService.getFloorDetail(floorId!),
    enabled:  !!floorId,
  });

  if (isLoading && !floor) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#006482] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Kat editörü yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isError || !floor) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Kat bilgisi yüklenemedi.</p>
        </div>
      </div>
    );
  }

  if (floor.planMode === 'SLOT_LAYOUT') {
    return <SlotLayoutEditor floor={floor} />;
  }

  return <FloorPlanEditorPage />;
};
