import React, { useState, useEffect } from 'react'
import { Users, Mail, Calendar, FileText, DollarSign, BarChart3, LogOut, Handshake, PieChart, TrendingUp } from 'lucide-react'
import { onAuthStateChange, signOut, supabase } from './lib/supabase'
import { useData } from './hooks/useData'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Pipeline from './components/Pipeline'
import Emails from './components/Emails'
import Meetings from './components/Meetings'
import Materials from './components/Materials'
import TermSheets from './components/TermSheets'
import ReferenceCoordination from './components/ReferenceCoordination'
import CapTable from './components/CapTable'
import FunnelAnalytics from './components/FunnelAnalytics'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = no user
  const [activeTab, setActiveTab] = useState('dashboard')

  const {
    data,
    loading,
    error,
    addInvestor,
    updateInvestor,
    deleteInvestor,
    addEmail,
    updateEmail,
    deleteEmail,
    addMeeting,
    updateMeeting,
    deleteMeeting,
    updateMaterial,
    addTermSheet,
    updateTermSheet,
    deleteTermSheet,
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    addReference,
    updateReference,
    deleteReference,
    addQuickNote,
    getInvestorTimeline,
    getLastTouched,
    exportToCSV
  } = useData(user?.id)

  useEffect(() => {
    // Check for existing session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    } else {
      // No Supabase configured, allow local-only usage
      setUser(null)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  // Show loading while checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  // Show auth if Supabase is configured and no user
  if (supabase && user === null) {
    return <Auth onAuth={setUser} />
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pipeline', label: 'Pipeline', icon: Users },
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'termsheets', label: 'Term Sheets', icon: DollarSign },
    { id: 'references', label: 'References', icon: Handshake },
    { id: 'captable', label: 'Cap Table', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

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
            <h1 className="text-xl font-bold">Series B Command Center</h1>
            <p className="text-slate-300 text-xs">January – July Fundraise Tracker</p>
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
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            addWeeklyAction={addWeeklyAction}
            updateWeeklyAction={updateWeeklyAction}
            deleteWeeklyAction={deleteWeeklyAction}
            exportToCSV={exportToCSV}
          />
        )}
        {activeTab === 'pipeline' && (
          <Pipeline
            data={data}
            addInvestor={addInvestor}
            updateInvestor={updateInvestor}
            deleteInvestor={deleteInvestor}
            addQuickNote={addQuickNote}
            getInvestorTimeline={getInvestorTimeline}
            getLastTouched={getLastTouched}
          />
        )}
        {activeTab === 'emails' && (
          <Emails
            data={data}
            addEmail={addEmail}
            updateEmail={updateEmail}
            deleteEmail={deleteEmail}
          />
        )}
        {activeTab === 'meetings' && (
          <Meetings
            data={data}
            addMeeting={addMeeting}
            updateMeeting={updateMeeting}
            deleteMeeting={deleteMeeting}
          />
        )}
        {activeTab === 'materials' && (
          <Materials
            data={data}
            updateMaterial={updateMaterial}
          />
        )}
        {activeTab === 'termsheets' && (
          <TermSheets
            data={data}
            addTermSheet={addTermSheet}
            deleteTermSheet={deleteTermSheet}
          />
        )}
        {activeTab === 'references' && (
          <ReferenceCoordination
            data={data}
            addReference={addReference}
            updateReference={updateReference}
            deleteReference={deleteReference}
          />
        )}
        {activeTab === 'captable' && (
          <CapTable data={data} />
        )}
        {activeTab === 'analytics' && (
          <FunnelAnalytics data={data} />
        )}
      </div>
    </div>
  )
}
