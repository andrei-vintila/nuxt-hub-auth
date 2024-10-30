import type { GoogleUser } from '../../types/gapi'
import type { GitHubUser } from '../../types/github'
import type { UpsertUser } from '../database/authSchema'
import { authUser, oAuthAccount } from '../database/authSchema'

type DB = ReturnType<typeof useDrizzle>
export function upsertGithubOAuthAccount(db: DB, {
  userId,
  githubUser,
  githubAccessToken,
  githubAccessTokenExpiresIn,
  githubRefreshToken,
}: {
  userId: string
  githubUser: GitHubUser
  githubAccessToken: string
  githubAccessTokenExpiresIn: number
  githubRefreshToken: string
}) {
  return db
    .insert(oAuthAccount)
    .values({
      userId,
      providerId: 'github',
      providerUserId: githubUser.id.toString(),
      accessToken: githubAccessToken,
      refreshToken: githubRefreshToken,
      expiresAt: new Date(Date.now() + githubAccessTokenExpiresIn * 1000),
    })
    .onConflictDoUpdate({
      target: [oAuthAccount.userId, oAuthAccount.providerId],
      set: {
        accessToken: githubAccessToken,
        refreshToken: githubRefreshToken,
        expiresAt: new Date(Date.now() + githubAccessTokenExpiresIn * 1000),
      },
    })
}

export function upsertGoogleOAuthAccount(db: DB, {
  userId,
  googleUser,
  googleAccessToken,
  googleAccessTokenExpiresIn,
  googleRefreshToken,
}: {
  userId: string
  googleUser: GoogleUser
  googleAccessToken: string
  googleAccessTokenExpiresIn: number
  googleRefreshToken: string
}) {
  return db
    .insert(oAuthAccount)
    .values({
      userId,
      providerId: 'google',
      providerUserId: googleUser.sub,
      accessToken: googleAccessToken,
      refreshToken: googleRefreshToken,
      expiresAt: new Date(Date.now() + googleAccessTokenExpiresIn * 1000),
    })
    .onConflictDoUpdate({
      target: [oAuthAccount.userId, oAuthAccount.providerId],
      set: {
        accessToken: googleAccessToken,
        refreshToken: googleRefreshToken,
        expiresAt: new Date(Date.now() + googleAccessTokenExpiresIn * 1000),
      },
    })
}

export function upsertFacebookOAuthAccount(db: DB, {
  userId,
  facebookUserId,
  facebookAccessToken,
  facebookAccessTokenExpiresIn,
}: {
  userId: string
  facebookUserId: string
  facebookAccessToken: string
  facebookAccessTokenExpiresIn: number
}) {
  return db
    .insert(oAuthAccount)
    .values({
      userId,
      providerId: 'facebook',
      providerUserId: facebookUserId,
      accessToken: facebookAccessToken,
      expiresAt: new Date(Date.now() + facebookAccessTokenExpiresIn * 1000),
    })
    .onConflictDoUpdate({
      target: [oAuthAccount.userId, oAuthAccount.providerId],
      set: {
        accessToken: facebookAccessToken,
        expiresAt: new Date(Date.now() + facebookAccessTokenExpiresIn * 1000),
      },
    })
}

export async function upsertAuthUser(db: DB, {
  id,
  email,
  githubUsername,
  profilePictureUrl,
  fullName,
}: UpsertUser) {
  const [user] = await db
    .insert(authUser)
    .values({ id, email, githubUsername, profilePictureUrl, fullName })
    .onConflictDoUpdate({
      target: authUser.email,
      set: {
        githubUsername: githubUsername || null,
        profilePictureUrl: profilePictureUrl || null,
        fullName: fullName || null,
        updatedAt: new Date(),
      },
    })
    .returning()
  return user
}
export interface GoogleToken {
  accessToken: string
  accessTokenExpiresAt: Date
}
// This needs to be reimplemented wihtout lucia
// type GoogleOAuthTokenByUserId = Pick<SelectOAuthAccount, 'userId'>
// export async function getGoogleToken(db: DB, { userId }: GoogleOAuthTokenByUserId, event: H3Event) {
//   const googleTokenData = await db.query.oAuthAccount.findFirst({
//     where: and(
//       eq(oAuthAccount.userId, userId),
//       eq(oAuthAccount.providerId, 'google'),
//     ),
//   })
//   if (!googleTokenData) {
//     throw createError({
//       message: 'Google account not found',
//       statusCode: 404,
//     })
//   }
//   // check if access token is expired
//   const isExpired = !isWithinExpirationDate(googleTokenData.expiresAt)
//   // if expired, refresh access token
//   if (isExpired) {
//     if (!googleTokenData.refreshToken) {
//       throw createError({
//         message: 'Google account needs to be reconnected',
//         statusCode: 401,
//       })
//     }
//     try {
//       const refreshedTokens = await googleAuth(event).refreshAccessToken(
//         googleTokenData.refreshToken,
//       )
//       // update db with new access token
//       const [refreshedGoogleTokenData] = await db
//         .update(oAuthAccount)
//         .set({
//           accessToken: refreshedTokens.accessToken,
//           expiresAt: refreshedTokens.accessTokenExpiresAt,
//         })
//         .where(
//           and(
//             eq(oAuthAccount.userId, userId),
//             eq(oAuthAccount.providerId, 'google'),
//           ),
//         )
//         .returning()

//       return {
//         accessToken: refreshedGoogleTokenData.accessToken,
//         accessTokenExpiresAt: refreshedGoogleTokenData.expiresAt,
//       }
//     }
//     catch (e) {
//       if (e instanceof OAuth2RequestError) {
//         // see https://oslo.js.org/reference/oauth2/OAuth2RequestError/
//         const { request, message, description } = e
//         if (message === 'invalid_grant') {
//           await db
//             .update(oAuthAccount)
//             .set({
//               refreshToken: null,
//             })
//             .where(
//               and(
//                 eq(oAuthAccount.userId, userId),
//                 eq(oAuthAccount.providerId, 'google'),
//               ),
//             )
//           throw createError({
//             statusCode: 401,
//             message: 'Google account needs to be reconnected',
//           })
//         }
//         throw createError({
//           statusCode: 400,
//           data: request,
//           message,
//           statusText: description || 'Unknown error',
//         })
//       }
//       // unknown error

//       createError({
//         statusCode: 500,
//       })
//     }
//   }

//   return {
//     accessToken: googleTokenData.accessToken,
//     accessTokenExpiresAt: googleTokenData.expiresAt,
//   }
// }

// function isWithinExpirationDate(date: Date): boolean {
//   return Date.now() < date.getTime()
// }
