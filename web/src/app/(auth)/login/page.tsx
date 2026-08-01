import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from './login-form';
import '../auth.css';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ' };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
