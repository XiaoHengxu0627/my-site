import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
  const location = useLocation()
  return (
    <div className="container page">
      <h1 className="page-title">404</h1>
      <p className="page-body">This page does not exist.</p>
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
