'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings as SettingsIcon, Shield, User, Bell, Palette, Database, Download, Upload, Trash2, Save, FileText, DollarSign, Clock, Users, Stethoscope } from 'lucide-react';
import { storage } from '../utils/storage';
import { toast } from 'sonner';

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
	const isClickScrolling = useRef(false);

	useEffect(() => {
		if (isOpen) {
			loadSettings();
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
							setActiveSection(entry.target.id);
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

	const loadSettings = async () => {
		try {
			const savedSettings = await storage.getSettings();
			if (savedSettings) {
				setSettings((prevSettings) => ({
					...prevSettings,
					...savedSettings,
				}));
			}
		} catch (error) {
			console.error('Error loading settings:', error);
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
		if (hasUnsavedChanges) {
			if (confirm('You have unsaved changes. Are you sure you want to close?')) {
				setHasUnsavedChanges(false);
				onClose();
			}
		} else {
			onClose();
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
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Full Name
									</label>
									<input
										type="text"
										value={settings.profile.doctorName}
										onChange={(e) => updateSetting('profile', 'doctorName', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="Dr. John Smith"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Specialization
									</label>
									<input
										type="text"
										value={settings.profile.specialization}
										onChange={(e) => updateSetting('profile', 'specialization', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="General Medicine"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Qualification
									</label>
									<input
										type="text"
										value={settings.profile.qualification}
										onChange={(e) => updateSetting('profile', 'qualification', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="MBBS, MD"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Registration Number
									</label>
									<input
										type="text"
										value={settings.profile.registrationNumber}
										onChange={(e) => updateSetting('profile', 'registrationNumber', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="MCI Registration Number"
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Hospital/Clinic Name
									</label>
									<input
										type="text"
										value={settings.profile.hospitalName}
										onChange={(e) => updateSetting('profile', 'hospitalName', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="Chaitanya Hospital"
									/>
								</div>

								<div className="col-span-2">
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Hospital/Clinic Address
									</label>
									<textarea
										value={settings.profile.hospitalAddress}
										onChange={(e) => updateSetting('profile', 'hospitalAddress', e.target.value)}
										rows={2}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="Enter complete address"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Phone Number
									</label>
									<input
										type="tel"
										value={settings.profile.phoneNumber}
										onChange={(e) => updateSetting('profile', 'phoneNumber', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										placeholder="+91 9876543210"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Email Address
									</label>
									<input
										type="email"
										value={settings.profile.email}
										onChange={(e) => updateSetting('profile', 'email', e.target.value)}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.general.autoSave}
											onChange={(e) =>
												updateSetting('general', 'autoSave', e.target.checked)
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Consultation Fee (₹)
										</label>
										<input
											type="number"
											value={settings.general.defaultConsultationFee}
											onChange={(e) =>
												updateSetting(
													'general',
													'defaultConsultationFee',
													parseInt(e.target.value) || 0
												)
											}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Follow-up Days
										</label>
										<input
											type="number"
											value={settings.general.defaultFollowUpDays}
											onChange={(e) =>
												updateSetting(
													'general',
													'defaultFollowUpDays',
													parseInt(e.target.value) || 0
												)
											}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Language
										</label>
										<select
											value={settings.general.language}
											onChange={(e) => updateSetting('general', 'language', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="english">English</option>
											<option value="hindi">Hindi</option>
											<option value="marathi">Marathi</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Timezone
										</label>
										<select
											value={settings.general.timezone}
											onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
											<option value="Asia/Mumbai">Asia/Mumbai</option>
											<option value="Asia/Delhi">Asia/Delhi</option>
										</select>
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.general.showPatientAge}
											onChange={(e) =>
												updateSetting('general', 'showPatientAge', e.target.checked)
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
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
											value={settings.prescription.defaultInstructions}
											onChange={(e) => updateSetting('prescription', 'defaultInstructions', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
											placeholder="Take as directed"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Default Duration
										</label>
										<select
											value={settings.prescription.defaultDuration}
											onChange={(e) => updateSetting('prescription', 'defaultDuration', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="3 days">3 days</option>
											<option value="5 days">5 days</option>
											<option value="7 days">7 days</option>
											<option value="10 days">10 days</option>
											<option value="15 days">15 days</option>
											<option value="30 days">30 days</option>
										</select>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Default Advice
									</label>
									<textarea
										value={settings.prescription.defaultAdvice}
										onChange={(e) => updateSetting('prescription', 'defaultAdvice', e.target.value)}
										rows={2}
										className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={settings.prescription[setting.key]}
													onChange={(e) => updateSetting('prescription', setting.key, e.target.checked)}
													className="sr-only peer"
												/>
												<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
											</label>
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
											value={settings.billing.defaultConsultationFee}
											onChange={(e) => updateSetting('billing', 'defaultConsultationFee', parseInt(e.target.value) || 0)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Payment Terms
										</label>
										<select
											value={settings.billing.defaultPaymentTerms}
											onChange={(e) => updateSetting('billing', 'defaultPaymentTerms', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="immediate">Immediate</option>
											<option value="7 days">7 days</option>
											<option value="15 days">15 days</option>
											<option value="30 days">30 days</option>
										</select>
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.billing.enableGST}
											onChange={(e) => updateSetting('billing', 'enableGST', e.target.checked)}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								{settings.billing.enableGST && (
									<div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												GST Number
											</label>
											<input
												type="text"
												value={settings.billing.gstNumber}
												onChange={(e) => updateSetting('billing', 'gstNumber', e.target.value)}
												className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
												placeholder="22AAAAA0000A1Z5"
											/>
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
												GST Percentage (%)
											</label>
											<input
												type="number"
												value={settings.billing.gstPercentage}
												onChange={(e) => updateSetting('billing', 'gstPercentage', parseInt(e.target.value) || 18)}
												className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={settings.billing[setting.key]}
													onChange={(e) => updateSetting('billing', setting.key, e.target.checked)}
													className="sr-only peer"
												/>
												<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
											</label>
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.billing.includeFollowUpDiscount}
											onChange={(e) => updateSetting('billing', 'includeFollowUpDiscount', e.target.checked)}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								{settings.billing.includeFollowUpDiscount && (
									<div className="pl-4 border-l-2 border-blue-200 dark:border-blue-800">
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Follow-up Discount Percentage (%)
										</label>
										<input
											type="number"
											value={settings.billing.followUpDiscountPercentage}
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
										<select
											value={settings.scheduling.consultationDuration}
											onChange={(e) => updateSetting('scheduling', 'consultationDuration', parseInt(e.target.value))}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value={10}>10 minutes</option>
											<option value={15}>15 minutes</option>
											<option value={20}>20 minutes</option>
											<option value={30}>30 minutes</option>
											<option value={45}>45 minutes</option>
											<option value={60}>1 hour</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Working Hours Start
										</label>
										<input
											type="time"
											value={settings.scheduling.workingHoursStart}
											onChange={(e) => updateSetting('scheduling', 'workingHoursStart', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Working Hours End
										</label>
										<input
											type="time"
											value={settings.scheduling.workingHoursEnd}
											onChange={(e) => updateSetting('scheduling', 'workingHoursEnd', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
													checked={settings.scheduling.workingDays.includes(day)}
													onChange={(e) => {
														const days = e.target.checked
															? [...settings.scheduling.workingDays, day]
															: settings.scheduling.workingDays.filter(d => d !== day);
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
										<select
											value={settings.scheduling.bufferTimeBetweenAppointments}
											onChange={(e) => updateSetting('scheduling', 'bufferTimeBetweenAppointments', parseInt(e.target.value))}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value={0}>No buffer</option>
											<option value={5}>5 minutes</option>
											<option value={10}>10 minutes</option>
											<option value={15}>15 minutes</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Max Patients Per Day
										</label>
										<input
											type="number"
											value={settings.scheduling.maxPatientsPerDay}
											onChange={(e) => updateSetting('scheduling', 'maxPatientsPerDay', parseInt(e.target.value) || 50)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
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
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={settings.scheduling[setting.key]}
													onChange={(e) => updateSetting('scheduling', setting.key, e.target.checked)}
													className="sr-only peer"
												/>
												<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
											</label>
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.security.requirePasswordForDelete}
											onChange={(e) =>
												updateSetting('security', 'requirePasswordForDelete', e.target.checked)
											}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
										Session Timeout (minutes)
									</label>
									<select
										value={settings.security.sessionTimeout}
										onChange={(e) =>
											updateSetting('security', 'sessionTimeout', parseInt(e.target.value))
										}
										className="w-40 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
									>
										<option value={15}>15 minutes</option>
										<option value={30}>30 minutes</option>
										<option value={60}>1 hour</option>
										<option value={120}>2 hours</option>
										<option value={0}>Never</option>
									</select>
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
									<label className="relative inline-flex items-center cursor-pointer">
										<input
											type="checkbox"
											checked={settings.security.enableAuditLog}
											onChange={(e) => updateSetting('security', 'enableAuditLog', e.target.checked)}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
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
										<label className="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												checked={settings.notifications[setting.key]}
												onChange={(e) => updateSetting('notifications', setting.key, e.target.checked)}
												className="sr-only peer"
											/>
											<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
										</label>
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
										<select
											value={settings.appearance.theme}
											onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="system">System</option>
											<option value="light">Light</option>
											<option value="dark">Dark</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
											Font Size
										</label>
										<select
											value={settings.appearance.fontSize}
											onChange={(e) => updateSetting('appearance', 'fontSize', e.target.value)}
											className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
										>
											<option value="small">Small</option>
											<option value="medium">Medium</option>
											<option value="large">Large</option>
										</select>
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
											<label className="relative inline-flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={settings.appearance[setting.key]}
													onChange={(e) => updateSetting('appearance', setting.key, e.target.checked)}
													className="sr-only peer"
												/>
												<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
											</label>
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
				className="absolute inset-0 backdrop-blur-sm transition-opacity"
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
					<div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-3 overflow-y-auto">
						<nav className="space-y-1">
							{SETTINGS_SECTIONS.map((section) => {
								const IconComponent = section.icon;
								const isActive = activeSection === section.id;

								return (
									<button
										key={section.id}
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
