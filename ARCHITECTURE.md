# DayStream 架构文档

> **这个文件是给 AI 看的。** 每次你开一个新的 AI 对话窗口来写代码，把这个文件的内容贴给它，它就能理解你的项目。

## 一句话描述

DayStream 是一个个人生活时间轴应用，把各种来源（屏幕录制、录音、照片、手动输入）的数据统一到一条日历式时间线上。

## 核心概念

### Record（记录）

系统中的最小数据单位。所有数据源的输出都转成统一的 Record 格式：

```typescript
interface Record {
  id: string;                  // UUID
  timestamp: string;           // ISO 8601, 例如 "2026-03-10T14:30:00Z"
  source_type: string;         // "screenpipe_ocr" | "screenpipe_audio" | "upload_audio" | "upload_image" | "manual"
  content: string;             // 文字内容（转录文字、OCR 文字、笔记等）
  media_type?: string;         // "audio" | "image" | "video" | null
  raw_file_path?: string;      // 原始文件路径（如果有）
  metadata: object;            // 自由格式的额外信息（JSONB）
  session_id?: string;         // 所属事件/session（可选）
  created_at: string;          // 记录创建时间
}
```

### Session（事件）

多条 Record 可以归属同一个 Session，代表一个连续的活动或事件：

```typescript
interface Session {
  id: string;
  start_time: string;
  end_time: string;
  summary?: string;           // LLM 生成的摘要
  metadata: object;
}
```

## 数据流

```
[screenpipe API] ──→ Collector ──→ 标准化 Record ──→ SQLite 数据库
[用户拖拽文件]   ──→ Collector ──→ 标准化 Record ──→     ↓
[Omi 设备]      ──→ Collector ──→ 标准化 Record ──→  REST API
[手动输入]      ──→ Collector ──→ 标准化 Record ──→     ↓
                                                     前端日历 UI
```

## 目录结构

```
daystream/
├── src/
│   ├── collectors/          # 数据采集器
│   │   ├── screenpipe.ts    # 从 screenpipe API 拉取数据
│   │   ├── file-import.ts   # 处理拖拽上传的文件
│   │   └── index.ts
│   │
│   ├── processors/          # 数据处理
│   │   ├── audio.ts         # 音频转文字（调用 Whisper API 等）
│   │   ├── image.ts         # 图片描述（调用 VLM）
│   │   ├── metadata.ts      # 提取文件元数据（时间、GPS 等）
│   │   └── index.ts
│   │
│   ├── storage/             # 存储层
│   │   ├── database.ts      # SQLite 操作（better-sqlite3）
│   │   ├── files.ts         # 原始文件存储管理
│   │   ├── schema.sql       # 数据库建表语句
│   │   └── index.ts
│   │
│   ├── api/                 # REST API
│   │   ├── routes.ts        # API 路由定义
│   │   ├── server.ts        # Express 服务器
│   │   └── index.ts
│   │
│   └── ui/                  # 前端（React）
│       ├── components/
│       │   ├── Calendar.tsx      # 日历主视图
│       │   ├── DayView.tsx       # 单日详情
│       │   ├── DropZone.tsx      # 拖拽上传区域
│       │   ├── RecordCard.tsx    # 单条记录卡片
│       │   └── Timeline.tsx      # 时间线视图
│       ├── App.tsx
│       └── index.tsx
│
├── data/                    # 本地数据（不上传 GitHub）
│   ├── daystream.db         # SQLite 数据库
│   └── raw/                 # 原始上传文件
│       └── 2026/03/10/      # 按日期分文件夹
│
├── config/
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## 技术选型

| 层级 | 技术 | 原因 |
|------|------|------|
| 前端 | React + TypeScript | 生态成熟，AI 写代码方便 |
| 后端 | Node.js + Express | 跟前端同语言，简单直接 |
| 数据库 | SQLite (better-sqlite3) | 单文件，零配置，够用 |
| 文件存储 | 本地文件系统 | 简单，按日期分文件夹 |
| screenpipe 对接 | HTTP fetch | screenpipe 在 localhost:3030 |

## 外部依赖

### screenpipe（已在本地运行）

```
API 地址: http://localhost:3030
数据库: C:\Users\5600\.screenpipe\db.sqlite

常用接口:
GET /health              → 健康检查
GET /search?limit=10     → 最近的屏幕/音频数据
GET /search?q=关键词      → 按关键词搜 OCR 文字
GET /search?content_type=ocr   → 只搜屏幕文字
GET /search?content_type=audio → 只搜音频转写
```

## 开发环境

- Windows 11 + Mac（通过 Git 同步代码）
- Node.js v20
- 数据文件通过云盘同步（不放 GitHub）

## 设计原则

1. **所有数据源输出统一格式（Record）**：新增数据源只需写一个新的 Collector
2. **数据和代码分离**：代码在 GitHub，数据在本地 data/ 文件夹
3. **原始文件永远保留**：Record 里的 raw_file_path 指回原始文件，可溯源
4. **metadata 字段灵活扩展**：核心字段固定，其他信息都放 metadata（JSON）
