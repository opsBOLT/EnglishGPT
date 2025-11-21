import { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Calendar</h1>
            <p className="text-gray-600">Schedule and manage your study sessions</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600">
            <Plus className="w-5 h-5" />
            <span>Schedule Session</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex space-x-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`aspect-square p-2 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${
                  isToday(day)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : isSameMonth(day, currentDate)
                    ? 'border-gray-200'
                    : 'border-gray-100 text-gray-400'
                }`}
              >
                <div className="text-sm font-medium">{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
          </div>
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No upcoming sessions scheduled</p>
            <button className="mt-4 text-blue-600 font-medium hover:text-blue-700">
              Schedule your first session
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Calendar;
