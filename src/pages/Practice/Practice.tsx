import { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { Target, Book, Star } from 'lucide-react';

const Practice = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Zone</h1>
          <p className="text-gray-600">
            Sharpen your skills with personalized practice and past papers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm p-8 text-white">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Personalized Practice</h2>
            <p className="text-blue-100 mb-6">
              AI-generated questions tailored to your weaknesses and learning style
            </p>
            <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Start Personalized Practice
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
              <Book className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Past Papers</h2>
            <p className="text-gray-600 mb-6">
              Practice with real exam questions from previous years
            </p>
            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors">
              Browse Past Papers
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Based on your recent study sessions and quiz performance, we recommend focusing on these areas:
          </p>
          <div className="space-y-3">
            {[
              'Literary device identification in poetry',
              'Comparative essay structure',
              'Time management in timed writing',
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-900">{item}</span>
                <button className="text-blue-600 font-medium hover:text-blue-700">Practice</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Practice;
