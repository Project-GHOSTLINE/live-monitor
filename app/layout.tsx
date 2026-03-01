import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Live Situation Monitor - Middle East News Aggregator',
  description: 'Real-time news aggregation from reputable sources. Auto-translated to English.',
  keywords: ['news', 'middle east', 'israel', 'palestine', 'iran', 'live feed', 'breaking news'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LEVBF3JP4J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LEVBF3JP4J');
          `}
        </Script>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
