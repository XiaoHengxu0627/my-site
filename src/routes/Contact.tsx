import { useContent } from '../lib/content'

export default function Contact() {
  const content = useContent()
  if (content.status !== 'ready') return null
  const page = content.site.pages.contact

  return (
    <div className="container contact-page">
      <h1 className="contact-title">{content.t(page.title)}</h1>
      <a className="contact-email" href={`mailto:${page.email}`}>
        {page.email}
      </a>
    </div>
  )
}
