# DayStream

把生活的每一刻汇成一条时间流。

DayStream 是一个个人生活时间轴应用，将屏幕前和屏幕外的生活碎片——录音、截图、照片、笔记——统一记录在一条可视化的时间线上。拖拽文件到日历上，它就会自动出现在该出现的地方。

## 功能

- 📅 日历式时间轴视图，按天/周/月浏览你的生活
- 🖱️ 拖拽上传：音频、图片、视频拖到页面上，自动按时间归位
- 🖥️ 对接 [screenpipe](https://github.com/screenpipe/screenpipe)，自动导入屏幕活动和音频转录
- 🎙️ 对接 Omi 可穿戴设备，导入线下对话录音
- 🔍 全文搜索所有记录
- 🏷️ 自动/手动标签和分类

## 技术栈

- **前端**: React + TypeScript
- **后端**: Node.js + Express
- **数据库**: SQLite (via better-sqlite3)
- **向量检索**: 待定 (计划集成 embedding 搜索)
- **外部数据源**: screenpipe REST API (localhost:3030)

## 快速开始

```bash
# 克隆项目
git clone https://github.com/你的用户名/daystream.git
cd daystream

# 安装依赖
npm install

# 复制配置文件并填入你的设置
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 前置要求

- Node.js >= 20
- screenpipe 在本地运行 (可选，用于屏幕数据采集)

## 项目结构

```
daystream/
├── src/
│   ├── collectors/     # 数据采集器（screenpipe、文件导入等）
│   ├── processors/     # 数据处理（转录、OCR、元数据提取）
│   ├── storage/        # 数据库操作和文件存储
│   ├── api/            # REST API 路由
│   └── ui/             # 前端界面
├── config/             # 配置文件
├── tests/              # 测试
├── docs/               # 文档
└── scripts/            # 工具脚本
```

## 数据源

| 数据源 | 状态 | 说明 |
|--------|------|------|
| screenpipe | ✅ 可用 | 屏幕截图、OCR、音频转录 |
| 文件拖拽上传 | 🚧 开发中 | 音频/图片/视频手动导入 |
| Omi 可穿戴 | 📋 计划中 | 线下对话录音 |
| 手机照片/GPS | 📋 计划中 | 通过文件夹同步导入 |
| 日历 (Google/Apple) | 📋 计划中 | 事件和日程 |

## 许可证

MIT License
