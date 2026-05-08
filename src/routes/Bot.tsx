import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useContent } from '../lib/content'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

type Message = {
  id: string
  role: 'bot' | 'user' | 'system'
  type: 'text' | 'product'
  text?: string
  productData?: any
  timestamp: number
}

const API_KEY = 'ark-1adcc8e5-f5ec-4c48-8c52-661087580121-f8e0c'
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses'
const MODEL = 'doubao-seed-2-0-mini-260428'
const HISTORY_KEY = 'bot_page_messages_v1'

function ProductCard({
  product,
  t,
  onImageClick,
}: {
  product: any
  t: (value: any) => string
  onImageClick: (images: string[], index: number) => void
}) {
  const images = product.images || (product.image ? [product.image] : [])
  const [parsedInfo, setParsedInfo] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const processMarkdown = async () => {
      const rawInfo = t(product.info)
      if (!rawInfo) return
      
      try {
        const processed = await unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeStringify)
          .process(rawInfo)
        
        setParsedInfo(String(processed.value))
      } catch (error) {
        console.error('Failed to parse markdown:', error)
        setParsedInfo(rawInfo)
      }
    }

    processMarkdown()
  }, [product.info, t])

  useEffect(() => {
    if (!images || images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images!.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [images])

  return (
    <div className="bot-page-card">
      <div className="bot-page-card-title">{t(product.name)}</div>
      {product.dept ? <div className="bot-page-card-dept">{t(product.dept)}</div> : null}
      <div 
        className="bot-page-card-info"
        dangerouslySetInnerHTML={{ __html: parsedInfo }}
      />
      {images.length > 0 ? (
        <button
          type="button"
          className="bot-page-card-image-wrap"
          onClick={() => onImageClick(images, currentImageIndex)}
        >
          {images.map((img: string, idx: number) => (
            <img 
              key={img}
              src={img} 
              alt={t(product.name)} 
              className={`bot-page-card-image ${idx === currentImageIndex ? 'active' : ''}`} 
            />
          ))}
          {images.length > 1 && (
            <div className="bot-page-card-image-dots">
              {images.map((_: string, idx: number) => (
                <div
                  key={idx}
                  className={`bot-page-card-image-dot ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(idx)
                  }}
                />
              ))}
            </div>
          )}
        </button>
      ) : null}
    </div>
  )
}

export default function Bot() {
  const content = useContent()
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const quickProducts = useMemo(() => {
    if (content.status !== 'ready') return []
    return content.locale === 'zh'
      ? ['智能掌柜', '整车大数据门户', '游戏助手']
      : ['Smart Manager', 'Vehicle Big Data Portal', 'Game Assistant']
  }, [content.status, content.locale])

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Math.random().toString(36).slice(2, 9),
        timestamp: Date.now(),
      },
    ])
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior,
    })
  }

  useEffect(() => {
    document.documentElement.classList.add('bot-mode')
    document.body.classList.add('bot-mode')
    return () => {
      document.documentElement.classList.remove('bot-mode')
      document.body.classList.remove('bot-mode')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages))
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth')
  }, [messages, isTyping])

  useEffect(() => {
    if (content.status !== 'ready') return
    if (messages.length > 0) return

    const timer = setTimeout(() => {
      addMessage({
        role: 'bot',
        type: 'text',
        text: content.t({
          zh: '你好，我是肖蘅栩 Hank 的 AI 助手。你可以直接从我这里了解他的经历～',
          en: "Hi, I'm Hank's AI assistant. Ask me about his projects, impact, and skills.",
        }),
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [content.status, messages.length])

  useEffect(() => {
    if (!lightbox) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft') {
        setLightbox((prev) =>
          prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null,
        )
      }
      if (e.key === 'ArrowRight') {
        setLightbox((prev) =>
          prev
            ? { ...prev, index: Math.min(prev.images.length - 1, prev.index + 1) }
            : null,
        )
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightbox])

  const handleProductQuery = (productName: string) => {
    if (content.status !== 'ready') return
    addMessage({ role: 'user', type: 'text', text: productName })

    const resume = content.site.pages.about.resumeSections || []
    let foundDetails: any = null
    let foundDept: any = null

    for (const section of resume) {
      for (const item of section.items) {
        if (!item.productDetails) continue
        const detail = item.productDetails.find(
          (pd: any) =>
            content.t(pd.name) === productName ||
            pd.name?.zh === productName ||
            pd.name?.en === productName,
        )
        if (detail) {
          foundDetails = detail
          foundDept = item.dept
          break
        }
      }
      if (foundDetails) break
    }

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      if (!foundDetails) {
        addMessage({
          role: 'bot',
          type: 'text',
          text: content.t({
            zh: '抱歉，暂时没找到相关产品信息。',
            en: "Sorry, I couldn't find details for that product.",
          }),
        })
        return
      }
      addMessage({
        role: 'bot',
        type: 'product',
        productData: { ...foundDetails, dept: foundDept },
      })
    }, 800)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return
    const text = inputValue.trim()
    setInputValue('')
    addMessage({ role: 'user', type: 'text', text })

    setIsTyping(true)
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: `你是 Hank 的 AI 助手，请用中文回答问题。

用户问：${text}`,
                },
              ],
            },
          ],
        }),
      })

      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      const data = await res.json()
      
      let reply = 'No response.'
      if (data.output && Array.isArray(data.output)) {
        const messageOutput = data.output.find((item: any) => item.type === 'message')
        if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
          const textContent = messageOutput.content.find((c: any) => c.type === 'output_text' || c.type === 'input_text')
          if (textContent) {
            reply = textContent.text || textContent.content || 'No response.'
          }
        }
      }
      if (reply === 'No response.' && data.output?.[1]?.content?.[0]?.text) {
        reply = data.output[1].content[0].text
      }
      addMessage({ role: 'bot', type: 'text', text: reply })
    } catch (err: any) {
      addMessage({
        role: 'system',
        type: 'text',
        text: content.t({
          zh: `请求失败：${err?.message || '未知错误'}`,
          en: `Request failed: ${err?.message || 'Unknown error'}`,
        }),
      })
    } finally {
      setIsTyping(false)
    }
  }

  if (content.status !== 'ready') return null

  return (
    <div className="bot-page">
      <AnimatePresence>
        {lightbox ? (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="lightbox-close" onClick={() => setLightbox(null)}>
              {content.locale === 'zh' ? '关闭' : 'Close'}
            </button>
            {lightbox.images.length > 1 ? (
              <>
                <div className="lightbox-counter">
                  {lightbox.index + 1} / {lightbox.images.length}
                </div>
                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightbox((prev) =>
                      prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null,
                    )
                  }}
                >
                  ‹
                </button>
                <button
                  className="lightbox-nav lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightbox((prev) =>
                      prev
                        ? { ...prev, index: Math.min(prev.images.length - 1, prev.index + 1) }
                        : null,
                    )
                  }}
                >
                  ›
                </button>
              </>
            ) : null}
            <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox.images[lightbox.index]} alt="" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="container bot-page-shell">
        <section className="bot-chat-panel">
          <div className="bot-chat-header">
            <button
              type="button"
              className="bot-chat-reset"
              onClick={() => setMessages([])}
            >
              {content.locale === 'zh' ? '新对话' : 'New Chat'}
            </button>
          </div>

          <div className="bot-chat-messages" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`bot-chat-row ${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className="bot-avatar">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
                    </svg>
                  </div>
                )}
                <div className="bot-chat-content">
                  {msg.type === 'text' ? (
                    <div className="bot-chat-bubble">{msg.text}</div>
                  ) : null}
                  {msg.type === 'product' && msg.productData ? (
                    <ProductCard
                      product={msg.productData}
                      t={content.t}
                      onImageClick={(images, index) => setLightbox({ images, index })}
                    />
                  ) : null}
                </div>
              </div>
            ))}
            {isTyping ? (
              <div className="bot-chat-row bot">
                <div className="bot-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="bot-chat-content">
                  <div className="bot-chat-bubble typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bot-chat-tools">
            {quickProducts.map((name) => (
              <button
                key={name}
                type="button"
                className="bot-chat-chip"
                onClick={() => handleProductQuery(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="bot-chat-input-wrap">
            <input
              type="text"
              className="bot-chat-input"
              value={inputValue}
              placeholder={content.t({ zh: '输入消息...', en: 'Type a message...' })}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
            />
            <button
              type="button"
              className="bot-chat-send"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              ↑
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
