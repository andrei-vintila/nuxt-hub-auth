import type { FacebookUser } from '../../../../types/facebook'
import { authUser, oAuthAccount } from '../../../../server/database/authSchema'
import { generateId } from '../../../../utils/random'
import { consola } from 'consola'
import { and, eq } from 'drizzle-orm'

interface FacebookOAuthTokens {
  access_token: string
  token_type: string
  expires_in: number
}

export default defineOAuthFacebookEventHandler({
  config: {
    scope: ['email', 'public_profile'],
    fields: ['id', 'name', 'email', 'picture'],
  },
  async onSuccess(event, { user, tokens }: { user: FacebookUser, tokens: FacebookOAuthTokens }) {
    consola.info(tokens)
    const db = useDrizzle()
    const facebookToken = tokens
    const facebookUser = user
    consola.info(facebookToken)

    const existingAccount = await db.query.oAuthAccount.findFirst({
      where: and(
        eq(oAuthAccount.providerUserId, facebookUser.id),
        eq(oAuthAccount.providerId, 'facebook'),
      ),
    })
    const getUser = async () => {
      // now we check if the user has an email in his facebook account to see if we can find an existing user
      if (!facebookUser.email)
        throw new Error('Email not verified or not set')

      const existingUserWithEmail = await db.query.authUser.findFirst({
        columns: { id: true },
        where: eq(authUser.email, facebookUser.email),
      })
      if (existingAccount) {
        await upsertAuthUser(db, {
          id: existingAccount.userId,
          profilePictureUrl: facebookUser.picture.data.url,
          fullName: facebookUser.name,
          email: facebookUser.email,
          githubUsername: null,
          updatedAt: new Date(),
        })
        return existingAccount.userId
      }
      if (existingUserWithEmail) {
        await upsertFacebookOAuthAccount(db, {
          userId: existingUserWithEmail.id,
          facebookUserId: facebookUser.id,
          facebookAccessToken: facebookToken.access_token,
          facebookAccessTokenExpiresIn: facebookToken.expires_in,
        })
        return existingUserWithEmail.id
      }

      const user = await upsertAuthUser(db, {
        id: generateId(25),
        profilePictureUrl: facebookUser.picture.data.url,
        fullName: facebookUser.name,
        email: facebookUser.email,
        githubUsername: null,
        updatedAt: new Date(),
      })
      await upsertFacebookOAuthAccount(db, {
        userId: user.id,
        facebookUserId: facebookUser.id,
        facebookAccessToken: facebookToken.access_token,
        facebookAccessTokenExpiresIn: facebookToken.expires_in,
      })
      return user.id
    }

    const userId = await getUser()

    await setUserSession(event, {
      user: {
        id: userId,
        email: facebookUser.email,
        profilePictureUrl: facebookUser.picture.data.url,
        fullName: facebookUser.name,
      },
    })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    consola.error('Facebook OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
