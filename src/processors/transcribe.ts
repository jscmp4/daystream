/**
 * 语音转录 Processor
 *
 * 把音频/视频文件发送给本地转录服务（localhost:8080），
 * 用返回的转录文本更新对应 Record。
 */

import { createReadStream } from 'fs';
import { basename } from 'path';
import { getRecordById, updateRecord } from '../storage';

const TRANSCRIBE_URL = process.env.TRANSCRIBE_URL || 'http://localhost:8080/api/transcribe';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface TranscribeResponse {
  success: boolean;
  formatted_text: string;
  full_text: string;
  segments: { speaker: string; text: string; start: number; end: number }[];
  duration_seconds: number;
}

/**
 * 对指定 Record 的原始文件进行语音转录，并更新 Record。
 * @param recordId Record 的 id
 * @param rawFilePath 原始文件路径
 */
export async function transcribeRecord(recordId: string, rawFilePath: string): Promise<void> {
  const record = getRecordById(recordId);
  if (!record) {
    throw new Error(`Record not found: ${recordId}`);
  }

  // 构建 multipart/form-data
  const fileStream = createReadStream(rawFilePath);
  const formData = new FormData();
  const { Blob } = await import('buffer');

  // 读取文件内容为 buffer
  const chunks: Buffer[] = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk as Buffer);
  }
  const fileBuffer = Buffer.concat(chunks);
  const blob = new Blob([fileBuffer]);
  formData.append('file', blob, basename(rawFilePath));

  const response = await fetch(TRANSCRIBE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`转录服务返回错误 ${response.status}: ${text}`);
  }

  const result = (await response.json()) as TranscribeResponse;

  if (!result.success) {
    throw new Error('转录服务返回 success=false');
  }

  // 用转录结果更新 Record
  updateRecord(recordId, {
    content: result.formatted_text,
    metadata: {
      segments: result.segments,
      duration_seconds: result.duration_seconds,
      full_text: result.full_text,
      transcribed: true,
    },
  });
}
