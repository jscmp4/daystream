import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { mkdirSync } from 'fs';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || './data/daystream.db';

    // 确保 data 目录存在
    mkdirSync(join(dbPath, '..'), { recursive: true });

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();
  const schema = readFileSync(
    join(__dirname, 'schema.sql'),
    'utf-8'
  );
  database.exec(schema);
  console.log('✅ 数据库初始化完成');
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
