// Re-export types from api.ts for backward compatibility
export type { SegmentMask, SegmentedObject, CompositionData } from '@/types/api';

export interface CompositionRequest {
  prompt: string;
  objects: SegmentedObject[];
  targetPosition?: { x: number; y: number };
  canvasSize: { width: number; height: number };
}

// Import the actual types
import type { SegmentedObject } from '@/types/api';