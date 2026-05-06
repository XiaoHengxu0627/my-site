import { useEffect, useMemo } from 'react'
import ParticleText from '../components/ParticleText'
import CursorHint from '../components/CursorHint'
import { useContent } from '../lib/content'

export default function Home() {
  const content = useContent()

  useEffect(() => {
    document.body.classList.add('home-mode')
    return () => {
      document.body.classList.remove('home-mode')
    }
  }, [])

  const brandText = useMemo(() => {
    if (content.status !== 'ready') return ''
    return content.t(content.site.brand)
  }, [content])

  return (
    <div className="home-page" role="main" aria-label={brandText || 'Home'}>
      {brandText && <ParticleText text={brandText} />}
      <CursorHint 
        text={content.t({ zh: '尝试点击屏幕探索更多', en: 'Click anywhere to explore' })} 
        idleTime={5000} 
      />
    </div>
  )
}
