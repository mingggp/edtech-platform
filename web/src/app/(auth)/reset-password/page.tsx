import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ResetForm } from './reset-form';

export const metadata: Metadata = { title: 'ตั้งรหัสผ่านใหม่' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
