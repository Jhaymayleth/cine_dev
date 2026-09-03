import type { Metadata } from 'next'
import '../src/styles/globals.css'

export const metadata: Metadata = {
  title: 'Multicine',
  description: 'Cartelera, funciones y entradas de cine.',
  icons: {
    icon: [
      {
        url: '/images/favicon-multicine.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: '/images/favicon-multicine.png',
  },
  manifest: '/images/site.webmanifest',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
