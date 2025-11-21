import MainLayout from '../../components/Layout/MainLayout';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Target, Clock, Award } from 'lucide-react';

const Analytics = () => {
  const progressData = [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 70 },
    { month: 'Mar', score: 75 },
    { month: 'Apr', score: 78 },
    { month: 'May', score: 82 },
    { month: 'Jun', score: 85 },
  ];

  const skillsData = [
    { skill: 'Reading', score: 85 },
    { skill: 'Writing', score: 78 },
    { skill: 'Analysis', score: 82 },
    { skill: 'Structure', score: 80 },
    { skill: 'Evidence', score: 88 },
  ];

  const categoryData = [
    { category: 'Paper 1', hours: 12 },
    { category: 'Paper 2', hours: 10 },
    { category: 'Examples', hours: 8 },
    { category: 'Text Types', hours: 6 },
    { category: 'Vocabulary', hours: 5 },
  ];

  return (
    <MainLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">41h</div>
            <div className="text-sm text-gray-600">Total Study Time</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">85%</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600">Tasks Completed</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-cyan-500" />
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">78%</div>
            <div className="text-sm text-gray-600">Consistency Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Progress Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Study Time by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="category" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Skills Assessment</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={skillsData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="skill" stroke="#6b7280" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Analytics;
