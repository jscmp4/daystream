/**
 * screenpipe 数据采集器
 *
 * 从 screenpipe 的 REST API 拉取屏幕和音频数据，
 * 转成 DayStream 的标准 Record 格式存入数据库。
 */

import { insertRecord, RecordInput } from '../storage';

const SCREENPIPE_URL = process.env.SCREENPIPE_API_URL || 'http://localhost:3030';

interface ScreenpipeSearchResult {
  data: Array<{
    type: 'OCR' | 'Audio';
    content: {
      text?: string;
      transcription?: string;
      timestamp: string;
      app_name?: string;
      window_name?: string;
      file_path?: string;
      [key: string]: any;
    };
  }>;
}

/** 检查 screenpipe 是否在运行 */
export async function checkScreenpipeHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${SCREENPIPE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/** 从 screenpipe 拉取最新数据并存入 DayStream */
export async function syncFromScreenpipe(limit: number = 50): Promise<number> {
  const res = await fetch(`${SCREENPIPE_URL}/search?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`screenpipe API 返回 ${res.status}`);
  }

  const result: ScreenpipeSearchResult = await res.json();
  let imported = 0;

  for (const item of result.data) {
    const record = screenpipeItemToRecord(item);
    if (record) {
      try {
        insertRecord(record);
        imported++;
      } catch (e: any) {
        // 忽略重复记录
        if (!e.message?.includes('UNIQUE constraint')) {
          console.error('导入失败:', e.message);
        }
      }
    }
  }

  return imported;
}

/** 把 screenpipe 的数据项转成 DayStream 的 Record 格式 */
function screenpipeItemToRecord(item: ScreenpipeSearchResult['data'][0]): RecordInput | null {
  const { type, content } = item;

  if (type === 'OCR') {
    return {
      timestamp: content.timestamp,
      source_type: 'screenpipe_ocr',
      content: content.text || '',
      media_type: 'image',
      metadata: {
        app_name: content.app_name,
        window_name: content.window_name,
      },
    };
  }

  if (type === 'Audio') {
    return {
      timestamp: content.timestamp,
      source_type: 'screenpipe_audio',
      content: content.transcription || '',
      media_type: 'audio',
      raw_file_path: content.file_path,
      metadata: {},
    };
  }

  return null;
}
