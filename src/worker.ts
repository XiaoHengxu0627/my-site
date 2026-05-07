export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url)
    const accept = request.headers.get('Accept') || ''
    const isHtmlNav = request.method === 'GET' && accept.includes('text/html')
    const isAdmin = url.pathname.startsWith('/admin')

    if (isHtmlNav && url.pathname !== '/' && !isAdmin) {
      return Response.redirect(new URL('/', url), 302)
    }

    const res = await env.ASSETS.fetch(request)
    if (res.status !== 404) return res
    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request))
  },
}
