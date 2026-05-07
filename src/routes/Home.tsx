import { useEffect, useMemo } from 'react'
import ParticleText from '../components/ParticleText'
import CursorHint from '../components/CursorHint'
import { useContent } from '../lib/content'

export default function Home() {
  const content = useContent()

  useEffect(() => {
    document.body.classList.add('home-mode')
    document.body.style.setProperty('--home-scroll', '0')
    return () => {
      document.body.classList.remove('home-mode')
      document.body.classList.remove('home-scrolled')
      document.body.style.removeProperty('--home-scroll')
    }
  }, [])

  useEffect(() => {
    const thresholdPx = 140
    let rafId = 0
    let ticking = false

    const update = () => {
      ticking = false

      const scrollY = window.scrollY || 0
      const doc = document.documentElement
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight)
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll))

      document.body.style.setProperty('--home-scroll', String(progress))
      document.body.classList.toggle('home-scrolled', scrollY > thresholdPx)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafId = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  const brandText = useMemo(() => {
    if (content.status !== 'ready') return ''
    return content.t(content.site.brand)
  }, [content])

  return (
    <>
      <div className="home-scroll-spacer" aria-hidden="true" />
      <div className="home-page" role="main" aria-label={brandText || 'Home'}>
        {brandText && <ParticleText text={brandText} />}
        <CursorHint
          text={content.t({ zh: '尝试点击屏幕探索更多', en: 'Click anywhere to explore' })}
          idleTime={5000}
        />
      </div>
    </>
  )
}
