import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Channel, invoke, isTauri } from '@tauri-apps/api/core'
import hermesAvatar from './assets/hermes-avatar.webp'
import './App.css'
// 定义消息类型
type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

type Conversation = {
  id: number
  title: string
  messages: Message[]
}

const EMPTY_MESSAGES: Message[] = []

/// 应用主组件
function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] =
    useState<number | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendingConversationId, setSendingConversationId] = useState<
    number | null
  >(null)
  const [searchQuery, setSearchQuery] = useState('')
  const messageEndRef = useRef<HTMLDivElement>(null)

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  )
  const messages = selectedConversation?.messages ?? EMPTY_MESSAGES
  const isEmptyConversation = messages.length === 0
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  )

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedConversationId, isSending])

  function appendMessage(conversationId: number, message: Message) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, message] }
          : conversation,
      ),
    )
  }

  // 按会话 ID 和消息 ID 定位助手消息，并追加新收到的文本片段。
  function appendToMessage(
    conversationId: number,
    messageId: number,
    chunk: string,
  ) {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId
                  ? { ...message, content: message.content + chunk }
                  : message,
              ),
            }
          : conversation,
      ),
    )
  }

  function handleNewConversation() {
    setSelectedConversationId(null)
    setInput('')
  }

  /// 提交表单处理函数
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = input.trim()
    if (!prompt || isSending) return

    const userMessageId = Date.now()
    const conversationId = selectedConversationId ?? userMessageId
    const assistantMessageId = userMessageId + 1
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: prompt,
    }
    // 先创建空的助手消息，后续每个流式片段都会追加到这里。
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    }

    if (selectedConversationId === null) {
      setConversations((current) => [
        ...current,
        {
          id: conversationId,
          title: prompt.slice(0, 40),
          messages: [userMessage, assistantMessage],
        },
      ])
      setSelectedConversationId(conversationId)
    } else {
      appendMessage(conversationId, userMessage)
      appendMessage(conversationId, assistantMessage)
    }

    setInput('')
    setIsSending(true)
    setSendingConversationId(conversationId)

    try {
      if (!isTauri()) {
        throw new Error(
          '当前页面运行在普通浏览器中。请在项目根目录运行 npm run tauri dev，并在打开的 Hermes Studio 桌面窗口中测试。',
        )
      }

      // Rust 每发送一个片段，就在这里追加到刚创建的助手消息。
      const onEvent = new Channel<string>()
      onEvent.onmessage = (chunk) => {
        appendToMessage(conversationId, assistantMessageId, chunk)
      }

      // 回答通过 Channel 分段传回，因此命令本身不返回完整字符串。
      await invoke<void>('chat', { prompt, onEvent })
    } catch (error) {
      console.error('调用 chat 命令失败:', error)
      appendToMessage(
        conversationId,
        assistantMessageId,
        `请求失败：${String(error)}`,
      )
    } finally {
      setIsSending(false)
      setSendingConversationId(null)
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
          <div className="search-box">
            <input
              aria-label="搜索会话"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索会话"
              type="search"
              value={searchQuery}
            />
          </div>

          <button
            className="new-conversation-button"
            onClick={handleNewConversation}
            type="button"
          >
            + 新建对话
          </button>

          <div className="chat-list">
            <ul>
              {filteredConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    aria-current={
                      conversation.id === selectedConversationId
                        ? 'page'
                        : undefined
                    }
                    className={
                      conversation.id === selectedConversationId
                        ? 'conversation-item conversation-item-selected'
                        : 'conversation-item'
                    }
                    onClick={() => {
                      setSelectedConversationId(conversation.id)
                      setInput('')
                    }}
                    type="button"
                  >
                    {conversation.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-user">


          </div>
        </aside>

        <section
          className={
            isEmptyConversation
              ? 'chat-workspace chat-workspace-empty'
              : 'chat-workspace'
          }
          aria-label="聊天区域"
        >
          <div className="message-area">
            {isEmptyConversation ? (
              <div className="empty-chat">
                <img src={hermesAvatar} alt="" />
                <h2>有什么可以帮你？</h2>
                <p>输入消息，开始一段新的对话。</p>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  className={`message message-${message.role}`}
                  key={message.id}
                >
                  <strong>{message.role === 'user' ? '你' : 'Hermes'}</strong>
                  <p>{message.content}</p>
                </article>
              ))
            )}

            {isSending &&
              selectedConversationId === sendingConversationId && (
                <p role="status">Hermes 正在回复…</p>
              )}
            <div ref={messageEndRef} />
          </div>

          <footer className="composer-area">
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  // 检查是否按下了 Enter 键，且不是 Shift+Enter
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
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
      </div >
    </main >
  )
}
export default App
