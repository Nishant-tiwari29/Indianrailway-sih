import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchNetwork = async () => {
  const response = await api.get('/network');
  return response.data;
};

export const fetchTrains = async () => {
  const response = await api.get('/trains');
  return response.data;
};

export const fetchRequests = async () => {
  const response = await api.get('/requests');
  return response.data;
};

export const fetchKPIs = async () => {
  const response = await api.get('/kpis');
  return response.data;
};

export const runOptimization = async (weights = {}, customRequests = null) => {
  const payload = {
    weights: {
      weight_risk: weights.weight_risk ?? 1.2,
      weight_disruption: weights.weight_disruption ?? 1.0,
      weight_backlog: weights.weight_backlog ?? 0.8,
      crew_limit: weights.crew_limit ?? 4,
      enforce_must_run: weights.enforce_must_run ?? true,
    },
    custom_requests: customRequests,
  };
  const response = await api.post('/optimize', payload);
  return response.data;
};

export const approveBlockRequest = async (requestId, approve = true) => {
  const response = await api.post(`/requests/${requestId}/approve?approve=${approve}`);
  return response.data;
};

export const updateBlockRequest = async (requestId, updates) => {
  const response = await api.put(`/requests/${requestId}`, updates);
  return response.data;
};

export const createBlockRequest = async (requestData) => {
  const response = await api.post('/requests', requestData);
  return response.data;
};

export const resetFixtures = async () => {
  const response = await api.post('/reset');
  return response.data;
};

export default api;
