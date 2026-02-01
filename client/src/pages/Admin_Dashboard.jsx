import React, { useMemo } from 'react';
import Navbar from '../components/Navbar';
import { FaUsers, FaUserGraduate, FaCalendar, FaDonate, FaSync } from 'react-icons/fa';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import useDashboardStats from '../hooks/useDashboardStats';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Admin_Dashboard = () => {
  // Use custom hook for real-time dashboard stats (refreshes every 30 seconds)
  const { stats, loading, error, refresh } = useDashboardStats(30000);

  // Chart configurations
  const usersByRoleChart = useMemo(() => {
    const data = stats.usersByRole.length > 0
      ? stats.usersByRole
      : [
        { role: 'Students', count: stats.totalStudents },
        { role: 'Alumni', count: stats.totalAlumni }
      ];

    return {
      labels: data.map(d => d.role || 'Unknown'),
      datasets: [{
        label: 'Users',
        data: data.map(d => d.count || 0),
        backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899'],
        borderColor: ['#2563EB', '#7C3AED', '#DB2777'],
        borderWidth: 2
      }]
    };
  }, [stats.usersByRole, stats.totalStudents, stats.totalAlumni]);

  const alumniVerificationChart = useMemo(() => {
    let data = stats.alumniVerificationStatus;

    // If no verification data, use safe defaults
    if (!data || data.length === 0) {
      data = [
        { status: 'Verified', count: 0 },
        { status: 'Pending', count: stats.totalAlumni },
        { status: 'Rejected', count: 0 }
      ];
    }

    return {
      labels: data.map(d => d.status || 'Unknown'),
      datasets: [{
        label: 'Alumni',
        data: data.map(d => d.count || 0),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderColor: ['#059669', '#D97706', '#DC2626'],
        borderWidth: 2
      }]
    };
  }, [stats.alumniVerificationStatus, stats.totalAlumni]);

  const studentSkillsChart = useMemo(() => {
    const data = stats.studentSkills;

    if (!data || data.length === 0) {
      return null; // Will show "No data available"
    }

    return {
      labels: data.map(d => d.skill || 'Other'),
      datasets: [{
        label: 'Students',
        data: data.map(d => d.count || 0),
        backgroundColor: '#6366F1',
        borderColor: '#4F46E5',
        borderWidth: 2,
        borderRadius: 6
      }]
    };
  }, [stats.studentSkills]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#9CA3AF',
          font: { size: 11 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F3F4F6',
        bodyColor: '#E5E7EB',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: '#9CA3AF', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#9CA3AF', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="pt-24 min-h-screen bg-black text-white p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#F0D41D]">Admin Dashboard</h1>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#F0D41D] text-black rounded-lg hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0D41D]"></div>
            <p className="mt-4">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl hover:bg-gray-750 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">Total Users</h3>
                  <FaUsers className="text-[#F0D41D] text-xl" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Students + Alumni</p>
              </div>

              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl hover:bg-gray-750 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">Total Alumni</h3>
                  <FaUserGraduate className="text-blue-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalAlumni}</p>
                <p className="text-xs text-gray-500 mt-1">Alumni accounts</p>
              </div>

              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl hover:bg-gray-750 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">No. of Events</h3>
                  <FaCalendar className="text-green-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.numberOfEvents}</p>
                <p className="text-xs text-gray-500 mt-1">Total events created</p>
              </div>

              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl hover:bg-gray-750 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">No. of Donations</h3>
                  <FaDonate className="text-purple-400 text-xl" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.numberOfDonations}</p>
                <p className="text-xs text-gray-500 mt-1">Total Donations</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Users by Role Chart */}
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-[#F0D41D] mb-4">Users by Role</h3>
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={usersByRoleChart} options={chartOptions} />
                </div>
              </div>

              {/* Alumni Verification Status Chart */}
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-[#F0D41D] mb-4">Alumni Verification Status</h3>
                <div className="h-64 flex items-center justify-center">
                  <Doughnut data={alumniVerificationChart} options={chartOptions} />
                </div>
              </div>

              {/* Student Skills Chart */}
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-[#F0D41D] mb-4">Top Student Skills</h3>
                <div className="h-64 flex items-center justify-center">
                  {studentSkillsChart ? (
                    <Bar data={studentSkillsChart} options={barChartOptions} />
                  ) : (
                    <p className="text-gray-500 text-sm">No data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="text-center text-gray-500 text-sm">
              <p>📊 Data refreshes automatically every 30 seconds</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin_Dashboard;
