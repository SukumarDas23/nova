import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'NOVA — AI Assistant',
  description: 'NOVA: Your personal AI assistant powered by NVIDIA\'s 753B MoE model. Available on web, desktop, and mobile.',
  keywords: ['AI assistant', 'NVIDIA', 'chat', 'NOVA'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
