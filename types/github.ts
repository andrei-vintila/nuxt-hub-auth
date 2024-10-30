import { z } from 'zod'

const baseUserSchema = z.object({
  login: z.string(),
  id: z.number().int(),
  node_id: z.string(),
  avatar_url: z.string().url(),
  gravatar_id: z.union([z.string(), z.null()]),
  url: z.string().url(),
  html_url: z.string().url(),
  followers_url: z.string().url(),
  following_url: z.string(),
  gists_url: z.string(),
  starred_url: z.string(),
  subscriptions_url: z.string().url(),
  organizations_url: z.string().url(),
  repos_url: z.string().url(),
  events_url: z.string(),
  received_events_url: z.string().url(),
  type: z.string(),
  site_admin: z.boolean(),
  name: z.union([z.string(), z.null()]),
  company: z.union([z.string(), z.null()]),
  blog: z.union([z.string(), z.null()]),
  location: z.union([z.string(), z.null()]),
  email: z.string().email(),
  hireable: z.union([z.boolean(), z.null()]),
  bio: z.union([z.string(), z.null()]),
  twitter_username: z.union([z.string(), z.null()]).optional(),
  public_repos: z.number().int(),
  public_gists: z.number().int(),
  followers: z.number().int(),
  following: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})

const planSchema = z.object({
  collaborators: z.number().int(),
  name: z.string(),
  space: z.number().int(),
  private_repos: z.number().int(),
})

const privateUserSchema = baseUserSchema.extend({
  private_gists: z.number().int(),
  total_private_repos: z.number().int(),
  owned_private_repos: z.number().int(),
  disk_usage: z.number().int(),
  collaborators: z.number().int(),
  two_factor_authentication: z.boolean(),
  plan: planSchema.optional(),
  suspended_at: z.union([z.string(), z.null()]).optional(),
  business_plus: z.boolean().optional(),
  ldap_dn: z.string().optional(),
}).describe('Private User')

const publicUserSchema = baseUserSchema.extend({
  plan: planSchema.optional(),
  suspended_at: z.union([z.string(), z.null()]).optional(),
  private_gists: z.number().int().optional(),
  total_private_repos: z.number().int().optional(),
  owned_private_repos: z.number().int().optional(),
  disk_usage: z.number().int().optional(),
  collaborators: z.number().int().optional(),
}).strict().describe('Public User')

export const schema = z.discriminatedUnion('type', [
  privateUserSchema,
  publicUserSchema,
])

export type GitHubUser = z.infer<typeof schema>
