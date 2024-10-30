import type { GitHubUser } from '../../../../types/github'
import { authUser, oAuthAccount } from '../../../../server/database/authSchema'
import { generateId } from '../../../../utils/random'
import { consola } from 'consola'
import { and, eq } from 'drizzle-orm'

interface GitHubOAuthTokens {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
  refresh_token_expires_in: number
}

export default defineOAuthGitHubEventHandler({

  config: {
    emailRequired: true,
    scope: ['user:email'],
  },
  async onSuccess(event, { user, tokens }: { user: GitHubUser, tokens: GitHubOAuthTokens }) {
    const githubUser = user
    const githubTokens = tokens
    consola.info('Tokens:', githubUser)
    consola.info('User:', githubTokens)
    const db = useDrizzle()
    const existingAccount = await db.query.oAuthAccount.findFirst({
      where: and(
        eq(oAuthAccount.providerUserId, githubUser.id.toString()),
        eq(oAuthAccount.providerId, 'github'),
      ),
    })
    const getUser = async () => {
      const existingUserWithEmail = await db.query.authUser.findFirst({
        columns: { id: true },
        where: eq(authUser.email, githubUser.email),
      })

      if (existingUserWithEmail) {
        await upsertGithubOAuthAccount(db, {
          userId: existingUserWithEmail.id,
          githubUser,
          githubAccessToken: githubTokens.access_token,
          githubAccessTokenExpiresIn: githubTokens.expires_in,
          githubRefreshToken: githubTokens.refresh_token,
        })
        await db
          .update(authUser)
          .set({ githubUsername: githubUser.login, profilePictureUrl: githubUser.avatar_url })
          .where(eq(authUser.id, existingUserWithEmail.id))
        return existingUserWithEmail.id
      }
      if (existingAccount)
        return existingAccount.userId

      const user = await upsertAuthUser(db, {
        id: generateId(25),
        email: githubUser.email,
        githubUsername: githubUser.login,
        fullName: githubUser.name,
        profilePictureUrl: githubUser.avatar_url,
      })
      const userId = user.id
      await upsertGithubOAuthAccount(db, {
        userId,
        githubUser,
        githubAccessToken: githubTokens.access_token,
        githubAccessTokenExpiresIn: githubTokens.expires_in,
        githubRefreshToken: githubTokens.refresh_token,
      })
      return userId
    }

    const userId = await getUser()
    await setUserSession(event, {
      user: {
        id: userId,
        email: githubUser.email,
        profilePictureUrl: githubUser.avatar_url,
        fullName: githubUser.name,
      },
    })
    return sendRedirect(event, '/')
  },
})
