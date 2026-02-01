import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for fetching real-time dashboard analytics
 * Automatically refreshes data every 30 seconds
 */
const useDashboardStats = (refreshInterval = 30000) => {
  const [stats, setStats] = useState({
    // KPI Stats
    totalUsers: 0,
    totalAlumni: 0,
    totalStudents: 0,
    numberOfEvents: 0,
    numberOfDonations: 0,
    
    // Chart Data
    usersByRole: [],
    alumniVerificationStatus: [],
    studentSkills: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch all analytics data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs
      const kpisResponse = await fetch('http://localhost:5001/api/admin/analytics/kpis', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let kpisData = {};
      if (kpisResponse.ok) {
        const kpisResult = await kpisResponse.json();
        kpisData = kpisResult.data || {};
      } else {
        const errorText = await kpisResponse.text();
        console.error('Failed to fetch KPIs:', kpisResponse.status, errorText);
        if (kpisResponse.status === 401 || kpisResponse.status === 403) {
          throw new Error('Authentication required. Please login as admin.');
        }
      }

      // Fetch users by role
      const roleResponse = await fetch('http://localhost:5001/api/admin/analytics/users-by-role', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let rolesData = { labels: [], datasets: [] };
      if (roleResponse.ok) {
        const roleResult = await roleResponse.json();
        rolesData = roleResult.data || { labels: [], datasets: [] };
      }

      // Fetch alumni verification status
      const verificationResponse = await fetch('http://localhost:5001/api/admin/analytics/alumni-verification-status', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let verificationData = { labels: [], datasets: [] };
      if (verificationResponse.ok) {
        const verificationResult = await verificationResponse.json();
        verificationData = verificationResult.data || { labels: [], datasets: [] };
      }

      // Fetch student skills
      const skillsResponse = await fetch('http://localhost:5001/api/admin/analytics/student-skills', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      let skillsData = { labels: [], datasets: [] };
      if (skillsResponse.ok) {
        const skillsResult = await skillsResponse.json();
        skillsData = skillsResult.data || { labels: [], datasets: [] };
      }

      // Extract values from KPIs
      const totalUsers = kpisData.totalUsers?.value || 0;
      const totalAlumni = kpisData.totalAlumni?.value || 0;
      const totalStudents = kpisData.totalStudents?.value || 0;
      const numberOfEvents = kpisData.totalEvents?.value || 0;
      const numberOfDonations = kpisData.totalDonations?.value || 0;

      // Format users by role
      const usersByRole = [];
      if (rolesData.labels && rolesData.datasets && rolesData.datasets[0]) {
        rolesData.labels.forEach((label, index) => {
          usersByRole.push({
            role: label,
            count: rolesData.datasets[0].data[index] || 0
          });
        });
      }

      // Format alumni verification status
      const alumniVerificationStatus = [];
      if (verificationData.labels && verificationData.datasets && verificationData.datasets[0]) {
        verificationData.labels.forEach((label, index) => {
          alumniVerificationStatus.push({
            status: label,
            count: verificationData.datasets[0].data[index] || 0
          });
        });
      }

      // Format student skills
      const studentSkills = [];
      if (skillsData.labels && skillsData.datasets && skillsData.datasets[0]) {
        skillsData.labels.forEach((label, index) => {
          studentSkills.push({
            skill: label,
            count: skillsData.datasets[0].data[index] || 0
          });
        });
      }

      // Update state
      setStats({
        totalUsers,
        totalAlumni,
        totalStudents,
        numberOfEvents,
        numberOfDonations,
        usersByRole,
        alumniVerificationStatus,
        studentSkills,
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchDashboardData, refreshInterval);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchDashboardData, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    loading,
    error,
    refresh
  };
};

export default useDashboardStats;
