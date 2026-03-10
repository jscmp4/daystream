/**
 * 文件导入采集器
 *
 * 处理用户拖拽上传的文件（音频、图片、视频），
 * 提取时间元数据，存入 DayStream。
 */

import { insertRecord, RecordInput } from '../storage';
import { statSync, mkdirSync, copyFileSync } from 'fs';
import { join, extname } from 'path';
import { v4 as uuid } from 'uuid';

const RAW_FILES_PATH = process.env.RAW_FILES_PATH || './data/raw';

/** 从文件名或文件修改时间推断时间戳 */
function extractTimestamp(filePath: string, originalName: string): string {
  // 先尝试从文件名中提取日期（常见格式: IMG_20260310_143000, 2026-03-10_14-30）
  const datePatterns = [
    /(\d{4})(\d{2})(\d{2})[_-](\d{2})(\d{2})(\d{2})/,    // 20260310_143000
    /(\d{4})-(\d{2})-(\d{2})[_T](\d{2})-(\d{2})-(\d{2})/, // 2026-03-10_14-30-00
    /(\d{4})-(\d{2})-(\d{2})/,                              // 2026-03-10
  ];

  for (const pattern of datePatterns) {
    const match = originalName.match(pattern);
    if (match) {
      const [, y, m, d, h = '00', min = '00', s = '00'] = match;
      return `${y}-${m}-${d}T${h}:${min}:${s}`;
    }
  }

  // 兜底：用文件的修改时间
  try {
    const stat = statSync(filePath);
    return stat.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/** 根据文件扩展名判断媒体类型 */
function getMediaType(filename: string): string | null {
  const ext = extname(filename).toLowerCase();
  const audioExts = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'];
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

  if (audioExts.includes(ext)) return 'audio';
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return null;
}

/** 把上传的文件移到 data/raw/YYYY/MM/DD/ 目录下 */
function storeRawFile(tempPath: string, originalName: string, timestamp: string): string {
  const date = timestamp.slice(0, 10); // "2026-03-10"
  const [year, month, day] = date.split('-');
  const dir = join(RAW_FILES_PATH, year, month, day);

  mkdirSync(dir, { recursive: true });

  const ext = extname(originalName);
  const storedName = `${uuid()}${ext}`;
  const destPath = join(dir, storedName);

  copyFileSync(tempPath, destPath);
  return destPath;
}

/** 处理一个上传的文件，返回创建的 Record */
export function importFile(tempPath: string, originalName: string): RecordInput {
  const timestamp = extractTimestamp(tempPath, originalName);
  const mediaType = getMediaType(originalName);
  const storedPath = storeRawFile(tempPath, originalName, timestamp);

  return {
    timestamp,
    source_type: `upload_${mediaType || 'file'}`,
    content: `[已上传文件] ${originalName}`,  // 后续可以用 AI 转录/描述来更新
    media_type: mediaType,
    raw_file_path: storedPath,
    metadata: {
      original_name: originalName,
      needs_processing: true,  // 标记：还需要 AI 处理（转录/描述）
    },
  };
}
