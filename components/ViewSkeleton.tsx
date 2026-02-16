import React from 'react';

interface ViewSkeletonProps {
  view?: string;
}

const HeaderSkeleton = () => (
  <div className="h-24 rounded-[20px] border border-slate-100 bg-white shadow-sm p-6">
    <div className="skeleton h-3 w-40 rounded-full" />
    <div className="skeleton h-8 w-72 rounded-lg mt-3" />
  </div>
);

const DashboardSkeleton = () => (
  <>
    <HeaderSkeleton />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`skeleton-kpi-${index}`} className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-10 w-24 rounded-lg mt-3" />
          <div className="skeleton h-12 w-12 rounded-2xl mt-4" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 h-72 shadow-sm">
        <div className="skeleton h-4 w-40 rounded-full" />
        <div className="skeleton h-52 rounded-2xl mt-4" />
      </div>
      <div className="rounded-[20px] border border-slate-100 bg-white p-6 h-72 xl:col-span-2 shadow-sm">
        <div className="skeleton h-4 w-56 rounded-full" />
        <div className="skeleton h-52 rounded-2xl mt-4" />
      </div>
    </div>
  </>
);

const CalendarSkeleton = () => (
  <>
    <HeaderSkeleton />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`skeleton-calendar-stat-${index}`} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-lg mt-2" />
        </div>
      ))}
    </div>
    <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={`skeleton-calendar-cell-${index}`} className="h-24 rounded-xl border border-slate-50 bg-white p-3">
            <div className="skeleton h-3 w-6 rounded-full" />
            <div className="skeleton h-3 w-full rounded-full mt-3" />
            <div className="skeleton h-3 w-4/5 rounded-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  </>
);

const ReportsSkeleton = () => (
  <>
    <HeaderSkeleton />
    <div className="rounded-[20px] border border-slate-100 bg-white p-6 shadow-sm">
      <div className="skeleton h-5 w-48 rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="skeleton h-11 rounded-xl" />
        <div className="skeleton h-11 rounded-xl" />
      </div>
      <div className="space-y-4 mt-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-report-row-${index}`} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  </>
);

const GenericSkeleton = () => (
  <>
    <HeaderSkeleton />
    <div className="rounded-[20px] border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`skeleton-generic-row-${index}`} className="skeleton h-12 rounded-xl" />
      ))}
    </div>
  </>
);

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ view }) => {
  const renderByView = () => {
    if (view === 'dashboard') return <DashboardSkeleton />;
    if (view === 'calendar') return <CalendarSkeleton />;
    if (view === 'reports') return <ReportsSkeleton />;
    return <GenericSkeleton />;
  };

  return (
    <div className="space-y-5 animate-fade-in-up" aria-hidden="true">
      {renderByView()}
    </div>
  );
};
