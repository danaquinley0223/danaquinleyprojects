export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    // SPA fallback: any path under /cocktail-bar/ that isn't a static file
    // gets served the app shell so React Router can handle the route.
    if (url.pathname.startsWith('/cocktail-bar/') && !url.pathname.match(/\.[a-zA-Z0-9]+$/)) {
      const rewritten = new URL(request.url)
      rewritten.pathname = '/cocktail-bar/index.html'
      return env.ASSETS.fetch(new Request(rewritten.toString(), request))
    }
    return env.ASSETS.fetch(request)
  },
}
