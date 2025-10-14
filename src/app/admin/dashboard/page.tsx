import AdminDashboard from '@/components/AdminDashboard';
import React, { Suspense } from 'react';
import AdminGuard from "../AdminGuard";


export default function DashboardPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminDashboard />
      </Suspense>
    </AdminGuard>
  );
}
