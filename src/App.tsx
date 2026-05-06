import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LocaleProvider } from './lib/locale'

const Layout = lazy(() => import('./routes/Layout.tsx'))
const WorksIndex = lazy(() => import('./routes/WorksIndex.tsx'))
const ProjectDetail = lazy(() => import('./routes/ProjectDetail.tsx'))
const About = lazy(() => import('./routes/About.tsx'))
const Contact = lazy(() => import('./routes/Contact.tsx'))
const NotFound = lazy(() => import('./routes/NotFound.tsx'))

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LocaleProvider>
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
              <Route index element={<Navigate to="/digitalart" replace />} />
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
