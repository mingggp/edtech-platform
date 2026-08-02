import type { Metadata } from 'next';

import { ForgotForm } from './forgot-form';

export const metadata: Metadata = { title: 'ลืมรหัสผ่าน' };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
