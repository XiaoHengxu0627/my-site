import { useEffect, useMemo } from 'react'
import ParticleText from '../components/ParticleText'
import { useContent } from '../lib/content'

export default function Home() {
  const content = useContent()

  useEffect(() => {
    document.body.classList.add('home-mode')
    document.documentElement.classList.add('home-mode')
    document.body.style.setProperty('--home-scroll', '0')
    
    return () => {
      document.body.classList.remove('home-mode')
      document.documentElement.classList.remove('home-mode')
      document.body.style.removeProperty('--home-scroll')
    }
  }, [])

  const brandText = useMemo(() => {
    if (content.status !== 'ready') return ''
    return content.t(content.site.brand)
  }, [content])

  return (
    <div className="home-page" role="main" aria-label={brandText || 'Home'}>
      {brandText && <ParticleText text={brandText} />}
    </div>
  )
}
