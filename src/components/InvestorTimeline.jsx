import React, { useState, useMemo } from 'react'
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
  CheckCircle,
  Filter,
  Users,
  MailOpen,
  MousePointerClick,
  TrendingUp,
  AlertCircle,
  ListTodo
} from 'lucide-react'

const ACTIVITY_TYPES = {
  email: { label: 'Email', icon: Mail, color: 'text-blue-500 bg-blue-50', borderColor: 'border-blue-200' },
  meeting: { label: 'Meeting', icon: Calendar, color: 'text-purple-500 bg-purple-50', borderColor: 'border-purple-200' },
  stage_change: { label: 'Stage Change', icon: ArrowRightLeft, color: 'text-orange-500 bg-orange-50', borderColor: 'border-orange-200' },
  note: { label: 'Note', icon: StickyNote, color: 'text-green-500 bg-green-50', borderColor: 'border-green-200' },
  created: { label: 'Created', icon: PlusCircle, color: 'text-slate-500 bg-slate-50', borderColor: 'border-slate-200' },
  reference: { label: 'Reference', icon: Users, color: 'text-pink-500 bg-pink-50', borderColor: 'border-pink-200' }
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

function getEngagementLevel(timeline) {
  if (timeline.length === 0) return { level: 'none', label: 'No activity', color: 'text-slate-400' }

  const now = new Date()
  const recentActivities = timeline.filter(item => {
    const itemDate = new Date(item.timestamp)
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }).length

  if (recentActivities >= 3) return { level: 'high', label: 'Hot', color: 'text-red-500' }
  if (recentActivities >= 1) return { level: 'medium', label: 'Active', color: 'text-orange-500' }

  const lastActivity = new Date(timeline[0].timestamp)
  const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))

  if (daysSinceActivity <= 14) return { level: 'warm', label: 'Warm', color: 'text-yellow-600' }
  if (daysSinceActivity <= 30) return { level: 'cooling', label: 'Cooling', color: 'text-blue-500' }
  return { level: 'cold', label: 'Cold', color: 'text-slate-400' }
}

export default function InvestorTimeline({
  investor,
  timeline,
  onClose,
  onAddNote,
  onAddAction,
  lastTouched
}) {
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isAddingAction, setIsAddingAction] = useState(false)
  const [newAction, setNewAction] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    await onAddNote(newNote.trim())
    setNewNote('')
    setIsAddingNote(false)
  }

  const handleAddAction = async () => {
    if (!newAction.trim() || !onAddAction) return
    try {
      await onAddAction(newAction.trim())
      setNewAction('')
      setIsAddingAction(false)
    } catch (err) {
      console.error('Failed to add action:', err)
    }
  }

  // Calculate activity stats
  const activityStats = useMemo(() => {
    const stats = {
      total: timeline.length,
      byType: {}
    }

    timeline.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1
    })

    return stats
  }, [timeline])

  // Filter timeline based on active filter
  const filteredTimeline = useMemo(() => {
    if (activeFilter === 'all') return timeline
    return timeline.filter(item => item.type === activeFilter)
  }, [timeline, activeFilter])

  const engagement = useMemo(() => getEngagementLevel(timeline), [timeline])

  const getActivityLabel = (item) => {
    switch (item.type) {
      case 'email':
        return item.replied ? 'Email replied' : 'Email sent'
      case 'meeting':
        return item.meetingType || 'Meeting'
      case 'stage_change':
        return 'Stage changed'
      case 'note':
        return 'Note'
      case 'created':
        return 'Added to pipeline'
      case 'reference':
        return 'Reference call'
      default:
        return item.type
    }
  }

  const availableFilters = useMemo(() => {
    const filters = ['all']
    Object.keys(activityStats.byType).forEach(type => {
      if (!filters.includes(type)) filters.push(type)
    })
    return filters
  }, [activityStats])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-lg text-slate-800">{investor.firm}</h2>
              {investor.contact && (
                <p className="text-xs text-slate-500">{investor.contact}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Engagement & Last Touch */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Clock size={12} className="text-slate-400" />
                <span className="text-slate-500">
                  Last touch: {lastTouched ? formatRelativeTime(lastTouched) : 'Never'}
                </span>
              </div>
              <div className={`flex items-center space-x-1 font-medium ${engagement.color}`}>
                <TrendingUp size={12} />
                <span>{engagement.label}</span>
              </div>
            </div>
            <span className="text-slate-400">{activityStats.total} activities</span>
          </div>
        </div>

        {/* Activity Stats Pills */}
        {activityStats.total > 0 && (
          <div className="px-4 py-2 border-b bg-slate-50/50">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter size={12} className="text-slate-400 shrink-0" />
              {availableFilters.map(filter => {
                const config = ACTIVITY_TYPES[filter] || { label: filter, color: 'text-slate-500 bg-slate-100' }
                const count = filter === 'all' ? activityStats.total : activityStats.byType[filter]
                const isActive = activeFilter === filter

                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                      isActive
                        ? `${config.color} ring-2 ring-offset-1 ring-slate-300`
                        : 'bg-white text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{filter === 'all' ? 'All' : config.label}</span>
                    <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Add Note / Action */}
        <div className="p-3 border-b bg-slate-50">
          {isAddingNote ? (
            <div className="space-y-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a quick note... (e.g., 'Had great intro call, interested in our API')"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                rows={2}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="flex items-center space-x-1 bg-slate-800 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50 hover:bg-slate-700"
                >
                  <Send size={14} />
                  <span>Add Note</span>
                </button>
                <button
                  onClick={() => { setIsAddingNote(false); setNewNote(''); }}
                  className="px-3 py-1.5 bg-slate-100 rounded text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isAddingAction ? (
            <div className="space-y-2">
              <input
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                placeholder="Action item... (e.g., 'Send follow-up deck')"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddAction() }}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddAction}
                  disabled={!newAction.trim()}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50 hover:bg-blue-700"
                >
                  <ListTodo size={14} />
                  <span>Add Action</span>
                </button>
                <button
                  onClick={() => { setIsAddingAction(false); setNewAction(''); }}
                  className="px-3 py-1.5 bg-slate-100 rounded text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingNote(true)}
                className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 transition-colors flex-1 p-2 hover:bg-white rounded-lg"
              >
                <MessageCircle size={16} />
                <span>Add a quick note...</span>
              </button>
              {onAddAction && (
                <button
                  onClick={() => setIsAddingAction(true)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-white rounded-lg"
                >
                  <ListTodo size={16} />
                  <span>Add action</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTimeline.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {timeline.length === 0 ? (
                <>
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs">Start by adding a note above</p>
                </>
              ) : (
                <>
                  <Filter size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No {activeFilter} activities</p>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="text-xs text-slate-500 hover:text-slate-700 underline mt-1"
                  >
                    Show all activities
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {filteredTimeline.map((item, index) => {
                  const config = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.note
                  const Icon = config.icon

                  return (
                    <div key={item.id} className="relative flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`relative z-10 p-1.5 rounded-full ${config.color}`}>
                        <Icon size={14} />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 min-w-0 bg-white rounded-lg border p-2.5 ${config.borderColor}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700">
                            {getActivityLabel(item)}
                          </span>
                          <span className="text-xs text-slate-400" title={formatDate(item.timestamp)}>
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 break-words">
                          {item.description}
                        </p>

                        {/* Extra info for specific types */}
                        {item.type === 'email' && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {item.replied && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <CheckCircle size={12} />
                                <span>Replied</span>
                              </div>
                            )}
                            {item.opened && (
                              <div className="flex items-center space-x-1 text-blue-500">
                                <MailOpen size={12} />
                                <span>Opened</span>
                              </div>
                            )}
                            {item.clicked && (
                              <div className="flex items-center space-x-1 text-purple-500">
                                <MousePointerClick size={12} />
                                <span>Clicked</span>
                              </div>
                            )}
                          </div>
                        )}

                        {item.type === 'meeting' && item.followUp && (
                          <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                            Follow-up: {item.followUp}
                          </div>
                        )}

                        {item.type === 'meeting' && item.attendees && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                            <Users size={12} />
                            <span>{item.attendees}</span>
                          </div>
                        )}

                        {item.type === 'stage_change' && item.oldValue && item.newValue && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{item.oldValue}</span>
                            <ArrowRightLeft size={12} className="text-slate-400" />
                            <span className="px-2 py-0.5 bg-orange-100 rounded text-orange-700 font-medium">{item.newValue}</span>
                          </div>
                        )}

                        {item.type === 'reference' && item.status && (
                          <div className={`mt-2 text-xs px-2 py-1 rounded inline-block ${
                            item.status === 'completed' ? 'bg-green-50 text-green-700' :
                            item.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {item.status}
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
        <div className="p-3 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {activeFilter === 'all'
              ? `${timeline.length} ${timeline.length === 1 ? 'activity' : 'activities'}`
              : `${filteredTimeline.length} of ${timeline.length} activities`
            }
          </span>
          {timeline.length > 0 && (
            <span className="text-xs text-slate-400">
              First activity: {formatDate(timeline[timeline.length - 1]?.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Export utility function for use elsewhere
export { getEngagementLevel, formatRelativeTime }
