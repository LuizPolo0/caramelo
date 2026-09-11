import type { Metadata } from 'next'
import  './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProviderWrapper } from '@/hooks/useToast'

export const metadata: Metadata = {
  title: 'Caramelo do Bem',
  description: 'Reporte cachorros em situação de rua',
  themeColor: '#F5A623',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <AuthProvider>
          <ToastProviderWrapper>
            {children}
          </ToastProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}