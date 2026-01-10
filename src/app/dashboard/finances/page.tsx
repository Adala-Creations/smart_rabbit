'use client';

import { useEffect, useState } from 'react';
import useFetchWithLoading from '@/hooks/useFetchWithLoading';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmProvider';

export default function FinancesPage() {
  const toast = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [creditors, setCreditors] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDebtorForm, setShowDebtorForm] = useState(false);
  const [showCreditorForm, setShowCreditorForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editingDebtorId, setEditingDebtorId] = useState<string | null>(null);
  const [editingCreditorId, setEditingCreditorId] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<any | null>(null);
  const [viewingExpense, setViewingExpense] = useState<any | null>(null);
  const [viewingDebtor, setViewingDebtor] = useState<any | null>(null);
  const [viewingCreditor, setViewingCreditor] = useState<any | null>(null);

  const [saleType, setSaleType] = useState<'rabbit' | 'batch'>('rabbit');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantitySold, setQuantitySold] = useState('');

  const [saleData, setSaleData] = useState({
    rabbitId: '',
    description: '',
    amount: '',
    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerContact: '',
    notes: '',
  });

  const [expenseData, setExpenseData] = useState({
    description: '',
    category: 'Feed',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    notes: '',
  });

  const [debtorData, setDebtorData] = useState({
    name: '',
    contact: '',
    amountOwed: '',
    description: '',
    dueDate: '',
    status: 'PENDING',
    notes: '',
  });

  const [creditorData, setCreditorData] = useState({
    name: '',
    contact: '',
    amountOwed: '',
    description: '',
    dueDate: '',
    status: 'PENDING',
    notes: '',
  });

  const fetchWithLoading = useFetchWithLoading();
  const confirm = useConfirm();
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, expensesRes, debtorsRes, creditorsRes, rabbitsRes, batchesRes] = await Promise.all([
        fetchWithLoading('/api/sales'),
        fetchWithLoading('/api/expenses'),
        fetchWithLoading('/api/debtors'),
        fetchWithLoading('/api/creditors'),
        fetchWithLoading('/api/rabbits'),
        fetchWithLoading('/api/offspring?status=ACTIVE'),
      ]);

      setSales(await salesRes.json());
      setExpenses(await expensesRes.json());
      setDebtors(await debtorsRes.json());
      setCreditors(await creditorsRes.json());
      setRabbits(await rabbitsRes.json());
      setBatches(await batchesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For updates, API expects id in JSON body (not query param)
      const method = editingSaleId ? 'PUT' : 'POST';
      const url = '/api/sales';

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingSaleId ? { id: editingSaleId } : {}),
          ...saleData,
          rabbitId: saleType === 'rabbit' ? (saleData.rabbitId || undefined) : undefined,
          batchId: saleType === 'batch' ? selectedBatchId : undefined,
          quantitySold: saleType === 'batch' ? quantitySold : undefined,
        }),
      });

      if (res.ok) {
        setShowSaleForm(false);
        setEditingSaleId(null);
        setSaleData({
          rabbitId: '',
          description: '',
          amount: '',
          saleDate: new Date().toISOString().split('T')[0],
          buyerName: '',
          buyerContact: '',
          notes: '',
        });
        setSelectedBatchId('');
        setQuantitySold('');
        fetchData();
      }
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const handleSaleEdit = (sale: any) => {
    setEditingSaleId(sale.id);
    setSaleType(sale.batchId ? 'batch' : 'rabbit');
    setSelectedBatchId(sale.batchId || '');
    setQuantitySold(sale.quantitySold ? sale.quantitySold.toString() : '1');
    setSaleData({
      rabbitId: sale.rabbitId || '',
      description: sale.description,
      amount: sale.amount.toString(),
      saleDate: new Date(sale.saleDate).toISOString().split('T')[0],
      buyerName: sale.buyerName || '',
      buyerContact: sale.buyerContact || '',
      notes: sale.notes || '',
    });
    setShowSaleForm(true);
  };

  const handleSaleDelete = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this sale record?'))) return;
    try {
      const res = await fetchWithLoading(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete sale', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const handleCancelSaleEdit = () => {
    setEditingSaleId(null);
    setSaleData({
      rabbitId: '',
      description: '',
      amount: '',
      saleDate: new Date().toISOString().split('T')[0],
      buyerName: '',
      buyerContact: '',
      notes: '',
    });
    setSelectedBatchId('');
    setQuantitySold('');
    setSaleType('rabbit');
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // PUT expects id in request body (not query param)
      const method = editingExpenseId ? 'PUT' : 'POST';
      const url = '/api/expenses';

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingExpenseId ? { id: editingExpenseId } : {}),
          ...expenseData,
        }),
      });

      if (res.ok) {
        setShowExpenseForm(false);
        setEditingExpenseId(null);
        setExpenseData({
          description: '',
          category: 'Feed',
          amount: '',
          expenseDate: new Date().toISOString().split('T')[0],
          vendor: '',
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording expense:', error);
    }
  };

  const handleExpenseEdit = (expense: any) => {
    setEditingExpenseId(expense.id);
    setExpenseData({
      description: expense.description,
      category: expense.category,
      amount: expense.amount.toString(),
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      vendor: expense.vendor || '',
      notes: expense.notes || '',
    });
    setShowExpenseForm(true);
  };

  const handleExpenseDelete = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this expense record?'))) return;
    try {
      const res = await fetchWithLoading(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete expense', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleCancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setExpenseData({
      description: '',
      category: 'Feed',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      vendor: '',
      notes: '',
    });
  };

  const handleDebtorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingDebtorId ? 'PUT' : 'POST';
      const url = '/api/debtors';

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingDebtorId ? { id: editingDebtorId } : {}),
          ...debtorData,
          amountOwed: debtorData.amountOwed || undefined,
          dueDate: debtorData.dueDate || undefined,
        }),
      });

      if (res.ok) {
        setShowDebtorForm(false);
        setEditingDebtorId(null);
        setDebtorData({
          name: '',
          contact: '',
          amountOwed: '',
          description: '',
          dueDate: '',
          status: 'PENDING',
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording debtor:', error);
    }
  };

  const handleDebtorEdit = (debtor: any) => {
    setEditingDebtorId(debtor.id);
    setDebtorData({
      name: debtor.name,
      contact: debtor.contact || '',
      amountOwed: debtor.amountOwed.toString(),
      description: debtor.description,
      dueDate: debtor.dueDate ? new Date(debtor.dueDate).toISOString().split('T')[0] : '',
      status: debtor.status,
      notes: debtor.notes || '',
    });
    setShowDebtorForm(true);
  };

  const handleDebtorDelete = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this debtor record?'))) return;
    try {
      const res = await fetchWithLoading(`/api/debtors?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete debtor', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting debtor:', error);
    }
  };

  const handleCancelDebtorEdit = () => {
    setEditingDebtorId(null);
    setDebtorData({
      name: '',
      contact: '',
      amountOwed: '',
      description: '',
      dueDate: '',
      status: 'PENDING',
      notes: '',
    });
  };

  const handleCreditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCreditorId ? 'PUT' : 'POST';
      const url = '/api/creditors';

      const res = await fetchWithLoading(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingCreditorId ? { id: editingCreditorId } : {}),
          ...creditorData,
          amountOwed: creditorData.amountOwed || undefined,
          dueDate: creditorData.dueDate || undefined,
        }),
      });

      if (res.ok) {
        setShowCreditorForm(false);
        setEditingCreditorId(null);
        setCreditorData({
          name: '',
          contact: '',
          amountOwed: '',
          description: '',
          dueDate: '',
          status: 'PENDING',
          notes: '',
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error recording creditor:', error);
    }
  };

  const handleCreditorEdit = (creditor: any) => {
    setEditingCreditorId(creditor.id);
    setCreditorData({
      name: creditor.name,
      contact: creditor.contact || '',
      amountOwed: creditor.amountOwed.toString(),
      description: creditor.description,
      dueDate: creditor.dueDate ? new Date(creditor.dueDate).toISOString().split('T')[0] : '',
      status: creditor.status,
      notes: creditor.notes || '',
    });
    setShowCreditorForm(true);
  };

  const handleCreditorDelete = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this creditor record?'))) return;
    try {
      const res = await fetchWithLoading(`/api/creditors?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        toast.pushToast({ message: data.error || 'Failed to delete creditor', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting creditor:', error);
    }
  };

  const handleCancelCreditorEdit = () => {
    setEditingCreditorId(null);
    setCreditorData({
      name: '',
      contact: '',
      amountOwed: '',
      description: '',
      dueDate: '',
      status: 'PENDING',
      notes: '',
    });
  };

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDebtors = debtors.reduce((sum, d) => sum + d.amountOwed, 0);
  const totalCreditors = creditors.reduce((sum, c) => sum + c.amountOwed, 0);
  const netProfit = totalSales - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track sales, expenses, debtors, and creditors
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Total Sales</h3>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
            ${totalSales.toFixed(2)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
            ${totalExpenses.toFixed(2)}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Money Owed to Us</h3>
          <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
            ${totalDebtors.toFixed(2)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
          <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Money We Owe</h3>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
            ${totalCreditors.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Sale View Modal */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingSale(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sale Details</h2>
                <button onClick={() => setViewingSale(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sale Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingSale.saleDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingSale.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">${viewingSale.amount.toFixed(2)}</p>
                </div>
                {viewingSale.rabbit && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rabbit</p>
                    <p className="text-gray-900 dark:text-white">{viewingSale.rabbit.rabbitId} - {viewingSale.rabbit.name || 'Unnamed'}</p>
                  </div>
                )}
                {viewingSale.batch && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Batch</p>
                    <p className="text-gray-900 dark:text-white">{viewingSale.batch.batchId} - {viewingSale.quantitySold} rabbits sold</p>
                  </div>
                )}
                {viewingSale.buyerName && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Buyer Name</p>
                    <p className="text-gray-900 dark:text-white">{viewingSale.buyerName}</p>
                  </div>
                )}
                {viewingSale.buyerContact && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Buyer Contact</p>
                    <p className="text-gray-900 dark:text-white">{viewingSale.buyerContact}</p>
                  </div>
                )}
                {viewingSale.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingSale.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingSale(null);
                    handleSaleEdit(viewingSale);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingSale(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense View Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingExpense(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Details</h2>
                <button onClick={() => setViewingExpense(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expense Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{new Date(viewingExpense.expenseDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingExpense.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <span className="inline-block px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {viewingExpense.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">${viewingExpense.amount.toFixed(2)}</p>
                </div>
                {viewingExpense.vendor && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
                    <p className="text-gray-900 dark:text-white">{viewingExpense.vendor}</p>
                  </div>
                )}
                {viewingExpense.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingExpense.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingExpense(null);
                    handleExpenseEdit(viewingExpense);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingExpense(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debtor View Modal */}
      {viewingDebtor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingDebtor(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Debtor Details</h2>
                <button onClick={() => setViewingDebtor(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingDebtor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount Owed</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${viewingDebtor.amountOwed.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingDebtor.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    viewingDebtor.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    viewingDebtor.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {viewingDebtor.status}
                  </span>
                </div>
                {viewingDebtor.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                    <p className="text-gray-900 dark:text-white">{new Date(viewingDebtor.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingDebtor.contact && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                    <p className="text-gray-900 dark:text-white">{viewingDebtor.contact}</p>
                  </div>
                )}
                {viewingDebtor.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingDebtor.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingDebtor(null);
                    handleDebtorEdit(viewingDebtor);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingDebtor(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creditor View Modal */}
      {viewingCreditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewingCreditor(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Creditor Details</h2>
                <button onClick={() => setViewingCreditor(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingCreditor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount Owed</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${viewingCreditor.amountOwed.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingCreditor.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    viewingCreditor.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    viewingCreditor.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {viewingCreditor.status}
                  </span>
                </div>
                {viewingCreditor.dueDate && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                    <p className="text-gray-900 dark:text-white">{new Date(viewingCreditor.dueDate).toLocaleDateString()}</p>
                  </div>
                )}
                {viewingCreditor.contact && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                    <p className="text-gray-900 dark:text-white">{viewingCreditor.contact}</p>
                  </div>
                )}
                {viewingCreditor.notes && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{viewingCreditor.notes}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setViewingCreditor(null);
                    handleCreditorEdit(viewingCreditor);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button onClick={() => setViewingCreditor(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales</h2>
          <button
            onClick={() => {
              if (showSaleForm) {
                handleCancelSaleEdit();
                setShowSaleForm(false);
              } else {
                setShowSaleForm(true);
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            {showSaleForm ? 'Cancel' : '+ Add Sale'}
          </button>
        </div>

        {showSaleForm && (
          <form onSubmit={handleSaleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Sale Type</label>
                <select
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value as 'rabbit' | 'batch')}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="rabbit">Individual Rabbit</option>
                  <option value="batch">Rabbit Batch</option>
                </select>
              </div>
              {saleType === 'rabbit' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Rabbit (Optional)</label>
                  <select
                    value={saleData.rabbitId}
                    onChange={(e) => setSaleData({ ...saleData, rabbitId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">No specific rabbit</option>
                    {rabbits.filter(r => r.status === 'ACTIVE').map((rabbit) => (
                      <option key={rabbit.id} value={rabbit.id}>
                        {rabbit.rabbitId} - {rabbit.name || 'Unnamed'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {saleType === 'batch' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Batch *</label>
                    <select
                      required
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    >
                      <option value="">Select batch</option>
                      {batches.filter(b => b.liveCount > 0).map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchId} - {batch.liveCount} rabbits
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Quantity Sold *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantitySold}
                      onChange={(e) => setQuantitySold(e.target.value)}
                      placeholder="Number of rabbits sold"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description *</label>
                <input
                  type="text"
                  required
                  value={saleData.description}
                  onChange={(e) => setSaleData({ ...saleData, description: e.target.value })}
                  placeholder="e.g., Rabbit sale, Meat sale"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={saleData.amount}
                  onChange={(e) => setSaleData({ ...saleData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Sale Date *</label>
                <input
                  type="date"
                  required
                  value={saleData.saleDate}
                  onChange={(e) => setSaleData({ ...saleData, saleDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Buyer Name</label>
                <input
                  type="text"
                  value={saleData.buyerName}
                  onChange={(e) => setSaleData({ ...saleData, buyerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Buyer Contact</label>
                <input
                  type="text"
                  value={saleData.buyerContact}
                  onChange={(e) => setSaleData({ ...saleData, buyerContact: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {editingSaleId ? 'Update Sale' : 'Record Sale'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Buyer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {sale.description}
                    {sale.batch && ` (${sale.batch.batchId} - ${sale.quantitySold} rabbits)`}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {sale.buyerName || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400">
                    ${sale.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingSale(sale)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleSaleEdit(sale)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleSaleDelete(sale.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expenses</h2>
          <button
            onClick={() => {
              if (showExpenseForm) {
                handleCancelExpenseEdit();
                setShowExpenseForm(false);
              } else {
                setShowExpenseForm(true);
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            {showExpenseForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleExpenseSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description *</label>
                <input
                  type="text"
                  required
                  value={expenseData.description}
                  onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Category *</label>
                <select
                  required
                  value={expenseData.category}
                  onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="Feed">Feed</option>
                  <option value="Medical">Medical</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={expenseData.expenseDate}
                  onChange={(e) => setExpenseData({ ...expenseData, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Vendor</label>
                <input
                  type="text"
                  value={expenseData.vendor}
                  onChange={(e) => setExpenseData({ ...expenseData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              {editingExpenseId ? 'Update Expense' : 'Record Expense'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vendor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {expense.description}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {expense.category}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {expense.vendor || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingExpense(expense)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleExpenseEdit(expense)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleExpenseDelete(expense.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debtors Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Debtors (Money Owed to Us)</h2>
          <button
            onClick={() => {
              if (showDebtorForm) {
                handleCancelDebtorEdit();
                setShowDebtorForm(false);
              } else {
                setShowDebtorForm(true);
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
          >
            {showDebtorForm ? 'Cancel' : '+ Add Debtor'}
          </button>
        </div>

        {showDebtorForm && (
          <form onSubmit={handleDebtorSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                <input
                  type="text"
                  required
                  value={debtorData.name}
                  onChange={(e) => setDebtorData({ ...debtorData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Amount Owed ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={debtorData.amountOwed}
                  onChange={(e) => setDebtorData({ ...debtorData, amountOwed: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description *</label>
                <input
                  type="text"
                  required
                  value={debtorData.description}
                  onChange={(e) => setDebtorData({ ...debtorData, description: e.target.value })}
                  placeholder="e.g., Rabbit sale on credit"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Status</label>
                <select
                  value={debtorData.status}
                  onChange={(e) => setDebtorData({ ...debtorData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Due Date</label>
                <input
                  type="date"
                  value={debtorData.dueDate}
                  onChange={(e) => setDebtorData({ ...debtorData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Contact</label>
                <input
                  type="text"
                  value={debtorData.contact}
                  onChange={(e) => setDebtorData({ ...debtorData, contact: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
              {editingDebtorId ? 'Update Debtor' : 'Record Debtor'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount Owed</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {debtors.map((debtor) => (
                <tr key={debtor.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {debtor.name}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    ${debtor.amountOwed.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                      debtor.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      debtor.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {debtor.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {debtor.dueDate ? new Date(debtor.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingDebtor(debtor)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDebtorEdit(debtor)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDebtorDelete(debtor.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creditors Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Creditors (Money We Owe)</h2>
          <button
            onClick={() => {
              if (showCreditorForm) {
                handleCancelCreditorEdit();
                setShowCreditorForm(false);
              } else {
                setShowCreditorForm(true);
              }
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            {showCreditorForm ? 'Cancel' : '+ Add Creditor'}
          </button>
        </div>

        {showCreditorForm && (
          <form onSubmit={handleCreditorSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Name *</label>
                <input
                  type="text"
                  required
                  value={creditorData.name}
                  onChange={(e) => setCreditorData({ ...creditorData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Amount Owed ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={creditorData.amountOwed}
                  onChange={(e) => setCreditorData({ ...creditorData, amountOwed: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Description *</label>
                <input
                  type="text"
                  required
                  value={creditorData.description}
                  onChange={(e) => setCreditorData({ ...creditorData, description: e.target.value })}
                  placeholder="e.g., Feed supplier, Equipment purchase"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Status</label>
                <select
                  value={creditorData.status}
                  onChange={(e) => setCreditorData({ ...creditorData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Due Date</label>
                <input
                  type="date"
                  value={creditorData.dueDate}
                  onChange={(e) => setCreditorData({ ...creditorData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Contact</label>
                <input
                  type="text"
                  value={creditorData.contact}
                  onChange={(e) => setCreditorData({ ...creditorData, contact: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {editingCreditorId ? 'Update Creditor' : 'Record Creditor'}
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount Owed</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {creditors.map((creditor) => (
                <tr key={creditor.id}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {creditor.name}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    ${creditor.amountOwed.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                      creditor.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      creditor.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {creditor.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {creditor.dueDate ? new Date(creditor.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button
                      onClick={() => setViewingCreditor(creditor)}
                      className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleCreditorEdit(creditor)}
                      className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCreditorDelete(creditor.id)}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
