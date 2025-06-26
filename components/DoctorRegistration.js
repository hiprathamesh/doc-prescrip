// This file is no longer needed - functionality has been merged into the login page
// You can safely delete this file
import { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Building2, GraduationCap, Phone, MapPin, FileText, Key, Info } from 'lucide-react';
import { toast } from 'sonner';
import storage from '../utils/storage';

export default function DoctorRegistration({ onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    hospitalName: '',
    hospitalAddress: '',
    degree: '',
    registrationNumber: '',
    phone: '',
    accessKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [accessType, setAccessType] = useState('trial');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update access type based on key presence
    if (name === 'accessKey') {
      setAccessType(value.trim() ? 'lifetime_free' : 'trial');
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Error', { description: 'Passwords do not match' });
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('Error', { description: 'Password must be at least 8 characters long' });
      return false;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error('Error', { description: 'Please enter a valid phone number' });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Error', { description: 'Please enter a valid email address' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          hospitalName: formData.hospitalName,
          hospitalAddress: formData.hospitalAddress,
          degree: formData.degree,
          registrationNumber: formData.registrationNumber,
          phone: formData.phone,
          accessKey: formData.accessKey
        }),
      });

      const data = await response.json();

      if (data.success) {
        const accessMessage = data.doctor.accessType === 'lifetime_free' 
          ? 'with lifetime free access' 
          : 'with 6-month free trial';
        
        // Store doctor context for immediate login
        storage.setCurrentDoctor(data.doctor.doctorId, {
          name: data.doctor.name,
          accessType: data.doctor.accessType
        });
        
        toast.success('Registration Successful', {
          description: `Doctor account has been created successfully ${accessMessage}`
        });
        onSuccess?.(data.doctor);
      } else {
        toast.error('Registration Failed', {
          description: data.error || 'Failed to register doctor'
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={onBack}
            className="absolute left-6 p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Register New Doctor</h2>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Access Key */}
            <div>
              <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
                Access Key (Optional)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="accessKey"
                  name="accessKey"
                  type="text"
                  value={formData.accessKey}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                />
              </div>
              <div className={`mt-2 p-3 rounded-md ${accessType === 'lifetime_free' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-center">
                  <Info className={`h-4 w-4 mr-2 ${accessType === 'lifetime_free' ? 'text-green-600' : 'text-blue-600'}`} />
                  <span className={`text-sm font-medium ${accessType === 'lifetime_free' ? 'text-green-800' : 'text-blue-800'}`}>
                    {accessType === 'lifetime_free' 
                      ? 'Lifetime Free Access' 
                      : '6-Month Free Trial'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${accessType === 'lifetime_free' ? 'text-green-700' : 'text-blue-700'}`}>
                  {accessType === 'lifetime_free' 
                    ? 'Your access key provides unlimited access to all features.' 
                    : 'After 6 months, a subscription will be required to continue accessing your data.'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dr. John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john.doe@hospital.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91-9876543210"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            {/* Hospital Name */}
            <div>
              <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700">
                Hospital/Clinic Name *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="hospitalName"
                  name="hospitalName"
                  type="text"
                  required
                  value={formData.hospitalName}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City General Hospital"
                />
              </div>
            </div>

            {/* Hospital Address */}
            <div>
              <label htmlFor="hospitalAddress" className="block text-sm font-medium text-gray-700">
                Hospital Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="hospitalAddress"
                  name="hospitalAddress"
                  type="text"
                  value={formData.hospitalAddress}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Medical Street, City, State"
                />
              </div>
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700">
                Medical Degree *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="degree"
                  name="degree"
                  type="text"
                  required
                  value={formData.degree}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MBBS, MD"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                Medical Registration Number *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  required
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MH-12345"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : 'Register Doctor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
