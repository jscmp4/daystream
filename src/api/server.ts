import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initDb } from '../storage/database';
import {
  getRecordsByDate,
  getRecordsByDateRange,
  getRecentRecords,
  getDatesWithRecords,
  searchRecords,
  insertRecord,
} from '../storage';
import { importFile } from '../collectors/file-import';
import { transcribeRecord } from '../processors/transcribe';
import { syncFromScreenpipe, checkScreenpipeHealth } from '../collectors/screenpipe';

const app = express();
const upload = multer({ dest: 'data/uploads/' });
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

// ===== 健康检查 =====

app.get('/api/health', async (_req, res) => {
  const screenpipeOk = await checkScreenpipeHealth();
  res.json({
    status: 'ok',
    screenpipe: screenpipeOk ? 'connected' : 'disconnected',
  });
});

// ===== 记录查询 =====

/** 获取某一天的所有记录 */
app.get('/api/records/date/:date', (req, res) => {
  // GET /api/records/date/2026-03-10
  const records = getRecordsByDate(req.params.date);
  res.json({ data: records, count: records.length });
});

/** 获取时间范围内的记录 */
app.get('/api/records', (req, res) => {
  const { start, end, limit } = req.query;

  if (start && end) {
    const records = getRecordsByDateRange(start as string, end as string);
    res.json({ data: records, count: records.length });
  } else {
    const records = getRecentRecords(Number(limit) || 20);
    res.json({ data: records, count: records.length });
  }
});

/** 全文搜索 */
app.get('/api/search', (req, res) => {
  const { q, limit } = req.query;
  if (!q) {
    return res.status(400).json({ error: '需要提供搜索关键词 q' });
  }
  const records = searchRecords(q as string, Number(limit) || 50);
  res.json({ data: records, count: records.length });
});

/** 获取某月中有记录的日期（日历上标点用） */
app.get('/api/calendar/:yearMonth', (req, res) => {
  // GET /api/calendar/2026-03
  const dates = getDatesWithRecords(req.params.yearMonth);
  res.json({ dates });
});

// ===== 文件上传（拖拽） =====

app.post('/api/upload', upload.array('files'), (req, res) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: '没有收到文件' });
  }

  const results = files.map(file => {
    const recordInput = importFile(file.path, file.originalname);
    const record = insertRecord(recordInput);
    return record;
  });

  // 对音频/视频文件异步触发转录
  for (const record of results) {
    if (record.media_type === 'audio' || record.media_type === 'video') {
      if (record.raw_file_path) {
        transcribeRecord(record.id, record.raw_file_path).catch(err => {
          console.error(`转录失败 [${record.id}]:`, err.message);
        });
      }
    }
  }

  res.json({ imported: results.length, records: results });
});

// ===== screenpipe 同步 =====

app.post('/api/sync/screenpipe', async (_req, res) => {
  try {
    const count = await syncFromScreenpipe(100);
    res.json({ imported: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ===== 启动 =====

initDb();
app.listen(PORT, () => {
  console.log(`\n🌊 DayStream 已启动`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   健康检查: http://localhost:${PORT}/api/health\n`);
});
