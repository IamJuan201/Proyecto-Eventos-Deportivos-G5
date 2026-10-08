import 'server-only';
import { cookies } from 'next/headers';
import type { Locale } from './messages';

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get('elite-locale')?.value;
  return value === 'en' ? 'en' : 'es';
}
