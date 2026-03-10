# DayStream 上手指南（给自己看的）

## 第一次设置（只需要做一次）

### 1. GitHub 上创建 repo

1. 打开 https://github.com/new
2. Repository name 填 `daystream`
3. 选 **Public**
4. **不要** 勾选 "Add a README file"（我们已经有了）
5. 点 **Create repository**

### 2. 电脑上的操作

打开终端（Mac）或 命令提示符/PowerShell（Windows），依次输入：

```bash
# 进入你想放项目的文件夹
cd ~/Projects    # Mac
cd C:\Projects   # Windows（或者你喜欢的其他位置）

# 把下载好的 daystream 文件夹变成 git 仓库
cd daystream
git init
git add .
git commit -m "初始项目结构"

# 连接到 GitHub（把 "你的用户名" 换成你的 GitHub 用户名）
git remote add origin https://github.com/你的用户名/daystream.git
git branch -M main
git push -u origin main
```

### 3. 在另一台电脑上克隆

```bash
cd ~/Projects    # 或者你喜欢的位置
git clone https://github.com/你的用户名/daystream.git
cd daystream
npm install
cp .env.example .env
# 编辑 .env 填入这台电脑的配置
```

## 日常工作流

### 开始写代码前
```bash
git pull
```

### 写完代码后
```bash
git add .
git commit -m "简单描述你做了什么"
git push
```

### 换到另一台电脑
```bash
git pull
# 继续写...
```

## 跟 AI 对话时怎么说

开新窗口时，贴上 `ARCHITECTURE.md` 的内容，然后说你想做什么。例如：

> "这是我的项目结构（贴 ARCHITECTURE.md 内容）。
> 我现在想做日历的前端界面，用 React，要有月视图和日视图，
> 点击某一天能看到那天的所有记录。帮我写代码。"

或者：

> "这是我的项目（贴 ARCHITECTURE.md）。
> 帮我写一个从 screenpipe 定时同步数据的功能，
> 每 5 分钟自动拉一次新数据。"
