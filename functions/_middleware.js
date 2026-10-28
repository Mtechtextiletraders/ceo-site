// Send old/alias hosts to the main domain (keeps Search Console file reachable).
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const host = url.hostname;
  if ((host === 'ceo.mtechtextiletraders.com' || host === 'www.abdulrasheedgill.com')
      && !url.pathname.startsWith('/google')) {
    return Response.redirect('https://abdulrasheedgill.com' + url.pathname + url.search, 301);
  }
  if (url.pathname === '/gallery' || url.pathname === '/gallery.html') {
    return Response.redirect('https://abdulrasheedgill.com/journey', 301);
  }
  return next();
}
