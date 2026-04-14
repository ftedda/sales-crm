import React, { useState, useEffect } from 'react'
import { Users, BarChart3, LogOut, ListTodo } from 'lucide-react'
import { onAuthStateChange, signOut, supabase, getUserOrg } from './lib/supabase'
import { useData } from './hooks/useData'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Pipeline from './components/Pipeline'
import Actions from './components/Actions'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = no user
  const [orgId, setOrgId] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  const {
    data,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    addQuickNote,
    getContactTimeline,
    getLastTouched,
    exportToCSV
  } = useData(user?.id, orgId)

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    } else {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (user?.id) {
      getUserOrg(user.id).then(resolvedOrgId => {
        setOrgId(resolvedOrgId)
      })
    } else {
      setOrgId(null)
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pipeline', label: 'Pipeline', icon: Users },
    { id: 'actions', label: 'Actions', icon: ListTodo },
  ]

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (supabase && user === null) {
    return <Auth onAuth={setUser} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Sales CRM</h1>
            <p className="text-slate-300 text-xs">Contact & Deal Management</p>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 text-slate-300 hover:text-white text-sm"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-800 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            exportToCSV={exportToCSV}
            onNavigateToActions={() => setActiveTab('actions')}
            onNavigateToPipeline={() => setActiveTab('pipeline')}
          />
        )}
        {activeTab === 'pipeline' && (
          <Pipeline
            data={data}
            addContact={addContact}
            updateContact={updateContact}
            deleteContact={deleteContact}
            addQuickNote={addQuickNote}
            addWeeklyAction={addWeeklyAction}
            updateWeeklyAction={updateWeeklyAction}
            getContactTimeline={getContactTimeline}
            getLastTouched={getLastTouched}
          />
        )}
        {activeTab === 'actions' && (
          <Actions
            data={data}
            addWeeklyAction={addWeeklyAction}
            updateWeeklyAction={updateWeeklyAction}
            deleteWeeklyAction={deleteWeeklyAction}
          />
        )}
      </div>
    </div>
  )
}
