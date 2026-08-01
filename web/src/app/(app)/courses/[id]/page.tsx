import type { Metadata } from 'next';

import { CourseDetail } from './course-detail';
import './course-detail.css';

export const metadata: Metadata = { title: 'รายละเอียดคอร์ส' };

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetail courseId={Number(id)} />;
}
