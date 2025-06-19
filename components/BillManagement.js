'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock, Download, Search, Filter } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import SharePDFButton from './SharePDFButton';
import { generateBillPDF } from '../utils/billPDFGenerator';
import useScrollToTop from '../hooks/useScrollToTop';

export default function BillManagement({ onBack }) {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Add scroll to top when component mounts
  useScrollToTop();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, patientsData] = await Promise.all([
        storage.getBills(),
        storage.getPatients()
      ]);
      setBills(billsData);
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBillPayment = async (billId) => {
    const updatedBills = bills.map(bill =>
      bill.id === billId ? { ...bill, isPaid: !bill.isPaid } : bill
    );
    setBills(updatedBills);
    await storage.saveBills(updatedBills);
  };

  const downloadBill = async (bill) => {
    const patient = patients.find(p => p.id === bill.patientId);
    if (!patient) return;

    const billBlob = await generateBillPDF(bill, patient, false);
    const billUrl = URL.createObjectURL(billBlob);
    const a = document.createElement('a');
    a.href = billUrl;
    a.download = `bill-${patient.name}-${formatDate(bill.createdAt)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(billUrl);
  };

  const filteredBills = bills.filter(bill => {
    const patient = patients.find(p => p.id === bill.patientId);
    const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'paid' && bill.isPaid) ||
                         (filterStatus === 'pending' && !bill.isPaid);
    return matchesSearch && matchesFilter;
  });

  const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = filteredBills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-200">Bill Management</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-200">₹{totalAmount}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">₹{paidAmount}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</p>
                <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400">₹{pendingAmount}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name or bill ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="all">All Bills</option>
                <option value="paid">Paid Bills</option>
                <option value="pending">Pending Bills</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {filteredBills.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBills.map((bill) => {
                const patient = patients.find(p => p.id === bill.patientId);
                return (
                  <div key={bill.id} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-200">
                            {patient?.name || 'Unknown Patient'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bill.isPaid 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
                              : 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400'
                          }`}>
                            {bill.isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Bill ID: {bill.id}</span>
                          <span>Amount: ₹{bill.amount}</span>
                          <span>Date: {formatDate(bill.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleBillPayment(bill.id)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            bill.isPaid
                              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          }`}
                        >
                          Mark as {bill.isPaid ? 'Pending' : 'Paid'}
                        </button>
                        <button
                          onClick={() => downloadBill(bill)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {patient && (
                          <SharePDFButton
                            pdfUrl={bill.pdfUrl}
                            filename={`bill-${patient.name}-${formatDate(bill.createdAt)}.pdf`}
                            phone={patient.phone}
                            type="bill"
                            patientName={patient.name}
                            prescriptionDate={formatDate(bill.createdAt)}
                            billAmount={bill.amount}
                            bill={bill}
                            patient={patient}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">No bills found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Bills will appear here as you create prescriptions'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
