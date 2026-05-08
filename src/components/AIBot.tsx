import { useState, useEffect, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../lib/content'

type Message = {
  id: string
  type: 'bot' | 'user'
  content: ReactNode
  timestamp: number
}

export default function AIBot() {
  const content = useContent()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [showDot, setShowDot] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (content.status !== 'ready') return

    // 初始欢迎语
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        addBotMessage(
          content.t({
            zh: 'Hi! 我是 Hank 的 AI 助手。想快速了解他在美团、小米或 OPPO 做的产品吗？',
            en: "Hi! I'm Hank's AI assistant. Want to quickly explore the products he built at Meituan, Xiaomi, or OPPO?"
          })
        )
        setShowDot(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [content.status])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const addBotMessage = (text: ReactNode) => {
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'bot',
        content: text,
        timestamp: Date.now()
      }
    ])
  }

  const addUserMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'user',
        content: text,
        timestamp: Date.now()
      }
    ])
  }

  const handleProductQuery = (productName: string) => {
    if (content.status !== 'ready') return
    addUserMessage(productName)
    
    // 从 site.json 中寻找匹配的产品详情
    const resume = content.site.pages.about.resumeSections || []
    let foundDetails: any = null
    
    for (const section of resume) {
      for (const item of section.items) {
        if (item.productDetails) {
          const detail = item.productDetails.find((pd: any) => 
            content.t(pd.name) === productName
          )
          if (detail) {
            foundDetails = detail
            break
          }
        }
      }
      if (foundDetails) break
    }

    setTimeout(() => {
      if (foundDetails) {
        addBotMessage(
          <div className="bot-card">
            {foundDetails.images?.[0] && (
              <img src={foundDetails.images[0]} alt="" className="bot-card-img" />
            )}
            <div className="bot-card-title">{content.t(foundDetails.name)}</div>
            <div className="bot-card-info">{content.t(foundDetails.info)}</div>
          </div>
        )
      } else {
        addBotMessage(content.t({
          zh: '抱歉，暂时没找到相关产品信息。',
          en: "Sorry, I couldn't find details for that product."
        }))
      }
    }, 600)
  }

  if (content.status !== 'ready') return null

  return (
    <div className="ai-bot-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="ai-bot-window"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="ai-bot-header">
              <div className="bot-avatar-small">H</div>
              <div className="bot-title-group">
                <div className="bot-name">Hank's AI Assistant</div>
                <div className="bot-status">Online</div>
              </div>
              <button className="bot-close" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="ai-bot-messages" ref={scrollRef}>
              {messages.map(msg => (
                <div key={msg.id} className={`message-row ${msg.type}`}>
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-bot-actions">
              <div className="action-label">
                {content.t({ zh: '选择你想了解的产品：', en: 'Explore products:' })}
              </div>
              <div className="action-buttons">
                {['智能掌柜', '整车大数据门户', '游戏助手'].map(name => (
                  <button 
                    key={name} 
                    className="action-btn"
                    onClick={() => handleProductQuery(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        className={`ai-bot-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen)
          setShowDot(false)
        }}
      >
        <div className="trigger-icon">
          {isOpen ? '↓' : '✦'}
        </div>
        {showDot && <div className="trigger-dot" />}
      </button>
    </div>
  )
}
