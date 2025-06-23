import type {Metadata} from "next";
import "./globals.css";
import Link from 'next/link';
import {ReactNode} from 'react';

export const metadata: Metadata = {
  title: "Spotify Analyzer",
  description: "Let's analyze some spotify history!",
};

export default function RootLayout({children}: { children: ReactNode }) {
  return (
    <html lang="en">
    <body className="p-6">
    <nav className="mb-6 space-x-4 border-b pb-2">
      <Link href="/upload">Upload</Link>
      <Link href="/tracks">Tracks</Link>
      <Link href="/albums">Albums</Link>
      <Link href="/llm-tracks">Smart Tracks</Link>
    </nav>
    {children}
    </body>
    </html>
  );
}
