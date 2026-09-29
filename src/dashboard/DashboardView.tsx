import React from 'react';
import { MonthCalendar } from './MonthCalendar';
import { TomorrowSubjects } from './TomorrowSubjects';
import { OtherSubjects } from './OtherSubjects';

interface DashboardViewProps {
  onNavigateToTimetable: () => void;
  onNavigateToCalendarSync?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTimetable,
  onNavigateToCalendarSync,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. In alto: Il calendario con le verifiche e interrogazioni */}
      <section aria-label="Calendario verifiche e interrogazioni">
        <MonthCalendar />
      </section>

      {/* 2. Subito sotto: Le materie per il giorno dopo */}
      <section aria-label="Materie per il giorno dopo">
        <TomorrowSubjects onNavigateToTimetable={onNavigateToTimetable} />
      </section>

      {/* 3. Ed infine: Le altre materie (così rimuovi gli urgenti) */}
      <section aria-label="Le altre materie del corso">
        <OtherSubjects onNavigateToTimetable={onNavigateToTimetable} />
      </section>
    </div>
  );
};
