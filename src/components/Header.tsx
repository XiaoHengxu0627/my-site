import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'
import { useContent } from '../lib/content'
import { useLocale } from '../lib/locale'
import { cx } from '../lib/cx.ts'

export default function Header() {
  const { locale, setLocale } = useLocale()
  const content = useContent()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [clickedBot, setClickedBot] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipPosRef = useRef({ x: 0, y: 0 })
  const botLinkRef = useRef<HTMLAnchorElement | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isBotPage = location.pathname === '/bot'
  const showDot = !isBotPage && !clickedBot

  const handleBotClick = useCallback(() => {
    setClickedBot(true)
  }, [])

  const handleBotMouseEnter = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      if (botLinkRef.current) {
        const rect = botLinkRef.current.getBoundingClientRect()
        tooltipPosRef.current = { x: rect.left + rect.width / 2, y: rect.bottom + 8 }
      }
      setTooltipVisible(true)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      tooltipTimer.current = setTimeout(() => setTooltipVisible(false), 3000)
    }, 500)
  }, [])

  const handleBotMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    setTooltipVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    }
  }, [])

  const { isHome, title } = useMemo(() => {
    const pathname = location.pathname.replace(/\/+$/, '')
    const home = pathname === '' || pathname === '/' || pathname === '/home'

    const t = (zh: string, en: string) => (locale === 'zh' ? zh : en)

    if (home) {
      return { isHome: true, title: '' }
    }

    if (pathname === '/bot') return { isHome: false, title: t('Hank Bot', 'Hank Bot') }
    if (pathname === '/about') return { isHome: false, title: t('经历', 'Experience') }
    if (pathname === '/contact') return { isHome: false, title: t('联系', 'Contact') }

    if (
      pathname === '/digitalart' ||
      pathname === '/installation' ||
      pathname === '/performance'
    ) {
      return { isHome: false, title: t('作品', 'Works') }
    }

    const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname
    if (content.status === 'ready') {
      const project = content.projects.find((p) => p.slug === slug)
      if (project) return { isHome: false, title: content.t(project.title) }
    }

    return { isHome: false, title: t('作品', 'Work') }
  }, [content, locale, location.pathname])

  const nav = useMemo(() => {
    if (content.status !== 'ready') return []
    return content.site.nav
  }, [content])

  const brandText = useMemo(() => {
    if (content.status !== 'ready') return ''
    return content.t(content.site.brand)
  }, [content])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          to={{ pathname: '/digitalart', search: location.search }}
          className={cx('brand', !isHome && 'brand-hidden')}
          aria-label={brandText || 'Home'}
          onClick={() => setMenuOpen(false)}
        >
          <BrandMark text={brandText} />
        </Link>

        {!isHome && title ? <div className="header-title">{title}</div> : null}

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg
            aria-hidden="true"
            className="menu-toggle-icon"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M122.7 229.4h781.1c20.7 0 37.5-16.8 37.5-37.5s-16.8-37.5-37.5-37.5H122.7c-20.7 0-37.5 16.8-37.5 37.5s16.8 37.5 37.5 37.5zM903.8 473.1H122.7c-20.7 0-37.5 16.8-37.5 37.5s16.8 37.5 37.5 37.5h781.1c20.7 0 37.5-16.8 37.5-37.5-0.1-20.7-16.9-37.5-37.5-37.5zM903.8 791H122.7c-20.7 0-37.5 16.8-37.5 37.5S102 866 122.7 866h781.1c20.7 0 37.5-16.8 37.5-37.5S924.4 791 903.8 791z"
              fill="currentColor"
            />
          </svg>
        </button>

        <nav className={cx('nav', menuOpen && 'nav-open')}>
          <ul className="nav-list">
            {nav.map((item) => (
              <li key={item.to} className="nav-item">
                {item.to === '/bot' ? (
                  <NavLink
                    ref={botLinkRef}
                    to={{ pathname: item.to, search: location.search }}
                    className={({ isActive }) =>
                      cx(
                        'nav-link',
                        isActive && 'nav-link-active',
                        location.pathname === item.to && 'nav-link-active',
                      )
                    }
                    onClick={() => {
                      setMenuOpen(false)
                      handleBotClick()
                    }}
                    onMouseEnter={handleBotMouseEnter}
                    onMouseLeave={handleBotMouseLeave}
                    style={{ position: 'relative' }}
                  >
                    {content.status === 'ready' ? content.t(item.label) : ''}
                    {showDot ? (
                      <svg className="bot-notify-dot" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M7.08444 11.0844L8.55132 6.68377H10.4487L11.9156 11.0844L16.3162 12.5513V14.4487L11.9156 15.9156L10.4487 20.3162H8.55132L7.08444 15.9156L2.68378 14.4487V12.5513L7.08444 11.0844ZM9.5 10.1623L8.82369 12.1912L8.19123 12.8237L6.16228 13.5L8.19123 14.1763L8.82369 14.8088L9.5 16.8377L10.1763 14.8088L10.8088 14.1763L12.8377 13.5L10.8088 12.8237L10.1763 12.1912L9.5 10.1623Z" fill="url(#sparkle-grad)"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M16.1507 5.15066L16.9308 2.81026H18.0692L18.8493 5.15066L21.1897 5.93079V7.06921L18.8493 7.84934L18.0692 10.1897H16.9308L16.1507 7.84934L13.8103 7.06921V5.93079L16.1507 5.15066Z" fill="url(#sparkle-grad)"/>
                        <defs>
                          <linearGradient id="sparkle-grad" x1="11.9368" y1="2.81026" x2="11.9368" y2="20.3162" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00FFE1"/>
                            <stop offset="1" stopColor="#2B00FF"/>
                          </linearGradient>
                        </defs>
                      </svg>
                    ) : null}
                  </NavLink>
                ) : (
                  <NavLink
                    to={{ pathname: item.to, search: location.search }}
                    className={({ isActive }) =>
                      cx(
                        'nav-link',
                        isActive && 'nav-link-active',
                        location.pathname === item.to && 'nav-link-active',
                      )
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {content.status === 'ready' ? content.t(item.label) : ''}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>

          <div
            className="lang-switch"
            role="group"
            aria-label={`Language Selector: ${locale === 'zh' ? 'Chinese' : 'English'}`}
          >
            <button
              type="button"
              className={cx('lang-option', locale === 'zh' && 'lang-option-active')}
              aria-label="Chinese"
              aria-current={locale === 'zh'}
              onClick={() => setLocale('zh')}
            >
              <div className="lang-label">中文</div>
            </button>
            <button
              type="button"
              className={cx('lang-option', locale === 'en' && 'lang-option-active')}
              aria-label="English"
              aria-current={locale === 'en'}
              onClick={() => setLocale('en')}
            >
              <div className="lang-label">English</div>
            </button>
          </div>
        </nav>
      </div>

      <div
        className={`bot-notify-tooltip${tooltipVisible ? ' visible' : ''}`}
        style={{
          left: tooltipPosRef.current.x,
          top: tooltipPosRef.current.y,
        }}
      >
        来了解我负责的产品～
      </div>
    </header>
  )
}
