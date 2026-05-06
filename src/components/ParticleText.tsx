import { useEffect, useRef } from 'react'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

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

    // 初始化尺寸
    const resize = () => {
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

      const fontSize = Math.min(window.innerWidth / 8, 120)
      offCtx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
      offCtx.fillStyle = '#ffffff'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.letterSpacing = '0.05em'

      offCtx.fillText(text, offscreen.width / 2, offscreen.height / 2)

      const textCoordinates = offCtx.getImageData(0, 0, offscreen.width, offscreen.height)
      const data = textCoordinates.data

      let coords: {x: number, y: number}[] = []
      
      for (let y = 0; y < offscreen.height; y += 2) {
        for (let x = 0; x < offscreen.width; x += 2) {
          const alpha = data[(y * offscreen.width + x) * 4 + 3]
          if (alpha > 128) {
            coords.push({x, y})
          }
        }
      }

      // Shuffle and limit count
      coords.sort(() => Math.random() - 0.5)
      
      let targetCount = Math.max(3000, Math.min(5000, coords.length))
      if (coords.length < 3000) {
        while(coords.length < 3000) {
          coords = coords.concat(coords.slice(0, 3000 - coords.length))
        }
        targetCount = 3000
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
      let clientX = -9999
      let clientY = -9999

      if (e instanceof MouseEvent) {
        clientX = e.clientX
        clientY = e.clientY
      } else if (e.touches.length > 0) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      }
      
      mouse.x = clientX
      mouse.y = clientY

      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `${clientX}px`)
        containerRef.current.style.setProperty('--mouse-y', `${clientY}px`)
      }
      
      // 顺便在此处尝试恢复 audioContext，以防浏览器策略限制
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume()
      }
    }

    const handlePointerLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
      if (containerRef.current) {
        containerRef.current.style.setProperty('--mouse-x', `-9999px`)
        containerRef.current.style.setProperty('--mouse-y', `-9999px`)
      }
    }

    let clickTimeoutId: ReturnType<typeof setTimeout>
    const EFFECTS = ['effect-ripple', 'effect-cinematic', 'effect-burst']
    let currentEffect = ''

    const handlePointerClick = () => {
      if (videoRef.current) {
        if (currentEffect) {
          videoRef.current.classList.remove(currentEffect)
        }
        
        currentEffect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)]
        videoRef.current.classList.add('full-illumination', currentEffect)
        
        clearTimeout(clickTimeoutId)
        clickTimeoutId = setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.classList.remove('full-illumination', currentEffect)
            currentEffect = ''
          }
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
    }
  }, [text])

  return (
    <div
      ref={containerRef}
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
      <video
        ref={videoRef}
        className="video-bg"
        src="/media/video.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          transform: 'translateZ(0)',
        }}
      />
    </div>
  )
}
