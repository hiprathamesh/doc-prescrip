'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import PatientList from './PatientList';
import PatientDetails from './PatientDetails';
import NewPrescription from './NewPrescription';
import PrescriptionTemplates from './PrescriptionTemplates';
import MedicalDataManager from './MedicalDataManager';
import MedicalCertificate from './MedicalCertificate';
import KeyGeneratorTooltip from './KeyGeneratorModal';
import SettingsModal from './SettingsModal';
import RecentActivityPage from './RecentActivityPage';
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
  LogOut,
  Trash2,
  Download,
  Key,
  Settings,
  Image,
  Link
} from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate, formatTimeAgo } from '../utils/dateUtils';
import { activityLogger, ACTIVITY_ICONS, ACTIVITY_COLORS } from '../utils/activityLogger';
import useScrollToTop from '../hooks/useScrollToTop';
import DarkModeToggle from './DarkModeToggle';
import { logout } from '../utils/auth';
import { useRouter } from 'next/navigation';
import DocPill from './icons/DocPill';
import TitleUpdater from './TitleUpdater';

export default function Dashboard() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // Add 'activity' to possible values
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({});
  const [isStatsHovered, setIsStatsHovered] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [currentGreeting, setCurrentGreeting] = useState({ title: '', subtitle: '' });
  const [lastGreetingUpdate, setLastGreetingUpdate] = useState('');
  const [navigationSource, setNavigationSource] = useState('dashboard'); // Track where we came from
  const [showKeyGeneratorModal, setShowKeyGeneratorModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const keyGeneratorTriggerRef = useRef(null);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isGreetingLoading, setIsGreetingLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [maxRecentActivities, setMaxRecentActivities] = useState(3); // Default to 3
  const [recommendedSettings, setRecommendedSettings] = useState({
    needsLogo: false,
    needsGoogleLink: false,
    isLoading: true
  });

  useEffect(() => {
    loadAllData();
    loadRecentActivities();
    loadDoctorContext();
    loadSettings(); // Load settings for activity preferences
    loadRecommendedSettings(); // Load recommended settings status

    // Update greeting every minute to check for time period changes
    const greetingInterval = setInterval(() => {
      updateGreeting();
    }, 600000); // Check every minute

    return () => clearInterval(greetingInterval);
  }, []);

  // Add effect to refresh activities when returning to dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      // Refresh activities when returning to dashboard
      loadRecentActivities();
    }
  }, [currentView]);

  useEffect(() => {
    if (currentDoctor) {
      updateGreeting();
    }
  }, [currentDoctor]);

  // Add scroll to top when returning to dashboard
  useScrollToTop([currentView === 'dashboard']);

  const loadAllData = async () => {
    try {
      setIsDataLoading(true);
      setIsStatsLoading(true);

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

      setIsDataLoading(false);
      setIsStatsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsDataLoading(false);
      setIsStatsLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      setIsActivitiesLoading(true);
      const activities = await activityLogger.getActivities();
      setRecentActivities((activities || []).slice(0, maxRecentActivities));
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  const loadRecommendedSettings = async () => {
    try {
      setRecommendedSettings(prev => ({ ...prev, isLoading: true }));

      const currentDoctor = storage.getDoctorContext();
      let needsLogo = false;
      let needsGoogleLink = false;

      // Check if logo is uploaded
      if (currentDoctor?.id || currentDoctor?.doctorId) {
        const doctorId = currentDoctor.id || currentDoctor.doctorId;
        const logoData = await storage.getHospitalLogo(doctorId);
        needsLogo = !logoData;
      } else {
        needsLogo = true;
      }

      // Check if Google account is linked (this will be checked by the component that has access to session)
      needsGoogleLink = !session?.user?.googleId;

      setRecommendedSettings({
        needsLogo,
        needsGoogleLink,
        isLoading: false
      });
    } catch (error) {
      console.error('Error loading recommended settings:', error);
      setRecommendedSettings({
        needsLogo: true,
        needsGoogleLink: true,
        isLoading: false
      });
    }
  };

  // Update recommended settings when session changes
  useEffect(() => {
    if (session !== undefined) { // Only run when session is loaded (not undefined)
      loadRecommendedSettings();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      const settings = await storage.getSettings();
      if (settings?.general?.maxRecentActivities) {
        setMaxRecentActivities(Math.min(settings.general.maxRecentActivities, 10));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
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

  const handlePatientSelect = (patient, source = 'dashboard') => {
    setSelectedPatient(patient);
    setNavigationSource(source);
    setCurrentView('details');
  };

  const handleBackFromDetails = () => {
    // Navigate back to the appropriate view based on where we came from
    if (navigationSource === 'list') {
      setCurrentView('list');
    } else {
      setCurrentView('dashboard');
    }
    setSelectedPatient(null);
  };

  const handleNewPrescription = (patient = null) => {
    setSelectedPatient(patient);
    setCurrentView('prescription');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPatient(null);
    loadAllData(); // Refresh data when returning to dashboard
    // loadRecentActivities will be called automatically by useEffect when currentView changes
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

  const handleViewAllActivities = () => {
    setCurrentView('activity');
  };

  const handlePatientUpdate = async (updatedPatients) => {
    // Optimistically update patients state
    setPatients(updatedPatients);
    await storage.savePatients(updatedPatients);

    // Recalculate stats without full reload
    const [currentPrescriptions, currentBills] = await Promise.all([
      storage.getPrescriptions(),
      storage.getBills()
    ]);

    calculateStats(updatedPatients, currentPrescriptions, currentBills);
  };

  const handlePatientDelete = async (patientId) => {
    const patientToDelete = patients.find(p => p.id === patientId);
    const updatedPatients = patients.filter(p => p.id !== patientId);
    setPatients(updatedPatients);
    await storage.savePatients(updatedPatients);

    const allPrescriptions = await storage.getPrescriptions();
    const updatedPrescriptions = allPrescriptions.filter(p => p.patientId !== patientId);
    await storage.savePrescriptions(updatedPrescriptions);

    const allBills = await storage.getBills();
    const updatedBills = allBills.filter(b => b.patientId !== patientId);
    await storage.saveBills(updatedBills);

    // Log activity
    if (patientToDelete) {
      await activityLogger.logPatientDeleted(patientToDelete.name);
      await loadRecentActivities();
    }

    if (selectedPatient && selectedPatient.id === patientId) {
      handleBackToDashboard();
    }

    loadAllData();
  };

  const handleLogout = async () => {
    try {
      // Clear doctor context first
      storage.clearDoctorContext();

      // If user has NextAuth session, use NextAuth signOut
      if (session) {
        await signOut({ redirect: false });
        // Then manually redirect after a brief delay
        setTimeout(() => {
          window.location.replace('/login');
        }, 100);
      } else {
        // For custom JWT auth, call logout API then redirect
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          window.location.replace('/login');
        } else {
          console.error('Logout failed');
          // Fallback: clear cookies manually and redirect
          document.cookie = 'doctor-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'pin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.replace('/login');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear cookies manually and redirect
      document.cookie = 'doctor-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'pin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.replace('/login');
    }
  };

  // Add function to generate contextual greeting with stable message selection
  const generateContextualGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const month = now.getMonth(); // 0 = January, 11 = December
    const date = now.getDate();

    // Get current doctor's last name
    const doctorLastName = currentDoctor?.lastName ? `Dr. ${currentDoctor.lastName}` : 'Doc';

    // Create a stable seed based on current date and hour for consistent message selection
    const seed = `${now.getFullYear()}-${month}-${date}-${hour}`;
    const getSeedBasedIndex = (arrayLength) => {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash) % arrayLength;
    };

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

    // Festival greetings (these take priority and don't shuffle)
    if (specialDays.diwali2024) {
      return {
        title: `Happy Diwali, ${doctorLastName}!`,
        subtitle: "May this festival of lights brighten your practice and bring prosperity to all your patients"
      };
    }

    if (specialDays.holi2024) {
      return {
        title: `Happy Holi, ${doctorLastName}!`,
        subtitle: "Let the colors of joy and healing fill your practice today"
      };
    }

    if (specialDays.doctorsDay) {
      return {
        title: `Happy National Doctors' Day, ${doctorLastName}!`,
        subtitle: "Thank you for your dedication to healing and caring for the community"
      };
    }

    if (specialDays.worldHealthDay) {
      return {
        title: `Happy World Health Day, ${doctorLastName}!`,
        subtitle: "Your commitment to health makes the world a better place"
      };
    }

    if (specialDays.independenceDay) {
      return {
        title: `Happy Independence Day, ${doctorLastName}!`,
        subtitle: "Freedom through health - your service strengthens our nation"
      };
    }

    if (specialDays.republicDay) {
      return {
        title: `Happy Republic Day, ${doctorLastName}!`,
        subtitle: "Serving the republic with compassion and care"
      };
    }

    if (specialDays.newYear) {
      return {
        title: `Happy New Year, ${doctorLastName}!`,
        subtitle: "Here's to another year of healing hearts and changing lives"
      };
    }

    if (specialDays.christmas) {
      return {
        title: `Merry Christmas, ${doctorLastName}!`,
        subtitle: "Spreading joy and wellness this festive season"
      };
    }

    // Day-specific greetings with stable message selection
    if (day === 5) { // Friday
      const fridayMessages = [
        {
          title: `Happy Friday, ${doctorLastName}!`,
          subtitle: "End the week strong with your healing touch"
        },
        {
          title: `TGIF, ${doctorLastName}!`,
          subtitle: "Friday energy for healing and caring"
        }
      ];
      return fridayMessages[getSeedBasedIndex(fridayMessages.length)];
    }

    if (day === 1) { // Monday
      const mondayMessages = [
        {
          title: `Fresh start, ${doctorLastName}!`,
          subtitle: "New week, new opportunities to heal and help"
        }
      ];
      return mondayMessages[getSeedBasedIndex(mondayMessages.length)];
    }

    if (day === 0 || day === 6) { // Weekend
      return {
        title: `Weekend warrior, ${doctorLastName}!`,
        subtitle: "Even on weekends, your dedication to care never stops"
      };
    }

    // Time-based greetings with stable message selection
    if (hour >= 5 && hour < 12) {
      const morningMessages = [
        {
          title: `Good morning, ${doctorLastName}!`,
          subtitle: "Ready to make a difference in people's lives today"
        },
        {
          title: `Rise and heal, ${doctorLastName}!`,
          subtitle: "Another day to spread wellness and hope"
        },
        {
          title: `Morning energy, ${doctorLastName}!`,
          subtitle: "Starting the day with purpose and healing"
        }
      ];
      return morningMessages[getSeedBasedIndex(morningMessages.length)];
    } else if (hour >= 12 && hour < 17) {
      const afternoonMessages = [
        {
          title: `Good afternoon, ${doctorLastName}!`,
          subtitle: "Midday momentum for continued excellent care"
        },
        {
          title: `Afternoon power, ${doctorLastName}!`,
          subtitle: "Keeping the healing energy strong"
        }
      ];
      return afternoonMessages[getSeedBasedIndex(afternoonMessages.length)];
    } else if (hour >= 17 && hour < 21) {
      const eveningMessages = [
        {
          title: `Good evening, ${doctorLastName}!`,
          subtitle: "Winding down another day of compassionate care"
        },
        {
          title: `Evening excellence, ${doctorLastName}!`,
          subtitle: "Your dedication brightens even the evening hours"
        }
      ];
      return eveningMessages[getSeedBasedIndex(eveningMessages.length)];
    } else {
      const lateMessages = [
        {
          title: `Dedicated healer, ${doctorLastName}!`,
          subtitle: "Your commitment to patient care knows no bounds"
        },
        {
          title: `Night owl doctor, ${doctorLastName}!`,
          subtitle: "Thank you for your round-the-clock dedication"
        }
      ];
      return lateMessages[getSeedBasedIndex(lateMessages.length)];
    }
  };

  const updateGreeting = () => {
    setIsGreetingLoading(true);
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;

    // Only update greeting if the time period has changed
    if (currentPeriod !== lastGreetingUpdate) {
      const newGreeting = generateContextualGreeting();
      setCurrentGreeting(newGreeting);
      setLastGreetingUpdate(currentPeriod);
    }
    setIsGreetingLoading(false);
  };

  const getActivityIcon = (activityType) => {
    const iconName = ACTIVITY_ICONS[activityType] || 'Activity';
    const iconMap = {
      FileText,
      UserPlus: Plus, // Using Plus as UserPlus might not be available
      Plus,
      Edit: FileText, // Using FileText as Edit might not be available
      Trash2,
      Award: FileText, // Using FileText as Award might not be available
      Download,
      CreditCard: DollarSign,
      UserMinus: Trash2, // Using Trash2 as UserMinus might not be available
      Activity
    };

    const IconComponent = iconMap[iconName] || Activity;
    return IconComponent;
  };

  const getActivityColor = (activityType) => {
    const colorName = ACTIVITY_COLORS[activityType] || 'gray';
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
      cyan: 'bg-cyan-50 text-cyan-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      gray: 'bg-gray-50 text-gray-600'
    };
    return colorMap[colorName] || colorMap.gray;
  };

  const loadDoctorContext = () => {
    try {
      const doctor = storage.getDoctorContext();
      if (!doctor || !doctor.id) {
        console.warn('No valid doctor context found, redirecting to login');
        // Redirect to login if no valid doctor context
        setTimeout(() => {
          window.location.href = '/login';
        }, 300);
        return;
      }
      setCurrentDoctor(doctor);
    } catch (error) {
      console.error('Error loading doctor context:', error);
      setCurrentDoctor(null);
      // Redirect to login on error
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    }
  };

  const isAdmin = () => {
    return currentDoctor?.accessType === 'admin';
  };

  // Skeleton Components
  const GreetingSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-100"></div>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-50"></div>
    </div>
  );

  const StatCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded w-8 h-8"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );

  const handleViewSettings = () => {
    setShowSettingsModal(true);
  };

  const handleRecommendedSettingClick = (settingId) => {
    setShowSettingsModal(true);
    // Use a timeout to ensure the modal is rendered before trying to navigate
    setTimeout(() => {
      const event = new CustomEvent('navigateToSetting', { detail: { settingId } });
      window.dispatchEvent(event);
    }, 150);
  };

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 ${showSettingsModal ? 'overflow-hidden' : ''}`}>
      {/* Minimal Header */}
      <header className="dashboard-header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={handleBackToDashboard}
            >
              <div className="p-2 rounded">
                <DocPill className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentDoctor?.hospitalName || 'Chaitanya Hospital'}, {currentDoctor?.hospitalAddress?.split(',')[0] || 'Deola'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Practice Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DarkModeToggle />

              {isAdmin() && (
                <div className="relative">
                  <button
                    ref={keyGeneratorTriggerRef}
                    onClick={() => setShowKeyGeneratorModal(!showKeyGeneratorModal)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
                    title="Generate Registration Key"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  <KeyGeneratorTooltip
                    isOpen={showKeyGeneratorModal}
                    onClose={() => setShowKeyGeneratorModal(false)}
                    triggerRef={keyGeneratorTriggerRef}
                  />
                </div>
              )}

              <button
                title='Logout'
                onClick={handleLogout}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center space-x-2 text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNewPrescription()}
                className="bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 rounded-md text-sm font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Remove pointer-events manipulation */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Dynamic Welcome Section */}
            <div className="min-h-[76px]"> {/* Fixed height to prevent layout shift */}
              {isGreetingLoading ? (
                <GreetingSkeleton />
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    {currentGreeting.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentGreeting.subtitle}
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid with Hover Expansion */}
            <div
              className={`bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 transition-all duration-500 ease-out `}
              onMouseEnter={() => !isStatsLoading && setIsStatsHovered(true)}
              onMouseLeave={() => setIsStatsHovered(false)}
            >
              <div className="grid grid-cols-4 gap-4">
                {isStatsLoading ? (
                  // Show skeleton cards
                  <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                  </>
                ) : (
                  <>
                    {/* Total Patients */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">PATIENTS</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalPatients || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Total registered</p>
                      </div>

                      {/* Expanded content on hover */}
                      <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100 dark:border-gray-600`}>
                        <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">New this month</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">+{stats.newPatientsThisMonth || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] mt-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">New this week</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">+{stats.newPatientsThisWeek || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Visits This Week */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded">
                          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">VISITS</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.visitsThisWeek || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">This week</p>
                      </div>

                      <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100 dark:border-gray-600`}>
                        <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">This month</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">{stats.visitsThisMonth || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] mt-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Average per day</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">{Math.round((stats.visitsThisWeek || 0) / 7)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded">
                          <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">REVENUE</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{stats.paidRevenue || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Collected</p>
                      </div>

                      <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100 dark:border-gray-600`}>
                        <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Pending</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">₹{stats.pendingRevenue || 0}</span>
                        </div>
                        <div className="flex justify-between items-end text-[13px] mt-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">This month</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">₹{stats.revenueThisMonth || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Follow-ups */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-600 p-4 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-500 ease-out cursor-pointer overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">FOLLOW-UPS</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.upcomingFollowUps?.length || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Upcoming</p>
                      </div>

                      <div className={`${isStatsHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-500 ease-in-out mt-2 pt-2 border-t border-gray-100 dark:border-gray-600`}>
                        <div className="flex justify-between items-center text-[13px]">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Next 7 days</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">{stats.upcomingFollowUps?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px] mt-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-300">Overdue</span>
                          </div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">{stats.upcomingFollowUps?.filter(f => f.isOverdue).length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Quick Actions & Recent Activity */}
              <div className="col-span-2 space-y-6">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleNewPrescription()}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">New Prescription</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Create prescription</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewAllPatients}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-600 dark:bg-green-500 rounded">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">View Patients</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Manage patients</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewTemplates}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Templates</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Manage templates</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewMedicalData}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Medical Data</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Symptoms & diagnoses</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNewMedicalCertificate()}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-cyan-600 dark:bg-cyan-500 rounded">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Medical Certificate</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Generate fitness certificate</p>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleViewSettings}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 text-left cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-600 dark:bg-gray-500 rounded">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">App preferences</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <button
                      onClick={handleViewAllActivities}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-0">
                    {isActivitiesLoading ? (
                      // Activity loading skeleton
                      <div className="space-y-3">
                        {Array.from({ length: maxRecentActivities }).map((_, index) => (
                          <div key={index} className="flex items-center space-x-3 py-3 animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => {
                        const IconComponent = getActivityIcon(activity.type);
                        const colorClass = getActivityColor(activity.type);

                        return (
                          <div key={activity.id}>
                            <div className="flex items-center space-x-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer rounded-lg px-2 -mx-2">
                              <div className={`p-2 rounded ${colorClass}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.description}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {formatTimeAgo(activity.timestamp)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                            {index < recentActivities.length - 1 && (
                              <div className="border-b border-gray-100 dark:border-gray-700"></div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Your activities will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Follow-ups & Monthly Overview */}
              <div className="space-y-6">
                {/* Upcoming Follow-ups */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Follow-ups</h3>

                  <div className="space-y-0">
                    {stats.upcomingFollowUps?.length > 0 ? (
                      stats.upcomingFollowUps.slice(0, 5).map((prescription, index) => {
                        const patient = patients.find(p => p.id === prescription.patientId);
                        return (
                          <div key={prescription.id}>
                            <div className={`flex items-center space-x-3 py-3 transition-colors cursor-pointer rounded-lg px-2 -mx-2 ${prescription.isOverdue
                              ? 'hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => patient && handlePatientSelect(patient, 'dashboard')}>
                              <div className={`p-1.5 rounded-full ${prescription.isOverdue ? 'bg-red-600 dark:bg-red-500' : 'bg-purple-600 dark:bg-purple-500'
                                }`}>
                                <Clock className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{patient?.name}</p>
                                <p className={`text-xs ${prescription.isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {prescription.isOverdue ? 'Overdue: ' : ''}{formatDate(prescription.followUpDate)}
                                </p>
                              </div>
                            </div>
                            {index < stats.upcomingFollowUps.slice(0, 5).length - 1 && (
                              <div className="border-b border-gray-100 dark:border-gray-700"></div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6">
                        <Calendar className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming follow-ups</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Overview */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Month</h3>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">New Patients</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.newPatientsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Total Visits</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.visitsThisMonth || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Revenue</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">₹{stats.revenueThisMonth || 0}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Payments</span>
                        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">₹{stats.pendingRevenue || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Settings */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recommended Settings</h3>
                    {!recommendedSettings.isLoading && (recommendedSettings.needsLogo || recommendedSettings.needsGoogleLink) && (
                      <div className="flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {(recommendedSettings.needsLogo ? 1 : 0) + (recommendedSettings.needsGoogleLink ? 1 : 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {recommendedSettings.isLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 py-2 animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ) : (recommendedSettings.needsLogo || recommendedSettings.needsGoogleLink) ? (
                    <div className="space-y-1">
                      {recommendedSettings.needsLogo && (
                        <button
                          onClick={() => handleRecommendedSettingClick('profile')}
                          className="w-full py-1 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm transition-colors duration-200 text-left cursor-pointer group first:pt-1 last:pb-1"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-amber-600 dark:bg-amber-500 rounded">
                              <Image className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload Hospital Logo</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Add logo for your pdfs
                              </p>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      )}

                      {recommendedSettings.needsLogo && recommendedSettings.needsGoogleLink && (
                        <div className="border-t border-gray-100 dark:border-gray-700"></div>
                      )}

                      {recommendedSettings.needsGoogleLink && (
                        <button
                          onClick={() => handleRecommendedSettingClick('google-integration')}
                          className="w-full py-1 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-sm transition-colors duration-200 text-left cursor-pointer group first:pt-1 last:pb-1"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-blue-600 dark:bg-blue-500 rounded">
                              <Link className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Connect Google Account</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Enable sharing via Drive
                              </p>
                            </div>
                            <div className="text-gray-400 dark:text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No settings to recommend as of now</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'list' && (
          <PatientList
            patients={filteredPatients}
            onPatientSelect={(patient) => handlePatientSelect(patient, 'list')}
            onNewPrescription={handleNewPrescription}
            onPatientDelete={handlePatientDelete}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'details' && selectedPatient && (
          <PatientDetails
            patient={selectedPatient}
            onBack={handleBackFromDetails}
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

        {/* Add activity view */}
        {currentView === 'activity' && (
          <RecentActivityPage onBack={handleBackToDashboard} />
        )}

        {currentView === 'medical-data' && (
          <MedicalDataManager onBack={handleBackToDashboard} />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Title updater based on current view */}
      <TitleUpdater title={
        showSettingsModal ? 'Settings' :
          currentView === 'dashboard' ? 'Dashboard' :
            currentView === 'list' ? 'Patients' :
              currentView === 'prescription' ? 'New Prescription' :
                currentView === 'templates' ? 'Templates' :
                  currentView === 'medical-certificate' ? 'Medical Certificate' :
                    currentView === 'activity' ? 'Recent Activity' :
                      currentView === 'medical-data' ? 'Data Manager' : "Dashboard"
      } />
    </div>
  );
}