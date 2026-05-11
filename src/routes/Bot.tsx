import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useContent } from '../lib/content'
import { buildSystemPrompt, buildSuggestionQuestions, getFollowUpsForReply } from '../lib/knowledge'
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

function TypewriterText({ text, speed = 25, onTyping, onDone }: { text: string; speed?: number; onTyping?: () => void; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let index = 0
    const timer = setInterval(() => {
      index++
      setDisplayed(text.slice(0, index))
      if (onTyping) onTyping()
      if (index >= text.length) {
        clearInterval(timer)
        setDone(true)
        if (onDone) onDone()
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </>
  )
}

function ProductCard({
  product,
  t,
  onImageClick,
  enableTypewriter,
  onTyping,
}: {
  product: any
  t: (value: any) => string
  onImageClick: (images: string[], index: number) => void
  enableTypewriter?: boolean
  onTyping?: () => void
}) {
  const images = product.images || (product.image ? [product.image] : [])
  const [parsedInfo, setParsedInfo] = useState('')
  const [showImages, setShowImages] = useState(!enableTypewriter)
  const [typedChars, setTypedChars] = useState(0)
  const [doneTyping, setDoneTyping] = useState(!enableTypewriter)
  const rawInfoRef = useRef('')
  const name = t(product.name)
  const dept = product.dept ? t(product.dept) : ''

  useEffect(() => {
    const processMarkdown = async () => {
      const rawInfo = t(product.info)
      rawInfoRef.current = rawInfo
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
    if (!enableTypewriter) return
    if (doneTyping) {
      setShowImages(true)
      return
    }
    setShowImages(false)
  }, [enableTypewriter, doneTyping])

  useEffect(() => {
    if (showImages && onTyping) {
      const t = setTimeout(() => onTyping(), 50)
      return () => clearTimeout(t)
    }
  }, [showImages])

  useEffect(() => {
    if (!enableTypewriter) return
    const rawInfo = rawInfoRef.current
    if (!rawInfo) return

    const fullLine = `${name}${dept ? ` — ${dept}` : ''}\n\n${rawInfo}`
    const totalLen = fullLine.length
    if (typedChars >= totalLen) {
      setDoneTyping(true)
      return
    }

    const timer = setInterval(() => {
      setTypedChars((prev) => {
        const next = prev + 1
        if (onTyping) onTyping()
        if (next >= totalLen) {
          clearInterval(timer)
          setDoneTyping(true)
        }
        return next
      })
    }, 18)

    return () => clearInterval(timer)
  }, [enableTypewriter, name, dept])

  return (
    <div className="bot-page-card">
      {!enableTypewriter || doneTyping ? (
        <>
          <div className="bot-page-card-title">{name}</div>
          {dept ? <div className="bot-page-card-dept">{dept}</div> : null}
          <div
            className="bot-page-card-info"
            dangerouslySetInnerHTML={{ __html: parsedInfo }}
          />
        </>
      ) : (
        <div className="bot-page-card-typing">
          {(() => {
            const fullLine = `${name}${dept ? ` — ${dept}` : ''}\n\n${rawInfoRef.current}`
            return fullLine.slice(0, typedChars).split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))
          })()}
          <span className="typewriter-cursor" />
        </div>
      )}
      {images.length > 0 && showImages ? (
        <div className="bot-page-card-images">
          {images.map((img: string, idx: number) => (
            <button
              key={img}
              type="button"
              className="bot-page-card-image-wrap"
              onClick={() => onImageClick(images, idx)}
            >
              <img src={img} alt={name} className="bot-page-card-image" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function Bot() {
  const content = useContent()
  const [messages, setMessages] = useState<Message[]>([])
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

  const suggestionQuestions = useMemo(
    () => buildSuggestionQuestions(content, content.locale),
    [content.status, content.locale],
  )

  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [replyDone, setReplyDone] = useState(false)
  const scrollWhileTyping = useRef<ReturnType<typeof setInterval> | null>(null)

  const isLastMessageWelcome =
    messages.length === 1 &&
    messages[0].role === 'bot' &&
    messages[0].type === 'text'

  const handleSuggestionClick = async (question: string) => {
    setInputValue('')
    setInputFocused(false)
    addMessage({ role: 'user', type: 'text', text: question })
    await doSend(question)
  }

  const handleSendFromClick = async (question: string) => {
    setInputValue('')
    addMessage({ role: 'user', type: 'text', text: question })
    await doSend(question)
  }

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
          zh: '老师您好，我是肖蘅栩 Hank 的 AI 助手。下方标签可带您快速了解他的产品经历，欢迎点击～',
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
    setReplyDone(false)
    const scrollTimer = setInterval(() => scrollToBottom('auto'), 80)
    setTimeout(() => {
      setIsTyping(false)
      clearInterval(scrollTimer)
      scrollToBottom('smooth')
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
    setInputFocused(false)
    addMessage({ role: 'user', type: 'text', text })
    await doSend(text)
  }

  const doSend = async (text: string) => {
    setIsTyping(true)
    setReplyDone(false)
    scrollWhileTyping.current = setInterval(() => scrollToBottom('auto'), 100)
    try {
      const systemPrompt = buildSystemPrompt(content, content.locale)
      const userMessage = systemPrompt
        ? `${systemPrompt}\n\n---\n\n用户问：${text}`
        : `你是 Hank 的 AI 助手，请用${content.locale === 'zh' ? '中文' : '英文'}回答问题。\n\n用户问：${text}`

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
                  text: userMessage,
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

      const contextFollowUps = getFollowUpsForReply(reply, content.locale, suggestionQuestions)
      setFollowUpQuestions(contextFollowUps)
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
      if (scrollWhileTyping.current) {
        clearInterval(scrollWhileTyping.current)
        scrollWhileTyping.current = null
      }
      scrollToBottom('smooth')
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
          </div>

          <div className="bot-chat-messages" ref={scrollRef}>
            <AnimatePresence>
              {inputFocused && (
                <motion.div
                  className="bot-chat-suggestion-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setInputFocused(false)}
                />
              )}
            </AnimatePresence>
            {messages.map((msg, idx) => (
              <div key={msg.id} className={`bot-chat-row ${msg.role}`}>
                <div className="bot-chat-content">
                  {msg.type === 'text' ? (
                    <div className="bot-chat-bubble">
                      {msg.role === 'bot' ? (
                        <TypewriterText text={msg.text || ''} onTyping={() => scrollToBottom('auto')} onDone={() => setReplyDone(true)} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  ) : null}
                  {msg.type === 'product' && msg.productData ? (
                    <ProductCard
                      product={msg.productData}
                      t={content.t}
                      enableTypewriter
                      onTyping={() => scrollToBottom('auto')}
                      onImageClick={(images, index) => setLightbox({ images, index })}
                    />
                  ) : null}
                  {msg.role === 'bot' && !isLastMessageWelcome && idx === messages.length - 1 && replyDone && followUpQuestions.length > 0 ? (
                    <motion.div
                      className="bot-chat-followup"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <div className="bot-chat-followup-list">
                        {followUpQuestions.slice(0, 2).map((q) => (
                          <button
                            key={q}
                            type="button"
                            className="bot-chat-followup-item"
                            onClick={() => handleSendFromClick(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            ))}
            {isTyping ? (
              <div className="bot-chat-row bot">
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

          <div className="bot-chat-tools" style={{ display: inputFocused ? 'none' : '' }}>
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

          <div className="bot-chat-suggestion-wrap">
            <AnimatePresence>
              {inputFocused && suggestionQuestions.length > 0 ? (
              <motion.div
                className="bot-chat-suggestion"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
              >
                <div className="bot-chat-suggestion-title">
                  {content.t({ zh: '猜您想问？', en: 'You may want to ask:' })}
                </div>
                <div className="bot-chat-suggestion-list">
                  {suggestionQuestions.map((q, i) => (
                    <motion.div
                      key={q}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <button
                        type="button"
                        className="bot-chat-suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSuggestionClick(q)
                        }}
                      >
                        {q}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : null}
            </AnimatePresence>
          </div>

          <div className="bot-chat-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="bot-chat-input"
              value={inputValue}
              placeholder={content.t({ zh: '选个问题，听听我的经历～', en: 'Type a message...' })}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => {
                setTimeout(() => setInputFocused(false), 200)
              }}
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
