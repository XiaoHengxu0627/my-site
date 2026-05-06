import { useMemo } from 'react'
import { useContent } from '../lib/content'

function getSocialKind(label: string, href: string): 'xhs' | 'douyin' | null {
  const l = label.trim()
  const h = href.toLowerCase()
  if (l.includes('小红书') || h.includes('xhslink.com') || h.includes('xiaohongshu'))
    return 'xhs'
  if (l.includes('抖音') || h.includes('douyin.com') || h.includes('douyin'))
    return 'douyin'
  return null
}

function SocialIcon({ label, href }: { label: string; href: string }) {
  const kind = getSocialKind(label, href)
  if (!kind) return null

  if (kind === 'xhs') {
    return (
      <svg
        className="social-icon-svg social-icon-xhs"
        viewBox="0 0 1024 1024"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path d="M19.242667 401.066667h68.053333s-7.936 113.962667-10.026667 133.973333c-2.090667 20.053333-9.6 73.898667-39.253333 108.117333L3.370667 567.594667c0 0.042667 7.936-7.509333 15.872-166.528zM133.461333 310.656h68.437334v315.008s-13.909333 49.536-52.309334 48.981333h-36.736l-29.866666-59.349333h44.074666c4.736 0 4.608-6.528 4.608-4.778667 0.042667 3.882667 1.792-299.861333 1.792-299.861333zM476.288 307.84l-34.517333 77.909333s-6.101333 15.573333 3.882666 16.128c10.026667 0.554667 57.301333 0 57.301334 0l-47.872 107.392s-4.992 13.909333 4.437333 13.909334h35.626667l-23.722667 55.637333h-78.08s-33.962667-4.992-20.053333-35.626667 34.517333-79.018667 34.517333-79.018666l-35.072 0.554666s-31.701333-6.698667-16.128-38.954666c15.573333-32.298667 54.528-117.973333 54.528-117.973334h65.152zM247.552 400.256H314.88s8.917333 162.773333 16 163.370667l-34.389333 77.610666s-31.701333-23.936-40.064-120.490666c-6.869333-79.701333-8.874667-120.490667-8.874667-120.490667zM362.752 600.576s2.218667 6.101333 27.818667 6.101333h77.909333l-31.146667 67.328H354.389333s-24.192 0.554667-23.509333-7.253333l31.872-66.176zM679.424 333.44v67.370667h-42.325333v205.909333h65.706666v67.328h-225.408l29.482667-66.773333h57.898667l1.109333-207.018667-40.618667-0.554667-1.664-66.261333z" />
        <path d="M1024 615.04v-94.592c0-56.192-59.648-58.453333-59.648-58.453333h-17.237333V399.658667c0.554667-57.301333-68.992-66.218667-68.992-66.218667h-42.837334v-26.154667h-66.773333l1.109333 26.154667h-47.317333v66.218667h45.653333v62.890666H698.88v67.328l68.992 0.554667v143.573333h67.328V529.92h107.392c14.464 0 15.573333 14.464 15.573333 14.464s3.626667 39.381333 2.645334 56.192c-0.981333 16.682667-13.226667 15.573333-13.226667 15.573333h-55.637333l26.709333 57.898667h50.645333c59.050667 0 54.698667-59.008 54.698667-59.008z m-142.592-209.493333v55.637333H834.133333V400.512h40.362667c7.808 0 6.912 5.034667 6.912 5.034667z" />
        <path d="M992 398.549333H960v-32c0-17.578667 14.421333-32 32-32 17.621333 0 32 14.421333 32 32s-14.378667 32-32 32z" />
      </svg>
    )
  }

  return (
    <svg
      className="social-icon-svg social-icon-douyin"
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M937.4 423.9c-84 0-165.7-27.3-232.9-77.8v352.3c0 179.9-138.6 325.6-309.6 325.6S85.3 878.3 85.3 698.4c0-179.9 138.6-325.6 309.6-325.6 17.1 0 33.7 1.5 49.9 4.3v186.6c-15.5-6.1-32-9.2-48.6-9.2-76.3 0-138.2 65-138.2 145.3 0 80.2 61.9 145.3 138.2 145.3 76.2 0 138.1-65.1 138.1-145.3V0H707c0 134.5 103.7 243.5 231.6 243.5v180.3l-1.2 0.1" />
    </svg>
  )
}

export default function Footer() {
  const content = useContent()

  const socials = useMemo(() => {
    if (content.status !== 'ready') return []
    return content.site.footer.socials
  }, [content])

  const copyright = useMemo(() => {
    if (content.status !== 'ready') return ''
    return content.site.footer.copyright
  }, [content])

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-socials">
          {socials.map((s) => (
            <a
              key={s.href}
              className="social-link"
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
            >
              <span className="social-icon">
                <SocialIcon label={s.label} href={s.href} />
              </span>
              <span className="social-label">{s.label}</span>
            </a>
          ))}
        </div>
        <div className="footer-copy">{copyright}</div>
      </div>
    </footer>
  )
}
