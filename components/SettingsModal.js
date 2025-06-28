'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings as SettingsIcon, Shield, User, Bell, Palette, Database, Download, Upload, Trash2, Save, FileText, DollarSign, Clock, Users, Stethoscope, Image, AlertCircle } from 'lucide-react';
import { storage } from '../utils/storage';
import { toast } from 'sonner';
import FluidToggle from './FluidToggle';
import CustomDropdown from './CustomDropdown';

const SETTINGS_SECTIONS = [
	{
		id: 'profile',
		label: 'Doctor Profile',
		icon: User,
		description: 'Personal and practice information',
	},
	{
		id: 'general',
		label: 'General',
		icon: SettingsIcon,
		description: 'Basic app preferences',
	},
	{
		id: 'prescription',
		label: 'Prescription Defaults',
		icon: FileText,
		description: 'Default prescription settings',
	},
	{
		id: 'billing',
		label: 'Billing & Fees',
		icon: DollarSign,
		description: 'Payment and billing preferences',
	},
	{
		id: 'scheduling',
		label: 'Scheduling',
		icon: Clock,
		description: 'Appointment and timing settings',
	},
	{
		id: 'security',
		label: 'Security',
		icon: Shield,
		description: 'Privacy and security settings',
	},
	{
		id: 'notifications',
		label: 'Notifications',
		icon: Bell,
		description: 'Notification preferences',
	},
	{
		id: 'appearance',
		label: 'Appearance',
		icon: Palette,
		description: 'Theme and display settings',
	},
	{
		id: 'data',
		label: 'Data Management',
		icon: Database,
		description: 'Import, export, and backup',
	},
];

export default function SettingsModal({ isOpen, onClose }) {
	const [activeSection, setActiveSection] = useState('profile');
	const [settings, setSettings] = useState({
		profile: {
			doctorName: '',
			specialization: '',
			qualification: '',
			registrationNumber: '',
			hospitalName: '',
			hospitalAddress: '',
			phoneNumber: '',
			email: '',
			emergencyContact: '',
		},
		general: {
			autoSave: true,
			defaultConsultationFee: 500,
			showPatientAge: true,
			defaultFollowUpDays: 7,
			language: 'english',
			timezone: 'Asia/Kolkata',
		},
		prescription: {
			defaultInstructions: 'Take as directed',
			showDosageInstructions: true,
			includeGenericNames: true,
			defaultDuration: '5 days',
			autoSuggestMedicines: true,
			showMedicineStrength: true,
			includePrecautions: true,
			defaultAdvice: 'Rest and stay hydrated',
		},
		billing: {
			defaultConsultationFee: 500,
			enableGST: false,
			gstNumber: '',
			gstPercentage: 18,
			showPaymentReminders: true,
			acceptPartialPayments: true,
			defaultPaymentTerms: '30 days',
			includeFollowUpDiscount: false,
			followUpDiscountPercentage: 20,
		},
		scheduling: {
			consultationDuration: 15,
			workingHoursStart: '09:00',
			workingHoursEnd: '18:00',
			workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
			allowEmergencyAppointments: true,
			bufferTimeBetweenAppointments: 5,
			maxPatientsPerDay: 50,
			enableWaitingList: true,
		},
		security: {
			requirePasswordForDelete: true,
			sessionTimeout: 30,
			enableAuditLog: true,
			requireConfirmationForSensitiveActions: true,
			enableTwoFactorAuth: false,
			autoLogoutOnInactivity: true,
		},
		notifications: {
			followUpReminders: true,
			paymentReminders: true,
			systemNotifications: true,
			appointmentReminders: true,
			medicationAlerts: true,
			birthDayReminders: true,
			lowStockAlerts: true,
		},
		appearance: {
			theme: 'system',
			compactMode: false,
			showAnimations: true,
			fontSize: 'medium',
			showPatientPhotos: true,
			highlightUrgentCases: true,
		},
	});
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const sectionRefs = useRef({});
	const contentRef = useRef(null);
	const sidebarRef = useRef(null); // Add sidebar ref
	const isClickScrolling = useRef(false);
	const [hospitalLogo, setHospitalLogo] = useState({
		isUploading: false,
		logoData: null,
		isLoading: true
	});

	useEffect(() => {
		if (isOpen) {
			loadSettings();
			loadHospitalLogo();
			// Prevent background scroll when modal is open
			const scrollY = window.scrollY;
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollY}px`;
			document.body.style.width = '100%';
			document.body.style.overflow = 'hidden';

			const observer = new IntersectionObserver(
				(entries) => {
					if (isClickScrolling.current) return;

					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							const newActiveSection = entry.target.id;
							setActiveSection(newActiveSection);
							// Scroll sidebar to show the active section
							scrollSidebarToActiveSection(newActiveSection);
						}
					});
				},
				{ root: contentRef.current, threshold: 0.5 }
			);

			const sections = contentRef.current.querySelectorAll('.settings-section');
			sections.forEach((section) => {
				sectionRefs.current[section.id] = section;
				observer.observe(section);
			});

			return () => {
				sections.forEach((section) => {
					if (section) {
						observer.unobserve(section);
					}
				});
				// Restore background scroll when modal is closed
				const scrollY = document.body.style.top;
				document.body.style.position = '';
				document.body.style.top = '';
				document.body.style.width = '';
				document.body.style.overflow = '';
				if (scrollY) {
					window.scrollTo(0, parseInt(scrollY || '0') * -1);
				}
			};
		} else {
			// Restore background scroll when modal is closed
			const scrollY = document.body.style.top;
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			document.body.style.overflow = '';
			if (scrollY) {
				window.scrollTo(0, parseInt(scrollY || '0') * -1);
			}
		}

		// Cleanup function to restore scroll on unmount
		return () => {
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	const handleSectionClick = (sectionId) => {
		setActiveSection(sectionId);
		const sectionElement = sectionRefs.current[sectionId];
		if (sectionElement) {
			isClickScrolling.current = true;
			sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
			setTimeout(() => {
				isClickScrolling.current = false;
			}, 1000); // Reset after scroll animation
		}
	};

	// Add function to scroll sidebar to show active section
	const scrollSidebarToActiveSection = (sectionId) => {
		if (!sidebarRef.current) return;

		const sidebarContainer = sidebarRef.current;
		const activeSectionButton = sidebarContainer.querySelector(`[data-section="${sectionId}"]`);
		
		if (!activeSectionButton) return;

		const containerRect = sidebarContainer.getBoundingClientRect();
		const buttonRect = activeSectionButton.getBoundingClientRect();
		
		// Calculate if the button is out of view
		const isAboveView = buttonRect.top < containerRect.top;
		const isBelowView = buttonRect.bottom > containerRect.bottom;
		
		if (isAboveView || isBelowView) {
			// Calculate scroll position to center the button in the container
			const containerHeight = containerRect.height;
			const buttonHeight = buttonRect.height;
			const buttonOffsetTop = activeSectionButton.offsetTop;
			
			// Center the button in the visible area
			const targetScrollTop = buttonOffsetTop - (containerHeight / 2) + (buttonHeight / 2);
			
			sidebarContainer.scrollTo({
				top: Math.max(0, targetScrollTop),
				behavior: 'smooth'
			});
		}
	};

	const loadSettings = async () => {
		try {
			const savedSettings = await storage.getSettings();
			if (savedSettings) {
				// Deep merge to ensure all properties exist
				setSettings((prevSettings) => {
					const mergedSettings = { ...prevSettings };
					Object.keys(savedSettings).forEach(section => {
						mergedSettings[section] = {
							...prevSettings[section],
							...savedSettings[section]
						};
					});
					return mergedSettings;
				});
			}
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	};

	const loadHospitalLogo = async () => {
		try {
			setHospitalLogo(prev => ({ ...prev, isLoading: true }));
			const currentDoctor = storage.getDoctorContext();
			
			if (currentDoctor?.id || currentDoctor?.doctorId) {
				// Use either id or doctorId property
				const doctorId = currentDoctor.id || currentDoctor.doctorId;
				const logoData = await storage.getHospitalLogo(doctorId);
				setHospitalLogo(prev => ({ 
					...prev, 
					logoData: logoData,
					isLoading: false 
				}));
			} else {
				console.warn('No valid doctor ID found in context:', currentDoctor);
				setHospitalLogo(prev => ({ ...prev, isLoading: false }));
			}
		} catch (error) {
			console.error('Error loading hospital logo:', error);
			setHospitalLogo(prev => ({ ...prev, isLoading: false }));
		}
	};

	const updateSetting = (section, key, value) => {
		setSettings((prev) => ({
			...prev,
			[section]: {
				...prev[section],
				[key]: value,
			},
		}));
		setHasUnsavedChanges(true);
	};

	const saveSettings = async () => {
		try {
			await storage.saveSettings(settings);
			setHasUnsavedChanges(false);
			toast.success('Settings Saved', {
				description: 'Your preferences have been updated successfully',
			});
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('Save Failed', {
				description: 'Failed to save settings. Please try again.',
			});
		}
	};

	const exportData = async () => {
		try {
			const data = await storage.exportAllData();
			const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `practice-data-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success('Data Exported', {
				description: 'Your practice data has been exported successfully',
			});
		} catch (error) {
			console.error('Export error:', error);
			toast.error('Export Failed', {
				description: 'Failed to export data. Please try again.',
			});
		}
	};

	const handleClose = () => {
		setHasUnsavedChanges(false);
		onClose();
	};

	const handleLogoUpload = async (event) => {
		const file = event.target.files[0];
		if (!file) return;

		// Validate file type
		const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			toast.error('Invalid File Type', {
				description: 'Only PNG, JPEG, JPG, and WebP files are allowed.'
			});
			return;
		}

		// Validate file size (5MB)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error('File Too Large', {
				description: 'Maximum file size is 5MB.'
			});
			return;
		}

		setHospitalLogo(prev => ({ ...prev, isUploading: true }));

		try {
			const currentDoctor = storage.getDoctorContext();
			const doctorId = currentDoctor?.id || currentDoctor?.doctorId;
			
			if (!doctorId) {
				throw new Error('Doctor context not found. Please log in again.');
			}

			const result = await storage.uploadHospitalLogo(file, doctorId);
			
			if (result.success) {
				toast.success('Logo Uploaded', {
					description: 'Hospital logo has been uploaded successfully.'
				});
				await loadHospitalLogo(); // Reload logo data
			} else {
				throw new Error('Upload failed');
			}
		} catch (error) {
			console.error('Error uploading logo:', error);
			toast.error('Upload Failed', {
				description: error.message || 'Failed to upload logo. Please try again.'
			});
		} finally {
			setHospitalLogo(prev => ({ ...prev, isUploading: false }));
			// Clear the file input
			event.target.value = '';
		}
	};

	const handleLogoDelete = async () => {
		if (!confirm('Are you sure you want to delete the hospital logo?')) {
			return;
		}

		try {
			const currentDoctor = storage.getDoctorContext();
			const doctorId = currentDoctor?.id || currentDoctor?.doctorId;
			
			if (!doctorId) {
				throw new Error('Doctor context not found. Please log in again.');
			}

			const success = await storage.deleteHospitalLogo(doctorId);
			
			if (success) {
				toast.success('Logo Deleted', {
					description: 'Hospital logo has been removed.'
				});
				setHospitalLogo(prev => ({ ...prev, logoData: null }));
			} else {
				throw new Error('Failed to delete logo');
			}
		} catch (error) {
			console.error('Error deleting logo:', error);
			toast.error('Delete Failed', {
				description: error.message || 'Failed to delete logo. Please try again.'
			});
		}
	};

	if (!isOpen) return null;

	const renderSectionContent = (sectionId) => {
		switch (sectionId) {
			case 'profile':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Doctor Profile
							</h3>

							{/* Hospital Logo Upload Section */}
							<div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
								<div className="flex items-start space-x-3">
									<div className="p-2 bg-blue-600 dark:bg-blue-500 rounded">
										<Image className="w-5 h-5 text-white" />
									</div>
									<div className="flex-1">
										<h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
											Hospital Logo
										</h4>
										<p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
											Upload your hospital/clinic logo to appear on prescriptions and documents. Supported formats: PNG, JPEG, JPG, WebP (Max 5MB)
										</p>

										{hospitalLogo.isLoading ? (
											<div className="flex items-center space-x-2">
												<div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
												<span className="text-sm text-blue-700 dark:text-blue-300">Loading logo...</span>
											</div>
										) : hospitalLogo.logoData ? (
											<div className="space-y-3">
												<div className="flex items-center space-x-3">
													<img 
														src={hospitalLogo.logoData.base64} 
														alt="Hospital Logo" 
														className="w-16 h-16 object-contain border border-blue-200 dark:border-blue-700 rounded bg-white dark:bg-gray-800"
													/>
													<div className="flex-1">
														<p className="text-sm font-medium text-blue-900 dark:text-blue-200">
															{hospitalLogo.logoData.fileName}
														</p>
														<p className="text-xs text-blue-700 dark:text-blue-300">
															Size: {Math.round(hospitalLogo.logoData.fileSize / 1024)} KB
														</p>
														<p className="text-xs text-blue-700 dark:text-blue-300">
															Type: {hospitalLogo.logoData.mimeType}
														</p>
													</div>
												</div>
												<div className="flex space-x-2">
													<label
														htmlFor="logo-upload-replace"
														className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer inline-block"
													>
														Replace Logo
													</label>
													<button
														onClick={handleLogoDelete}
														className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
													>
														Remove Logo
													</button>
												</div>
												<input
													id="logo-upload-replace"
													type="file"
													accept="image/png,image/jpeg,image/jpg,image/webp"
													onChange={handleLogoUpload}
													disabled={hospitalLogo.isUploading}
													className="hidden"
												/>
											</div>
										) : (
											<div className="space-y-3">
												<div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-4 text-center">
													<Image className="mx-auto h-8 w-8 text-blue-400 dark:text-blue-500 mb-2" />
													<p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
														No logo uploaded
													</p>
													<label
														htmlFor="logo-upload"
														className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer inline-block ${
															hospitalLogo.isUploading ? 'opacity-50 cursor-not-allowed' : ''
														}`}
													>
														{hospitalLogo.isUploading ? 'Uploading...' : 'Upload Logo'}
													</label>
												</div>
												<input
													id="logo-upload"
													type="file"
													accept="image/png,image/jpeg,image/jpg,image/webp"
													onChange={handleLogoUpload}
													disabled={hospitalLogo.isUploading}
													className="hidden"
												/>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Full Name
									</label>
									<input
										type="text"
										value={settings.profile?.doctorName || ''}
										onChange={(e) => updateSetting('profile', 'doctorName', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="Dr. John Smith"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Specialization
									</label>
									<input
										type="text"
										value={settings.profile?.specialization || ''}
										onChange={(e) => updateSetting('profile', 'specialization', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="General Medicine"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Qualification
									</label>
									<input
										type="text"
										value={settings.profile?.qualification || ''}
										onChange={(e) => updateSetting('profile', 'qualification', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="MBBS, MD"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Registration Number
									</label>
									<input
										type="text"
										value={settings.profile?.registrationNumber || ''}
										onChange={(e) => updateSetting('profile', 'registrationNumber', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="MCI Registration Number"
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Hospital/Clinic Name
									</label>
									<input
										type="text"
										value={settings.profile?.hospitalName || ''}
										onChange={(e) => updateSetting('profile', 'hospitalName', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="Chaitanya Hospital"
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Hospital/Clinic Address
									</label>
									<textarea
										value={settings.profile?.hospitalAddress || ''}
										onChange={(e) => updateSetting('profile', 'hospitalAddress', e.target.value)}
										rows={2}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="Enter complete address"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Phone Number
									</label>
									<input
										type="tel"
										value={settings.profile?.phoneNumber || ''}
										onChange={(e) => updateSetting('profile', 'phoneNumber', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="+91 9876543210"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Email Address
									</label>
									<input
										type="email"
										value={settings.profile?.email || ''}
										onChange={(e) => updateSetting('profile', 'email', e.target.value)}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="doctor@hospital.com"
									/>
								</div>
							</div>
						</div>
					</div>
				);

			case 'general':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								General Settings
							</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Auto-save documents
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Automatically save prescriptions and certificates
										</p>
									</div>
									<FluidToggle
										checked={settings.general.autoSave}
										onChange={(value) => updateSetting('general', 'autoSave', value)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Consultation Fee (₹)
										</label>
										<input
											type="number"
											value={settings.general?.defaultConsultationFee || 0}
											onChange={(e) =>
												updateSetting(
													'general',
													'defaultConsultationFee',
													parseInt(e.target.value) || 0
												)
											}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Follow-up Days
										</label>
										<input
											type="number"
											value={settings.general?.defaultFollowUpDays || 0}
											onChange={(e) =>
												updateSetting(
													'general',
													'defaultFollowUpDays',
													parseInt(e.target.value) || 0
												)
											}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Language
										</label>
										<CustomDropdown
											options={[
												{ value: 'english', label: 'English' },
												{ value: 'hindi', label: 'Hindi' },
												{ value: 'marathi', label: 'Marathi' }
											]}
											value={settings.general?.language || 'english'}
											onChange={(value) => updateSetting('general', 'language', value)}
											placeholder="Select language"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Timezone
										</label>
										<CustomDropdown
											options={[
												{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
												{ value: 'Asia/Mumbai', label: 'Asia/Mumbai' },
												{ value: 'Asia/Delhi', label: 'Asia/Delhi' }
											]}
											value={settings.general?.timezone || 'Asia/Kolkata'}
											onChange={(value) => updateSetting('general', 'timezone', value)}
											placeholder="Select timezone"
										/>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Show patient age in lists
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Display age alongside patient names
										</p>
									</div>
									<FluidToggle
										checked={settings.general.showPatientAge}
										onChange={(value) => updateSetting('general', 'showPatientAge', value)}
									/>
								</div>
							</div>
						</div>
					</div>
				);

			case 'prescription':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Prescription Defaults
							</h3>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Instructions
										</label>
										<input
											type="text"
											value={settings.prescription?.defaultInstructions || ''}
											onChange={(e) => updateSetting('prescription', 'defaultInstructions', e.target.value)}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
											placeholder="Take as directed"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Duration
										</label>
										<CustomDropdown
											options={[
												{ value: '3 days', label: '3 days' },
												{ value: '5 days', label: '5 days' },
												{ value: '7 days', label: '7 days' },
												{ value: '10 days', label: '10 days' },
												{ value: '15 days', label: '15 days' },
												{ value: '30 days', label: '30 days' }
											]}
											value={settings.prescription?.defaultDuration || '5 days'}
											onChange={(value) => updateSetting('prescription', 'defaultDuration', value)}
											placeholder="Select duration"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Default Advice
									</label>
									<textarea
										value={settings.prescription?.defaultAdvice || ''}
										onChange={(e) => updateSetting('prescription', 'defaultAdvice', e.target.value)}
										rows={2}
										className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										placeholder="General advice for patients"
									/>
								</div>

								<div className="space-y-3">
									{[
										{ key: 'showDosageInstructions', label: 'Show dosage instructions', desc: 'Include detailed dosage in prescriptions' },
										{ key: 'includeGenericNames', label: 'Include generic medicine names', desc: 'Show generic names alongside brand names' },
										{ key: 'autoSuggestMedicines', label: 'Auto-suggest medicines', desc: 'Enable medicine auto-completion' },
										{ key: 'showMedicineStrength', label: 'Show medicine strength', desc: 'Display strength/concentration of medicines' },
										{ key: 'includePrecautions', label: 'Include precautions', desc: 'Add precaution notes to prescriptions' },
									].map((setting) => (
										<div key={setting.key} className="flex items-center justify-between">
											<div>
												<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{setting.label}
												</label>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{setting.desc}
												</p>
											</div>
											<FluidToggle
												checked={settings.prescription?.[setting.key] || false}
												onChange={(value) => updateSetting('prescription', setting.key, value)}
											/>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				);

			case 'billing':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Billing & Fee Settings
							</h3>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Consultation Fee (₹)
										</label>
										<input
											type="number"
											value={settings.billing?.defaultConsultationFee || 0}
											onChange={(e) => updateSetting('billing', 'defaultConsultationFee', parseInt(e.target.value) || 0)}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Payment Terms
										</label>
										<CustomDropdown
											options={[
												{ value: 'immediate', label: 'Immediate' },
												{ value: '7 days', label: '7 days' },
												{ value: '15 days', label: '15 days' },
												{ value: '30 days', label: '30 days' }
											]}
											value={settings.billing?.defaultPaymentTerms || 'immediate'}
											onChange={(value) => updateSetting('billing', 'defaultPaymentTerms', value)}
											placeholder="Select payment terms"
										/>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Enable GST
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Include GST in billing
										</p>
									</div>
									<FluidToggle
										checked={settings.billing?.enableGST || false}
										onChange={(value) => updateSetting('billing', 'enableGST', value)}
									/>
								</div>

								{settings.billing.enableGST && (
									<div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												GST Number
											</label>
											<input
												type="text"
												value={settings.billing?.gstNumber || ''}
												onChange={(e) => updateSetting('billing', 'gstNumber', e.target.value)}
												className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
												placeholder="22AAAAA0000A1Z5"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												GST Percentage (%)
											</label>
											<input
												type="number"
												value={settings.billing?.gstPercentage || 18}
												onChange={(e) => updateSetting('billing', 'gstPercentage', parseInt(e.target.value) || 18)}
												className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
												min="0"
												max="28"
											/>
										</div>
									</div>
								)}

								<div className="space-y-3">
									{[
										{ key: 'showPaymentReminders', label: 'Show payment reminders', desc: 'Display pending payment notifications' },
										{ key: 'acceptPartialPayments', label: 'Accept partial payments', desc: 'Allow patients to pay in installments' },
									].map((setting) => (
										<div key={setting.key} className="flex items-center justify-between">
											<div>
												<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{setting.label}
												</label>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{setting.desc}
												</p>
											</div>
											<FluidToggle
												checked={settings.billing?.[setting.key] || false}
												onChange={(value) => updateSetting('billing', setting.key, value)}
											/>
										</div>
									))}
								</div>

								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Follow-up discount
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Offer discount for follow-up visits
										</p>
									</div>
									<FluidToggle
										checked={settings.billing?.includeFollowUpDiscount || false}
										onChange={(value) => updateSetting('billing', 'includeFollowUpDiscount', value)}
									/>
								</div>

								{settings.billing.includeFollowUpDiscount && (
									<div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Follow-up Discount Percentage (%)
										</label>
										<input
											type="number"
											value={settings.billing?.followUpDiscountPercentage || 20}
											onChange={(e) => updateSetting('billing', 'followUpDiscountPercentage', parseInt(e.target.value) || 20)}
											className="w-32 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
											min="0"
											max="100"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				);

			case 'scheduling':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Scheduling Settings
							</h3>
							<div className="space-y-4">
								<div className="grid grid-cols-3 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Consultation Duration (minutes)
										</label>
										<CustomDropdown
											options={[
												{ value: 10, label: '10 minutes' },
												{ value: 15, label: '15 minutes' },
												{ value: 20, label: '20 minutes' },
												{ value: 30, label: '30 minutes' },
												{ value: 45, label: '45 minutes' },
												{ value: 60, label: '1 hour' }
											]}
											value={settings.scheduling?.consultationDuration || 15}
											onChange={(value) => updateSetting('scheduling', 'consultationDuration', parseInt(value))}
											placeholder="Select duration"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Working Hours Start
										</label>
										<input
											type="time"
											value={settings.scheduling?.workingHoursStart || '09:00'}
											onChange={(e) => updateSetting('scheduling', 'workingHoursStart', e.target.value)}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Working Hours End
										</label>
										<input
											type="time"
											value={settings.scheduling?.workingHoursEnd || '18:00'}
											onChange={(e) => updateSetting('scheduling', 'workingHoursEnd', e.target.value)}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Working Days
									</label>
									<div className="grid grid-cols-4 gap-2">
										{['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
											<label key={day} className="flex items-center space-x-2 cursor-pointer">
												<input
													type="checkbox"
													checked={settings.scheduling?.workingDays?.includes(day) || false}
													onChange={(e) => {
														const days = e.target.checked
															? [...(settings.scheduling?.workingDays || []), day]
															: (settings.scheduling?.workingDays || []).filter(d => d !== day);
														updateSetting('scheduling', 'workingDays', days);
													}}
													className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
												/>
												<span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{day.slice(0, 3)}</span>
											</label>
										))}
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Buffer Time Between Appointments (minutes)
										</label>
										<CustomDropdown
											options={[
												{ value: 0, label: 'No buffer' },
												{ value: 5, label: '5 minutes' },
												{ value: 10, label: '10 minutes' },
												{ value: 15, label: '15 minutes' }
											]}
											value={settings.scheduling?.bufferTimeBetweenAppointments || 5}
											onChange={(value) => updateSetting('scheduling', 'bufferTimeBetweenAppointments', parseInt(value))}
											placeholder="Select buffer time"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Max Patients Per Day
										</label>
										<input
											type="number"
											value={settings.scheduling?.maxPatientsPerDay || 50}
											onChange={(e) => updateSetting('scheduling', 'maxPatientsPerDay', parseInt(e.target.value) || 50)}
											className="w-full text-sm p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-500"
											min="1"
										/>
									</div>
								</div>

								<div className="space-y-3">
									{[
										{ key: 'allowEmergencyAppointments', label: 'Allow emergency appointments', desc: 'Accept urgent cases outside normal hours' },
										{ key: 'enableWaitingList', label: 'Enable waiting list', desc: 'Maintain a waiting list for busy days' },
									].map((setting) => (
										<div key={setting.key} className="flex items-center justify-between">
											<div>
												<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{setting.label}
												</label>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{setting.desc}
												</p>
											</div>
											<FluidToggle
												checked={settings.scheduling?.[setting.key] || false}
												onChange={(value) => updateSetting('scheduling', setting.key, value)}
											/>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				);

			case 'security':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Security Settings
							</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Require password for deletions
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Extra confirmation for deleting patients or records
										</p>
									</div>
									<FluidToggle
										checked={settings.security?.requirePasswordForDelete || false}
										onChange={(value) => updateSetting('security', 'requirePasswordForDelete', value)}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Session Timeout (minutes)
									</label>
									<div className="w-40">
										<CustomDropdown
											options={[
												{ value: 15, label: '15 minutes' },
												{ value: 30, label: '30 minutes' },
												{ value: 60, label: '1 hour' },
												{ value: 120, label: '2 hours' },
												{ value: 0, label: 'Never' }
											]}
											value={settings.security?.sessionTimeout || 30}
											onChange={(value) => updateSetting('security', 'sessionTimeout', parseInt(value))}
											placeholder="Select timeout"
										/>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<div>
										<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
											Enable audit logging
										</label>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Track user actions for security purposes
										</p>
									</div>
									<FluidToggle
										checked={settings.security?.enableAuditLog || false}
										onChange={(value) => updateSetting('security', 'enableAuditLog', value)}
									/>
								</div>
							</div>
						</div>
					</div>
				);

			case 'notifications':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Notification Settings
							</h3>
							<div className="space-y-4">
								{[
									{ key: 'followUpReminders', label: 'Follow-up reminders', desc: 'Show notifications for upcoming follow-ups' },
									{ key: 'paymentReminders', label: 'Payment reminders', desc: 'Notify about pending payments' },
									{ key: 'systemNotifications', label: 'System notifications', desc: 'Show app updates and announcements' },
									{ key: 'appointmentReminders', label: 'Appointment reminders', desc: 'Notify about upcoming appointments' },
									{ key: 'medicationAlerts', label: 'Medication alerts', desc: 'Alerts for drug interactions and allergies' },
									{ key: 'birthDayReminders', label: 'Birthday reminders', desc: 'Remind about patient birthdays' },
									{ key: 'lowStockAlerts', label: 'Low stock alerts', desc: 'Notify when medicine stock is low' },
								].map((setting) => (
									<div key={setting.key} className="flex items-center justify-between">
										<div>
											<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
												{setting.label}
											</label>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{setting.desc}
											</p>
										</div>
										<FluidToggle
											checked={settings.notifications?.[setting.key] || false}
											onChange={(value) => updateSetting('notifications', setting.key, value)}
										/>
									</div>
								))}
							</div>
						</div>
					</div>
				);

			case 'appearance':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Appearance Settings
							</h3>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Theme
										</label>
										<CustomDropdown
											options={[
												{ value: 'system', label: 'System' },
												{ value: 'light', label: 'Light' },
												{ value: 'dark', label: 'Dark' }
											]}
											value={settings.appearance?.theme || 'system'}
											onChange={(value) => updateSetting('appearance', 'theme', value)}
											placeholder="Select theme"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Font Size
										</label>
										<CustomDropdown
											options={[
												{ value: 'small', label: 'Small' },
												{ value: 'medium', label: 'Medium' },
												{ value: 'large', label: 'Large' }
											]}
											value={settings.appearance?.fontSize || 'medium'}
											onChange={(value) => updateSetting('appearance', 'fontSize', value)}
											placeholder="Select font size"
										/>
									</div>
								</div>

								<div className="space-y-3">
									{[
										{ key: 'compactMode', label: 'Compact mode', desc: 'Reduce spacing for more content' },
										{ key: 'showAnimations', label: 'Show animations', desc: 'Enable smooth transitions and effects' },
										{ key: 'showPatientPhotos', label: 'Show patient photos', desc: 'Display patient photos in lists and details' },
										{ key: 'highlightUrgentCases', label: 'Highlight urgent cases', desc: 'Visually emphasize urgent patients' },
									].map((setting) => (
										<div key={setting.key} className="flex items-center justify-between">
											<div>
												<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
													{setting.label}
												</label>
												<p className="text-xs text-gray-500 dark:text-gray-400">
													{setting.desc}
												</p>
											</div>
											<FluidToggle
												checked={settings.appearance?.[setting.key] || false}
												onChange={(value) => updateSetting('appearance', setting.key, value)}
											/>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				);

			case 'data':
				return (
					<div className="space-y-6">
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
								Data Management
							</h3>
							<div className="space-y-4">
								<div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
									<div className="flex items-start space-x-3">
										<Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
										<div className="flex-1">
											<h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
												Export Data
											</h4>
											<p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
												Download all your practice data as a backup
											</p>
											<button
												onClick={exportData}
												className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
											>
												Export Now
											</button>
										</div>
									</div>
								</div>

								<div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
									<div className="flex items-start space-x-3">
										<Upload className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
										<div className="flex-1">
											<h4 className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
												Import Data
											</h4>
											<p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
												Restore data from a previous backup
											</p>
											<input
												type="file"
												accept=".json"
												className="hidden"
												id="import-file"
												onChange={(e) => {
													// Handle import logic here
													toast.info('Import functionality coming soon');
												}}
											/>
											<label
												htmlFor="import-file"
												className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer inline-block"
											>
												Choose File
											</label>
										</div>
									</div>
								</div>

								<div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
									<div className="flex items-start space-x-3">
										<Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
										<div className="flex-1">
											<h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
												Clear All Data
											</h4>
											<p className="text-xs text-red-700 dark:text-red-300 mb-3">
												Permanently delete all practice data (irreversible)
											</p>
											<button
												onClick={() => {
													if (
														confirm(
															'This will permanently delete all your data. This action cannot be undone. Are you sure?'
														)
													) {
														toast.info('Clear data functionality coming soon');
													}
												}}
												className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
											>
												Clear Data
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop with blur - prevent pointer events on background */}
			<div
				className="absolute inset-0 bg-black/32 transition-opacity"
				onClick={handleClose}
			/>

			{/* Modal - Increased width */}
			<div className="relative w-full max-w-5xl h-[60vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
				{/* Header - Reduced padding */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
							<SettingsIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Settings
							</h2>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Manage your application preferences
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						{hasUnsavedChanges && (
							<button
								onClick={saveSettings}
								className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1"
							>
								<Save className="w-4 h-4" />
								<span>Save</span>
							</button>
						)}
						<button
							onClick={handleClose}
							className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar - Reduced padding and fixed button styling */}
					<div ref={sidebarRef} className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
						<nav className="space-y-1">
							{SETTINGS_SECTIONS.map((section) => {
								const IconComponent = section.icon;
								const isActive = activeSection === section.id;

								return (
									<button
										key={section.id}
										data-section={section.id}
										onClick={() => handleSectionClick(section.id)}
										className={`w-full text-left p-2.5 rounded-lg transition-colors duration-200 cursor-pointer ${
											isActive
												? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
												: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
										}`}
									>
										<div className="flex items-center space-x-2.5">
											<IconComponent
												className={`w-4 h-4 ${
													isActive
														? 'text-blue-600 dark:text-blue-400'
														: 'text-gray-500 dark:text-gray-400'
												}`}
											/>
											<div>
												<div className="font-medium text-sm">{section.label}</div>
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
													{section.description}
												</div>
											</div>
										</div>
									</button>
								);
							})}
						</nav>
					</div>

					{/* Main Content - Reduced padding */}
					<div ref={contentRef} className="flex-1 p-6 overflow-y-auto scroll-smooth">
						<div className="space-y-12">
							{SETTINGS_SECTIONS.map((section) => (
								<div key={section.id} id={section.id} className="settings-section pt-2">
									{renderSectionContent(section.id)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
