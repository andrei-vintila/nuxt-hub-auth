import * as schema from '../database/authSchema'

import { drizzle } from 'drizzle-orm/d1'

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema, logger: true })
}
