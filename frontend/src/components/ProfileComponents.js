import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, LoadingSpinner, Icons } from './UIComponents';

export const ProfileManagement = ({ onNavigate }) => {
  const { user, updateProfile, apiUrl, getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    specialty: '',
    license_number: '',
    institution: '',
    phone: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        specialty: user.specialty || '',
        license_number: user.license_number || '',
        institution: user.institution || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
    fetchProfileStats();
  }, [user]);

  const fetchProfileStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/profile`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
    } else {
      setError(result.error || 'Failed to update profile');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('dashboard')}
            className="mb-4"
          >
            <Icons.ArrowLeft />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Profile Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information and view your activity statistics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Personal Information
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                  <p className="text-green-700 dark:text-green-400">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Dr. John Smith"
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@hospital.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleInputChange}
                    placeholder="Cardiology, Internal Medicine, etc."
                  />
                  <Input
                    label="License Number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="Medical license number"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Institution"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    placeholder="Hospital or clinic name"
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="textarea"
                    rows="4"
                    placeholder="Brief professional bio or notes..."
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onNavigate('dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Account Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Username</span>
                  <p className="text-gray-900 dark:text-gray-100">{user?.username}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {user?.role || 'Doctor'}
                  </p>
                </div>
              </div>
            </Card>

            {stats && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Activity Statistics
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {stats.total_cases || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Cases
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                      {stats.analyzed_cases || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Analyzed Cases
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                      {stats.pending_cases || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pending Analysis
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-medical-600 dark:text-medical-400">
                      {stats.files_uploaded || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Files Uploaded
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate('create-case')}
                >
                  <Icons.Plus />
                  New Case
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate('cases')}
                >
                  <Icons.Cases />
                  View Cases
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => onNavigate('search')}
                >
                  <Icons.Search />
                  Search Cases
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};