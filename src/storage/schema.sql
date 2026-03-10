-- DayStream 数据库 Schema
-- 所有数据源的输出都存入 records 表，格式统一

-- 记录表：系统的核心
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,                          -- UUID
    timestamp TEXT NOT NULL,                       -- ISO 8601 时间戳
    source_type TEXT NOT NULL,                     -- 数据来源类型
    content TEXT NOT NULL DEFAULT '',              -- 文字内容
    media_type TEXT,                               -- 'audio' | 'image' | 'video' | null
    raw_file_path TEXT,                            -- 原始文件路径（可溯源）
    metadata TEXT NOT NULL DEFAULT '{}',           -- JSON 格式的额外信息
    session_id TEXT,                               -- 所属 session
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 按时间查询的索引（最常用）
CREATE INDEX IF NOT EXISTS idx_records_timestamp ON records(timestamp);
-- 按来源类型过滤
CREATE INDEX IF NOT EXISTS idx_records_source ON records(source_type);
-- 按 session 查询
CREATE INDEX IF NOT EXISTS idx_records_session ON records(session_id);

-- 全文搜索索引
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
    content,
    content='records',
    content_rowid='rowid'
);

-- 全文搜索同步触发器
CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
    INSERT INTO records_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON records BEGIN
    INSERT INTO records_fts(records_fts, rowid, content) VALUES('delete', old.rowid, old.content);
END;

CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON records BEGIN
    INSERT INTO records_fts(records_fts, rowid, content) VALUES('delete', old.rowid, old.content);
    INSERT INTO records_fts(rowid, content) VALUES (new.rowid, new.content);
END;

-- 事件/Session 表
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                          -- UUID
    start_time TEXT NOT NULL,
    end_time TEXT,
    summary TEXT,                                 -- LLM 生成的摘要
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_time ON sessions(start_time);
