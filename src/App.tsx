import { Suspense, lazy, useEffect, useRef } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LocaleProvider } from './lib/locale'

const Layout = lazy(() => import('./routes/Layout.tsx'))
const Home = lazy(() => import('./routes/Home.tsx'))
const WorksIndex = lazy(() => import('./routes/WorksIndex.tsx'))
const ProjectDetail = lazy(() => import('./routes/ProjectDetail.tsx'))
const About = lazy(() => import('./routes/About.tsx'))
const Contact = lazy(() => import('./routes/Contact.tsx'))
const NotFound = lazy(() => import('./routes/NotFound.tsx'))

function ForceRootOnLoad() {
  const location = useLocation()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const base = import.meta.env.BASE_URL || '/'
    const baseNormalized = base.endsWith('/') ? base : `${base}/`

    if (location.pathname !== baseNormalized && location.pathname !== baseNormalized.slice(0, -1)) {
      window.location.replace(baseNormalized)
    }
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LocaleProvider>
        <ForceRootOnLoad />
        <Suspense
          fallback={
            <main className="container page">
              <div className="skeleton-block" />
              <div className="skeleton-block" />
              <div className="skeleton-block" />
            </main>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route
                path="digitalart"
                element={<WorksIndex section="digitalart" />}
              />
              <Route
                path="installation"
                element={<WorksIndex section="installation" />}
              />
              <Route
                path="performance"
                element={<WorksIndex section="performance" />}
              />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path=":slug" element={<ProjectDetail />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </LocaleProvider>
    </BrowserRouter>
  )
}
