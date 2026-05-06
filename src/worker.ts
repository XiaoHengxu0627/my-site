export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url)
    const res = await env.ASSETS.fetch(request)
    if (res.status !== 404) return res
    return env.ASSETS.fetch(new Request(new URL('/index.html', url), request))
  },
}
