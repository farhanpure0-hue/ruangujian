export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('Password harus berupa teks yang tidak kosong.')
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API tidak tersedia. Jalankan aplikasi melalui localhost atau HTTPS.')
  }

  const bytes = new TextEncoder().encode(password)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password, expectedHash) {
  const actualHash = await hashPassword(password)
  if (typeof expectedHash !== 'string' || actualHash.length !== expectedHash.length) {
    return false
  }

  let difference = 0
  for (let index = 0; index < actualHash.length; index += 1) {
    difference |= actualHash.charCodeAt(index) ^ expectedHash.charCodeAt(index)
  }
  return difference === 0
}
