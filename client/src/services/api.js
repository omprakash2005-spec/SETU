import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      // window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Register user (student or alumni)
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user (student or alumni)
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (imageFile) => {
    const formData = new FormData();
    formData.append('profile_picture', imageFile);
    const response = await api.post('/auth/profile/upload-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Admin API calls
export const adminAPI = {
  // Admin login
  login: async (credentials) => {
    const response = await api.post('/admin/login', credentials);
    return response.data;
  },

  // Get admin profile
  getProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Create new admin
  createAdmin: async (adminData) => {
    const response = await api.post('/admin/create', adminData);
    return response.data;
  },

  // Get directory (alumni and students)
  getDirectory: async (params = {}) => {
    const response = await api.get('/admin/directory', { params });
    return response.data;
  },

  // Export directory as CSV
  exportDirectoryCSV: async () => {
    const response = await api.get('/admin/directory/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export directory as Excel
  exportDirectoryExcel: async () => {
    const response = await api.get('/admin/directory/export/excel', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export directory as PDF
  exportDirectoryPDF: async () => {
    const response = await api.get('/admin/directory/export/pdf', {
      responseType: 'blob',
    });
    return {
      blob: response.data,
      headers: response.headers,
    };
  },

  // Import directory from CSV
  importDirectoryCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/directory/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Events API calls
export const eventsAPI = {
  // Get all events
  getAll: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Get event by ID
  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create event (admin and alumni only)
  create: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  // Update event (organizer only)
  update: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  // Delete event (organizer only)
  delete: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  // Register for event (students only)
  register: async (id, registrationData) => {
    const response = await api.post(`/events/${id}/register`, registrationData);
    return response.data;
  },

  // Get my registrations (students only)
  getMyRegistrations: async () => {
    const response = await api.get('/events/my/registrations');
    return response.data;
  },
};

// Jobs API calls
export const jobsAPI = {
  // Get all approved jobs
  getAll: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  // Get job by ID
  getById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // Create job directly (admin only)
  create: async (jobData) => {
    const response = await api.post('/jobs/create', jobData);
    return response.data;
  },

  // Request job posting (alumni only)
  requestJob: async (jobData) => {
    const response = await api.post('/jobs/request', jobData);
    return response.data;
  },

  // Apply for a job (students and alumni)
  apply: async (jobId, applicationData) => {
    const response = await api.post(`/jobs/apply/${jobId}`, applicationData);
    return response.data;
  },

  // Get pending job requests (admin only)
  getPendingRequests: async (params = {}) => {
    const response = await api.get('/jobs/pending/requests', { params });
    return response.data;
  },

  // Approve job request (admin only)
  approveRequest: async (requestId) => {
    const response = await api.post(`/jobs/approve/${requestId}`);
    return response.data;
  },

  // Reject job request (admin only)
  rejectRequest: async (requestId, rejectionReason = '') => {
    const response = await api.post(`/jobs/reject/${requestId}`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  },
  // Delete job (admin can delete any, alumni cannot delete approved jobs)
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  // Delete pending job request (alumni - own pending requests)
  deletePendingRequest: async (requestId) => {
    const response = await api.delete(`/jobs/pending/request/${requestId}`);
    return response.data;
  },
  // Get my applications (students and alumni)
  getMyApplications: async () => {
    const response = await api.get('/jobs/my/applications');
    return response.data;
  },

  // Get my job requests (alumni only)
  getMyRequests: async () => {
    const response = await api.get('/jobs/my/requests');
    return response.data;
  },

  // Get applications for a job (admin or job poster only)
  getJobApplications: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data;
  },

  // Delete a job (admin or job poster only)
  delete: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },
};

// Posts API calls
export const postsAPI = {
  // Get all posts (paginated feed)
  getAll: async (params = { page: 1, limit: 10 }) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },

  // Create a post (with optional image)
  create: async (postData) => {
    // Use FormData for image uploads
    const formData = new FormData();
    formData.append('content', postData.content);
    if (postData.image) {
      formData.append('image', postData.image);
    }

    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a post (author or admin only)
  delete: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  // Like a post
  like: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Unlike a post
  unlike: async (postId) => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  // Get comments for a post
  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  // Add a comment
  addComment: async (postId, commentText) => {
    const response = await api.post(`/posts/${postId}/comments`, {
      comment_text: commentText,
    });
    return response.data;
  },
};

// Connection API calls
export const connectionsAPI = {
  // Create new connection request
  create: async (connectionData) => {
    const response = await api.post('/connections', connectionData);
    return response.data;
  },

  // Get all accepted connections for current user
  getAll: async () => {
    const response = await api.get('/connections');
    return response.data;
  },

  // Get pending connection requests (incoming)
  getPendingRequests: async () => {
    const response = await api.get('/connections/requests/pending');
    return response.data;
  },

  // Accept a connection request
  acceptRequest: async (requestId) => {
    const response = await api.post(`/connections/accept/${requestId}`);
    return response.data;
  },

  // Reject a connection request
  rejectRequest: async (requestId) => {
    const response = await api.post(`/connections/reject/${requestId}`);
    return response.data;
  },

  // Check if connected with specific mentor
  check: async (mentorName) => {
    const response = await api.get(`/connections/check/${encodeURIComponent(mentorName)}`);
    return response.data;
  },

  // Delete connection
  delete: async (connectionId) => {
    const response = await api.delete(`/connections/${connectionId}`);
    return response.data;
  },
};

export default api;
