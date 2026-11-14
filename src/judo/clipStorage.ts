export interface StudyClipRecord {
  id: string;
  techniqueId: string;
  techniqueName: string;
  techniqueKanji: string;
  speed: number;
  cameraLabel: string;
  guidesEnabled: boolean;
  durationSec: number;
  createdAt: number;
  thumbnailDataUrl: string;
  mimeType: string;
  videoBlob?: Blob;
  fallbackFrames?: string[];
}

const DB_NAME = 'alido_study_clips_db';
const DB_VERSION = 1;
const STORE_NAME = 'clips';

const memoryFallback: StudyClipRecord[] = [];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function saveStudyClip(clip: StudyClipRecord): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(clip);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save clip'));
    });
    db.close();
  } catch {
    const idx = memoryFallback.findIndex((c) => c.id === clip.id);
    if (idx >= 0) memoryFallback[idx] = clip;
    else memoryFallback.unshift(clip);
  }
}

export async function listStudyClips(): Promise<StudyClipRecord[]> {
  try {
    const db = await openDb();
    const items = await new Promise<StudyClipRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve((req.result as StudyClipRecord[]) || []);
      req.onerror = () => reject(req.error ?? new Error('Failed to load clips'));
    });
    db.close();
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [...memoryFallback].sort((a, b) => b.createdAt - a.createdAt);
  }
}

export async function deleteStudyClip(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete clip'));
    });
    db.close();
  } catch {
    const idx = memoryFallback.findIndex((c) => c.id === id);
    if (idx >= 0) memoryFallback.splice(idx, 1);
  }
}

export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export function triggerClipFileDownload(clip: StudyClipRecord): boolean {
  if (!clip.videoBlob) return false;
  const ext = clip.mimeType.includes('mp4') ? 'mp4' : 'webm';
  const safeName = clip.techniqueId.replace(/[^a-z0-9-_]/gi, '-');
  const speedTag = `${clip.speed}x`.replace('.', '_');
  const filename = `alido-${safeName}-${speedTag}.${ext}`;

  const url = URL.createObjectURL(clip.videoBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
