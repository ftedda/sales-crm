import React, { useState, useEffect, useRef } from 'react'
import { Users, Mail, Calendar, FileText, DollarSign, BarChart3, LogOut, HeartHandshake, PieChart, TrendingUp, ListTodo, FolderLock, ChevronDown, MoreHorizontal } from 'lucide-react'
import { onAuthStateChange, signOut, supabase, getUserOrg } from './lib/supabase'
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
import Actions from './components/Actions'
import DataRoomAccess from './components/DataRoomAccess'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = no user
  const [orgId, setOrgId] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showOtherMenu, setShowOtherMenu] = useState(false)
  const otherMenuRef = useRef(null)

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
    addMaterial,
    updateMaterial,
    deleteMaterial,
    reorderMaterials,
    addTermSheet,
    updateTermSheet,
    deleteTermSheet,
    addWeeklyAction,
    updateWeeklyAction,
    deleteWeeklyAction,
    addReference,
    updateReference,
    deleteReference,
    addDataRoomEntry,
    updateDataRoomEntry,
    deleteDataRoomEntry,
    addShareholder,
    updateShareholder,
    deleteShareholder,
    updateOptionPool,
    saveOptionPool,
    addQuickNote,
    getInvestorTimeline,
    getLastTouched,
    exportToCSV
  } = useData(user?.id, orgId)

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

  // Resolve org membership after user is authenticated
  useEffect(() => {
    if (user?.id) {
      getUserOrg(user.id).then(resolvedOrgId => {
        setOrgId(resolvedOrgId)
      })
    } else {
      setOrgId(null)
    }
  }, [user])

  // Close "Others" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (otherMenuRef.current && !otherMenuRef.current.contains(e.target)) {
        setShowOtherMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
    } catch (e) {
      console.error('Sign out error:', e)
    }
  }

  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'actions', label: 'Actions', icon: ListTodo },
    { id: 'pipeline', label: 'Pipeline', icon: Users },
    { id: 'dataroom', label: 'Data Room', icon: FolderLock },
  ]

  const otherTabs = [
    { id: 'emails', label: 'Emails', icon: Mail },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'references', label: 'References', icon: HeartHandshake },
    { id: 'termsheets', label: 'Term Sheets', icon: DollarSign },
    { id: 'captable', label: 'Cap Table', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const isOtherTabActive = otherTabs.some(t => t.id === activeTab)
  const activeOtherTab = otherTabs.find(t => t.id === activeTab)

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
        <div className="flex">
          {primaryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowOtherMenu(false) }}
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
          {/* Others dropdown */}
          <div className="relative" ref={otherMenuRef}>
            <button
              onClick={() => setShowOtherMenu(prev => !prev)}
              className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                isOtherTabActive
                  ? 'border-slate-800 text-slate-800 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {isOtherTabActive ? (
                <>
                  <activeOtherTab.icon size={14} />
                  <span>{activeOtherTab.label}</span>
                </>
              ) : (
                <>
                  <MoreHorizontal size={14} />
                  <span>Others</span>
                </>
              )}
              <ChevronDown size={12} className={`transition-transform ${showOtherMenu ? 'rotate-180' : ''}`} />
            </button>
            {showOtherMenu && (
              <div className="absolute top-full left-0 mt-0.5 bg-white border rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                {otherTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setShowOtherMenu(false) }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-xs transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-100 text-slate-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
        {activeTab === 'pipeline' && (
          <Pipeline
            data={data}
            addInvestor={addInvestor}
            updateInvestor={updateInvestor}
            deleteInvestor={deleteInvestor}
            addQuickNote={addQuickNote}
            addWeeklyAction={addWeeklyAction}
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
            addMaterial={addMaterial}
            updateMaterial={updateMaterial}
            deleteMaterial={deleteMaterial}
            reorderMaterials={reorderMaterials}
          />
        )}
        {activeTab === 'dataroom' && (
          <DataRoomAccess
            data={data}
            addDataRoomEntry={addDataRoomEntry}
            updateDataRoomEntry={updateDataRoomEntry}
            deleteDataRoomEntry={deleteDataRoomEntry}
          />
        )}
        {activeTab === 'termsheets' && (
          <TermSheets
            data={data}
            addTermSheet={addTermSheet}
            updateTermSheet={updateTermSheet}
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
          <CapTable
            data={data}
            addShareholder={addShareholder}
            updateShareholder={updateShareholder}
            deleteShareholder={deleteShareholder}
            updateOptionPool={updateOptionPool}
            saveOptionPool={saveOptionPool}
          />
        )}
        {activeTab === 'analytics' && (
          <FunnelAnalytics data={data} />
        )}
      </div>
    </div>
  )
}
