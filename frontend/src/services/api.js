import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically attach JWT Bearer Token if present in storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinemai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Intercept unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear if attempting login
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('cinemai_token');
        localStorage.removeItem('cinemai_user');
      }
    }
    return Promise.reject(error);
  }
);

// -----------------------------------------------------------------------------
// Auth Services
// -----------------------------------------------------------------------------
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// -----------------------------------------------------------------------------
// Movies Services
// -----------------------------------------------------------------------------
export const movieService = {
  getMovies: async (params = {}) => {
    const res = await api.get('/movies', { params });
    return res.data;
  },
  getMovieById: async (id) => {
    const res = await api.get(`/movies/${id}`);
    return res.data;
  },
  createMovie: async (movieData) => {
    const res = await api.post('/movies', movieData);
    return res.data;
  },
  getMoviePdf: async (movieId) => {
    const res = await api.get(`/movies/${movieId}/pdf`);
    return res.data;
  },
  sendMovieDigest: async (movieId, recipientEmail = null) => {
    const res = await api.post(`/movies/${movieId}/digest`, null, {
      params: recipientEmail ? { recipient_email: recipientEmail } : {},
    });
    return res.data;
  },
};

// -----------------------------------------------------------------------------
// Reviews Services
// -----------------------------------------------------------------------------
export const reviewService = {
  submitReview: async (reviewData) => {
    const res = await api.post('/reviews', reviewData);
    return res.data;
  },
  getMovieReviews: async (movieId, includeFlagged = false) => {
    const res = await api.get(`/reviews/movie/${movieId}`, {
      params: { include_flagged: includeFlagged },
    });
    return res.data;
  },
  deleteReview: async (reviewId) => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },
};

// -----------------------------------------------------------------------------
// AWS S3 Documents Vault Services
// -----------------------------------------------------------------------------
export const documentService = {
  getPresignedUrl: async (filename, fileType, folder = 'posters') => {
    const res = await api.post('/documents/presigned-url', {
      filename,
      file_type: fileType,
      folder,
    });
    return res.data;
  },
  uploadDirectToS3: async (uploadUrl, file, fileType) => {
    // Direct browser PUT to Amazon S3
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': fileType,
        'x-amz-server-side-encryption': 'AES256',
      },
    });
  },
};

// -----------------------------------------------------------------------------
// Admin Services
// -----------------------------------------------------------------------------
export const adminService = {
  getAnalytics: async () => {
    const res = await api.get('/admin/analytics');
    return res.data;
  },
  unflagReview: async (reviewId) => {
    const res = await api.patch(`/admin/review/${reviewId}/unflag`);
    return res.data;
  },
  purgeReview: async (reviewId) => {
    const res = await api.delete(`/admin/review/${reviewId}/purge`);
    return res.data;
  },
};

export default api;
