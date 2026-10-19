import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        {/* On force le thème sur "dark" et on désactive le raccourci clavier "D" */}
        <RootProvider
          theme={{
            defaultTheme: 'dark',
            forcedTheme: 'dark',
            hotKey: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
