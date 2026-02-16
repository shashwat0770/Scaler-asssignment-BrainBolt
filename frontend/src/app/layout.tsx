import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar/Navbar';

export const metadata: Metadata = {
  title: 'BrainBolt – Adaptive Infinite Quiz',
  description: 'Challenge yourself with an adaptive quiz that evolves with your skill level. Climb the leaderboards!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>
          <div className="page-wrapper">
            <Navbar />
            <main style={{ flex: 1 }}>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
