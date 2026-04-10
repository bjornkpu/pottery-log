import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState } from 'react'
import Footer from '../components/Footer'
import Header from '../components/Header'
import { useAuth } from '../hooks/use-auth'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Pottery Log',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <AuthGate>{children}</AuthGate>
        <Scripts />
      </body>
    </html>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (typeof window === 'undefined' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--sea-ink-soft)]">Laster...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <form onSubmit={async (e) => {
          e.preventDefault()
          setSubmitting(true)
          setError(null)
          const { error } = await signIn(email, password)
          setSubmitting(false)
          if (error) setError(error.message)
        }} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pottery Log</h1>
          <p className="text-sm text-[var(--sea-ink-soft)]">Logg inn for å fortsette</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">E-post</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Passord</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {submitting ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
          TanStackQueryDevtools,
        ]}
      />
    </>
  )
}
