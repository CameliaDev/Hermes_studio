import { useEffect, useRef, useState, type FormEvent } from 'react'
import { invoke, isTauri } from '@tauri-apps/api/core'
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
    try{
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
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">H</div>
        <div className="brand-copy">
          <h1>Hermes Studio</h1>
          <p>你的 AI 对话工作台</p>
        </div>
        <span className="connection-status">
          <span className="status-dot" />
          界面原型
        </span>
      </header>

      <section className="chat-panel" aria-label="聊天内容">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon" aria-hidden="true">✦</div>
            <h2>有什么可以帮你？</h2>
            <p>发送一条消息，开始测试聊天界面。</p>
            <div className="suggestions" aria-label="示例问题">
              {['介绍一下你自己', '帮我整理一个计划', '解释一个 Rust 概念'].map(
                (suggestion) => (
                  <button
                    className="suggestion"
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <article
                className={`message message-${message.role}`}
                key={message.id}
              >
                <div className="message-avatar" aria-hidden="true">
                  {message.role === 'user' ? '你' : 'H'}
                </div>
                <div className="message-body">
                  <div className="message-author">
                    {message.role === 'user' ? '你' : 'Hermes'}
                  </div>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}
            {isSending && (
              <div className="typing-indicator" role="status">
                Hermes 正在回复…
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
        )}
      </section>

      <footer className="composer-area">
        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            aria-label="输入消息"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="给 Hermes 发消息…"
            rows={1}
            value={input}
          />
          <button
            aria-label="发送消息"
            className="send-button"
            disabled={!input.trim() || isSending}
            type="submit"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 19.5 21 12 4.5 4.5l.2 6 11.1 1.5-11.1 1.5-.2 6Z" />
            </svg>
          </button>
        </form>
        <p className="composer-hint">Enter 发送 · Shift + Enter 换行</p>
      </footer>
    </main>
  )
}

export default App
