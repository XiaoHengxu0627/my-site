import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useContent } from '../lib/content'

export default function ProjectDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const content = useContent()
  if (content.status !== 'ready') return null

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const project = useMemo(
    () => content.projects.find((p) => p.slug === slug),
    [content.projects, slug],
  )

  useEffect(() => {
    if (lightboxIndex === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightboxIndex])

  if (!project) {
    return (
      <div className="container page">
        <h1 className="page-title">Not found</h1>
        <p className="page-body">
          <Link
            className="text-link"
            to={{ pathname: '/digitalart', search: location.search }}
          >
            Back to works
          </Link>
        </p>
      </div>
    )
  }

  const title = content.t(project.title)
  const subtitle = content.t(project.subtitle)
  const description = content.t(project.description)
  const awardsTitle = content.locale === 'en' ? 'Awards' : '获奖'

  const images = useMemo(() => {
    const seen = new Set<string>()
    const list: { src: string; alt: string }[] = []
    const hero = project.hero || project.cover
    if (hero && !seen.has(hero)) {
      seen.add(hero)
      list.push({ src: hero, alt: title })
    }
    for (const m of project.gallery ?? []) {
      if (m.type !== 'image') continue
      if (!m.src || seen.has(m.src)) continue
      seen.add(m.src)
      list.push({ src: m.src, alt: m.alt ? content.t(m.alt) : '' })
    }
    return list
  }, [project.cover, project.gallery, project.hero, title, content])

  const current = lightboxIndex !== null ? images[lightboxIndex] : null
  const canPrev = lightboxIndex !== null && lightboxIndex > 0
  const canNext =
    lightboxIndex !== null && lightboxIndex < Math.max(0, images.length - 1)

  const openAtSrc = (src: string) => {
    const idx = images.findIndex((i) => i.src === src)
    setLightboxIndex(idx >= 0 ? idx : 0)
  }

  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () =>
    setLightboxIndex((i) => (i === null ? i : Math.max(0, i - 1)))
  const nextImage = () =>
    setLightboxIndex((i) =>
      i === null ? i : Math.min(images.length - 1, i + 1),
    )

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxIndex, images.length])

  return (
    <>
      {current ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={content.locale === 'zh' ? '图片预览' : 'Image preview'}
          onClick={closeLightbox}
          onPointerDown={(e) => {
            swipeStart.current = { x: e.clientX, y: e.clientY }
          }}
          onPointerUp={(e) => {
            const start = swipeStart.current
            swipeStart.current = null
            if (!start) return
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return
            if (dx > 0) prevImage()
            else nextImage()
          }}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label={content.locale === 'zh' ? '关闭' : 'Close'}
          >
            {content.locale === 'zh' ? '关闭' : 'Close'}
          </button>

          <div className="lightbox-counter" aria-hidden="true">
            {lightboxIndex! + 1} / {images.length}
          </div>

          <button
            type="button"
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
            disabled={!canPrev}
            aria-label={content.locale === 'zh' ? '上一张' : 'Previous'}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-nav lightbox-next"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
            disabled={!canNext}
            aria-label={content.locale === 'zh' ? '下一张' : 'Next'}
          >
            ›
          </button>

          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={current.src} alt={current.alt} decoding="async" />
          </div>
        </div>
      ) : null}

      <div className="project-hero-bleed">
        <button
          type="button"
          className="media-button"
          onClick={() => openAtSrc(project.hero || project.cover)}
          aria-label={content.locale === 'zh' ? '点击查看大图' : 'View image'}
        >
          <img
            src={project.hero || project.cover}
            alt={title}
            loading="eager"
            decoding="async"
          />
        </button>
      </div>

      <div className="container project">
        <div className="project-body">
        <h1 className="project-page-title">{title}</h1>
        <div className="project-page-subtitle">
          {subtitle}
          {project.year ? ` / ${project.year}` : ''}
        </div>

        <div className="project-description">{description}</div>

        {project.gallery && project.gallery.length > 0 ? (
          <div className="project-gallery">
            {project.gallery.map((m, idx) => {
              if (m.type === 'video') {
                return (
                  <div className="media" key={`${m.src}-${idx}`}>
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      poster={m.poster}
                    >
                      <source src={m.src} />
                    </video>
                    {m.title ? (
                      <div className="media-caption">{content.t(m.title)}</div>
                    ) : null}
                  </div>
                )
              }
              return (
                <div className="media" key={`${m.src}-${idx}`}>
                  <button
                    type="button"
                    className="media-button"
                    onClick={() => openAtSrc(m.src)}
                    aria-label={content.locale === 'zh' ? '点击查看大图' : 'View image'}
                  >
                    <img
                      src={m.src}
                      alt={m.alt ? content.t(m.alt) : ''}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </div>
              )
            })}
          </div>
        ) : null}

        {project.awards && project.awards.length > 0 ? (
          <div className="project-awards">
            <div className="awards-title">{awardsTitle}</div>
            <div className="awards-list">
              {project.awards.map((a, idx) => (
                <p key={`${idx}-${content.t(a)}`} className="award-item">
                  {content.t(a)}
                </p>
              ))}
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </>
  )
}
