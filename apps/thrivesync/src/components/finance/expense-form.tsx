'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2, DollarSign, Calendar, Upload, FileText } from 'lucide-react'

interface ExpenseFormProps {
  onClose: () => void
  onSuccess: () => void
}

// Category options
const CATEGORIES = [
  { value: 'supplies', label: 'Supplies' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'training', label: 'Training' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'food', label: 'Food & Meals' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

// Allocation types for CFR
const ALLOCATION_TYPES = [
  { value: 'direct', label: 'Direct', description: 'Directly for program services' },
  { value: 'non_direct', label: 'Non-Direct', description: 'Support services' },
  { value: 'shared', label: 'Shared', description: 'Split across programs' },
  { value: 'admin', label: 'Administrative', description: 'Admin overhead' },
]

// Status options
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'reimbursed', label: 'Reimbursed' },
  { value: 'rejected', label: 'Rejected' },
]

// Payment methods
const PAYMENT_METHODS = [
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
]

export function ExpenseForm({ onClose, onSuccess }: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    vendor: '',
    expense_date: new Date().toISOString().split('T')[0],
    allocation_type: 'direct',
    status: 'pending',
    payment_method: '',
    receipt_url: '',
    cost_center: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.amount || !formData.category || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      try {
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            amount,
            category: formData.category,
            description: formData.description,
            vendor: formData.vendor || null,
            expense_date: formData.expense_date,
            allocation_type: formData.allocation_type,
            status: formData.status,
            payment_method: formData.payment_method || null,
            receipt_url: formData.receipt_url || null,
            cost_center: formData.cost_center || null,
          } as never)

        if (insertError) {
          console.error('Error adding expense:', insertError)
          setError(insertError.message)
          return
        }

        onSuccess()
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      }
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
              <p className="text-sm text-gray-500">Record a new expense</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Amount and Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="inline h-3.5 w-3.5 mr-1" />
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="expense_date"
                  value={formData.expense_date}
                  onChange={handleChange}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={2}
                placeholder="Describe the expense..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                placeholder="e.g., Office Depot, Amazon"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Allocation Type - CFR Classification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Allocation (CFR)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ALLOCATION_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.allocation_type === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="allocation_type"
                      value={type.value}
                      checked={formData.allocation_type === type.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div>
                      <p className={`text-sm font-medium ${
                        formData.allocation_type === type.value
                          ? 'text-purple-700'
                          : 'text-gray-700'
                      }`}>
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Status and Payment Method Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select method...</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receipt URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Upload className="inline h-3.5 w-3.5 mr-1" />
                Receipt URL
              </label>
              <input
                type="url"
                name="receipt_url"
                value={formData.receipt_url}
                onChange={handleChange}
                placeholder="https://storage.example.com/receipt.pdf"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Paste a link to the uploaded receipt (from Supabase Storage or external URL)
              </p>
            </div>

            {/* Cost Center */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Center
              </label>
              <input
                type="text"
                name="cost_center"
                value={formData.cost_center}
                onChange={handleChange}
                placeholder="e.g., Site A, Program X"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
