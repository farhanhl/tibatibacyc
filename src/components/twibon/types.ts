export interface TwibbonTemplate {
  id: string;
  name: string;
  filename: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  description?: string;
  badge?: string;
}

export interface TwibbonEditorState {
  scale: number;
  position: { x: number; y: number };
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  bgColor: string;
  showGuide: boolean;
}

