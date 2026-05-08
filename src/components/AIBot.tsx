import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../lib/content'

type Message = {
  id: string
  role: 'bot' | 'user' | 'system'
  type: 'text' | 'product'
  text?: string
  productData?: any
  timestamp: number
}

// Typewriter component for the typing effect
function Typewriter({ text, speed = 30, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsDone(true)
        onComplete?.()
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <span className={`typing-text ${isDone ? 'done' : ''}`}>
      {displayedText}
    </span>
  )
}

function ProductCard({ product, t, onHeightChange, onImageClick }: { product: any, t: (obj: any) => string, onHeightChange?: () => void, onImageClick?: (images: string[], index: number) => void }) {
  const [showInfo, setShowInfo] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    onHeightChange?.()
  }, [showInfo, showImage, currentImageIndex])

  useEffect(() => {
    if (!product.images || product.images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.images!.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [product.images])

  return (
    <div className="bot-card">
      <div className="bot-card-header">
        <div className="bot-card-title-group">
          <div className="bot-card-title">
            <Typewriter 
              text={t(product.name)} 
              speed={40} 
              onComplete={() => {
                setShowInfo(true)
                onHeightChange?.()
              }} 
            />
          </div>
          {product.dept && (
            <div className="bot-card-dept">{t(product.dept)}</div>
          )}
        </div>
        <div className="bot-card-tag">Product</div>
      </div>
      
      {showInfo && (
        <div className="bot-card-info">
          <Typewriter 
            text={t(product.info)} 
            speed={20} 
            onComplete={() => {
              onHeightChange?.()
              setTimeout(() => {
                setShowImage(true)
                onHeightChange?.()
              }, 400)
            }} 
          />
        </div>
      )}

      {product.images?.[0] && (
        <div 
          className={`bot-card-img-container ${showImage ? 'visible' : ''}`}
          onClick={() => product.images && onImageClick?.(product.images, currentImageIndex)}
          style={{ cursor: 'zoom-in' }}
        >
          {product.images.map((img: string, idx: number) => (
            <img 
              key={img}
              src={img} 
              alt="" 
              className={`bot-card-img ${idx === currentImageIndex ? 'active' : ''}`} 
              draggable={false} 
              onLoad={() => onHeightChange?.()}
            />
          ))}
          {product.images.length > 1 && (
            <div className="bot-card-img-dots">
              {product.images.map((_: string, idx: number) => (
                <div
                  key={idx}
                  className={`bot-card-img-dot ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(idx)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AIBot() {
  const content = useContent()
  const [isOpen, setIsOpen] = useState(false)
  const [showDot, setShowDot] = useState(false)
  
  // Drag state persistence
  const [triggerPos, setTriggerPos] = useState(() => {
    try {
      const saved = localStorage.getItem('aibot_trigger_pos')
      return saved ? JSON.parse(saved) : { x: 0, y: 0 }
    } catch (e) {
      return { x: 0, y: 0 }
    }
  })
  const [windowPos, setWindowPos] = useState(() => {
    try {
      const saved = localStorage.getItem('aibot_window_pos')
      return saved ? JSON.parse(saved) : { x: 0, y: 0 }
    } catch (e) {
      return { x: 0, y: 0 }
    }
  })
  
  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    images: string[]
    index: number
  } | null>(null)
  
  // Hardcoded API settings per user request
  const API_KEY = 'sk-a7502b94ae9e4991a12d3d579656f2ef'
  const BASE_URL = 'https://api.deepseek.com/v1' // Assuming DeepSeek based on key format, adjust if needed
  const MODEL = 'deepseek-chat'
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('aibot_messages')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync scroll on message/typing change
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current
      scrollRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior
      })
    }
  }

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'auto' : 'smooth')
    localStorage.setItem('aibot_messages', JSON.stringify(messages))
  }, [messages, isTyping])

  // Handle Lightbox keyboard
  useEffect(() => {
    if (!lightbox) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft')
        setLightbox((prev) =>
          prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null,
        )
      if (e.key === 'ArrowRight')
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: Math.min(prev.images.length - 1, prev.index + 1),
              }
            : null,
        )
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightbox])

  useEffect(() => {
    if (content.status !== 'ready') return

    const timer = setTimeout(() => {
      if (messages.length === 0) {
        addMessage({
          role: 'bot',
          type: 'text',
          text: content.t({
            zh: 'Hi! 我是 Hank 的 AI 助手。想快速了解他在美团、小米或 OPPO 做的产品吗？或者随便聊聊！',
            en: "Hi! I'm Hank's AI assistant. Want to explore the products he built, or just chat?"
          })
        })
        setShowDot(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [content.status, messages.length])

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      {
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      }
    ])
  }

  const handleProductQuery = (productName: string) => {
    if (content.status !== 'ready') return
    addMessage({ role: 'user', type: 'text', text: productName })
    
    const resume = content.site.pages.about.resumeSections || []
    let foundDetails: any = null
    let foundDept: any = null
    
    for (const section of resume) {
      for (const item of section.items) {
        if (item.productDetails) {
          const detail = item.productDetails.find((pd: any) => 
            content.t(pd.name) === productName
          )
          if (detail) {
            foundDetails = detail
            foundDept = item.dept
            break
          }
        }
      }
      if (foundDetails) break
    }

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      if (foundDetails) {
        addMessage({
          role: 'bot',
          type: 'product',
          text: content.t(foundDetails.name),
          productData: { ...foundDetails, dept: foundDept }
        })
      } else {
        addMessage({
          role: 'bot',
          type: 'text',
          text: content.t({
            zh: '抱歉，暂时没找到相关产品信息。',
            en: "Sorry, I couldn't find details for that product."
          })
        })
      }
    }, 1200)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return
    const text = inputValue.trim()
    setInputValue('')
    addMessage({ role: 'user', type: 'text', text })

    setIsTyping(true)
    try {
      // Build conversation history
      const history = messages
        .filter(m => m.type === 'text' && (m.role === 'user' || m.role === 'bot'))
        .map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.text
        }))
      
      const systemPrompt = {
        role: 'system',
        content: `You are Hank's AI Assistant on his portfolio website. You are polite, professional, and knowledgeable about his work as an AI Product Manager at Meituan, Xiaomi, and OPPO. You help visitors learn about him.`
      }

      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [systemPrompt, ...history, { role: 'user', content: text }]
        })
      })

      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      const data = await res.json()
      const reply = data.choices[0]?.message?.content || 'No response.'
      
      setIsTyping(false)
      addMessage({ role: 'bot', type: 'text', text: reply })
    } catch (err: any) {
      setIsTyping(false)
      addMessage({ role: 'system', type: 'text', text: `Error: ${err.message}` })
    }
  }

  if (content.status !== 'ready') return null

  return (
    <div className="ai-bot-wrapper" ref={containerRef}>
      {/* Lightbox Integration */}
      <AnimatePresence>
        {lightbox && (
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
            {lightbox.images.length > 1 && (
              <>
                <div className="lightbox-counter">{lightbox.index + 1} / {lightbox.images.length}</div>
                <button className="lightbox-nav lightbox-prev" onClick={(e) => {
                  e.stopPropagation()
                  setLightbox(prev => prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null)
                }}>‹</button>
                <button className="lightbox-nav lightbox-next" onClick={(e) => {
                  e.stopPropagation()
                  setLightbox(prev => prev ? { ...prev, index: Math.min(prev.images.length - 1, prev.index + 1) } : null)
                }}>›</button>
              </>
            )}
            <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
              <img src={lightbox.images[lightbox.index]} alt="" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div 
            key="bot-window"
            className="ai-bot-window"
            drag
            dragConstraints={containerRef}
            dragElastic={0.05}
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, x: triggerPos.x, y: triggerPos.y - 100 }}
            animate={{ opacity: 1, scale: 1, x: windowPos.x, y: windowPos.y }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onDragEnd={(_, info) => {
              const newPos = { x: windowPos.x + info.offset.x, y: windowPos.y + info.offset.y }
              setWindowPos(newPos)
              localStorage.setItem('aibot_window_pos', JSON.stringify(newPos))
            }}
          >
            <div className="ai-bot-header drag-handle">
              <div className="bot-avatar-small">H</div>
              <div className="bot-title-group">
                <div className="bot-name">Hank's AI</div>
                <div className="bot-status">Online</div>
              </div>
              <div className="bot-header-actions">
                <button className="bot-icon-btn" onClick={() => setIsOpen(false)}>×</button>
              </div>
            </div>

            <div className="ai-bot-messages" ref={scrollRef}>
              {messages.map(msg => (
                    <div key={msg.id} className={`message-row ${msg.role}`}>
                      {msg.type === 'text' && (
                        <div className="message-bubble">
                          {msg.text}
                        </div>
                      )}
                      {msg.type === 'product' && msg.productData && (
                        <ProductCard 
                          product={msg.productData} 
                          t={content.t} 
                          onHeightChange={() => scrollToBottom('smooth')}
                          onImageClick={(images, index) => setLightbox({ images, index })}
                        />
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="message-row bot">
                      <div className="message-bubble typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ai-bot-input-area">
                  <div className="quick-actions">
                    {['智能掌柜', '整车大数据门户', '游戏助手'].map(name => (
                      <button 
                        key={name} 
                        className="quick-action-btn"
                        onClick={() => handleProductQuery(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="input-row">
                    <input 
                      type="text" 
                      className="chat-input"
                      placeholder={content.t({ zh: '输入消息...', en: 'Type a message...' })}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button className="chat-send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                      ↑
                    </button>
                  </div>
                </div>
            </motion.div>
          ) : (
          <motion.button 
            key="bot-trigger"
            className={`ai-bot-trigger ${showDot ? 'has-dot' : ''}`}
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            initial={{ opacity: 0, scale: 0.5, x: triggerPos.x, y: triggerPos.y }}
            animate={{ opacity: 1, scale: 1, x: triggerPos.x, y: triggerPos.y }}
            exit={{ opacity: 0, scale: 0.5 }}
            onDragEnd={(_, info) => {
              const newPos = { x: triggerPos.x + info.offset.x, y: triggerPos.y + info.offset.y }
              setTriggerPos(newPos)
              localStorage.setItem('aibot_trigger_pos', JSON.stringify(newPos))
            }}
            onClick={() => {
              setIsOpen(true)
              setShowDot(false)
            }}
          >
            <div className="trigger-icon">✦</div>
            {showDot && <div className="trigger-dot" />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
