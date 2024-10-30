import type { GoogleUser } from '../../../../types/gapi'
import { authUser, oAuthAccount } from '../../../../server/database/authSchema'
import { generateId } from '../../../../utils/random'
import { consola } from 'consola'
import { and, eq } from 'drizzle-orm'

interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user, tokens }: { user: GoogleUser, tokens: GoogleTokens }) {
    const googleUser = user
    const googleTokens = tokens
    consola.info('Tokens:', googleUser)
    consola.info('User:', googleTokens)
    const db = useDrizzle()
    const existingAccount = await db.query.oAuthAccount.findFirst({
      where: and(
        eq(oAuthAccount.providerUserId, googleUser.sub),
        eq(oAuthAccount.providerId, 'google'),
      ),
    })
    const getUser = async () => {
      // now we check if the user has an email in his google account to see if we can find an existing user
      if (!googleUser.email_verified || !googleUser.email)
        throw new Error('Email not verified')

      const existingUserWithEmail = await db.query.authUser.findFirst({
        columns: { id: true },
        where: eq(authUser.email, googleUser.email),
      })
      if (existingUserWithEmail) {
        await upsertGoogleOAuthAccount(db, {
          userId: existingUserWithEmail.id,
          googleUser,
          googleAccessToken: googleTokens.access_token,
          googleAccessTokenExpiresIn: googleTokens.expires_in,
          googleRefreshToken: googleTokens.refresh_token,
        })
        await db
          .update(authUser)
          .set({ fullName: googleUser.name, profilePictureUrl: googleUser.picture })
          .where(eq(authUser.id, existingUserWithEmail.id))
        return existingUserWithEmail.id
      }
      if (existingAccount)
        return existingAccount.userId

      const user = await upsertAuthUser(db, {
        id: generateId(25),
        email: googleUser.email,
        fullName: googleUser.name,
        profilePictureUrl: googleUser.picture,
      })
      const userId = user.id
      await upsertGoogleOAuthAccount(db, {
        userId,
        googleUser,
        googleAccessToken: googleTokens.access_token,
        googleAccessTokenExpiresIn: googleTokens.expires_in,
        googleRefreshToken: googleTokens.refresh_token,
      })
      return userId
    }

    const userId = await getUser()
    await setUserSession(event, {
      user: {
        id: userId,
        email: googleUser.email,
        profilePictureUrl: googleUser.picture,
        fullName: googleUser.name,
      },
    })

    return sendRedirect(event, '/')
  },
  async onError(event, error) {
    consola.error('Error:', error)
    return sendRedirect(event, '/')
  },
})
