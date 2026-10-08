import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { locale?: string } | null;
  if (body?.locale !== 'es' && body?.locale !== 'en') {
    return NextResponse.json({ error: 'Idioma no válido.' }, { status: 400 });
  }

  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set('elite-locale', body.locale, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
