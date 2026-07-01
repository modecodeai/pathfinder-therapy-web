const APEX_HOST = "pathfindertherapy.org.uk";
const WWW_HOST = `www.${APEX_HOST}`;

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === WWW_HOST) {
    url.hostname = APEX_HOST;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
