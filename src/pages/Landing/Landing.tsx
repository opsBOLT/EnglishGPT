import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LampContainer } from '../../components/ui/lamp';
import { BookOpen, BarChart3, Calendar, Trophy, Clock, Target } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <LampContainer
        gridProps={{
          width: 30,
          height: 30,
          x: -1,
          y: -1,
          squares: [
            [4, 4],
            [5, 1],
            [8, 2],
            [6, 6],
            [10, 3],
            [12, 8],
            [15, 5],
            [18, 10],
            [20, 15],
            [3, 12],
            [7, 18],
            [14, 14],
            [22, 5],
            [25, 12],
            [28, 8],
            [30, 20],
            [2, 20],
            [10, 25],
            [16, 18],
            [20, 22],
          ],
          className: "opacity-30",
        }}
      >
        <motion.h1
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-8 py-4 text-center text-5xl font-bold tracking-tight text-black md:text-7xl lg:text-8xl"
        >
          Master Your Exams
          <br />
          <span className="text-4xl md:text-6xl lg:text-7xl">with Smart Study Planning</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-6 text-center text-lg md:text-xl text-gray-600 max-w-2xl"
        >
          Track your progress, optimize your study sessions, and achieve excellence with our comprehensive exam preparation platform
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.7,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/signup"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold text-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </Link>
          <Link
            to="/login"
            className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-cyan-500 transition-all shadow-lg hover:shadow-xl"
          >
            Sign In
          </Link>
        </motion.div>
      </LampContainer>

      <section className="py-24 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            Our platform provides all the tools and insights you need to optimize your study routine and ace your exams
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a comprehensive overview of your progress with intuitive charts, statistics, and personalized insights
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Study Sessions</h3>
              <p className="text-gray-600 leading-relaxed">
                Track your study time, manage breaks, and maintain optimal focus with our smart session management
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your improvement across different subjects and modules with detailed analytics and insights
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Plan your study sessions efficiently with our intelligent calendar that adapts to your learning pace
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Study Materials</h3>
              <p className="text-gray-600 leading-relaxed">
                Access organized study content, take notes, and review materials all in one centralized location
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Practice Tests</h3>
              <p className="text-gray-600 leading-relaxed">
                Test your knowledge with practice exams and receive instant feedback to improve your performance
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of students who are achieving their academic goals with our platform
          </p>
          <Link
            to="/signup"
            className="inline-block px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold text-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl"
          >
            Start Your Journey Today
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">ExamPrep</span>
          </div>
          <p className="text-gray-600 mb-4">
            Your intelligent companion for exam preparation and academic success
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link to="/login" className="hover:text-cyan-600 transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-cyan-600 transition-colors">Sign Up</Link>
          </div>
          <p className="mt-8 text-sm text-gray-400">
            © 2025 ExamPrep. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
