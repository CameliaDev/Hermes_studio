# Hermes Studio

Hermes Studio 是一个 Windows 桌面 LLM 客户端。前端使用 React + TypeScript，桌面壳与模型 API 后端使用 Rust 和 Tauri 2。

## 技术架构

```text
React + TypeScript + Vite
        │ Tauri commands / channels
        ▼
Tauri 2 + Rust
        │ HTTPS
        ▼
LLM API（初期使用 DeepSeek）
```

- React 负责聊天窗口、输入、消息展示和设置界面。
- Rust 负责 API 请求、配置、凭据处理和错误处理。
- API Key 不应写入前端代码、源码仓库或日志。

## 当前项目状态

本仓库已由 Vite 创建 React + TypeScript 前端，并初始化 Tauri 2。Tauri 使用 Vite 开发服务器 `http://localhost:5173`，生产前端资源目录为 `dist`。

- [x] React 聊天界面原型
- [x] 顶部栏、左侧栏与右侧聊天区的分区布局
- [x] 顶栏品牌头像与名称
- [x] 聊天消息列表和底部输入框
- [x] 消息区域独立滚动，输入区固定在聊天区底部
- [x] Tauri 桌面窗口可运行
- [x] React 通过 `invoke` 调用 Rust 命令
- [x] Rust 命令调用 DeepSeek Chat Completions API
- [x] 将请求错误显示在聊天界面
- [x] HTTP 请求 60 秒超时
- [ ] 流式响应

当前已支持非流式 DeepSeek 对话；暂未实现重试、流式传输、对话历史或结构化输出。

项目阶段性完成记录见 [docs/2026-10-16-project-progress.md](./docs/2026-10-16-project-progress.md)。

### 启动桌面开发版

在仓库根目录运行：

```bash
npm run tauri dev
```

只启动浏览器前端（不打开桌面窗口）：

```bash
npm run dev
```

### 构建前端

```bash
npm run build
```

### 代码检查与格式化

```bash
npm run lint
npm run format
npm run format:check

cd src-tauri
cargo fmt
cargo check
cargo test
```

VS Code 推荐安装 Rust Analyzer 和 Prettier 扩展。Rust 格式化使用 rustfmt。

## 开发路线

后续可逐步实现：

1. **流式响应**：通过 Tauri Channel 将文本片段逐步发送到 React，支持即时显示。
2. **稳定性**：增加有限重试和 Rust 单元测试。
3. **扩展功能**：对话历史、停止生成、多模型配置和安装包。

## 配置与密钥

在仓库根目录创建 `.env`，填入 DeepSeek API 地址和密钥：

```dotenv
BASE_DEEPSEEK_URL=https://api.deepseek.com
BASE_API_KEY=替换成你的_API_Key
```

后端会读取此文件，并在根地址后自动添加 `/chat/completions`；也可以直接将 `BASE_DEEPSEEK_URL` 设置为完整的 Chat Completions 地址。`.env` 已由 `.gitignore` 忽略，不要把真实密钥提交到 Git。

聊天功能必须在 Tauri 桌面环境运行。使用 `npm run tauri dev` 启动；单独打开 `npm run dev` 的浏览器页面时，Tauri `invoke` 不可用。

面向用户发布时，不要把 `.env` 打进应用包，也不要将密钥放在 React 前端；优先使用 Windows Credential Manager 等系统凭据存储。

若密钥曾出现在终端截图、聊天记录或仓库中，请在服务商控制台撤销并重新生成。不要在日志中打印密钥或敏感对话内容。

## Windows 开发环境

- Rust stable MSVC 工具链
- Microsoft C++ Build Tools（“使用 C++ 的桌面开发”）
- Node.js LTS 和 npm
- Microsoft Edge WebView2 Runtime（多数 Windows 10/11 系统已安装）

详情参阅 [Tauri Windows prerequisites](https://tauri.app/start/prerequisites/)。

## 参考资料

- [Tauri 2 官方文档](https://tauri.app/)
- [Tauri 2 创建项目](https://tauri.app/start/create-project/)
- [React 官方文档](https://react.dev/)
- [Vite 官方文档](https://vite.dev/guide/)
