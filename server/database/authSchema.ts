import { generateId } from '../../utils/random'
import { integer, primaryKey, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const DEFAULT_ID_SIZE: Readonly<number> = 25

// here we can add common columns to all tables
const defaultCreatedUpdatedColumns = {
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$onUpdate(() => new Date()),
}

export const authUser = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => generateId(DEFAULT_ID_SIZE)),
  email: text('email', { length: 256 }).unique().notNull(),
  githubUsername: text('github_username', { length: 256 }),
  profilePictureUrl: text('profile_picture'),
  fullName: text('full_name'),
  role: text('role', { enum: ['user', 'admin'] }).default('user'),
  ...defaultCreatedUpdatedColumns,
  // other user attributes  role: varchar("role", { length: 32 }).notNull().default("user"),
})
export const InsertUserSchema = createInsertSchema(authUser)
export const SelectUserSchema = createSelectSchema(authUser)
// upsert needs an id and updatedAt
export const UpsertUserSchema = createInsertSchema(authUser).required({
  id: true,
})
export type InsertUser = z.infer<typeof InsertUserSchema>
export type UpsertUser = z.infer<typeof UpsertUserSchema>
export type SelectUser = z.infer<typeof SelectUserSchema>

export const oAuthAccount = sqliteTable(
  'oauth_accounts',
  {
    providerId: text('provider_id').notNull(),
    providerUserId: text('provider_user_id'),
    userId: text('user_id')
      .notNull()
      .references(() => authUser.id),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({
        name: 'user_provider_id_pk',
        columns: [table.userId, table.providerId],
      }),
    }
  },
)

export const InsertOAuthAccountSchema = createInsertSchema(oAuthAccount)
export const SelectOAuthAccountSchema = createSelectSchema(oAuthAccount)
export const UpsertOAuthAccountSchema = createInsertSchema(oAuthAccount).required({
  providerUserId: true,
})

export type InsertOAuthAccount = z.infer<typeof InsertOAuthAccountSchema>
export type UpsertOAuthAccount = z.infer<typeof UpsertOAuthAccountSchema>
export type SelectOAuthAccount = z.infer<typeof SelectOAuthAccountSchema>
