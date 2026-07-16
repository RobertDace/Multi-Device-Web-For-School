'use client';

import React from 'react';

// Pastikan wajib menggunakan 'export default function'
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-wrapper bg-slate-50 min-h-screen">
      {children}
    </div>
  );
}