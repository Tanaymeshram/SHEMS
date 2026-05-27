const API_BASE = 'http://localhost:5000/api';

// Helper for sending requests
async function request(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth Module
  async login(username, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('user', JSON.stringify(res.user));
    return res.user;
  },

  async register(username, password, name, role) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, role }),
    });
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('user');
  },

  // Live Dashboard Feed (BEMS)
  async getLiveDashboard() {
    return request('/dashboard/live');
  },

  // HVAC Settings
  async getHvacSettings() {
    return request('/hvac/settings');
  },

  async setHvacSettings(data) {
    return request('/hvac/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // AI & ML Predictions
  async getEnergyPredictions(outdoorTemp = 24.0) {
    return request(`/predictions/energy?outdoor_temp=${outdoorTemp}`);
  },

  // Medical Equipment Monitor
  async getEquipment() {
    return request('/equipment');
  },

  async updateEquipmentStatus(name, status) {
    return request('/equipment', {
      method: 'POST',
      body: JSON.stringify({ name, status }),
    });
  },

  // Anomalies & Leakages
  async getAnomalies() {
    return request('/anomalies');
  },

  // Automation Policies
  async toggleAutomation(key) {
    return request('/automation/toggle', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  },

  // Alerts Management
  async getAlerts() {
    return request('/alerts');
  },

  async resolveAlert(id) {
    return request('/alerts', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'resolve' }),
    });
  },

  async deleteAlert(id) {
    return request('/alerts', {
      method: 'POST',
      body: JSON.stringify({ id, action: 'delete' }),
    });
  },

  // Reports Exporter Link
  getReportExportUrl(type) {
    return `${API_BASE}/reports/export?type=${type}`;
  },

  // System Controls
  async retrainModels() {
    return request('/settings/system', {
      method: 'POST',
      body: JSON.stringify({ action: 'retrain' }),
    });
  },

  async resetDatabase() {
    return request('/settings/system', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_db' }),
    });
  }
};
