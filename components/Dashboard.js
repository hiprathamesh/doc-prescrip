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
  const [isStatsHovered, setIsStatsHovered] = useState(false);

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

  // Add function to generate contextual greeting
  const getContextualGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const month = now.getMonth(); // 0 = January, 11 = December
    const date = now.getDate();
    
    // Performance metrics for pep talk
    const hasGoodPerformance = (stats.visitsThisWeek || 0) >= 10 || (stats.newPatientsThisWeek || 0) >= 3;
    const hasExcellentPerformance = (stats.visitsThisWeek || 0) >= 20 || (stats.newPatientsThisWeek || 0) >= 5;
    
    // Indian festivals and special days (approximate dates)
    const specialDays = {
      // Diwali (varies each year, but typically October/November)
      'diwali2024': month === 10 && date >= 1 && date <= 5, // Nov 1-5, 2024
      // Holi (varies each year, but typically March)
      'holi2024': month === 2 && date >= 13 && date <= 14, // March 13-14, 2024
      // Doctors Day (July 1)
      'doctorsDay': month === 6 && date === 1,
      // Teachers Day (September 5)
      'teachersDay': month === 8 && date === 5,
      // Independence Day (August 15)
      'independenceDay': month === 7 && date === 15,
      // Republic Day (January 26)
      'republicDay': month === 0 && date === 26,
      // New Year (January 1)
      'newYear': month === 0 && date === 1,
      // Christmas (December 25)
      'christmas': month === 11 && date === 25,
      // World Health Day (April 7)
      'worldHealthDay': month === 3 && date === 7,
    };

    // Festival greetings
    if (specialDays.diwali2024) {
      return {
        title: "✨ Happy Diwali, Dr. Nikam! ✨",
        subtitle: "May this festival of lights brighten your practice and bring prosperity to all your patients"
      };
    }
    
    if (specialDays.holi2024) {
      return {
        title: "Happy Holi, Dr. Nikam!",
        subtitle: "Let the colors of joy and healing fill your practice today"
      };
    }
    
    if (specialDays.doctorsDay) {
      return {
        title: "Happy National Doctors' Day, Dr. Nikam!",
        subtitle: "Thank you for your dedication to healing and caring for the community"
      };
    }
    
    if (specialDays.worldHealthDay) {
      return {
        title: "Happy World Health Day, Dr. Nikam!",
        subtitle: "Your commitment to health makes the world a better place"
      };
    }
    
    if (specialDays.independenceDay) {
      return {
        title: "Happy Independence Day, Dr. Nikam!",
        subtitle: "Freedom through health - your service strengthens our nation"
      };
    }
    
    if (specialDays.republicDay) {
      return {
        title: "Happy Republic Day, Dr. Nikam!",
        subtitle: "Serving the republic with compassion and care"
      };
    }
    
    if (specialDays.newYear) {
      return {
        title: "Happy New Year, Dr. Nikam!",
        subtitle: "Here's to another year of healing hearts and changing lives"
      };
    }
    
    if (specialDays.christmas) {
      return {
        title: "Merry Christmas, Dr. Nikam!",
        subtitle: "Spreading joy and wellness this festive season"
      };
    }

    // // Performance-based pep talks
    // if (hasExcellentPerformance) {
    //   const excellentMessages = [
    //     {
    //       title: "🚀 Outstanding work, Dr. Nikam!",
    //       subtitle: "Your exceptional care is making a real difference in people's lives"
    //     },
    //     {
    //       title: "⭐ Superstar healer, Dr. Nikam!",
    //       subtitle: "Your dedication to excellence shows in every patient interaction"
    //     },
    //     {
    //       title: "🏆 Phenomenal progress, Dr. Nikam!",
    //       subtitle: "You're setting new standards in patient care"
    //     }
    //   ];
    //   return excellentMessages[Math.floor(Math.random() * excellentMessages.length)];
    // }
    
    // if (hasGoodPerformance) {
    //   const goodMessages = [
    //     {
    //       title: "💪 Great going, Dr. Nikam!",
    //       subtitle: "Your consistent care is building a healthier community"
    //     },
    //     {
    //       title: "🌟 Back at it, Dr. Nikam!",
    //       subtitle: "Every patient you see is a life touched by your expertise"
    //     },
    //     {
    //       title: "📈 Impressive work, Dr. Nikam!",
    //       subtitle: "Your commitment to healing continues to inspire"
    //     }
    //   ];
    //   return goodMessages[Math.floor(Math.random() * goodMessages.length)];
    // }

    // Day-specific greetings
    if (day === 5) { // Friday
      const fridayMessages = [
        {
          title: "Happy Friday, Dr. Nikam!",
          subtitle: "End the week strong with your healing touch"
        },
        {
          title: "TGIF, Dr. Nikam!",
          subtitle: "Friday energy for healing and caring"
        }
      ];
      return fridayMessages[Math.floor(Math.random() * fridayMessages.length)];
    }
    
    if (day === 1) { // Monday
      const mondayMessages = [
        {
          title: "Monday motivation, Dr. Nikam!",
          subtitle: "Start the week with purpose and compassion"
        },
        {
          title: "Fresh start, Dr. Nikam!",
          subtitle: "New week, new opportunities to heal and help"
        }
      ];
      return mondayMessages[Math.floor(Math.random() * mondayMessages.length)];
    }
    
    if (day === 0 || day === 6) { // Weekend
      return {
        title: "Weekend warrior, Dr. Nikam!",
        subtitle: "Even on weekends, your dedication to care never stops"
      };
    }

    // Time-based greetings
    if (hour >= 5 && hour < 12) {
      const morningMessages = [
        {
          title: "Good morning, Dr. Nikam!",
          subtitle: "Ready to make a difference in people's lives today"
        },
        {
          title: "Rise and heal, Dr. Nikam!",
          subtitle: "Another day to spread wellness and hope"
        },
        {
          title: "Morning energy, Dr. Nikam!",
          subtitle: "Starting the day with purpose and healing"
        }
      ];
      return morningMessages[Math.floor(Math.random() * morningMessages.length)];
    } else if (hour >= 12 && hour < 17) {
      const afternoonMessages = [
        {
          title: "Good afternoon, Dr. Nikam!",
          subtitle: "Midday momentum for continued excellent care"
        },
        {
          title: "Afternoon power, Dr. Nikam!",
          subtitle: "Keeping the healing energy strong"
        }
      ];
      return afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
    } else if (hour >= 17 && hour < 21) {
      const eveningMessages = [
        {
          title: "Good evening, Dr. Nikam!",
          subtitle: "Winding down another day of compassionate care"
        },
        {
          title: "Evening excellence, Dr. Nikam!",
          subtitle: "Your dedication brightens even the evening hours"
        }
      ];
      return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    } else {
      const lateMessages = [
        {
          title: "Dedicated healer, Dr. Nikam!",
          subtitle: "Your commitment to patient care knows no bounds"
        },
        {
          title: "Night owl doctor, Dr. Nikam!",
          subtitle: "Thank you for your round-the-clock dedication"
        }
      ];
      return lateMessages[Math.floor(Math.random() * lateMessages.length)];
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="dashboard-header bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="p-2 bg-blue-600 rounded">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Chaitanya Hospital, Deola
                </h1>
                <p className="text-sm text-gray-500">Practice Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>

              <button
                onClick={() => handleNewPrescription()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center space-x-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>New Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Dynamic Welcome Section */}
            <div>
              {(() => {
                const greeting = getContextualGreeting();
                return (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {greeting.title}
                    </h2>
                    <p className="text-gray-600">
                      {greeting.subtitle}
                    </p>
                  </>
                );
              })()}
            </div>

            {/* Stats Grid with Hover Expansion */}
            <div 
              className={`bg-gray-100 rounded-2xl p-4 transition-all duration-500 ease-out `}
              onMouseEnter={() => setIsStatsHovered(true)}
              onMouseLeave={() => setIsStatsHovered(false)}
            >
              <div className="grid grid-cols-4 gap-4">
                {/* Total Patients */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-50 rounded">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">PATIENTS</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalPatients || 0}</p>
                    <p className="text-sm text-gray-600">Total registered</p>
                  </div>
                  
                  {/* Expanded content on hover */}
                  <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100`}>
                    <div className="flex justify-between items-center text-[13px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-gray-600">New this month</span>
                      </div>
                      <span className="font-medium text-gray-600">+{stats.newPatientsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-600">New this week</span>
                      </div>
                      <span className="font-medium text-gray-600">+{stats.newPatientsThisWeek || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Visits This Week */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-50 rounded">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">VISITS</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-gray-900">{stats.visitsThisWeek || 0}</p>
                    <p className="text-sm text-gray-600">This week</p>
                  </div>
                  
                  <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100`}>
                    <div className="flex justify-between items-center text-[13px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-gray-600">This month</span>
                      </div>
                      <span className="font-medium text-gray-600">{stats.visitsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-600">Average per day</span>
                      </div>
                      <span className="font-medium text-gray-600">{Math.round((stats.visitsThisWeek || 0) / 7)}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-orange-50 rounded">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">REVENUE</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-gray-900">₹{stats.paidRevenue || 0}</p>
                    <p className="text-sm text-gray-600">Collected</p>
                  </div>
                  
                  <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100`}>
                    <div className="flex justify-between items-center text-[13px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <span className="text-gray-600">Pending</span>
                      </div>
                      <span className="font-medium text-gray-600">₹{stats.pendingRevenue || 0}</span>
                    </div>
                    <div className="flex justify-between items-end text-[13px] mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-gray-600">This month</span>
                      </div>
                      <span className="font-medium text-gray-600">₹{stats.revenueThisMonth || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Follow-ups */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-purple-50 rounded">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">FOLLOW-UPS</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-semibold text-gray-900">{stats.upcomingFollowUps?.length || 0}</p>
                    <p className="text-sm text-gray-600">Upcoming</p>
                  </div>
                  
                  <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100`}>
                    <div className="flex justify-between items-center text-[13px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <span className="text-gray-600">Next 7 days</span>
                      </div>
                      <span className="font-medium text-gray-600">{stats.upcomingFollowUps?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px] mt-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span className="text-gray-600">Overdue</span>
                      </div>
                      <span className="font-medium text-gray-600">{stats.upcomingFollowUps?.filter(f => f.isOverdue).length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Quick Actions & Recent Activity */}
              <div className="col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleNewPrescription()}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">New Prescription</p>
                          <p className="text-xs text-gray-600">Create prescription</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewAllPatients}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-600 rounded">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">View Patients</p>
                          <p className="text-xs text-gray-600">Manage patients</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewTemplates}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-600 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Templates</p>
                          <p className="text-xs text-gray-600">Manage templates</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewMedicalData}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-600 rounded">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Medical Data</p>
                          <p className="text-xs text-gray-600">Symptoms & diagnoses</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNewMedicalCertificate()}
                      className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 text-left col-span-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-600 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Medical Certificate</p>
                          <p className="text-xs text-gray-600">Generate fitness certificate</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <button
                      onClick={handleViewAllPatients}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-0">
                    {stats.recentPrescriptions?.length > 0 ? (
                      stats.recentPrescriptions.map((prescription, index) => (
                        <div key={prescription.id}>
                          <div className="flex items-center space-x-3 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg px-2 -mx-2"
                            onClick={() => handlePatientSelect(prescription.patient)}>
                            <div className="p-2 bg-blue-50 rounded">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{prescription.patient?.name || 'Unknown Patient'}</p>
                              <p className="text-xs text-gray-600">
                                Prescription created • {formatTimeAgo(prescription.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(prescription.visitDate)}
                              </p>
                              {prescription.followUpDate && (
                                <p className="text-xs text-orange-600">
                                  Follow-up: {formatDate(prescription.followUpDate)}
                                </p>
                              )}
                            </div>
                          </div>
                          {index < stats.recentPrescriptions.length - 1 && (
                            <div className="border-b border-gray-100"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500">No recent activity</p>
                        <p className="text-sm text-gray-400">Recent prescriptions will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Follow-ups & Monthly Overview */}
              <div className="space-y-6">
                {/* Upcoming Follow-ups */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Follow-ups</h3>

                  <div className="space-y-0">
                    {stats.upcomingFollowUps?.length > 0 ? (
                      stats.upcomingFollowUps.slice(0, 5).map((prescription, index) => {
                        const patient = patients.find(p => p.id === prescription.patientId);
                        return (
                          <div key={prescription.id}>
                            <div className={`flex items-center space-x-3 py-3 transition-colors cursor-pointer rounded-lg px-2 -mx-2 ${
                              prescription.isOverdue 
                                ? 'hover:bg-red-50' 
                                : 'hover:bg-gray-50'
                            }`}
                              onClick={() => patient && handlePatientSelect(patient)}>
                              <div className={`p-1.5 rounded-full ${
                                prescription.isOverdue ? 'bg-red-600' : 'bg-purple-600'
                              }`}>
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{patient?.name}</p>
                                <p className={`text-xs ${prescription.isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                  {prescription.isOverdue ? 'Overdue: ' : ''}{formatDate(prescription.followUpDate)}
                                </p>
                              </div>
                            </div>
                            {index < stats.upcomingFollowUps.slice(0, 5).length - 1 && (
                              <div className="border-b border-gray-100"></div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No upcoming follow-ups</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Overview */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Patients</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.newPatientsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Visits</span>
                      <span className="text-sm font-semibold text-gray-900">{stats.visitsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue</span>
                      <span className="text-sm font-semibold text-green-600">₹{stats.revenueThisMonth || 0}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Pending Payments</span>
                        <span className="text-sm font-semibold text-orange-600">₹{stats.pendingRevenue || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <PatientList
            patients={filteredPatients}
            onPatientSelect={handlePatientSelect}
            onNewPrescription={handleNewPrescription}
            onPatientDelete={handlePatientDelete}
            onBack={handleBackToDashboard}
          />
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