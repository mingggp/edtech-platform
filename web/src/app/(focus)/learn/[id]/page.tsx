import type { Metadata } from 'next';

import { LearnView } from './learn-view';
import './learn.css';

export const metadata: Metadata = { title: 'ห้องเรียน' };

export default async function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LearnView courseId={Number(id)} />;
}
