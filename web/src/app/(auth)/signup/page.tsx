import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'สมัครสมาชิก' };

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
