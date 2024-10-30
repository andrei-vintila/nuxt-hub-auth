export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const lucia = event.context.lucia
  if (!event.context.user) {
    throw createError({
      message: 'Unauthorized',
      statusCode: 401,
    })
  }
  const cookie = getCookie(event, lucia.sessionCookieName)
  if (!cookie) {
    throw createError({
      message: 'Unauthorized',
      statusCode: 401,
    })
  }
  const { session } = await lucia.validateSession(cookie)
  if (!session) {
    // Check if session or session.impersonatorId is falsy
    throw createError({
      message: 'Unauthorized',
      statusCode: 401,
    })
  }
  if (!session.impersonatorId)
    return sendRedirect(event, '/')

  const newSession = await lucia.createSession(session.impersonatorId, {})
  const sessionCookie = lucia.createSessionCookie(newSession.id)
  appendResponseHeader(event, 'Set-Cookie', sessionCookie.serialize())
  return sendRedirect(event, '/')
})
