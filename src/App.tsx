import { useEffect, useRef, useState, type FormEvent } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
import hermesAvatar from './assets/hermes-avatar.webp'
import './App.css'

// 定义消息类型
type Message = {
  id: number
  role: 'user' | 'assistant'
  // 消息内容
  content: string
}

/// 应用主组件
function App() {
  /// 消息列表
  const [messages, setMessages] = useState<Message[]>([])
  /// 输入框内容
  const [input, setInput] = useState('')
  /// 是否正在发送消息
  const [isSending, setIsSending] = useState(false)
  /// 消息列表滚动到最新消息
  const messageEndRef = useRef<HTMLDivElement>(null)
  /// 消息列表滚动到最新消息
  /// 每次消息列表更新时，滚动到最新消息
  /// 这可以确保用户总能看到最新的对话内容
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /// 提交表单处理函数
  /// 处理用户提交的消息
  /// 如果输入框为空或正在发送消息，不执行任何操作
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = input.trim()
    if (!prompt || isSending) return

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', content: prompt },
    ])
    setInput('')
    setIsSending(true)
    try {
      if (!isTauri()) {
        throw new Error(
          '当前页面运行在普通浏览器中。请在项目根目录运行 npm run tauri dev，并在打开的 Hermes Studio 桌面窗口中测试。',
        )
      }



      // 调用 Tauri 后端命令，获取回复
      const reply = await invoke<string>('chat', { prompt })
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', content: reply },
      ])
    } catch (error) {
      console.error('调用 chat 命令失败:', error)
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `请求失败：${String(error)}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  /// 应用渲染函数
  /// 渲染应用的主界面
  /// 包含应用的标题、聊天面板、消息列表和提交表单
  return (
    <main className="app-shell">
      {/* 区域一：顶部栏 */}
      <header className="top-bar">
        {/* 顶栏内容 */}
        <img className="brand-logo" src={hermesAvatar} alt="Hermes Studio 头像" />
        <h1 className="brand-name">Hermes Studio</h1>
      </header>

      <div className="app-body">
        {/* 区域二：左侧栏 */}
        <aside className="sidebar">
          {/* 侧边栏内容 */}
        </aside>

        {/* 区域三：右侧聊天区 */}
        <section className="chat-workspace" aria-label="聊天区域">
          {/* 聊天内容和输入框 */}
          <div className="message-area">
            {/* 聊天消息显示在这里 */}
            {messages.map((message) => (
              <article
                className={`message message-${message.role}`}
                key={message.id}
              >
                <strong>{message.role === 'user' ? '你' : 'Hermes'}</strong>
                <p>{message.content}</p>
              </article>
            ))}

            {isSending && <p role="status">Hermes 正在回复…</p>}

            {/*-----------------*/}
          </div>

          <footer className="composer-area">
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  // 检查是否按下了 Enter 键，且不是 Shift+Enter
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    // 阻止默认提交行为
                    event.preventDefault()
                    // 触发提交事件
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="给 Hermes 发消息…"
              />

              <button type="submit" disabled={!input.trim() || isSending}>
                发送
              </button>
            </form>
          </footer>
        </section>
      </div>
    </main>
  )
}
export default App
