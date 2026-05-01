import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import Leaderboard from './Leaderboard';
import FriendsStory from '../components/FriendsList';

import DashboardProfileHeader from '../components/DashboardProfileHeader';
import DynamicStudyChart from '../components/DynamicStudyChart';
import CountdownWidget from '../components/CountdownWidget';
import DashboardCourseCarousel from '../components/DashboardCourseCarousel';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/me');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* 1. Interactive Profile Header */}
      <section id="profile">
        <DashboardProfileHeader profile={profile} onProfileUpdate={fetchStats} />
      </section>

      {/* 2. Friends Story Row */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <FriendsStory />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* 3. Dynamic Study Chart */}
          <section id="study-time" className="scroll-mt-24">
            <DynamicStudyChart profile={profile} />
          </section>

          {/* 4. Course Carousel */}
          <section id="courses" className="scroll-mt-24">
            <DashboardCourseCarousel />
          </section>
          
        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-10 h-full">
          {/* 5. Countdowns & Notifications */}
          <section id="announcements">
            <CountdownWidget />
          </section>
        </div>
      </div>

      {/* 6. Leaderboard Section */}
      <section id="leaderboard" className="scroll-mt-24 pt-8">
        <Leaderboard />
      </section>

    </div>
  );
}
