# 项目进展记录

日期：2026-10-16

## 已完成

- 初始化 Tauri 2、React、TypeScript 和 Vite 项目，配置桌面开发窗口与 Vite 开发服务器。
- 完成聊天界面原型，支持消息展示、输入、发送、等待状态和错误反馈。
- 建立前端到 Rust 的 Tauri `invoke` 调用，并注册聊天命令。
- 在 Rust 后端接入 DeepSeek Chat Completions API，支持非流式请求。
- 使用根目录 `.env` 保存 API 地址和密钥；后端负责读取配置，前端不接触密钥。
- 自动补全 `/chat/completions` 请求路径，并为 HTTP 请求设置 60 秒超时。
- 检查并处理普通浏览器与 Tauri 桌面环境的差异；聊天功能需在桌面应用中运行。
- 配置 Oxlint、Prettier、Rust Analyzer 和 rustfmt 相关开发工具。
- 完成桌面端实际对话验证，成功收到 DeepSeek 回复。
- 将界面拆分为顶部栏、左侧栏和右侧聊天区，并加入品牌头像与名称。
- 在聊天区接回消息列表和输入表单；消息超出区域时在消息区内部滚动，输入框保持在底部。

## 验证记录

- `npm run lint`：通过。
- `npm run build`：通过。
- 左侧栏与聊天区布局、头像和输入框调整后，`npm run build`：通过。
- 在 `src-tauri` 目录运行 `cargo check`：通过。
- `cargo fmt --check`：项目中仍有其他 Rust 文件不符合 rustfmt 格式；可运行 `cargo fmt` 统一格式。

## 当前未完成

- 流式响应。
- 对话历史与上下文管理。
- 有限重试和更多 Rust 单元测试。
- 多模型服务商配置与正式发行包。

## 安全提示

- `.env` 已加入 `.gitignore`，不得提交真实 API Key。
- 若密钥曾暴露在聊天、终端输出或截图中，应在服务商后台撤销并重新生成。
- 发布应用时不要将开发用 `.env` 打包；后续应采用系统凭据存储等方案保护密钥。
