import { useMemo, useState } from 'react'
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
          className="brand"
          aria-label={brandText || 'Home'}
          onClick={() => setMenuOpen(false)}
        >
          <BrandMark text={brandText} />
        </Link>

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
    </header>
  )
}
