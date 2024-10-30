import { authUser } from '@@/server/database/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const lucia = event.context.lucia
  const db = useDrizzle()
  if (!event.context.user) {
    throw createError({
      message: 'Unauthorized',
      statusCode: 401,
    })
  }
  if (event.context.user.role !== 'admin') {
    throw createError({
      message: 'Forbidden',
      statusCode: 403,
    })
  }
  // Now we can check validate if the we have a userId in the path
  const userId = getRouterParam(event, 'userId')
  if (!userId) {
    throw createError({
      message: 'Missing userId',
      statusCode: 400,
    })
  }

  if (event.context.user.id === userId) {
    throw createError({
      message: 'Cannot impersonate yourself',
      statusCode: 400,
    })
  }
  try {
    await db.query.authUser.findFirst({
      where: eq(authUser.id, userId),
    })
    const session = await lucia.createSession(userId, {
      impersonatorId: event.context.user.id,
    })
    const sessionCookie = lucia.createSessionCookie(session.id)
    appendResponseHeader(event, 'Set-Cookie', sessionCookie.serialize())
  }
  catch (error) {
    throw createError({
      message: 'User not found',
      statusCode: 404,
      cause: error,
    })
  }
  return sendRedirect(event, '/')
})
