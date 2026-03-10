import { getDb } from './database';
import { v4 as uuid } from 'uuid';

// ===== 类型定义 =====

export interface Record {
  id: string;
  timestamp: string;
  source_type: string;
  content: string;
  media_type?: string | null;
  raw_file_path?: string | null;
  metadata: object;
  session_id?: string | null;
  created_at: string;
}

export interface RecordInput {
  timestamp: string;
  source_type: string;
  content: string;
  media_type?: string | null;
  raw_file_path?: string | null;
  metadata?: object;
  session_id?: string | null;
}

// ===== 记录操作 =====

/** 插入一条新记录 */
export function insertRecord(input: RecordInput): Record {
  const db = getDb();
  const id = uuid();
  const metadata = JSON.stringify(input.metadata || {});

  db.prepare(`
    INSERT INTO records (id, timestamp, source_type, content, media_type, raw_file_path, metadata, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.timestamp,
    input.source_type,
    input.content,
    input.media_type || null,
    input.raw_file_path || null,
    metadata,
    input.session_id || null
  );

  return getRecordById(id)!;
}

/** 按 ID 查询 */
export function getRecordById(id: string): Record | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM records WHERE id = ?').get(id) as any;
  return row ? { ...row, metadata: JSON.parse(row.metadata) } : null;
}

/** 按时间范围查询（日历视图的核心查询） */
export function getRecordsByDateRange(startDate: string, endDate: string): Record[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM records
    WHERE timestamp >= ? AND timestamp < ?
    ORDER BY timestamp ASC
  `).all(startDate, endDate) as any[];

  return rows.map(row => ({ ...row, metadata: JSON.parse(row.metadata) }));
}

/** 按天查询（日历上点击某一天） */
export function getRecordsByDate(date: string): Record[] {
  // date 格式: "2026-03-10"
  return getRecordsByDateRange(`${date}T00:00:00`, `${date}T23:59:59`);
}

/** 全文搜索 */
export function searchRecords(query: string, limit: number = 50): Record[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT records.* FROM records
    JOIN records_fts ON records.rowid = records_fts.rowid
    WHERE records_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit) as any[];

  return rows.map(row => ({ ...row, metadata: JSON.parse(row.metadata) }));
}

/** 获取有记录的日期列表（日历上标记哪些天有数据） */
export function getDatesWithRecords(yearMonth: string): string[] {
  const db = getDb();
  // yearMonth 格式: "2026-03"
  const rows = db.prepare(`
    SELECT DISTINCT substr(timestamp, 1, 10) as date
    FROM records
    WHERE timestamp LIKE ?
    ORDER BY date
  `).all(`${yearMonth}%`) as any[];

  return rows.map(row => row.date);
}

/** 获取最近的记录 */
export function getRecentRecords(limit: number = 20): Record[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM records ORDER BY timestamp DESC LIMIT ?
  `).all(limit) as any[];

  return rows.map(row => ({ ...row, metadata: JSON.parse(row.metadata) }));
}
