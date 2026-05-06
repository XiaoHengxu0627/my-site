import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocale, type Locale } from './locale'

export type LocalizedString = { zh: string; en: string }
export type SectionId = 'digitalart' | 'installation' | 'performance'

export type SiteNavItem = {
  to: string
  label: LocalizedString
}

export type SocialLink = {
  label: string
  href: string
}

export type ResumeEntry = {
  title: LocalizedString
  time?: LocalizedString
  description?: LocalizedString
  bullets?: LocalizedString[]
}

export type ResumeSection = {
  title: LocalizedString
  items: ResumeEntry[]
}

export type SiteContent = {
  brand: LocalizedString
  nav: SiteNavItem[]
  footer: {
    copyright: string
    socials: SocialLink[]
  }
  pages: {
    about: {
      title: LocalizedString
      body: LocalizedString
      photo?: string
      heading?: LocalizedString
      tagline?: LocalizedString
      resumeSections?: ResumeSection[]
    }
    contact: {
      title: LocalizedString
      body: LocalizedString
      email: string
    }
  }
}

export type Media =
  | { type: 'image'; src: string; alt?: LocalizedString }
  | { type: 'video'; src: string; poster?: string; title?: LocalizedString }

export type Project = {
  slug: string
  section: SectionId
  title: LocalizedString
  subtitle: LocalizedString
  year?: number
  cover: string
  hero?: string
  description: LocalizedString
  gallery?: Media[]
  awards?: LocalizedString[]
}

export type ContentState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; site: SiteContent; projects: Project[] }

type ContentContextValue = ContentState & {
  locale: Locale
  t: (value: LocalizedString | undefined) => string
}

const ContentContext = createContext<ContentContextValue | null>(null)

type CmsSite = {
  brandZh: string
  brandEn: string
  email: string
  aboutTitleZh: string
  aboutTitleEn: string
  aboutBodyZh: string
  aboutBodyEn: string
  aboutPhoto?: string
  aboutHeadingZh?: string
  aboutHeadingEn?: string
  aboutTaglineZh?: string
  aboutTaglineEn?: string
  resumeSections?: {
    titleZh: string
    titleEn: string
    items: {
      titleZh: string
      titleEn: string
      timeZh?: string
      timeEn?: string
      descZh?: string
      descEn?: string
      bulletsZh?: string[]
      bulletsEn?: string[]
    }[]
  }[]
  contactTitleZh: string
  contactTitleEn: string
  contactBodyZh: string
  contactBodyEn: string
  copyright: string
  socials: SocialLink[]
}

type CmsGalleryItem = {
  type: 'image' | 'video'
  src: string
  poster?: string
  titleZh?: string
  titleEn?: string
}

type CmsProject = {
  slug: string
  section: SectionId
  titleZh: string
  titleEn: string
  subtitleZh: string
  subtitleEn: string
  year?: number
  cover: string
  hero?: string
  descZh: string
  descEn: string
  gallery?: CmsGalleryItem[]
  awards?: LocalizedString[]
}

type CmsProjects = {
  projects: CmsProject[]
}

function toLocalized(zh?: string, en?: string): LocalizedString | undefined {
  if (!zh && !en) return undefined
  return { zh: zh ?? '', en: en ?? '' }
}

function zipLocalizedArray(
  zh: string[] | undefined,
  en: string[] | undefined,
): LocalizedString[] | undefined {
  if (!zh?.length && !en?.length) return undefined
  const max = Math.max(zh?.length ?? 0, en?.length ?? 0)
  return Array.from({ length: max }, (_, i) => ({
    zh: zh?.[i] ?? '',
    en: en?.[i] ?? '',
  }))
}

const DEFAULT_NAV: SiteNavItem[] = [
  { to: '/home', label: { zh: '主页', en: 'Home' } },
  { to: '/digitalart', label: { zh: '作品', en: 'Works' } },
  { to: '/about', label: { zh: '简介', en: 'About' } },
  { to: '/contact', label: { zh: '联系', en: 'Contact' } },
]

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale()
  const [state, setState] = useState<ContentState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([
      fetchJson<CmsSite>('/content/site.json'),
      fetchJson<CmsProjects>('/content/projects.json'),
    ])
      .then(([cmsSite, cmsProjects]) => {
        if (cancelled) return
        const site: SiteContent = {
          brand: { zh: cmsSite.brandZh, en: cmsSite.brandEn },
          nav: DEFAULT_NAV,
          footer: {
            copyright: cmsSite.copyright,
            socials: cmsSite.socials,
          },
          pages: {
            about: {
              title: { zh: cmsSite.aboutTitleZh, en: cmsSite.aboutTitleEn },
              body: { zh: cmsSite.aboutBodyZh, en: cmsSite.aboutBodyEn },
              photo: cmsSite.aboutPhoto,
              heading: toLocalized(cmsSite.aboutHeadingZh, cmsSite.aboutHeadingEn),
              tagline: toLocalized(cmsSite.aboutTaglineZh, cmsSite.aboutTaglineEn),
              resumeSections: cmsSite.resumeSections?.map((s) => ({
                title: { zh: s.titleZh, en: s.titleEn },
                items: s.items.map((it) => ({
                  title: { zh: it.titleZh, en: it.titleEn },
                  time: toLocalized(it.timeZh, it.timeEn),
                  description: toLocalized(it.descZh, it.descEn),
                  bullets: zipLocalizedArray(it.bulletsZh, it.bulletsEn),
                })),
              })),
            },
            contact: {
              title: {
                zh: cmsSite.contactTitleZh,
                en: cmsSite.contactTitleEn,
              },
              body: { zh: cmsSite.contactBodyZh, en: cmsSite.contactBodyEn },
              email: cmsSite.email,
            },
          },
        }

        const projects: Project[] = cmsProjects.projects.map((p) => ({
          slug: p.slug,
          section: p.section,
          title: { zh: p.titleZh, en: p.titleEn },
          subtitle: { zh: p.subtitleZh, en: p.subtitleEn },
          year: p.year,
          cover: p.cover,
          hero: p.hero,
          description: { zh: p.descZh, en: p.descEn },
          gallery: p.gallery?.map((m) => {
            const text =
              m.titleZh || m.titleEn
                ? { zh: m.titleZh ?? '', en: m.titleEn ?? '' }
                : undefined
            if (m.type === 'video') {
              return { type: 'video', src: m.src, poster: m.poster, title: text }
            }
            return { type: 'image', src: m.src, alt: text }
          }),
          awards: p.awards,
        }))

        setState({ status: 'ready', site, projects })
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Failed to load content'
        setState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const t = useMemo(
    () => (value: LocalizedString | undefined) => {
      if (!value) return ''
      return locale === 'en' ? value.en : value.zh
    },
    [locale],
  )

  const ctxValue: ContentContextValue = useMemo(
    () => ({ ...state, locale, t }),
    [state, locale, t],
  )

  return (
    <ContentContext.Provider value={ctxValue}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}
