import { useEffect, useRef, useState } from 'react'

interface CursorHintProps {
  text?: string
  idleTime?: number
}

export default function CursorHint({
  text = '尝试点击屏幕探索更多',
  idleTime = 5000
}: CursorHintProps) {
  const [isVisible, setIsVisible] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let animationFrameId: number

    // 默认初始位置放在屏幕中下方
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight * 0.75
    let currentX = targetX
    let currentY = targetY

    // 重置空闲计时器：任何实际点击操作都代表“不再空闲”
    const resetTimer = () => {
      setIsVisible(false)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsVisible(true)
      }, idleTime)
    }

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        targetX = e.clientX
        targetY = e.clientY
      } else if (e.touches.length > 0) {
        targetX = e.touches[0].clientX
        targetY = e.touches[0].clientY
      }
    }

    const updatePosition = () => {
      // Lerp (线性插值) 算法实现丝滑跟随
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08

      if (cursorRef.current) {
        const isMobile = window.innerWidth <= 860
        // PC端偏移至鼠标右下方，移动端居中并悬浮于触点上方避免遮挡
        const xOffset = isMobile ? -(cursorRef.current.offsetWidth / 2) : 16
        const yOffset = isMobile ? -60 : 24
        cursorRef.current.style.transform = `translate3d(${currentX + xOffset}px, ${currentY + yOffset}px, 0)`
      }

      animationFrameId = requestAnimationFrame(updatePosition)
    }

    // 鼠标移动只更新目标坐标（继续跟随），不重置提示显示状态
    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    
    // 点击代表真正的交互，重置提示文案
    window.addEventListener('click', resetTimer, { passive: true })
    window.addEventListener('touchstart', resetTimer, { passive: true })

    resetTimer()
    updatePosition()

    return () => {
      clearTimeout(timeoutId)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('click', resetTimer)
      window.removeEventListener('touchstart', resetTimer)
    }
  }, [idleTime])

  return (
    <div
      ref={cursorRef}
      className={`cursor-hint ${isVisible ? 'visible' : ''}`}
      aria-hidden="true"
    >
      <span className="cursor-hint-icon">✧</span>
      {text}
    </div>
  )
}
