# 流式聊天进度记录

日期：2026-10-17

## 实现内容

- DeepSeek 请求启用流式响应。
- Rust 使用 `reqwest` 的字节流读取 HTTP 响应，并按 SSE 行和事件解析数据。
- Rust 从流式事件中提取 `choices[0].delta.content`，通过 Tauri `Channel<String>` 发送文本片段。
- React 在发送时先创建一条空的助手消息；每收到一个片段，就按会话 ID 和消息 ID 追加到该消息。
- 流式请求失败时，将错误信息追加到对应的助手消息。
- 将 reqwest 0.13 的 TLS feature 配置为 `rustls`。

## 验证记录

- `npm run lint`：通过。
- `npm run build`：通过。
- 在 `src-tauri` 目录运行 `cargo check`：通过。
- 首次运行 `npm run tauri dev` 时发现 reqwest feature 名称不兼容；改为 `rustls` 后，Rust 检查通过。
- `npm run tauri dev`：修正 reqwest feature 后，Rust 编译完成并启动桌面应用。
- 启动过程中，文件监听器对正在使用的 `target\\debug` 构建文件报告 `EBUSY`；该警告未阻止应用启动。
- 在 Tauri 桌面应用中完成实际对话验证，确认回答逐段显示。

## 后续工作

- 后续再考虑停止生成、重试和对话上下文管理。
