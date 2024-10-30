import type { RandomReader } from '@oslojs/crypto/random'
import { generateRandomString } from '@oslojs/crypto/random'

const random: RandomReader = {
  read(bytes: Uint8Array): void {
    crypto.getRandomValues(bytes)
  },
}

function generateId(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return generateRandomString(random, alphabet, length)
}

export { generateId }
