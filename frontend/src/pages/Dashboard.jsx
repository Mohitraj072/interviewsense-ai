import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain, BarChart3, Clock, Trophy, TrendingUp, Flame,
  Play, FileText, LogOut, ChevronRight, Target,
  Plus, Calendar, Upload, Sparkles, Loader2, ArrowRight,
  Bell
} from 'lucide-react'
import axios from 'axios'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import ProfileSetup from '../components/ProfileSetup'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

function StatCard({ icon: Icon, label, value, sub, color = '#6366F1', trend }) {
  return (
    <motion.div variants={fadeUp} className="feature-card group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-text-primary mb-0.5">{value}</p>
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// ─── Streak Calendar (last 28 days) ───────────────────────────────────────────
function StreakCalendar({ interviewDates = [] }) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (27 - i))
    return d.toDateString()
  })

  const dateSet = new Set(interviewDates.map((d) => new Date(d).toDateString()))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-text-primary">Activity — Last 28 days</p>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span>None</span>
          <div className="w-3 h-3 rounded-sm bg-brand-indigo" />
          <span>Active</span>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(14, 1fr)' }}>
        {days.map((day, i) => {
          const active = dateSet.has(day)
          return (
            <div
              key={i}
              title={day}
              className="aspect-square rounded-sm transition-all duration-200"
              style={{
                background: active
                  ? `rgba(99,102,241,${0.4 + Math.random() * 0.6})`
                  : 'rgba(255,255,255,0.05)',
                border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.04)',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : score >= 40 ? '#F59E0B' : '#EF4444'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Work'
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color, background: `${color}15` }}>
      {score}% · {label}
    </span>
  )
}

// ─── New Interview Modal with Resume Upload Support ─────────────────────────
const DOMAINS = ['DSA', 'Web Dev', 'System Design', 'OS', 'DBMS', 'Networking', 'HR', 'Behavioral']
const TYPES = ['Technical', 'HR', 'Mixed']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function NewInterviewModal({ onClose, onStart, initialRole = 'Software Engineer' }) {
  const [activeTab, setActiveTab] = useState('standard') // 'standard' | 'resume'
  const [config, setConfig] = useState({ type: 'Technical', difficulty: 'Medium', domain: 'DSA' })
  
  // Resume mode states
  const [resumeFile, setResumeFile] = useState(null)
  const [targetRole, setTargetRole] = useState(initialRole)
  const [resumeDifficulty, setResumeDifficulty] = useState('Medium')
  const [analyzingResume, setAnalyzingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')

  const handleResumeFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFile(file)
      setResumeError('')
    }
  }

  const handleStartResumeInterview = async () => {
    setAnalyzingResume(true)
    setResumeError('')

    try {
      let questions = []
      if (resumeFile) {
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('targetRole', targetRole)
        formData.append('difficulty', resumeDifficulty)

        const res = await axios.post(`${API_BASE}/api/interview/resume`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        questions = res.data?.questions || []
      } else {
        const res = await axios.post(`${API_BASE}/api/interview/resume`, {
          targetRole,
          difficulty: resumeDifficulty,
          resumeText: `Candidate profile targeting ${targetRole} position.`,
        })
        questions = res.data?.questions || []
      }

      onStart({
        type: 'Technical',
        difficulty: resumeDifficulty,
        domain: `Resume · ${targetRole}`,
        isResumeBased: true,
        customQuestions: questions,
      })
    } catch (err) {
      console.warn('Resume API fallback:', err)
      // Fallback personalized questions
      onStart({
        type: 'Technical',
        difficulty: resumeDifficulty,
        domain: `Resume · ${targetRole}`,
        isResumeBased: true,
        customQuestions: [
          { question: `Walk me through your most complex project relevant to ${targetRole}. What technical trade-offs did you make?` },
          { question: `Describe a difficult bug or production outage you investigated. What was the root cause?` },
          { question: `How do you approach system reliability and API security when architecting features?` },
          { question: `Tell me about a time you had to balance clean code architecture with rapid business delivery.` },
          { question: `What questions do you have about engineering culture and development practices?` },
        ],
      })
    } finally {
      setAnalyzingResume(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md p-7 relative"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-text-primary">New Interview Session</h2>
            <p className="text-text-secondary text-xs">Choose practice mode & configure session.</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher: Standard vs Resume */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'standard'
                ? 'bg-brand-indigo text-white shadow-lg'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Topic & Domain
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'resume'
                ? 'bg-brand-indigo text-white shadow-lg'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Resume Upload
          </button>
        </div>

        {activeTab === 'standard' ? (
          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Interview Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setConfig((c) => ({ ...c, type: t }))}
                    className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      border: `1px solid ${config.type === t ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                      background: config.type === t ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      color: config.type === t ? '#6366F1' : '#94A3B8',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Domain */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Domain</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DOMAINS.map((d) => (
                  <button key={d} onClick={() => setConfig((c) => ({ ...c, domain: d }))}
                    className="py-2 rounded-xl text-[11px] font-semibold transition-all"
                    style={{
                      border: `1px solid ${config.domain === d ? '#6366F1' : 'rgba(255,255,255,0.08)'}`,
                      background: config.domain === d ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                      color: config.domain === d ? '#6366F1' : '#94A3B8',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((dif) => {
                  const colors = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' }
                  const active = config.difficulty === dif
                  return (
                    <button key={dif} onClick={() => setConfig((c) => ({ ...c, difficulty: dif }))}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        border: `1px solid ${active ? colors[dif] : 'rgba(255,255,255,0.08)'}`,
                        background: active ? `${colors[dif]}15` : 'rgba(255,255,255,0.03)',
                        color: active ? colors[dif] : '#94A3B8',
                      }}>
                      {dif}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-xs">Cancel</button>
              <button id="btn-start-interview" onClick={() => onStart(config)} className="btn-primary flex-1 justify-center py-2.5 text-xs">
                <Play className="w-3.5 h-3.5" /> Start Interview
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resume Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Upload Resume (PDF / TXT)</label>
              <label
                className="border-2 border-dashed border-surface-border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-brand-indigo transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <Upload className="w-6 h-6 text-brand-indigo mb-2" />
                <span className="text-xs font-medium text-text-primary">
                  {resumeFile ? resumeFile.name : 'Click to select or drop resume PDF'}
                </span>
                <span className="text-[10px] text-text-muted mt-1">
                  Gemini extracts your projects, tools & target skills
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleResumeFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Target Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Full Stack Dev"
                className="input-field text-xs py-2 w-full"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((dif) => {
                  const colors = { Easy: '#10B981', Medium: '#F59E0B', Hard: '#EF4444' }
                  const active = resumeDifficulty === dif
                  return (
                    <button key={dif} onClick={() => setResumeDifficulty(dif)}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        border: `1px solid ${active ? colors[dif] : 'rgba(255,255,255,0.08)'}`,
                        background: active ? `${colors[dif]}15` : 'rgba(255,255,255,0.03)',
                        color: active ? colors[dif] : '#94A3B8',
                      }}>
                      {dif}
                    </button>
                  )
                })}
              </div>
            </div>

            {resumeError && (
              <p className="text-xs text-red-400">{resumeError}</p>
            )}

            <div className="flex gap-3 pt-3">
              <button onClick={onClose} disabled={analyzingResume} className="btn-secondary flex-1 justify-center py-2.5 text-xs">
                Cancel
              </button>
              <button
                id="btn-start-resume-interview"
                onClick={handleStartResumeInterview}
                disabled={analyzingResume}
                className="btn-primary flex-1 justify-center py-2.5 text-xs"
              >
                {analyzingResume ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing Resume…</>
                ) : (
                  <><Sparkles className="w-3.5 h-3.5" /> Start Tailored Session</>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile, logout } = useAuth()

  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showNewInterview, setShowNewInterview] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Show profile setup if incomplete
  useEffect(() => {
    if (profile && !profile.profileComplete) setShowProfileSetup(true)
  }, [profile])

  // Fetch interview history from reports collection
  useEffect(() => {
    if (!user) {
      setHistory([])
      setLoadingHistory(false)
      return
    }

    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'reports'),
          where('userId', '==', user.uid)
        )
        const snap = await getDocs(q)
        let reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        // Also check legacy interviews collection if reports is empty
        if (reports.length === 0) {
          try {
            const legacyQ = query(
              collection(db, 'interviews'),
              where('userId', '==', user.uid)
            )
            const legacySnap = await getDocs(legacyQ)
            reports = legacySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          } catch {}
        }

        // Sort descending by createdAt in memory
        reports.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0)
          const tB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0)
          return tB - tA
        })

        setHistory(reports)
      } catch (err) {
        console.warn('Error fetching reports from Firestore:', err)
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchHistory()
  }, [user])

  const handleLogout = async () => { await logout(); navigate('/') }

  const handleStartInterview = (config) => {
    navigate('/interview', { state: config })
    setShowNewInterview(false)
  }

  // Calculate consecutive days streak from reports
  const calculateStreak = (reportsList) => {
    if (!reportsList || reportsList.length === 0) return 0
    const dates = new Set()
    reportsList.forEach((r) => {
      let d = null
      if (r.createdAt?.toDate) {
        d = r.createdAt.toDate()
      } else if (r.createdAt?.seconds) {
        d = new Date(r.createdAt.seconds * 1000)
      } else if (typeof r.createdAt === 'string') {
        d = new Date(r.createdAt)
      }
      if (d && !isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        dates.add(key)
      }
    })

    if (dates.size === 0) return 0

    const now = new Date()
    const formatKey = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const todayKey = formatKey(now)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = formatKey(yesterday)

    let cursor = null
    if (dates.has(todayKey)) {
      cursor = new Date(now)
    } else if (dates.has(yesterdayKey)) {
      cursor = new Date(yesterday)
    } else {
      return 1 // At least 1 if candidate completed interviews
    }

    let streak = 0
    while (cursor && dates.has(formatKey(cursor))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return Math.max(streak, 1)
  }

  // Real stats computed from Firestore reports
  const scoresList = history
    .map((h) => h.totalScore ?? h.score)
    .filter((s) => typeof s === 'number')
  const avgScore = scoresList.length ? Math.round(scoresList.reduce((a, b) => a + b, 0) / scoresList.length) : null
  const bestScore = scoresList.length ? Math.max(...scoresList) : null
  const totalSessionsCount = history.length
  const currentStreak = calculateStreak(history)

  const stats = [
    { icon: BarChart3, label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', color: '#6366F1' },
    { icon: Trophy, label: 'Best Score', value: bestScore !== null ? `${bestScore}%` : '—', color: '#F59E0B' },
    { icon: Flame, label: 'Day Streak', value: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`, sub: currentStreak > 0 ? 'Active streak!' : 'Practice today!', color: '#EF4444' },
    { icon: Clock, label: 'Total Interviews', value: totalSessionsCount, sub: 'Sessions completed', color: '#10B981' },
  ]

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'there'
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <ProfileSetup onComplete={() => setShowProfileSetup(false)} />
      )}

      {/* New Interview Modal */}
      {showNewInterview && (
        <NewInterviewModal
          onClose={() => setShowNewInterview(false)}
          onStart={handleStartInterview}
        />
      )}

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-60 flex flex-col border-r border-surface-border bg-bg-secondary z-40 hidden lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-surface-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary">
            InterviewSense<span className="gradient-text-brand"> AI</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {[
            { icon: BarChart3, label: 'Dashboard', active: true },
            { icon: Play, label: 'New Interview', action: () => setShowNewInterview(true) },
            { icon: FileText, label: 'My Reports', href: '#' },
            { icon: TrendingUp, label: 'Progress', href: '#' },
            { icon: Target, label: 'Practice', href: '#' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="p-3 border-t border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-all cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
              <p className="text-xs text-text-muted truncate">{profile?.targetRole || 'Set your role'}</p>
            </div>
            <button onClick={handleLogout} title="Sign out"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-60 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-surface-border"
          style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)' }}>
          <div>
            <h1 className="text-base font-bold text-text-primary">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text-brand">{displayName.split(' ')[0]} 👋</span>
            </h1>
            <p className="text-xs text-text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <Bell className="w-4 h-4" />
            </button>
            <button
              id="btn-new-interview-header"
              onClick={() => setShowNewInterview(true)}
              className="btn-primary py-2 px-4 text-sm"
            >
              <Plus className="w-4 h-4" /> New Interview
            </button>
          </div>
        </header>

        <div className="p-6 max-w-6xl mx-auto">
          {/* Streak banner */}
          {(profile?.streak ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl mb-6"
              style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-3xl">🔥</div>
              <div>
                <p className="text-text-primary font-bold text-sm">{profile.streak}-day streak! Keep it going!</p>
                <p className="text-text-muted text-xs">Practice today to maintain your streak.</p>
              </div>
              <button onClick={() => setShowNewInterview(true)} className="btn-primary ml-auto py-2 px-4 text-sm">
                Practice Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {/* Stat cards */}
          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </motion.div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Interview history */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text-primary">Recent Interviews</h2>
                <button className="text-xs text-brand-indigo hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12 glass-card">
                    <div className="w-8 h-8 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  // Empty state
                  <div className="glass-card flex flex-col items-center justify-center py-14 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-text-primary font-bold text-lg mb-1">Start your first interview</p>
                    <p className="text-text-secondary text-sm mb-6 max-w-sm">
                      Practice real technical, HR, and resume-based questions with real-time AI speech transcription and detailed reports.
                    </p>
                    <button
                      id="btn-start-first"
                      onClick={() => setShowNewInterview(true)}
                      className="btn-primary py-3 px-6 text-sm font-bold shadow-lg shadow-indigo-500/25"
                    >
                      Start Your First Interview <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {history.map((item) => {
                      const rawScore = item.totalScore ?? item.score ?? 70
                      const score = typeof rawScore === 'number' ? rawScore : 70

                      // Overall score color: green >70, yellow 50-70, red <50
                      const isGreen = score > 70
                      const isYellow = score >= 50 && score <= 70
                      const scoreColor = isGreen ? '#10B981' : isYellow ? '#F59E0B' : '#EF4444'
                      const scoreBg = isGreen ? 'rgba(16, 185, 129, 0.1)' : isYellow ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                      const scoreBorder = isGreen ? 'rgba(16, 185, 129, 0.3)' : isYellow ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'

                      const verdictLabel = item.verdict || (isGreen ? 'Strong' : isYellow ? 'Average' : 'Needs Work')

                      // Format interview date
                      let dateStr = 'Recent'
                      if (item.createdAt?.toDate) {
                        dateStr = item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      } else if (item.createdAt?.seconds) {
                        dateStr = new Date(item.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      } else if (typeof item.createdAt === 'string') {
                        dateStr = item.createdAt
                      }

                      const diff = item.difficulty || 'Medium'
                      const diffColor = diff === 'Hard' ? '#EF4444' : diff === 'Easy' ? '#10B981' : '#F59E0B'

                      return (
                        <div
                          key={item.id}
                          className="p-4 sm:p-5 rounded-2xl transition-all duration-200 hover:border-brand-indigo/40"
                          style={{
                            background: 'rgba(17, 17, 24, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3.5">
                              {/* Score box */}
                              <div
                                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                                style={{
                                  background: scoreBg,
                                  border: `1.5px solid ${scoreBorder}`,
                                  color: scoreColor,
                                }}
                              >
                                <span className="text-lg font-black leading-none">{score}</span>
                                <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5">/100</span>
                              </div>

                              {/* Details */}
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  {/* Domain badge */}
                                  <span
                                    className="text-xs font-bold px-2.5 py-0.5 rounded-lg text-[#818CF8]"
                                    style={{
                                      background: 'rgba(99, 102, 241, 0.15)',
                                      border: '1px solid rgba(99, 102, 241, 0.3)',
                                    }}
                                  >
                                    {item.domain || 'Technical'}
                                  </span>

                                  {/* Difficulty badge */}
                                  <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                                    style={{
                                      color: diffColor,
                                      background: `${diffColor}15`,
                                      border: `1px solid ${diffColor}30`,
                                    }}
                                  >
                                    {diff}
                                  </span>

                                  {/* Verdict label */}
                                  <span
                                    className="text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider"
                                    style={{
                                      color: scoreColor,
                                      background: scoreBg,
                                      border: `1px solid ${scoreBorder}`,
                                    }}
                                  >
                                    {verdictLabel}
                                  </span>
                                </div>

                                {/* Subtitle with date and question count */}
                                <div className="flex items-center gap-3 text-xs text-text-muted">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    {dateStr}
                                  </span>
                                  <span>•</span>
                                  <span>{item.type || 'Interview'}</span>
                                  <span>•</span>
                                  <span>{item.questions?.length || item.totalQuestions || 5} questions</span>
                                </div>
                              </div>
                            </div>

                            {/* View Report Button */}
                            <div className="flex items-center justify-end sm:justify-center">
                              <Link
                                to={`/report/${item.id}`}
                                className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 font-bold shadow-md hover:shadow-indigo-500/20"
                              >
                                <span>View Report</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-5">
              {/* Profile card */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-lg">
                    {initials}
                  </div>
                  <div>
                    <p className="text-text-primary font-bold text-sm">{displayName}</p>
                    <p className="text-text-muted text-xs">{profile?.targetRole || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Profile complete</span>
                  <span className="text-brand-indigo font-semibold">{profile?.profileComplete ? '100%' : '60%'}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: profile?.profileComplete ? '100%' : '60%' }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full bg-brand-gradient"
                  />
                </div>
                {!profile?.profileComplete && (
                  <button onClick={() => setShowProfileSetup(true)}
                    className="mt-3 text-xs text-brand-indigo hover:underline flex items-center gap-1">
                    Complete profile <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Activity calendar */}
              <div className="glass-card p-5">
                <StreakCalendar interviewDates={history.map((h) => h.createdAt?.toDate?.())} />
              </div>

              {/* Quick start cards */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-widest">Quick Practice</p>
                <div className="space-y-2">
                  {[
                    { label: 'DSA · Medium', domain: 'DSA', difficulty: 'Medium', type: 'Technical', icon: '🧮' },
                    { label: 'System Design · Hard', domain: 'System Design', difficulty: 'Hard', type: 'Technical', icon: '🏗️' },
                    { label: 'HR Behavioral', domain: 'HR', difficulty: 'Medium', type: 'HR', icon: '🤝' },
                  ].map((q) => (
                    <button
                      key={q.label}
                      onClick={() => { navigate('/interview', { state: q }) }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-surface-hover"
                      style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <span className="text-base">{q.icon}</span>
                      <span className="text-sm text-text-secondary flex-1">{q.label}</span>
                      <Play className="w-3.5 h-3.5 text-brand-indigo flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
