# 更新日志

本项目的重要变更记录在此文件中。

## [未发布] - 2026-10-17

### 新增

- 接入 DeepSeek 流式响应：Rust 按 SSE 事件读取模型文本，并通过 Tauri Channel 发送给 React。
- React 预先创建助手消息，收到文本片段后追加到同一条消息中。
- 新增流式聊天阶段性进度文档。

### 修改

- 将 reqwest TLS feature 更新为 `rustls`，匹配项目使用的 reqwest 0.13。
- 更新 README 中的流式功能状态与后续验证步骤。

### 验证

- `npm run lint`：通过。
- `npm run build`：通过。
- 在 `src-tauri` 目录运行 `cargo check`：通过。
- `npm run tauri dev`：修正 reqwest feature 后，Rust 编译完成且桌面应用已启动。
- 在 Tauri 桌面端完成实际对话验证，确认回答逐段显示。
- 启动时出现的 `EBUSY` 文件监听警告未阻止应用运行。
