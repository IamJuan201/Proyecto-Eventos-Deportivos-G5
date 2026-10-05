import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/auth-forms';

const safeNextPath = (value: string | undefined) => value?.startsWith('/') && !value.startsWith('//') ? value : '/';

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const query = await searchParams;
  const nextPath = safeNextPath(typeof query.next === 'string' ? query.next : '/');
  return <div className="flex min-h-screen bg-sport-bg">
    <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-sport-surface relative overflow-hidden px-12"><div className="absolute inset-0 bg-linear-to-br from-sport-emerald/10 to-transparent" /><div className="relative z-10 text-center space-y-6"><div className="w-20 h-20 rounded-full bg-sport-emerald/20 border-2 border-sport-emerald flex items-center justify-center mx-auto"><span className="text-4xl">⚡</span></div><h1 className="text-4xl font-black text-sport-text">Élite<br /><span className="text-sport-emerald">Club</span></h1><p className="text-sport-muted text-lg max-w-xs">Tu espacio para moverte, competir y desconectar.</p></div></div>
    <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12"><div className="w-full max-w-md space-y-8">
      <div className="text-center"><h2 className="text-3xl font-bold text-sport-text">Iniciar sesión</h2><p className="mt-2 text-sm text-sport-muted">¿No tienes una cuenta? <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-medium text-sport-emerald">Regístrate aquí</Link></p></div>
      {nextPath !== '/' && <p className="rounded-lg border border-sport-border bg-sport-surface-2 p-3 text-sm text-sport-muted">Inicia sesión para continuar con tu reserva. Al terminar volverás al espacio elegido.</p>}
      <LoginForm nextPath={nextPath} oauthError={query.error === 'oauth'} />
    </div></div>
  </div>;
}
