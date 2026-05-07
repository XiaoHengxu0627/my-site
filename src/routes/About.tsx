import { useContent } from '../lib/content'

export default function About() {
  const content = useContent()
  if (content.status !== 'ready') return null

  const page = content.site.pages.about
  const heading = content.t(page.heading) || content.t(page.title)
  const photo = page.photo || '/media/xiaohengxu.jpg'
  return (
    <div className="container resume">
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
        </div>
      </div>

      {page.resumeSections?.map((section) => (
        <section
          className="resume-section"
          key={`resume-${content.t(section.title)}`}
        >
          <div className="resume-section-title">{content.t(section.title)}</div>
          <div className="resume-items">
            {section.items.map((item, idx) => (
              <div className="resume-item" key={`${content.t(item.title)}-${idx}`}>
                <div className="resume-item-head">
                  <div className="resume-item-title-group">
                    {item.dept ? (
                      <div className="resume-item-dept">{content.t(item.dept)}</div>
                    ) : null}
                    <div className="resume-item-title">{content.t(item.title)}</div>
                  </div>
                  {item.time ? (
                    <div className="resume-item-time">{content.t(item.time)}</div>
                  ) : null}
                </div>
                {item.description ? (
                  <div className="resume-item-desc">
                    {content.t(item.description)}
                  </div>
                ) : null}
                {item.bullets && item.bullets.length > 0 ? (
                  <ul className="resume-item-bullets">
                    {item.bullets.map((b, bIdx) =>
                      content.t(b) ? (
                        <li key={`${bIdx}-${content.t(b)}`}>{content.t(b)}</li>
                      ) : null,
                    )}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
