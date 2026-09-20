import React from 'react';
import { DashboardSummary } from './DashboardSummary';
import { MonthCalendar } from './MonthCalendar';

interface DashboardViewProps {
  onNavigateToTasks: () => void;
  onNavigateToTimetable: () => void;
  onNavigateToNotebooks?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTasks,
  onNavigateToTimetable,
  onNavigateToNotebooks,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Cards */}
      <DashboardSummary
        onNavigateToTasks={onNavigateToTasks}
        onNavigateToTimetable={onNavigateToTimetable}
        onNavigateToNotebooks={onNavigateToNotebooks}
      />

      {/* Month Calendar */}
      <MonthCalendar />
    </div>
  );
};
