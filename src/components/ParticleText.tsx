import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  vx: number
  vy: number
  size: number
  baseSize: number
  color: string
  staticColor: string
  friction: number
  springFactor: number
  opacity: number
  z: number
  agitated: number
  hue: number
}

// 德彪西风格（全音阶/五声音阶）的频率，C4 - C6
const ETHERIAL_SCALE = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  369.99, // F#4
  415.3,  // G#4
  466.16, // A#4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  739.99, // F#5
  830.61, // G#5
  932.33, // A#5
]

let audioCtx: AudioContext | null = null

function playEtherealNote() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    audioCtx = new AudioContext()
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  osc.type = 'sine'

  // 随机挑选一个和谐音符
  const freq = ETHERIAL_SCALE[Math.floor(Math.random() * ETHERIAL_SCALE.length)]
  osc.frequency.value = freq

  const now = audioCtx.currentTime

  // 极柔和的八音盒/钟声包络 (Envelope)
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(0.08, now + 0.1) // 缓慢轻柔的起音
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3) // 悠长空灵的尾音

  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  osc.start(now)
  osc.stop(now + 3)
}

export default function ParticleText({ text }: { text: string }) {
  const computeIsMobile = () =>
    window.innerWidth <= 860 ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fallbackRef = useRef<HTMLImageElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [fallbackReady, setFallbackReady] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [forceHideLoading, setForceHideLoading] = useState(false)
  const [minLoadingElapsed, setMinLoadingElapsed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isFullyLoaded, setIsFullyLoaded] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [isMobile, setIsMobile] = useState(computeIsMobile)
  const [mobileGifReady, setMobileGifReady] = useState(false)
  const [showMobileWorksCta, setShowMobileWorksCta] = useState(false)
  const [mobileForceVideo, setMobileForceVideo] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(computeIsMobile())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setVideoReady(false)
    setVideoPlaying(false)
    setFallbackReady(false)
    setMobileGifReady(false)
    setVideoFailed(false)
    setShowMobileWorksCta(false)
    setMobileForceVideo(false)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile || !mobileGifReady) return
    const loopMs = 1200
    const t = window.setTimeout(() => setShowMobileWorksCta(true), loopMs * 3)
    return () => window.clearTimeout(t)
  }, [isMobile, mobileGifReady])

  useEffect(() => {
    if (!isMobile || !mobileGifReady) return
    const img = fallbackRef.current
    if (!img) return

    let cancelled = false
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 24
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const sample = () => {
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let sum = 0
        for (let i = 0; i < data.length; i += 20) sum = (sum + data[i]) % 1000000007
        return sum
      } catch {
        return null
      }
    }

    const first = sample()
    if (first === null) return

    let prev = first
    let ticks = 0
    let changed = false

    const interval = window.setInterval(() => {
      if (cancelled) return
      const next = sample()
      ticks += 1
      if (next === null) {
        window.clearInterval(interval)
        return
      }
      if (next !== prev) {
        changed = true
        window.clearInterval(interval)
        return
      }
      prev = next
      if (ticks >= 10) {
        window.clearInterval(interval)
        if (!changed) setMobileForceVideo(true)
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isMobile, mobileGifReady])

  useEffect(() => {
    if (!isMobile || !mobileForceVideo) return
    videoRef.current?.play().catch(() => {})
  }, [isMobile, mobileForceVideo])

  useEffect(() => {
    if (!isMobile) return
    const els = [videoRef.current, fallbackRef.current].filter(Boolean) as HTMLElement[]
    els.forEach((el) => {
      el.classList.remove('full-illumination', 'effect-ripple', 'effect-cinematic', 'effect-burst')
    })
  }, [isMobile])

  const { videoSrc, mobileVideoSrc, gifSrc, posterSrc } = useMemo(() => {
    const base = import.meta.env.BASE_URL || '/'
    const baseNormalized = base.endsWith('/') ? base : `${base}/`
    return {
      videoSrc: `${baseNormalized}media/video.mp4`,
      mobileVideoSrc: `${baseNormalized}media/app.mp4`,
      gifSrc: `${baseNormalized}media/APP.GIF`,
      posterSrc: `${baseNormalized}media/1.png`,
    }
  }, [])

  // Use a simple 1.5s minimum loading time for the new CSS loader
  useEffect(() => {
    const t = window.setTimeout(() => setMinLoadingElapsed(true), 1500)
    const hardCap = window.setTimeout(() => setForceHideLoading(true), 30000)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(hardCap)
    }
  }, [])

  // Simulated progress easing over 10s
  useEffect(() => {
    let startTime = performance.now()
    let animationFrame: number
    const duration = 10000

    const updateProgress = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - t, 3)
      
      setProgress(p => {
        if (p >= 100) return p
        return easeOut * 99
      })

      if (t < 1) {
        animationFrame = requestAnimationFrame(updateProgress)
      }
    }
    
    animationFrame = requestAnimationFrame(updateProgress)
    return () => cancelAnimationFrame(animationFrame)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // 强化移动端视频自动播放策略
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
      videoRef.current.setAttribute('playsinline', 'true')
      videoRef.current.setAttribute('webkit-playsinline', 'true')
      
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 捕获 iOS 低电量模式或严格 Autoplay 策略导致的播放失败
          // 等待用户下一次交互时强制唤醒
          const forcePlay = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {})
            }
            window.removeEventListener('touchstart', forcePlay)
            window.removeEventListener('click', forcePlay)
          }
          window.addEventListener('touchstart', forcePlay, { once: true })
          window.addEventListener('click', forcePlay, { once: true })
        })
      }
    }

    // 强制给 CSS 变量注入初始中心点坐标，防止部分老旧移动端浏览器对 var() fallback 解析失效
    if (containerRef.current && !computeIsMobile()) {
      containerRef.current.style.setProperty('--mouse-x', `${window.innerWidth / 2}px`)
      containerRef.current.style.setProperty('--mouse-y', `${window.innerHeight / 2}px`)
    }

    let isVisible = true
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting
    })
    if (canvas) observer.observe(canvas)

    let animationFrameId: number
    let particles: Particle[] = []
    let bgParticles: Particle[] = []
    
    let mouse = { x: -9999, y: -9999, radius: 50 } // 鼠标排斥半径改为 50px
    let lastNoteTime = 0
    let lastWidth = window.innerWidth
    let lastHeight = window.innerHeight

    // 初始化尺寸
    const resize = () => {
      // 防抖：移动端上下滚动地址栏收缩会触发 resize（高度变化），避免此时重新生成 5000 粒子导致严重卡顿
      const isMobile = window.innerWidth <= 860
      if (isMobile) {
        const heightDiff = Math.abs(window.innerHeight - lastHeight)
        const widthDiff = Math.abs(window.innerWidth - lastWidth)
        // 如果宽度没变，且高度变化小于 120px (通常是地址栏高度)，则跳过重新生成
        if (widthDiff === 0 && heightDiff < 120) {
          lastHeight = window.innerHeight
          return
        }
      }
      
      lastWidth = window.innerWidth
      lastHeight = window.innerHeight
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
      initBgParticles()
    }

    // 生成背景星尘
    const initBgParticles = () => {
      bgParticles = []
      const count = Math.floor((canvas.width * canvas.height) / 15000)
      for (let i = 0; i < count; i++) {
        bgParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseX: 0,
          baseY: 0,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          baseSize: 0,
          size: Math.random() * 1.5 + 0.2,
          color: '#ffffff',
          staticColor: '',
          friction: 1,
          springFactor: 0,
          opacity: Math.random() * 0.5 + 0.1,
          z: 0,
          agitated: 0,
          hue: 0
        })
      }
    }

    // 生成文字粒子
    const initParticles = () => {
      particles = []
      
      // 1. 在离屏 canvas 上绘制文字，以便采样像素
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!offCtx) return

      // 移动端字体可以适当放大一些（原本 /8 可能太小了），并且保证有个下限
      const isMobile = window.innerWidth <= 860
      const fontSize = isMobile ? Math.max(window.innerWidth / 6, 32) : Math.min(window.innerWidth / 8, 120)
      
      offCtx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
      offCtx.fillStyle = '#ffffff'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.letterSpacing = '0.05em'

      offCtx.fillText(text, offscreen.width / 2, offscreen.height / 2)

      const textCoordinates = offCtx.getImageData(0, 0, offscreen.width, offscreen.height)
      const data = textCoordinates.data

      let coords: {x: number, y: number}[] = []
      
      // 增加步长逻辑：如果在极窄的移动端（字体很大但区域很小），避免找不到足够多的非透明像素
      const step = isMobile ? 1 : 2
      
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = data[(y * offscreen.width + x) * 4 + 3]
          if (alpha > 128) {
            coords.push({x, y})
          }
        }
      }

      // 如果屏幕太小导致文字像素极少（防止死循环/崩溃）
      if (coords.length === 0) return

      // Shuffle and limit count
      coords.sort(() => Math.random() - 0.5)
      
      // 移动端由于屏幕小，粒子数可以适当减少，防止过度密集糊成一团
      const minCount = isMobile ? 1500 : 3000
      const maxCount = isMobile ? 2500 : 5000
      let targetCount = Math.max(minCount, Math.min(maxCount, coords.length))
      
      if (coords.length < minCount) {
        let tempCoords = [...coords]
        while(tempCoords.length < minCount) {
          tempCoords = tempCoords.concat(coords)
        }
        coords = tempCoords
        targetCount = minCount
      }
      coords = coords.slice(0, targetCount)

      for (let i = 0; i < coords.length; i++) {
        const {x, y} = coords[i]
        const z = Math.random() // 0 to 1 深度
        const baseSize = Math.random() * 2.5 + 0.5 // 0.5 to 3
        const opacity = z * 0.7 + 0.3

        particles.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 50,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          baseSize: baseSize,
          size: baseSize,
          color: '#ffffff',
          staticColor: `rgba(255, 255, 255, ${opacity})`,
          friction: 0.85 + z * 0.05,
          springFactor: 0.02 + z * 0.02,
          opacity: opacity,
          z: z,
          agitated: 0,
          hue: Math.floor(Math.random() * 60) + 180 // Cyan/Blue hue
        })
      }
    }

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制背景粒子（深空感）
      bgParticles.forEach(bp => {
        bgParticlesUpdate(bp)
        ctx.globalAlpha = bp.opacity
        ctx.fillStyle = bp.color
        ctx.beginPath()
        ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2)
        ctx.fill()
      })

      let activeParticlesInHover = 0

      // 绘制文字粒子
      particles.forEach(p => {
        let dx = mouse.x - p.x
        let dy = mouse.y - p.y
        let distance = Math.sqrt(dx * dx + dy * dy)

        // 鼠标排斥逻辑（星尘散开）
        if (distance < mouse.radius) {
          activeParticlesInHover++
          // 计算受力，距离越近受力越大
          const forceDirectionX = dx / distance
          const forceDirectionY = dy / distance
          const maxDistance = mouse.radius
          const force = (maxDistance - distance) / maxDistance
          
          // 施加推力（负号代表排斥）
          const directionX = forceDirectionX * force * 5
          const directionY = forceDirectionY * force * 5
          
          p.vx -= directionX
          p.vy -= directionY
          p.agitated = Math.min(1, p.agitated + 0.15)
        } else {
          p.agitated = Math.max(0, p.agitated - 0.05)
        }

        // 弹簧恢复逻辑（自动聚拢回文字）
        p.vx += (p.baseX - p.x) * p.springFactor
        p.vy += (p.baseY - p.y) * p.springFactor

        // 应用阻尼
        p.vx *= p.friction
        p.vy *= p.friction

        // 加速运动 (速度提升200-300%)
        const currentVx = p.vx * (1 + p.agitated * 2.5)
        const currentVy = p.vy * (1 + p.agitated * 2.5)

        // 更新位置
        p.x += currentVx
        p.y += currentVy

        // 脉动大小 (1.0 - 1.5倍)
        if (p.agitated > 0) {
          p.size = p.baseSize * (1 + p.agitated * 0.5 * Math.abs(Math.sin(Date.now() * 0.005 + p.z * 10)))
        } else {
          p.size = p.baseSize
        }

        // 颜色变化 (静态色 -> 高饱和色)
        if (p.agitated > 0.01) {
          const l = 100 - p.agitated * 40 // -> 60%
          const s = p.agitated * 100 // -> 100%
          ctx.fillStyle = `hsla(${p.hue}, ${s}%, ${l}%, ${p.opacity})`
        } else {
          ctx.fillStyle = p.staticColor
        }

        // 绘制
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // 根据悬停的活跃度触发音效（节流控制，避免太吵）
      if (activeParticlesInHover > 20) {
        const now = Date.now()
        // 鼠标移动越快/波及粒子越多，触发概率轻微上升，但保持至少 250ms 间隔
        if (now - lastNoteTime > 250 && Math.random() > 0.6) {
          playEtherealNote()
          lastNoteTime = now
        }
      }

      ctx.globalAlpha = 1
      animationFrameId = requestAnimationFrame(animate)
    }

    const bgParticlesUpdate = (p: Particle) => {
      p.x += p.vx
      p.y += p.vy
      // 边界循环
      if (p.x > canvas.width) p.x = 0
      if (p.x < 0) p.x = canvas.width
      if (p.y > canvas.height) p.y = 0
      if (p.y < 0) p.y = canvas.height
    }

    window.addEventListener('resize', resize)
    
    // 监听鼠标/触摸移动
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX = mouse.x
      let clientY = mouse.y

      if (e instanceof MouseEvent) {
        clientX = e.clientX
        clientY = e.clientY
      } else if (e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      }
      
      mouse.x = clientX
      mouse.y = clientY

      if (containerRef.current && !computeIsMobile()) {
        containerRef.current.style.setProperty('--mouse-x', `${clientX}px`)
        containerRef.current.style.setProperty('--mouse-y', `${clientY}px`)
      }
      
      // 顺便在此处尝试恢复 audioContext，以防浏览器策略限制
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
    }

    const handlePointerLeave = () => {
      // 离开时，不要将探照灯设置到 -9999px（导致完全黑屏），而是重置到屏幕中央
      mouse.x = -9999
      mouse.y = -9999
      if (containerRef.current && !computeIsMobile()) {
        containerRef.current.style.setProperty('--mouse-x', `50vw`)
        containerRef.current.style.setProperty('--mouse-y', `50vh`)
      }
    }

    let clickTimeoutId: ReturnType<typeof setTimeout>
    const EFFECTS = ['effect-ripple', 'effect-cinematic', 'effect-burst']
    let currentEffect = ''
    const visualLayers = () => [videoRef.current, fallbackRef.current].filter(Boolean) as Element[]

    const handlePointerClick = (e: MouseEvent | TouchEvent) => {
      // 移动端点击时，如果没有经过 move，需要强制更新一次坐标
      if (e && 'touches' in e && e.touches.length > 0) {
        handlePointerMove(e)
      } else if (e instanceof MouseEvent) {
        handlePointerMove(e)
      }

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume()
      }

      if (computeIsMobile()) {
        return
      }

      const layers = visualLayers()
      if (layers.length > 0) {
        if (currentEffect) {
          layers.forEach((el) => el.classList.remove(currentEffect))
        }
        
        currentEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)]
        layers.forEach((el) => el.classList.add('full-illumination', currentEffect))
        
        clearTimeout(clickTimeoutId)
        clickTimeoutId = setTimeout(() => {
          visualLayers().forEach((el) =>
            el.classList.remove('full-illumination', currentEffect),
          )
          currentEffect = ''
        }, 3000)
      }
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('touchmove', handlePointerMove)
    window.addEventListener('mouseleave', handlePointerLeave)
    window.addEventListener('touchend', handlePointerLeave)
    window.addEventListener('click', handlePointerClick)
    window.addEventListener('touchstart', handlePointerClick)

    // 初始化并开始动画
    resize()
    animate()
    const bootRaf = window.requestAnimationFrame(() => setCanvasReady(true))

    return () => {
      if (canvas) observer.unobserve(canvas)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('mouseleave', handlePointerLeave)
      window.removeEventListener('touchend', handlePointerLeave)
      window.removeEventListener('click', handlePointerClick)
      window.removeEventListener('touchstart', handlePointerClick)
      clearTimeout(clickTimeoutId)
      cancelAnimationFrame(animationFrameId)
      window.cancelAnimationFrame(bootRaf)
    }
  }, [text])

  const readyToReveal =
    (isMobile ? mobileGifReady || videoReady || videoFailed : videoReady || (videoFailed && fallbackReady)) &&
    canvasReady

  useEffect(() => {
    if (readyToReveal && minLoadingElapsed) {
      setProgress(100)
      const t = setTimeout(() => setIsFullyLoaded(true), 400) // Delay to let user see 100%
      return () => clearTimeout(t)
    }
  }, [readyToReveal, minLoadingElapsed])

  const showLoading = !isFullyLoaded && !forceHideLoading

  const loadingOverlay = createPortal(
    <div className={`home-loading${showLoading ? '' : ' hidden'}`}>
      <div className="lusion-loader-container">
        <div className="lusion-loader"></div>
        <div className="lusion-progress">
          {Math.floor(progress).toString().padStart(2, '0')}%
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <div
      ref={containerRef}
      className="particle-text"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      {loadingOverlay}
      {isMobile ? (
        <>
          {(() => {
            const showMobileVideo = videoPlaying || (mobileForceVideo && videoReady)
            return (
              <>
          <img
            ref={fallbackRef}
            src={gifSrc}
            alt=""
            aria-hidden="true"
            className={`mobile-bg${showMobileVideo ? ' hidden' : ''}`}
            loading="eager"
            onLoad={() => setMobileGifReady(true)}
            onError={() => setVideoFailed(true)}
          />
          <video
            ref={videoRef}
            className={`mobile-video${showMobileVideo ? '' : ' hidden'}`}
            src={mobileVideoSrc}
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
            onCanPlayThrough={() => setVideoReady(true)}
            onPlaying={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onError={() => setVideoFailed(true)}
          />
          <div className="mobile-bg-dim" aria-hidden="true" />
          <button
            type="button"
            className={`mobile-works-cta${showMobileWorksCta ? ' visible' : ''}`}
            aria-label="Open works"
            onClick={() =>
              navigate({ pathname: '/digitalart', search: location.search })
            }
          >
            <svg
              width="213"
              height="52"
              viewBox="0 0 213 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="213" height="52" rx="26" fill="white" />
              <path
                d="M35.0529 27.584C35.0529 26.6773 35.2343 25.8827 35.5969 25.2C35.9703 24.5067 36.4823 23.9733 37.1329 23.6C37.7836 23.2267 38.5303 23.04 39.3729 23.04C40.4396 23.04 41.3196 23.296 42.0129 23.808C42.7169 24.3093 43.1916 25.0293 43.4369 25.968H41.4689C41.3089 25.5307 41.0529 25.1893 40.7009 24.944C40.3489 24.6987 39.9063 24.576 39.3729 24.576C38.6263 24.576 38.0289 24.8427 37.5809 25.376C37.1436 25.8987 36.9249 26.6347 36.9249 27.584C36.9249 28.5333 37.1436 29.2747 37.5809 29.808C38.0289 30.3413 38.6263 30.608 39.3729 30.608C40.4289 30.608 41.1276 30.144 41.4689 29.216H43.4369C43.1809 30.112 42.7009 30.8267 41.9969 31.36C41.2929 31.8827 40.4183 32.144 39.3729 32.144C38.5303 32.144 37.7836 31.9573 37.1329 31.584C36.4823 31.2 35.9703 30.6667 35.5969 29.984C35.2343 29.2907 35.0529 28.4907 35.0529 27.584ZM49.0787 32.144C48.2467 32.144 47.4947 31.9573 46.8227 31.584C46.1507 31.2 45.6227 30.6667 45.2387 29.984C44.8547 29.2907 44.6627 28.4907 44.6627 27.584C44.6627 26.688 44.86 25.8933 45.2547 25.2C45.6494 24.5067 46.188 23.9733 46.8707 23.6C47.5534 23.2267 48.316 23.04 49.1587 23.04C50.0014 23.04 50.764 23.2267 51.4467 23.6C52.1294 23.9733 52.668 24.5067 53.0627 25.2C53.4574 25.8933 53.6547 26.688 53.6547 27.584C53.6547 28.48 53.452 29.2747 53.0467 29.968C52.6414 30.6613 52.0867 31.2 51.3827 31.584C50.6894 31.9573 49.9214 32.144 49.0787 32.144ZM49.0787 30.56C49.548 30.56 49.9854 30.448 50.3907 30.224C50.8067 30 51.1427 29.664 51.3987 29.216C51.6547 28.768 51.7827 28.224 51.7827 27.584C51.7827 26.944 51.66 26.4053 51.4147 25.968C51.1694 25.52 50.844 25.184 50.4387 24.96C50.0334 24.736 49.596 24.624 49.1267 24.624C48.6574 24.624 48.22 24.736 47.8147 24.96C47.42 25.184 47.1054 25.52 46.8707 25.968C46.636 26.4053 46.5187 26.944 46.5187 27.584C46.5187 28.5333 46.7587 29.2693 47.2387 29.792C47.7294 30.304 48.3427 30.56 49.0787 30.56ZM66.1298 23.04C66.8231 23.04 67.4418 23.184 67.9858 23.472C68.5405 23.76 68.9725 24.1867 69.2818 24.752C69.6018 25.3173 69.7618 26 69.7618 26.8V32H67.9538V27.072C67.9538 26.2827 67.7565 25.68 67.3618 25.264C66.9671 24.8373 66.4285 24.624 65.7458 24.624C65.0631 24.624 64.5191 24.8373 64.1138 25.264C63.7191 25.68 63.5218 26.2827 63.5218 27.072V32H61.7138V27.072C61.7138 26.2827 61.5165 25.68 61.1218 25.264C60.7271 24.8373 60.1885 24.624 59.5058 24.624C58.8231 24.624 58.2791 24.8373 57.8738 25.264C57.4791 25.68 57.2818 26.2827 57.2818 27.072V32H55.4578V23.184H57.2818V24.192C57.5805 23.8293 57.9591 23.5467 58.4178 23.344C58.8765 23.1413 59.3671 23.04 59.8898 23.04C60.5938 23.04 61.2231 23.1893 61.7778 23.488C62.3325 23.7867 62.7591 24.2187 63.0578 24.784C63.3245 24.2507 63.7405 23.8293 64.3058 23.52C64.8711 23.2 65.4791 23.04 66.1298 23.04ZM80.1628 27.376C80.1628 27.7067 80.1415 28.0053 80.0988 28.272H73.3628C73.4161 28.976 73.6775 29.5413 74.1468 29.968C74.6161 30.3947 75.1921 30.608 75.8748 30.608C76.8561 30.608 77.5495 30.1973 77.9548 29.376H79.9228C79.6561 30.1867 79.1708 30.8533 78.4668 31.376C77.7735 31.888 76.9095 32.144 75.8748 32.144C75.0321 32.144 74.2748 31.9573 73.6028 31.584C72.9415 31.2 72.4188 30.6667 72.0348 29.984C71.6615 29.2907 71.4748 28.4907 71.4748 27.584C71.4748 26.6773 71.6561 25.8827 72.0188 25.2C72.3921 24.5067 72.9095 23.9733 73.5708 23.6C74.2428 23.2267 75.0108 23.04 75.8748 23.04C76.7068 23.04 77.4481 23.2213 78.0988 23.584C78.7495 23.9467 79.2561 24.4587 79.6188 25.12C79.9815 25.7707 80.1628 26.5227 80.1628 27.376ZM78.2588 26.8C78.2481 26.128 78.0081 25.5893 77.5388 25.184C77.0695 24.7787 76.4881 24.576 75.7948 24.576C75.1655 24.576 74.6268 24.7787 74.1788 25.184C73.7308 25.5787 73.4641 26.1173 73.3788 26.8H78.2588ZM88.2421 24.672V29.552C88.2421 29.8827 88.3167 30.1227 88.4661 30.272C88.6261 30.4107 88.8927 30.48 89.2661 30.48H90.3861V32H88.9461C88.1247 32 87.4954 31.808 87.0581 31.424C86.6207 31.04 86.4021 30.416 86.4021 29.552V24.672H85.3621V23.184H86.4021V20.992H88.2421V23.184H90.3861V24.672H88.2421ZM95.8912 32.144C95.0592 32.144 94.3072 31.9573 93.6352 31.584C92.9632 31.2 92.4352 30.6667 92.0512 29.984C91.6672 29.2907 91.4752 28.4907 91.4752 27.584C91.4752 26.688 91.6725 25.8933 92.0672 25.2C92.4619 24.5067 93.0005 23.9733 93.6832 23.6C94.3659 23.2267 95.1285 23.04 95.9712 23.04C96.8139 23.04 97.5765 23.2267 98.2592 23.6C98.9419 23.9733 99.4805 24.5067 99.8752 25.2C100.27 25.8933 100.467 26.688 100.467 27.584C100.467 28.48 100.265 29.2747 99.8592 29.968C99.4539 30.6613 98.8992 31.2 98.1952 31.584C97.5019 31.9573 96.7339 32.144 95.8912 32.144ZM95.8912 30.56C96.3605 30.56 96.7979 30.448 97.2032 30.224C97.6192 30 97.9552 29.664 98.2112 29.216C98.4672 28.768 98.5952 28.224 98.5952 27.584C98.5952 26.944 98.4725 26.4053 98.2272 25.968C97.9819 25.52 97.6565 25.184 97.2512 24.96C96.8459 24.736 96.4085 24.624 95.9392 24.624C95.4699 24.624 95.0325 24.736 94.6272 24.96C94.2325 25.184 93.9179 25.52 93.6832 25.968C93.4485 26.4053 93.3312 26.944 93.3312 27.584C93.3312 28.5333 93.5712 29.2693 94.0512 29.792C94.5419 30.304 95.1552 30.56 95.8912 30.56ZM109.915 27.6L113.979 32H111.515L108.251 28.208V32H106.427V20.16H108.251V27.04L111.451 23.184H113.979L109.915 27.6ZM119.734 23.04C120.427 23.04 121.046 23.184 121.59 23.472C122.145 23.76 122.577 24.1867 122.886 24.752C123.195 25.3173 123.35 26 123.35 26.8V32H121.542V27.072C121.542 26.2827 121.345 25.68 120.95 25.264C120.555 24.8373 120.017 24.624 119.334 24.624C118.651 24.624 118.107 24.8373 117.702 25.264C117.307 25.68 117.11 26.2827 117.11 27.072V32H115.286V23.184H117.11V24.192C117.409 23.8293 117.787 23.5467 118.246 23.344C118.715 23.1413 119.211 23.04 119.734 23.04ZM129.501 32.144C128.669 32.144 127.917 31.9573 127.245 31.584C126.573 31.2 126.045 30.6667 125.661 29.984C125.277 29.2907 125.085 28.4907 125.085 27.584C125.085 26.688 125.282 25.8933 125.677 25.2C126.071 24.5067 126.61 23.9733 127.293 23.6C127.975 23.2267 128.738 23.04 129.581 23.04C130.423 23.04 131.186 23.2267 131.869 23.6C132.551 23.9733 133.09 24.5067 133.485 25.2C133.879 25.8933 134.077 26.688 134.077 27.584C134.077 28.48 133.874 29.2747 133.469 29.968C133.063 30.6613 132.509 31.2 131.805 31.584C131.111 31.9573 130.343 32.144 129.501 32.144ZM129.501 30.56C129.97 30.56 130.407 30.448 130.813 30.224C131.229 30 131.565 29.664 131.821 29.216C132.077 28.768 132.205 28.224 132.205 27.584C132.205 26.944 132.082 26.4053 131.837 25.968C131.591 25.52 131.266 25.184 130.861 24.96C130.455 24.736 130.018 24.624 129.549 24.624C129.079 24.624 128.642 24.736 128.237 24.96C127.842 25.184 127.527 25.52 127.293 25.968C127.058 26.4053 126.941 26.944 126.941 27.584C126.941 28.5333 127.181 29.2693 127.661 29.792C128.151 30.304 128.765 30.56 129.501 30.56ZM147.72 23.184L144.984 32H143.064L141.288 25.488L139.512 32H137.592L134.84 23.184H136.696L138.536 30.272L140.408 23.184H142.312L144.104 30.24L145.928 23.184H147.72ZM163.911 23.04C164.604 23.04 165.223 23.184 165.767 23.472C166.322 23.76 166.754 24.1867 167.063 24.752C167.383 25.3173 167.543 26 167.543 26.8V32H165.735V27.072C165.735 26.2827 165.538 25.68 165.143 25.264C164.748 24.8373 164.21 24.624 163.527 24.624C162.844 24.624 162.3 24.8373 161.895 25.264C161.5 25.68 161.303 26.2827 161.303 27.072V32H159.495V27.072C159.495 26.2827 159.298 25.68 158.903 25.264C158.508 24.8373 157.97 24.624 157.287 24.624C156.604 24.624 156.06 24.8373 155.655 25.264C155.26 25.68 155.063 26.2827 155.063 27.072V32H153.239V23.184H155.063V24.192C155.362 23.8293 155.74 23.5467 156.199 23.344C156.658 23.1413 157.148 23.04 157.671 23.04C158.375 23.04 159.004 23.1893 159.559 23.488C160.114 23.7867 160.54 24.2187 160.839 24.784C161.106 24.2507 161.522 23.8293 162.087 23.52C162.652 23.2 163.26 23.04 163.911 23.04ZM177.944 27.376C177.944 27.7067 177.923 28.0053 177.88 28.272H171.144C171.197 28.976 171.459 29.5413 171.928 29.968C172.397 30.3947 172.973 30.608 173.656 30.608C174.637 30.608 175.331 30.1973 175.736 29.376H177.704C177.437 30.1867 176.952 30.8533 176.248 31.376C175.555 31.888 174.691 32.144 173.656 32.144C172.813 32.144 172.056 31.9573 171.384 31.584C170.723 31.2 170.2 30.6667 169.816 29.984C169.443 29.2907 169.256 28.4907 169.256 27.584C169.256 26.6773 169.437 25.8827 169.8 25.2C170.173 24.5067 170.691 23.9733 171.352 23.6C172.024 23.2267 172.792 23.04 173.656 23.04C174.488 23.04 175.229 23.2213 175.88 23.584C176.531 23.9467 177.037 24.4587 177.4 25.12C177.763 25.7707 177.944 26.5227 177.944 27.376ZM176.04 26.8C176.029 26.128 175.789 25.5893 175.32 25.184C174.851 24.7787 174.269 24.576 173.576 24.576C172.947 24.576 172.408 24.7787 171.96 25.184C171.512 25.5787 171.245 26.1173 171.16 26.8H176.04Z"
                fill="black"
              />
            </svg>
          </button>
              </>
            )
          })()}
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            className="video-bg"
            src={videoSrc}
            poster={posterSrc}
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoReady(true)}
            onCanPlayThrough={() => setVideoReady(true)}
            onPlaying={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onError={() => setVideoFailed(true)}
          />
          <img
            ref={fallbackRef}
            src={posterSrc}
            alt=""
            aria-hidden="true"
            className={`video-fallback${videoPlaying ? ' hidden' : ''}`}
            decoding="async"
            loading="eager"
            onLoad={() => setFallbackReady(true)}
          />
        </>
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 1,
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}
