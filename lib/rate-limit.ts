import { kv } from "./redis"

export async function checkRateLimit(
  identifier: string,
  limit = 30,
  windowSecs = 60
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSecs)
  const key = `rl:${identifier}:${bucket}`
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, windowSecs * 2)
  return count <= limit
}
