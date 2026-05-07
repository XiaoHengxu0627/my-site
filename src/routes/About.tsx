import { useState, useEffect } from 'react'
import { useContent } from '../lib/content'

type TooltipProps = {
  details: {
    name: string
    info: string
    images?: string[]
  }
  onImageClick: (images: string[], index: number) => void
}

function ProductTooltip({ details, onImageClick }: TooltipProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (!details.images || details.images.length <= 1) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % details.images!.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [details.images])

  return (
    <div className="product-tooltip">
      <div className="product-tooltip-content">
        {details.images && details.images.length > 0 && (
          <div
            className="product-tooltip-image"
            onClick={(e) => {
              e.stopPropagation()
              onImageClick(details.images!, currentImageIndex)
            }}
            style={{ cursor: 'zoom-in' }}
          >
            {details.images.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={`${details.name} ${idx + 1}`}
                className={idx === currentImageIndex ? 'active' : ''}
              />
            ))}
            {details.images.length > 1 && (
              <div className="product-tooltip-dots">
                {details.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <div className="product-tooltip-text">
          <div className="product-tooltip-name">{details.name}</div>
          <div className="product-tooltip-info">{details.info}</div>
        </div>
      </div>
      <div className="product-tooltip-arrow" />
    </div>
  )
}

export default function About() {
  const content = useContent()
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{
    images: string[]
    index: number
  } | null>(null)

  useEffect(() => {
    if (!lightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowLeft')
        setLightbox((prev) =>
          prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null,
        )
      if (e.key === 'ArrowRight')
        setLightbox((prev) =>
          prev
            ? {
                ...prev,
                index: Math.min(prev.images.length - 1, prev.index + 1),
              }
            : null,
        )
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [lightbox])

  if (content.status !== 'ready') return null

  const page = content.site.pages.about
  const heading = content.t(page.heading) || content.t(page.title)
  const photo = page.photo || '/media/xiaohengxu.jpg'

  const renderDescription = (text: string, details?: any, itemId?: string) => {
    if (!details || !text.includes(content.t(details.name))) return text

    const productName = content.t(details.name)
    const parts = text.split(productName)

    return (
      <>
        {parts[0]}
        <span
          className="product-highlight"
          onMouseEnter={() => setActiveTooltip(itemId || '')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          {productName}
          {activeTooltip === itemId && (
            <ProductTooltip
              details={{
                name: productName,
                info: content.t(details.info),
                images: details.images,
              }}
              onImageClick={(images, index) => setLightbox({ images, index })}
            />
          )}
        </span>
        {parts[1]}
      </>
    )
  }

  return (
    <div className="container resume">
      {lightbox && (
        <div
          className="lightbox"
          role="dialog"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setLightbox(null)}
          >
            {content.locale === 'zh' ? '关闭' : 'Close'}
          </button>

          {lightbox.images.length > 1 && (
            <>
              <div className="lightbox-counter">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
              <button
                type="button"
                className="lightbox-nav lightbox-prev"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((prev) =>
                    prev
                      ? { ...prev, index: Math.max(0, prev.index - 1) }
                      : null,
                  )
                }}
                disabled={lightbox.index === 0}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-next"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index: Math.min(
                            prev.images.length - 1,
                            prev.index + 1,
                          ),
                        }
                      : null,
                  )
                }}
                disabled={lightbox.index === lightbox.images.length - 1}
              >
                ›
              </button>
            </>
          )}

          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.images[lightbox.index]} alt="" />
          </div>
        </div>
      )}
      <div className="resume-hero">
        <div className="resume-photo">
          <img src={photo} alt={heading} loading="eager" decoding="async" />
        </div>
        <div className="resume-intro">
          <h1 className="resume-name">{heading}</h1>
          {page.tagline ? (
            <div className="resume-tagline">{content.t(page.tagline)}</div>
          ) : null}
          {page.body ? (
            <div className="resume-summary">{content.t(page.body)}</div>
          ) : null}
          {page.personalTags && page.personalTags.length > 0 ? (
            <div className="personal-tags">
              {page.personalTags.map((tag) => (
                <span key={tag} className="personal-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {page.resumeSections?.map((section) => (
        <section
          className="resume-section"
          key={`resume-${content.t(section.title)}`}
        >
          <div className="resume-section-title">{content.t(section.title)}</div>
          <div className="resume-items">
            {section.items.map((item, idx) => {
              const itemId = `${content.t(section.title)}-${idx}`
              return (
                <div className="resume-item" key={itemId}>
                  <div className="resume-item-head">
                    <div className="resume-item-title-group">
                      {item.dept ? (
                        <div className="resume-item-dept">
                          {content.t(item.dept)}
                        </div>
                      ) : null}
                      <div className="resume-item-title">
                        {content.t(item.title)}
                      </div>
                    </div>
                    {item.time ? (
                      <div className="resume-item-time">
                        {content.t(item.time)}
                      </div>
                    ) : null}
                  </div>
                  {item.description ? (
                    <div className="resume-item-desc">
                      {renderDescription(
                        content.t(item.description),
                        item.productDetails,
                        itemId,
                      )}
                    </div>
                  ) : null}
                  {item.bullets && item.bullets.length > 0 ? (
                    <ul className="resume-item-bullets">
                      {item.bullets.map((b, bIdx) =>
                        content.t(b) ? (
                          <li key={`${bIdx}-${content.t(b)}`}>
                            {content.t(b)}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
