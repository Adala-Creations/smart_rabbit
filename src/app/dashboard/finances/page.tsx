'use client';

import { useEffect, useState } from 'react';

export default function FinancesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<any | null>(null);
  const [viewingExpense, setViewingExpense] = useState<any | null>(null);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, expensesRes, rabbitsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/expenses'),
        fetch('/api/rabbits'),
      ]);

      setSales(await salesRes.json());
      setExpenses(await expensesRes.json());
      setRabbits(await rabbitsRes.json());
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingSaleId ? { id: editingSaleId } : {}),
          ...saleData,
          rabbitId: saleData.rabbitId || undefined,
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
        fetchData();
      }
    } catch (error) {
      console.error('Error recording sale:', error);
    }
  };

  const handleSaleEdit = (sale: any) => {
    setEditingSaleId(sale.id);
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
    if (!confirm('Are you sure you want to delete this sale record?')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete sale');
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
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // PUT expects id in request body (not query param)
      const method = editingExpenseId ? 'PUT' : 'POST';
      const url = '/api/expenses';

      const res = await fetch(url, {
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
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete expense');
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

  const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track sales and expenses
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className={`${netProfit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'} rounded-lg p-6`}>
          <h3 className={`text-sm font-medium ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
            Net Profit/Loss
          </h3>
          <p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
            ${netProfit.toFixed(2)}
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
    </div>
  );
}
