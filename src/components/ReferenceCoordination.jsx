import React, { useState } from 'react'
import { PlusCircle, Phone, Mail, Building, User, MessageSquare, Trash2 } from 'lucide-react'

const REFERENCE_STATUSES = ['Requested', 'Scheduled', 'Completed']
const STATUS_COLORS = {
  'Requested': 'bg-yellow-100 text-yellow-800',
  'Scheduled': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-green-100 text-green-800'
}

export default function ReferenceCoordination({ data, addReference, updateReference, deleteReference }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    customerName: '',
    company: '',
    email: '',
    phone: '',
    relationship: '',
    requestedBy: '',
    scheduledDate: '',
    status: 'Requested',
    feedbackNotes: ''
  })

  const handleSubmit = async () => {
    if (!form.customerName || !form.company) return
    await addReference(form)
    setForm({
      customerName: '',
      company: '',
      email: '',
      phone: '',
      relationship: '',
      requestedBy: '',
      scheduledDate: '',
      status: 'Requested',
      feedbackNotes: ''
    })
    setShowForm(false)
  }

  const handleStatusChange = async (id, newStatus) => {
    await updateReference(id, { status: newStatus })
  }

  const handleUpdateNotes = async (id, feedbackNotes) => {
    await updateReference(id, { feedbackNotes })
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this reference?')) {
      await deleteReference(id)
    }
  }

  const groupedReferences = REFERENCE_STATUSES.reduce((acc, status) => {
    acc[status] = (data.references || []).filter(r => r.status === status)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
        <h2 className="font-semibold text-amber-800 flex items-center gap-2">
          <MessageSquare size={18} />
          Reference Coordination
        </h2>
        <p className="text-sm text-amber-700 mt-1">
          Reference calls close deals. Track your customer references and investor requests.
        </p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm"
      >
        <PlusCircle size={16} /><span>Add Reference Customer</span>
      </button>

      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-medium text-slate-800 mb-3">New Reference Customer</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Company *</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@acme.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555-123-4567"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Relationship / Use Case</label>
              <input
                type="text"
                placeholder="e.g., Enterprise customer since 2023, uses our API platform"
                value={form.relationship}
                onChange={e => setForm({ ...form, relationship: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Requested By (Investor)</label>
                <select
                  value={form.requestedBy}
                  onChange={e => setForm({ ...form, requestedBy: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Not yet assigned</option>
                  {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {REFERENCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Feedback Notes</label>
              <textarea
                placeholder="Notes from the reference call..."
                value={form.feedbackNotes}
                onChange={e => setForm({ ...form, feedbackNotes: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save Reference</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Status-based columns for larger screens, stacked for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REFERENCE_STATUSES.map(status => (
          <div key={status} className="space-y-2">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STATUS_COLORS[status]}`}>
              {status} ({groupedReferences[status].length})
            </div>
            {groupedReferences[status].map(ref => (
              <ReferenceCard
                key={ref.id}
                reference={ref}
                investors={data.investors}
                onStatusChange={handleStatusChange}
                onUpdateNotes={handleUpdateNotes}
                onDelete={handleDelete}
              />
            ))}
            {groupedReferences[status].length === 0 && (
              <p className="text-center py-4 text-slate-400 text-xs">No references</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferenceCard({ reference, investors, onStatusChange, onUpdateNotes, onDelete }) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(reference.feedbackNotes || '')

  const handleSaveNotes = () => {
    onUpdateNotes(reference.id, notes)
    setEditingNotes(false)
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400" />
            <h3 className="font-semibold text-slate-800 text-sm">{reference.customerName}</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Building size={12} className="text-slate-400" />
            <p className="text-xs text-slate-600">{reference.company}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(reference.id)}
          className="text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {reference.relationship && (
        <p className="text-xs text-slate-500 mt-2 italic">{reference.relationship}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        {reference.email && (
          <a href={`mailto:${reference.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            <Mail size={12} />{reference.email}
          </a>
        )}
        {reference.phone && (
          <a href={`tel:${reference.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
            <Phone size={12} />{reference.phone}
          </a>
        )}
      </div>

      {reference.requestedBy && (
        <div className="mt-2 text-xs">
          <span className="text-slate-500">Requested by: </span>
          <span className="font-medium text-slate-700">{reference.requestedBy}</span>
        </div>
      )}

      {reference.scheduledDate && (
        <div className="text-xs text-slate-500 mt-1">
          Scheduled: {reference.scheduledDate}
        </div>
      )}

      <div className="mt-2">
        <select
          value={reference.status}
          onChange={e => onStatusChange(reference.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded border-0 ${STATUS_COLORS[reference.status]}`}
        >
          {REFERENCE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Feedback Notes Section */}
      <div className="mt-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Feedback Notes</span>
          {!editingNotes && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              {reference.feedbackNotes ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="mt-1">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
              rows={2}
              placeholder="How did the call go? Key feedback..."
            />
            <div className="flex gap-1 mt-1">
              <button onClick={handleSaveNotes} className="text-xs bg-slate-800 text-white px-2 py-1 rounded">Save</button>
              <button onClick={() => setEditingNotes(false)} className="text-xs bg-slate-100 px-2 py-1 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          reference.feedbackNotes && (
            <p className="text-xs text-slate-600 mt-1">{reference.feedbackNotes}</p>
          )
        )}
      </div>
    </div>
  )
}
