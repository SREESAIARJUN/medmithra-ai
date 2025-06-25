import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input, Textarea, Badge, LoadingSpinner, ProgressBar, Icons, CollapsibleSection } from './UIComponents';

export const CreateCase = ({ onNavigate }) => {
  const { apiUrl, getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    chief_complaint: '',
    history_present_illness: '',
    past_medical_history: '',
    medications: '',
    allergies: '',
    social_history: '',
    family_history: '',
    review_of_systems: '',
    physical_examination: '',
    vital_signs: '',
    laboratory_results: '',
    imaging_results: '',
    assessment: '',
    plan: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validate required fields
    if (!formData.patient_id || !formData.patient_name || !formData.patient_age || !formData.patient_gender) {
      setError('Please fill in all required patient information fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create case
      const caseResponse = await fetch(`${apiUrl}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      if (!caseResponse.ok) {
        const errorData = await caseResponse.json();
        throw new Error(errorData.message || 'Failed to create case');
      }

      const caseData = await caseResponse.json();
      const caseId = caseData.id;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);

          const fileResponse = await fetch(`${apiUrl}/api/cases/${caseId}/upload`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
            },
            body: fileFormData,
          });

          if (!fileResponse.ok) {
            console.error(`Failed to upload file: ${file.name}`);
          }
        }
      }

      setSuccess('Case created successfully!');
      
      // Navigate to case detail after a short delay
      setTimeout(() => {
        onNavigate('case-detail', caseId);
      }, 1500);

    } catch (error) {
      setError(error.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
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
            Create New Case
          </h1>
        </div>

        {error && (
          <Card className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {success && (
          <Card className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Patient ID *"
                name="patient_id"
                value={formData.patient_id}
                onChange={handleInputChange}
                required
                placeholder="e.g., P001234"
              />
              <Input
                label="Patient Name *"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleInputChange}
                required
                placeholder="Full name"
              />
              <Input
                label="Age *"
                name="patient_age"
                type="number"
                value={formData.patient_age}
                onChange={handleInputChange}
                required
                placeholder="Age in years"
              />
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleInputChange}
                  required
                  className="input"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Clinical Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Clinical Information
            </h2>
            <div className="space-y-4">
              <Textarea
                label="Chief Complaint"
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleInputChange}
                placeholder="Primary reason for the visit"
              />
              <Textarea
                label="History of Present Illness"
                name="history_present_illness"
                value={formData.history_present_illness}
                onChange={handleInputChange}
                placeholder="Detailed description of current symptoms"
              />
              <Textarea
                label="Past Medical History"
                name="past_medical_history"
                value={formData.past_medical_history}
                onChange={handleInputChange}
                placeholder="Previous medical conditions, surgeries, hospitalizations"
              />
              <Textarea
                label="Current Medications"
                name="medications"
                value={formData.medications}
                onChange={handleInputChange}
                placeholder="List current medications with dosages"
              />
              <Textarea
                label="Allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="Known allergies and reactions"
              />
            </div>
          </Card>

          {/* Additional History */}
          <CollapsibleSection title="Additional History" className="p-6">
            <div className="space-y-4">
              <Textarea
                label="Social History"
                name="social_history"
                value={formData.social_history}
                onChange={handleInputChange}
                placeholder="Smoking, alcohol, occupation, lifestyle factors"
              />
              <Textarea
                label="Family History"
                name="family_history"
                value={formData.family_history}
                onChange={handleInputChange}
                placeholder="Relevant family medical history"
              />
              <Textarea
                label="Review of Systems"
                name="review_of_systems"
                value={formData.review_of_systems}
                onChange={handleInputChange}
                placeholder="Systematic review of body systems"
              />
            </div>
          </CollapsibleSection>

          {/* Physical Examination */}
          <CollapsibleSection title="Physical Examination" className="p-6">
            <div className="space-y-4">
              <Textarea
                label="Vital Signs"
                name="vital_signs"
                value={formData.vital_signs}
                onChange={handleInputChange}
                placeholder="BP, HR, RR, Temp, O2 Sat"
              />
              <Textarea
                label="Physical Examination"
                name="physical_examination"
                value={formData.physical_examination}
                onChange={handleInputChange}
                placeholder="Detailed physical examination findings"
              />
            </div>
          </CollapsibleSection>

          {/* Diagnostic Results */}
          <CollapsibleSection title="Diagnostic Results" className="p-6">
            <div className="space-y-4">
              <Textarea
                label="Laboratory Results"
                name="laboratory_results"
                value={formData.laboratory_results}
                onChange={handleInputChange}
                placeholder="Lab test results and values"
              />
              <Textarea
                label="Imaging Results"
                name="imaging_results"
                value={formData.imaging_results}
                onChange={handleInputChange}
                placeholder="X-ray, CT, MRI, ultrasound findings"
              />
            </div>
          </CollapsibleSection>

          {/* Assessment and Plan */}
          <CollapsibleSection title="Assessment & Plan" className="p-6">
            <div className="space-y-4">
              <Textarea
                label="Assessment"
                name="assessment"
                value={formData.assessment}
                onChange={handleInputChange}
                placeholder="Clinical assessment and impression"
              />
              <Textarea
                label="Plan"
                name="plan"
                value={formData.plan}
                onChange={handleInputChange}
                placeholder="Treatment plan and follow-up"
              />
            </div>
          </CollapsibleSection>

          {/* File Upload */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Attach Files
            </h2>
            <div className="form-group">
              <label className="form-label">Upload Medical Files</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="input"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Supported formats: PDF, JPG, PNG, DOC, DOCX
              </p>
              {files.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected files:
                  </p>
                  <ul className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {files.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Submit */}
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
              size="lg"
            >
              {loading ? 'Creating Case...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CasesList = ({ onNavigate }) => {
  const { apiUrl, getAuthHeaders } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/cases`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCases = cases
    .filter(case_ =>
      case_.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (case_.chief_complaint && case_.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => onNavigate('dashboard')}
            className="mb-4"
          >
            <Icons.ArrowLeft />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Cases
            </h1>
            <Button
              variant="primary"
              onClick={() => onNavigate('create-case')}
            >
              <Icons.Plus />
              New Case
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name, ID, or complaint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input"
              >
                <option value="created_at">Sort by Date</option>
                <option value="patient_name">Sort by Name</option>
                <option value="patient_age">Sort by Age</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Cases List */}
        {filteredAndSortedCases.length === 0 ? (
          <Card className="p-12 text-center">
            <Icons.Cases />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">
              No cases found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create your first case to get started.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => onNavigate('create-case')}
            >
              <Icons.Plus />
              Create First Case
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedCases.map((case_) => (
              <Card
                key={case_.id}
                className="p-6 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => onNavigate('case-detail', case_.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {case_.patient_name}
                      </h3>
                      <Badge variant="secondary" size="sm">
                        ID: {case_.patient_id}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Age:</span> {case_.patient_age} years
                      </div>
                      <div>
                        <span className="font-medium">Gender:</span> {case_.patient_gender}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(case_.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {case_.chief_complaint && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Chief Complaint:</span> {case_.chief_complaint}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge
                      variant={case_.analysis_result ? 'success' : 'warning'}
                    >
                      {case_.analysis_result ? 'Analyzed' : 'Pending Analysis'}
                    </Badge>
                    {case_.files && case_.files.length > 0 && (
                      <Badge variant="secondary" size="sm">
                        {case_.files.length} file(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};