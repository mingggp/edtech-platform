import type { Metadata } from 'next';

import { CoursesBrowser } from './courses-browser';
import './courses.css';

export const metadata: Metadata = {
  title: 'คอร์สทั้งหมด',
  description: 'คอร์สคณิต ฟิสิกส์ TPAT3 TGAT2 ของพี่หมิง — เลือกวิชาที่อยากเก่ง',
};

export default function CoursesPage() {
  return <CoursesBrowser />;
}
