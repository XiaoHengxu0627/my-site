import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Header from '../components/Header'
import ScrollToTop from '../components/ScrollToTop'
import { ContentProvider, useContent } from '../lib/content'

function TitleManager() {
  const content = useContent()
  const location = useLocation()

  useEffect(() => {
    if (content.status !== 'ready') return
    const brand = content.t(content.site.brand)
    const pathname = location.pathname.replace(/\/+$/, '')

    if (
      pathname === '' ||
      pathname === '/' ||
      pathname === '/home' ||
      pathname === '/digitalart' ||
      pathname === '/installation' ||
      pathname === '/performance'
    ) {
      document.title = brand || 'Portfolio'
      return
    }

    if (pathname === '/about') {
      document.title = `${content.t(content.site.pages.about.title)} · ${brand}`
      return
    }

    if (pathname === '/contact') {
      document.title = `${content.t(content.site.pages.contact.title)} · ${brand}`
      return
    }

    if (pathname === '/bot') {
      const label = content.t({ zh: 'Hank Bot', en: 'Hank Bot' })
      document.title = `${label} · ${brand}`
      return
    }

    const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname
    const project = content.projects.find((p) => p.slug === slug)
    document.title = project ? `${content.t(project.title)} · ${brand}` : brand
  }, [content, location.pathname])

  return null
}

function ContentShell() {
  const content = useContent()

  if (content.status === 'error') {
    return (
      <div className="container page">
        <h1 className="page-title">Content error</h1>
        <p className="page-body">{content.message}</p>
      </div>
    )
  }

  if (content.status !== 'ready') {
    return (
      <div className="container page">
        <div className="skeleton-block" />
        <div className="skeleton-block" />
        <div className="skeleton-block" />
      </div>
    )
  }

  return <Outlet />
}

export default function Layout() {
  const location = useLocation()

  return (
    <ContentProvider>
      <ScrollToTop />
      <TitleManager />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={`${location.pathname}${location.search}`}
          className="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <ContentShell />
        </motion.main>
      </AnimatePresence>
      <Footer />
    </ContentProvider>
  )
}
