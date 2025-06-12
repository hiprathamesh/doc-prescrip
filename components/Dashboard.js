'use client';

import { useState, useEffect } from 'react';
import PatientList from './PatientList';
import PatientDetails from './PatientDetails';
import NewPrescription from './NewPrescription';
import PrescriptionTemplates from './PrescriptionTemplates';
import MedicalDataManager from './MedicalDataManager';
import MedicalCertificate from './MedicalCertificate';
import {
  Plus,
  Search,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  AlertCircle,
  Activity,
  UserPlus,
  CalendarDays,
  Stethoscope,
  PieChart,
  BarChart3,
  LogOut
} from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatTimeAgo } from '../utils/dateUtils';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // Add 'templates' to possible values
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Load all data concurrently
      const [savedPatients, savedPrescriptions, savedBills] = await Promise.all([
        storage.getPatients(),
        storage.getPrescriptions(),
        storage.getBills()
      ]);

      setPatients(savedPatients);
      setPrescriptions(savedPrescriptions);
      setBills(savedBills);

      calculateStats(savedPatients, savedPrescriptions, savedBills);
    } catch (error) {
      console.error('Error loading data:', error);
      // Handle error - maybe show a notification to user
    }
  };

  const calculateStats = (patients, prescriptions, bills) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Patients stats
    const totalPatients = patients.length;
    const newPatientsThisWeek = patients.filter(p =>
      new Date(p.createdAt) >= oneWeekAgo
    ).length;
    const newPatientsThisMonth = patients.filter(p =>
      new Date(p.createdAt) >= oneMonthAgo
    ).length;

    // Visit stats
    const visitsThisWeek = prescriptions.filter(p =>
      new Date(p.visitDate) >= oneWeekAgo
    ).length;
    const visitsThisMonth = prescriptions.filter(p =>
      new Date(p.visitDate) >= oneMonthAgo
    ).length;

    // Follow-up stats - only include pending/overdue follow-ups
    const upcomingFollowUps = prescriptions.filter(p =>
      p.followUpDate &&
      (!p.followUpStatus || p.followUpStatus === 'pending' || p.followUpStatus === 'overdue') &&
      new Date(p.followUpDate) <= oneWeekFromNow
    ).map(p => ({
      ...p,
      patient: patients.find(patient => patient.id === p.patientId),
      isOverdue: new Date(p.followUpDate) < now
    })).sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    // Revenue stats
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paidRevenue = bills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
    const pendingRevenue = totalRevenue - paidRevenue;
    const revenueThisMonth = bills.filter(b =>
      new Date(b.createdAt) >= oneMonthAgo
    ).reduce((sum, bill) => sum + bill.amount, 0);

    // Recent activity
    const recentPrescriptions = prescriptions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(p => ({
        ...p,
        patient: patients.find(patient => patient.id === p.patientId)
      }));

    setStats({
      totalPatients,
      newPatientsThisWeek,
      newPatientsThisMonth,
      visitsThisWeek,
      visitsThisMonth,
      upcomingFollowUps,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      revenueThisMonth,
      recentPrescriptions
    });
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setCurrentView('details');
  };

  const handleNewPrescription = (patient = null) => {
    setSelectedPatient(patient);
    setCurrentView('prescription');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPatient(null);
    loadAllData(); // Refresh data when returning to dashboard
  };

  const handleViewAllPatients = () => {
    setCurrentView('list');
  };

  const handleViewTemplates = () => {
    setCurrentView('templates');
  };

  const handleViewMedicalData = () => {
    setCurrentView('medical-data');
  };

  const handleNewMedicalCertificate = (patient = null) => {
    setSelectedPatient(patient);
    setCurrentView('medical-certificate');
  };

  const handlePatientUpdate = async (updatedPatients) => {
    setPatients(updatedPatients);
    await storage.savePatients(updatedPatients);
    loadAllData();
  };

  const handlePatientDelete = async (patientId) => {
    const updatedPatients = patients.filter(p => p.id !== patientId);
    setPatients(updatedPatients);
    await storage.savePatients(updatedPatients);

    const allPrescriptions = await storage.getPrescriptions();
    const updatedPrescriptions = allPrescriptions.filter(p => p.patientId !== patientId);
    await storage.savePrescriptions(updatedPrescriptions);

    const allBills = await storage.getBills();
    const updatedBills = allBills.filter(b => b.patientId !== patientId);
    await storage.saveBills(updatedBills);

    if (selectedPatient && selectedPatient.id === patientId) {
      handleBackToDashboard();
    }

    loadAllData();
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Force a page reload to ensure middleware takes effect
        window.location.href = '/pin-entry';
      } else {
        console.error('Logout failed');
        // Fallback: try client-side cookie clearing
        document.cookie = 'pin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/pin-entry';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: try client-side cookie clearing
      document.cookie = 'pin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/pin-entry';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border border-gray-200 sticky top-0 z-40 rounded-b-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="flex items-center space-x-2">
                <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
                  <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-2xl font-bold text-gray-900">
                    Dr. Prashant Nikam
                  </h1>
                  <p className="text-xs text-gray-600 hidden sm:block">Practice Management System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Logout button - always visible */}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <button
                onClick={() => handleNewPrescription()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium hidden sm:inline">New Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Welcome Section */}
            <div className="text-center py-4 sm:py-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Welcome back, Dr. Nikam
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Here's what's happening in your practice today
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {/* Total Patients */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Patients</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalPatients || 0}</p>
                    <p className="text-xs sm:text-sm text-green-600 font-medium mt-1">
                      +{stats.newPatientsThisMonth || 0} this month
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-xl self-end sm:self-auto">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* This Week's Visits */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Visits This Week</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.visitsThisWeek || 0}</p>
                    <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                      {stats.visitsThisMonth || 0} this month
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl self-end sm:self-auto">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Revenue (Paid)</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">₹{stats.paidRevenue || 0}</p>
                    <p className="text-xs sm:text-sm text-orange-600 font-medium mt-1">
                      ₹{stats.pendingRevenue || 0} pending
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-xl self-end sm:self-auto">
                    <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Follow-ups */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Upcoming Follow-ups</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.upcomingFollowUps?.length || 0}</p>
                    <p className="text-xs sm:text-sm text-purple-600 font-medium mt-1">Next 7 days</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-xl self-end sm:self-auto">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Recent Activity & Quick Actions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Quick Actions</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={() => handleNewPrescription()}
                      className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">New Prescription</p>
                          <p className="text-xs sm:text-sm text-gray-600">Create prescription</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewAllPatients}
                      className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border border-green-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">View Patients</p>
                          <p className="text-xs sm:text-sm text-gray-600">Manage patient list</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewTemplates}
                      className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">Templates</p>
                          <p className="text-xs sm:text-sm text-gray-600">Manage templates</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewMedicalData}
                      className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border border-orange-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-orange-600 rounded-lg group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">Medical Data</p>
                          <p className="text-xs sm:text-sm text-gray-600">Manage symptoms & diagnoses</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNewMedicalCertificate()}
                      className="p-3 sm:p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 rounded-xl border border-cyan-200 transition-all duration-200 group sm:col-span-2 lg:col-span-1"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 sm:p-2 bg-cyan-600 rounded-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm sm:text-base font-semibold text-gray-900">Medical Certificate</p>
                          <p className="text-xs sm:text-sm text-gray-600">Generate fitness certificate</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span>Recent Activity</span>
                    </h3>
                    <button
                      onClick={handleViewAllPatients}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs sm:text-sm transition-colors"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {stats.recentPrescriptions?.length > 0 ? (
                      stats.recentPrescriptions.map((prescription) => (
                        <div key={prescription.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handlePatientSelect(prescription.patient)}>
                          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{prescription.patient?.name || 'Unknown Patient'}</p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Prescription created • {formatTimeAgo(prescription.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatDate(prescription.visitDate)}
                            </p>
                            {prescription.followUpDate && (
                              <p className="text-xs text-orange-600">
                                Follow-up: {formatDate(prescription.followUpDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm sm:text-base">No recent activity</p>
                        <p className="text-xs sm:text-sm text-gray-400">Recent prescriptions will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Upcoming Follow-ups & Insights */}
              <div className="space-y-6">
                {/* Upcoming Follow-ups */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-purple-600" />
                    <span>Upcoming Follow-ups</span>
                  </h3>

                  <div className="space-y-3">
                    {stats.upcomingFollowUps?.length > 0 ? (
                      stats.upcomingFollowUps.slice(0, 5).map((prescription) => {
                        const patient = patients.find(p => p.id === prescription.patientId);
                        return (
                          <div key={prescription.id} className={`flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer ${
                            prescription.isOverdue ? 'bg-red-50 border border-red-200' : 'bg-purple-50'
                          }`}
                            onClick={() => patient && handlePatientSelect(patient)}>
                            <div className={`p-1 sm:p-1.5 rounded-full ${
                              prescription.isOverdue ? 'bg-red-600' : 'bg-purple-600'
                            }`}>
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{patient?.name}</p>
                              <p className={`text-xs ${prescription.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                {prescription.isOverdue ? 'Overdue: ' : ''}{formatDate(prescription.followUpDate)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 sm:py-6">
                        <Calendar className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-xs sm:text-sm">No upcoming follow-ups</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Overview */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <span>This Month</span>
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">New Patients</span>
                      <span className="text-sm sm:text-base font-semibold text-gray-900">{stats.newPatientsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Total Visits</span>
                      <span className="text-sm sm:text-base font-semibold text-gray-900">{stats.visitsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Revenue</span>
                      <span className="text-sm sm:text-base font-semibold text-green-600">₹{stats.revenueThisMonth || 0}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Pending Payments</span>
                        <span className="text-sm sm:text-base font-semibold text-orange-600">₹{stats.pendingRevenue || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Tips Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
                  <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Practice Tip</span>
                  </h3>
                  <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                    Remember to follow up with patients who have pending payments. Good financial health keeps your practice running smoothly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <div>
            {/* Enhanced Search Bar for Patient List */}
            <div className="mb-6 sm:mb-8">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients by name, ID, or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base sm:text-lg shadow-lg"
                  />
                </div>
              </div>
            </div>

            <PatientList
              patients={filteredPatients}
              onPatientSelect={handlePatientSelect}
              onNewPrescription={handleNewPrescription}
              onPatientDelete={handlePatientDelete}
            />
          </div>
        )}

        {currentView === 'details' && selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBackToDashboard}
            onNewPrescription={() => handleNewPrescription(selectedPatient)}
          />
        )}

        {currentView === 'prescription' && (
          <NewPrescription
            patient={selectedPatient}
            patients={patients}
            onBack={handleBackToDashboard}
            onPatientUpdate={handlePatientUpdate}
          />
        )}

        {/* Add templates view */}
        {currentView === 'templates' && (
          <PrescriptionTemplates onBack={handleBackToDashboard} />
        )}

        {currentView === 'medical-certificate' && (
          <MedicalCertificate
            patient={selectedPatient}
            patients={patients}
            onBack={handleBackToDashboard}
            onPatientUpdate={handlePatientUpdate}
          />
        )}

        {currentView === 'medical-data' && (
          <MedicalDataManager onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
}