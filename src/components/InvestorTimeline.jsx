import React, { useState } from 'react'
import {
  X,
  Mail,
  Calendar,
  ArrowRightLeft,
  StickyNote,
  PlusCircle,
  Clock,
  Send,
  MessageCircle,
  CheckCircle
} from 'lucide-react'

const ACTIVITY_ICONS = {
  email: Mail,
  meeting: Calendar,
  stage_change: ArrowRightLeft,
  note: StickyNote,
  created: PlusCircle
}

const ACTIVITY_COLORS = {
  email: 'text-blue-500 bg-blue-50',
  meeting: 'text-purple-500 bg-purple-50',
  stage_change: 'text-orange-500 bg-orange-50',
  note: 'text-green-500 bg-green-50',
  created: 'text-slate-500 bg-slate-50'
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

export default function InvestorTimeline({
  investor,
  timeline,
  onClose,
  onAddNote,
  lastTouched
}) {
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await onAddNote(newNote.trim())
    setNewNote('')
    setIsAddingNote(false)
  }

  const getActivityLabel = (item) => {
    switch (item.type) {
      case 'email':
        return item.replied ? 'Email (replied)' : 'Email sent'
      case 'meeting':
        return 'Meeting'
      case 'stage_change':
        return 'Stage changed'
      case 'note':
        return 'Note added'
      case 'created':
        return 'Added to pipeline'
      default:
        return item.type
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold text-lg text-slate-800">{investor.firm}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Clock size={12} />
              <span>
                Last touched: {lastTouched ? formatRelativeTime(lastTouched) : 'Never'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Quick Add Note */}
        <div className="p-3 border-b bg-slate-50">
          {isAddingNote ? (
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a quick note..."
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex items-center space-x-1 bg-slate-800 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>Add Note</span>
                </button>
                <button
                  onClick={() => { setIsAddingNote(false); setNewNote(''); }}
                  className="px-3 py-1.5 bg-slate-100 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNote(true)}
              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 transition-colors w-full p-2 hover:bg-white rounded-lg"
            >
              <MessageCircle size={16} />
              <span>Add a quick note...</span>
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {timeline.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Clock size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs">Start by adding a note above</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {timeline.map((item, index) => {
                  const Icon = ACTIVITY_ICONS[item.type] || StickyNote
                  const colorClass = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.note

                  return (
                    <div key={item.id} className="relative flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`relative z-10 p-1.5 rounded-full ${colorClass}`}>
                        <Icon size={14} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">
                            {getActivityLabel(item)}
                          </span>
                          <span className="text-xs text-slate-400" title={formatDate(item.timestamp)}>
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 break-words">
                          {item.description}
                        </p>

                        {/* Extra info for specific types */}
                        {item.type === 'email' && item.replied && (
                          <div className="flex items-center space-x-1 mt-1 text-xs text-green-600">
                            <CheckCircle size={12} />
                            <span>Replied</span>
                          </div>
                        )}
                        {item.type === 'meeting' && item.followUp && (
                          <div className="mt-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                            Follow-up: {item.followUp}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-slate-50 text-center">
          <span className="text-xs text-slate-400">
            {timeline.length} {timeline.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>
      </div>
    </div>
  )
}
