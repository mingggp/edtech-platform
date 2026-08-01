import type { Metadata } from 'next';

import { CheckoutView } from './checkout-view';
import './checkout.css';

export const metadata: Metadata = { title: 'ชำระเงิน' };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CheckoutView courseId={Number(id)} />;
}
