import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Code2,
  Globe,
  Cpu,
  Database,
  Layers,
  Boxes,
  Mic,
  MicOff,
  ArrowRight,
  SkipForward,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Edit3,
  Check,
  X,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ── Domains list ──────────────────────────────────────────────────────────────
const DOMAINS = [
  {
    id: 'DSA',
    name: 'DSA',
    title: 'Data Structures & Algorithms',
    desc: 'Arrays, Trees, Graphs, DP, Recursion',
    icon: Code2,
    gradient: 'from-[#6366F1] to-[#8B5CF6]',
  },
  {
    id: 'Web Dev',
    name: 'Web Dev',
    title: 'Web Development',
    desc: 'React, Node.js, DOM, APIs, Async JS',
    icon: Globe,
    gradient: 'from-[#3B82F6] to-[#06B6D4]',
  },
  {
    id: 'OS',
    name: 'OS',
    title: 'Operating Systems',
    desc: 'Processes, Threads, Memory, Paging, Locks',
    icon: Cpu,
    gradient: 'from-[#10B981] to-[#059669]',
  },
  {
    id: 'DBMS',
    name: 'DBMS',
    title: 'Database Management',
    desc: 'SQL, ACID, Indexes, Normalization, Sharding',
    icon: Database,
    gradient: 'from-[#F59E0B] to-[#D97706]',
  },
  {
    id: 'System Design',
    name: 'System Design',
    title: 'System Design',
    desc: 'Scalability, Load Balancers, Caching, Microservices',
    icon: Layers,
    gradient: 'from-[#8B5CF6] to-[#EC4899]',
  },
  {
    id: 'OOPs',
    name: 'OOPs',
    title: 'OOPs & Architecture',
    desc: 'SOLID, Polymorphism, Abstraction, Design Patterns',
    icon: Boxes,
    gradient: 'from-[#EC4899] to-[#F43F5E]',
  },
]

// ── Filler words list ──────────────────────────────────────────────────────────
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'right', 'sort of']
const countFillers = (text = '') => {
  const lower = text.toLowerCase()
  return FILLER_WORDS.reduce((acc, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    return acc + (lower.match(regex) || []).length
  }, 0)
}

// ── Web Speech Recognition Hook ───────────────────────────────────────────────
function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const activeListeningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let currentInterim = ''
      let currentFinal = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i]
        if (item.isFinal) {
          currentFinal += item[0].transcript + ' '
        } else {
          currentInterim += item[0].transcript
        }
      }

      if (currentFinal) {
        setTranscript((prev) => (prev ? `${prev.trim()} ${currentFinal.trim()}` : currentFinal.trim()))
      }
      setInterimTranscript(currentInterim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(event.error)
      }
    }

    recognition.onend = () => {
      // Auto-restart if user still intended to be listening
      if (activeListeningRef.current) {
        try {
          recognition.start()
        } catch {
          setIsListening(false)
          activeListeningRef.current = false
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      activeListeningRef.current = false
      try {
        recognition.stop()
      } catch {}
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    activeListeningRef.current = true
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // If already started, ignore error
      setIsListening(true)
    }
  }, [])

  const stopListening = useCallback(() => {
    activeListeningRef.current = false
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {}
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const resetTranscript = useCallback((initial = '') => {
    setTranscript(initial)
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}

// ── Audio Waveform Visualizer Component ───────────────────────────────────────
function AudioWaveform({ isRecording }) {
  const bars = [14, 28, 42, 20, 36, 50, 24, 46, 32, 18, 40, 26, 48, 16]
  return (
    <div className="flex items-center justify-center gap-1.5 h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          style={{ background: isRecording ? '#6366F1' : 'rgba(255,255,255,0.12)' }}
          animate={
            isRecording
              ? {
                  height: [8, height, 10, height * 0.7, 8],
                  opacity: [0.6, 1, 0.7, 1, 0.6],
                }
              : { height: 6, opacity: 0.25 }
          }
          transition={
            isRecording
              ? {
                  repeat: Infinity,
                  duration: 0.9 + (i % 4) * 0.2,
                  ease: 'easeInOut',
                  delay: (i % 5) * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  )
}

// ── Main Interview Component ──────────────────────────────────────────────────
export default function Interview() {
  const navigate = useNavigate()
  const location = useLocation()
  const incomingState = location.state
  const { user } = useAuth()

  // Setup state
  const [stage, setStage] = useState('setup') // 'setup' | 'interview'
  const [interviewType, setInterviewType] = useState('Technical') // 'Technical' | 'HR' | 'Mixed' | 'Resume-Based'
  const [selectedDomain, setSelectedDomain] = useState('DSA')
  const [difficulty, setDifficulty] = useState('Medium') // 'Easy' | 'Medium' | 'Hard'
  const [questionCount, setQuestionCount] = useState(5) // 5 | 8 | 10
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [setupError, setSetupError] = useState('')

  // Resume-based states
  const [resumeFile, setResumeFile] = useState(null)
  const [isResumeActive, setIsResumeActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // Support pre-configured state from Dashboard navigation
  useEffect(() => {
    if (incomingState) {
      if (incomingState.customQuestions && incomingState.customQuestions.length > 0) {
        const qList = incomingState.customQuestions.map((q) =>
          typeof q === 'string' ? q : q.question || JSON.stringify(q)
        )
        setQuestions(qList)
        setIsResumeActive(Boolean(incomingState.isResumeBased || incomingState.type === 'Resume-Based'))
        setInterviewType(incomingState.type || 'Technical')
        setSelectedDomain(incomingState.domain || 'DSA')
        setDifficulty(incomingState.difficulty || 'Medium')
        setQuestionCount(qList.length)
        setCurrentIndex(0)
        setAnswers([])
        setTimerSeconds(0)
        setQuestionStartTime(Date.now())
        setStage('interview')
      } else {
        if (incomingState.type) setInterviewType(incomingState.type)
        if (incomingState.domain) setSelectedDomain(incomingState.domain)
        if (incomingState.difficulty) setDifficulty(incomingState.difficulty)
        if (incomingState.isResumeBased) setIsResumeActive(true)
      }
    }
  }, [incomingState])

  const handleResumeFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setSetupError('Please select a valid PDF file only (.pdf).')
        return
      }
      setResumeFile(file)
      setSetupError('')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setSetupError('Please upload a PDF file only (.pdf).')
        return
      }
      setResumeFile(file)
      setSetupError('')
    }
  }

  const handleRemoveResume = (e) => {
    e.stopPropagation()
    setResumeFile(null)
    setSetupError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Live session state
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // Array of { answer, skipped, duration }
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isManualEditing, setIsManualEditing] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  // Speech recognition
  const {
    isListening,
    transcript,
    setTranscript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition()

  // Live elapsed timer
  useEffect(() => {
    let interval = null
    if (stage === 'interview') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [stage])

  // Format timer MM:SS
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start interview handler
  const handleStartInterview = async () => {
    setLoadingQuestions(true)
    setSetupError('')

    // Scenario 1: Resume uploaded -> send PDF to POST /api/resume/extract
    if (resumeFile) {
      try {
        const formData = new FormData()
        formData.append('resume', resumeFile)
        formData.append('domain', selectedDomain)
        formData.append('difficulty', difficulty)
        formData.append('count', questionCount)
        formData.append('type', interviewType)

        const response = await axios.post(`${API_BASE}/api/resume/extract`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        const rawQuestions = Array.isArray(response.data)
          ? response.data
          : response.data?.questions || []

        const cleanList = rawQuestions.map((q) =>
          typeof q === 'string' ? q : q.question || JSON.stringify(q)
        )

        if (cleanList.length > 0) {
          setQuestions(cleanList)
          setIsResumeActive(true)
          setCurrentIndex(0)
          setAnswers([])
          setTimerSeconds(0)
          setQuestionStartTime(Date.now())
          resetTranscript('')
          setStage('interview')
          return
        } else {
          throw new Error('No personalized questions returned from resume extraction.')
        }
      } catch (err) {
        console.error('Resume question generation error:', err)
        setSetupError(
          'Failed to extract resume with AI. Please check your PDF or click "Remove" to continue with standard domain questions.'
        )
      } finally {
        setLoadingQuestions(false)
      }
      return
    }

    // Scenario 2: Normal flow when no resume is uploaded
    setIsResumeActive(false)
    try {
      const response = await axios.post(`${API_BASE}/api/generate-questions`, {
        type: interviewType,
        domain: selectedDomain,
        difficulty,
        count: questionCount,
      })

      const fetchedList = Array.isArray(response.data)
        ? response.data
        : response.data?.questions || []

      const cleanList = fetchedList.map((q) =>
        typeof q === 'string' ? q : q.question || JSON.stringify(q)
      )

      if (cleanList.length > 0) {
        setQuestions(cleanList)
        setIsResumeActive(false)
        setCurrentIndex(0)
        setAnswers([])
        setTimerSeconds(0)
        setQuestionStartTime(Date.now())
        resetTranscript('')
        setStage('interview')
      } else {
        throw new Error('No questions returned from backend.')
      }
    } catch (err) {
      console.warn('Backend question fetch failed, using curated default questions:', err)
      // Fallback questions for smooth client experience
      const defaultQuestions = [
        `Explain the core architecture and fundamental principles of ${selectedDomain}.`,
        `What are the most common performance bottlenecks in ${selectedDomain} and how do you mitigate them?`,
        `Walk me through a real-world scenario where you had to solve a complex ${selectedDomain} challenge.`,
        `What are the critical trade-offs between speed, scalability, and memory consumption in ${selectedDomain}?`,
        `Describe the industry best practices for testing, monitoring, and debugging in ${selectedDomain}.`,
      ].slice(0, questionCount)

      setQuestions(defaultQuestions)
      setIsResumeActive(false)
      setCurrentIndex(0)
      setAnswers([])
      setTimerSeconds(0)
      setQuestionStartTime(Date.now())
      resetTranscript('')
      setStage('interview')
    } finally {
      setLoadingQuestions(false)
    }
  }

  // Toggle microphone
  const toggleRecording = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Complete current question and advance
  const handleAdvance = (skipped = false) => {
    stopListening()

    const finalAnswer = skipped ? '' : transcript.trim()
    const questionDuration = Math.round((Date.now() - questionStartTime) / 1000)

    const updatedAnswers = [
      ...answers,
      {
        questionIndex: currentIndex,
        questionText: questions[currentIndex],
        answer: finalAnswer,
        skipped,
        duration: questionDuration,
      },
    ]

    setAnswers(updatedAnswers)

    // Check if last question
    if (currentIndex + 1 >= questions.length) {
      // All questions completed → Redirect to report
      const allText = updatedAnswers.map((a) => a.answer).join(' ')
      const totalFillers = countFillers(allText)
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

      const qaHistory = updatedAnswers.map((item, idx) => ({
        question: item.questionText,
        answer: item.answer || (item.skipped ? '(Candidate skipped this question)' : ''),
        questionNumber: idx + 1,
        skipped: item.skipped,
        duration: item.duration,
      }))

      navigate('/report', {
        state: {
          qaHistory,
          config: {
            type: isResumeActive ? 'Resume-Based' : interviewType,
            domain: selectedDomain,
            difficulty,
            count: questions.length,
            isResumeBased: isResumeActive,
          },
          fillerCount: totalFillers,
          sessionId,
        },
      })
    } else {
      // Advance to next question
      setCurrentIndex((prev) => prev + 1)
      resetTranscript('')
      setIsManualEditing(false)
      setQuestionStartTime(Date.now())
    }
  }

  // Progress percentage
  const progressPercent = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: SETUP SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (stage === 'setup') {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-[#F8F8FF]" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="max-w-4xl mx-auto">
          {/* Top navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8F8FF] transition-colors py-2 px-3 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold tracking-wide text-[#94A3B8]">
                INTERVIEW ENGINE <span className="text-[#6366F1]">PHASE 3</span>
              </span>
            </div>
          </div>

          {/* Header Title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3"
              style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#A5B4FC' }}>
              <Sparkles className="w-3.5 h-3.5" />
              AI Mock Session Configuration
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#F8F8FF] tracking-tight">
              Configure Your Interview
            </h1>
            <p className="text-sm text-[#94A3B8] mt-2 max-w-xl">
              Choose your domain, interview style, and difficulty. Our Gemini AI will generate tailored questions for your mock session.
            </p>
          </motion.div>

          {setupError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {setupError}
            </div>
          )}

          {/* Options Container */}
          <div className="space-y-8">
            {/* Upload Resume (Optional) Section */}
            <div
              className="p-6 rounded-2xl transition-all duration-200"
              style={{
                background: 'rgba(17, 17, 24, 0.7)',
                border: resumeFile ? '1.5px solid rgba(99, 102, 241, 0.5)' : '1px solid #1E1E2E',
                boxShadow: resumeFile ? '0 0 25px rgba(99, 102, 241, 0.12)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                    Upload Resume (Optional)
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#94A3B8]">
                    PDF Only
                  </span>
                </div>
                {resumeFile ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resume Uploaded
                  </span>
                ) : (
                  <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Generates Questions from Projects & Skills
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeFileChange}
                className="hidden"
              />

              {/* Drag & drop zone OR file uploaded state */}
              {resumeFile ? (
                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-[#F8F8FF] truncate max-w-xs sm:max-w-md">
                        {resumeFile.name}
                      </div>
                      <div className="text-xs text-[#94A3B8] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{(resumeFile.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Ready for PyPDF2 extraction</span>
                        <span>•</span>
                        <span className="text-indigo-300">Questions will be personalized</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveResume}
                      className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01]'
                      : 'border-white/10 hover:border-indigo-500/40 bg-white/[0.01] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 text-[#94A3B8] flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-[#F8F8FF]">
                    Drag & drop your resume PDF here, or <span className="text-indigo-400 underline">click to upload</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1.5 max-w-md">
                    Accepts PDF files only. Gemini AI will analyze your listed projects, technical skills, and work experience to generate personalized interview questions.
                  </p>
                </div>
              )}
            </div>

            {/* 1. Interview Type */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(17, 17, 24, 0.7)', border: '1px solid #1E1E2E' }}
            >
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                1. Select Interview Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Technical', label: 'Technical', desc: 'Code, concepts, architecture & problem solving' },
                  { id: 'HR', label: 'HR & Behavioral', desc: 'STAR situational, leadership & team culture' },
                  { id: 'Mixed', label: 'Mixed Round', desc: 'Comprehensive blend of technical & behavioral' },
                ].map((item) => {
                  const active = interviewType === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInterviewType(item.id)}
                      className="p-4 rounded-xl text-left transition-all duration-200 cursor-pointer relative"
                      style={{
                        background: active ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1.5px solid #6366F1' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: active ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
                      }}
                    >
                      <div className="font-bold text-sm text-[#F8F8FF] flex items-center justify-between">
                        {item.label}
                        {active && <Check className="w-4 h-4 text-[#6366F1]" />}
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-1 leading-snug">{item.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Select Domain / Topic */}
            <div
              className="p-6 rounded-2xl"
              style={{ background: 'rgba(17, 17, 24, 0.7)', border: '1px solid #1E1E2E' }}
            >
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                2. Select Domain / Topic
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DOMAINS.map((domain) => {
                  const Icon = domain.icon
                  const active = selectedDomain === domain.id
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => setSelectedDomain(domain.id)}
                      className="p-4 rounded-xl text-left transition-all duration-200 cursor-pointer relative group"
                      style={{
                        background: active ? 'rgba(99, 102, 241, 0.14)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1.5px solid #6366F1' : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: active ? '0 0 24px rgba(99, 102, 241, 0.22)' : 'none',
                      }}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform duration-200 ${
                          active ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                        style={{
                          background: active
                            ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                            : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#94A3B8]'}`} />
                      </div>
                      <div className="font-bold text-sm text-[#F8F8FF]">{domain.title}</div>
                      <div className="text-[11px] text-[#94A3B8] mt-1 line-clamp-1">{domain.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Difficulty & Question Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Difficulty */}
              <div
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(17, 17, 24, 0.7)', border: '1px solid #1E1E2E' }}
              >
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                  3. Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Easy', label: 'Easy', color: '#10B981', desc: 'Entry / Fresher' },
                    { id: 'Medium', label: 'Medium', color: '#F59E0B', desc: 'Mid-level' },
                    { id: 'Hard', label: 'Hard', color: '#EF4444', desc: 'Senior / Deep' },
                  ].map((lvl) => {
                    const active = difficulty === lvl.id
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDifficulty(lvl.id)}
                        className="py-3 px-2 rounded-xl text-center transition-all duration-200 cursor-pointer"
                        style={{
                          background: active ? `${lvl.color}15` : 'rgba(255,255,255,0.02)',
                          border: active ? `1.5px solid ${lvl.color}` : '1px solid rgba(255,255,255,0.06)',
                          color: active ? lvl.color : '#94A3B8',
                        }}
                      >
                        <div className="font-bold text-xs">{lvl.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{lvl.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Number of Questions */}
              <div
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(17, 17, 24, 0.7)', border: '1px solid #1E1E2E' }}
              >
                <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">
                  4. Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 5, time: '~10 mins' },
                    { count: 8, time: '~18 mins' },
                    { count: 10, time: '~25 mins' },
                  ].map((q) => {
                    const active = questionCount === q.count
                    return (
                      <button
                        key={q.count}
                        type="button"
                        onClick={() => setQuestionCount(q.count)}
                        className="py-3 px-2 rounded-xl text-center transition-all duration-200 cursor-pointer"
                        style={{
                          background: active ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: active ? '1.5px solid #6366F1' : '1px solid rgba(255,255,255,0.06)',
                          color: active ? '#F8F8FF' : '#94A3B8',
                        }}
                      >
                        <div className="font-black text-base">{q.count}</div>
                        <div className="text-[10px] text-[#94A3B8] mt-0.5">{q.time}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                id="btn-start-interview"
                type="button"
                onClick={handleStartInterview}
                disabled={loadingQuestions}
                className="btn-primary w-full justify-center py-4 rounded-xl text-base font-bold transition-all duration-300 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-indigo-500/25"
              >
                {loadingQuestions ? (
                  <div className="flex items-center gap-2.5">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{resumeFile ? 'Analyzing Resume & Generating Questions...' : 'Generating Questions with Gemini AI...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{resumeFile ? 'Start Resume-Based Interview Session' : 'Start Interview Session'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
              <p className="text-center text-xs text-[#94A3B8] mt-3">
                {resumeFile
                  ? 'Gemini AI will personalize questions based on your resume projects, technical skills, and selected domain.'
                  : 'Microphone audio will be transcribed in real time. You can review and edit your response before submitting.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: LIVE INTERVIEW SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex] || 'Loading question...'
  const currentWordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const currentFillerCount = countFillers(transcript)

  return (
    <div className="min-h-screen flex flex-col text-[#F8F8FF]" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Top Fixed Progress Bar */}
      <div className="w-full h-1 bg-white/5 relative">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Top Bar Header */}
      <header
        className="px-4 sm:px-8 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(8px)' }}
      >
        {/* Left: Question counter badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Exit interview"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30">
              Q {currentIndex + 1} / {questions.length}
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold text-[#94A3B8]">
              {selectedDomain} • {difficulty}
            </span>
            {isResumeActive && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Resume-based
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Timer */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#F8F8FF]">
          <Clock className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>{formatTimer(timerSeconds)}</span>
        </div>

        {/* Right: Topic / Mode */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8]">
          {isResumeActive && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
              <FileText className="w-3 h-3" />
              Tailored to Resume
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10">
            {interviewType}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        {/* Question Card */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(17, 17, 24, 0.8)',
            border: '1px solid #1E1E2E',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center justify-between mb-3 text-xs font-semibold">
            {isResumeActive ? (
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Resume-Personalized Question {currentIndex + 1}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-[#6366F1]">
                <Sparkles className="w-3.5 h-3.5" />
                Interview Question {currentIndex + 1}
              </span>
            )}
            <span className="text-[#94A3B8] font-normal">Speak clearly into your microphone</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#F8F8FF] leading-relaxed">
            {currentQuestion}
          </h2>
        </motion.div>

        {/* Center Microphone & Recording Section */}
        <div className="my-8 flex flex-col items-center justify-center">
          {/* Waveform visualizer */}
          <AudioWaveform isRecording={isListening} />

          {/* Large Microphone Button */}
          <div className="relative mt-2 mb-3">
            {/* Pulsing ring animation when listening */}
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#EF4444]"
                  animate={{ scale: [1, 1.45, 1.7], opacity: [0.6, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#6366F1]"
                  animate={{ scale: [1, 1.25, 1.5], opacity: [0.5, 0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut', delay: 0.4 }}
                />
              </>
            )}

            <button
              id="btn-mic-toggle"
              type="button"
              onClick={toggleRecording}
              className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl"
              style={{
                background: isListening
                  ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                  : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: isListening
                  ? '0 0 40px rgba(239, 68, 68, 0.5)'
                  : '0 0 35px rgba(99, 102, 241, 0.4)',
              }}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <div className="text-center">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isListening ? 'text-[#EF4444]' : 'text-[#94A3B8]'
              }`}
            >
              {isListening ? 'Recording active • Click to Stop' : 'Click microphone to start speaking'}
            </span>
          </div>
        </div>

        {/* Speech-to-Text Transcription Box */}
        <div
          className="p-5 sm:p-6 rounded-2xl relative"
          style={{ background: 'rgba(17, 17, 24, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                Real-Time Transcript
              </span>
              {isListening && (
                <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Listening...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsManualEditing(!isManualEditing)}
                className="text-[11px] font-medium text-[#6366F1] hover:text-[#818CF8] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                {isManualEditing ? 'Save Edit' : 'Edit Response'}
              </button>
            </div>
          </div>

          {/* Transcript Display or Manual Edit textarea */}
          {isManualEditing ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type or edit your answer here..."
              rows={4}
              className="w-full bg-black/30 text-sm text-[#F8F8FF] p-3 rounded-xl border border-white/10 focus:border-[#6366F1] outline-none resize-none"
            />
          ) : (
            <div className="min-h-[90px] max-h-[140px] overflow-y-auto text-sm leading-relaxed text-[#F8F8FF]">
              {transcript ? (
                <>
                  <span>{transcript}</span>
                  {interimTranscript && (
                    <span className="text-[#94A3B8] italic"> {interimTranscript}</span>
                  )}
                </>
              ) : (
                <span className="text-[#475569] italic">
                  Your speech will be transcribed here automatically as you answer the question...
                </span>
              )}
            </div>
          )}

          {/* Transcript stats footer */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <div className="flex items-center gap-4">
              <span>Words: <strong className="text-white">{currentWordCount}</strong></span>
              <span>Filler words: <strong className={currentFillerCount > 3 ? 'text-amber-400' : 'text-white'}>{currentFillerCount}</strong></span>
            </div>
            {!isSupported && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Speech API not supported in this browser. Use manual typing.
              </span>
            )}
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            id="btn-skip-question"
            type="button"
            onClick={() => handleAdvance(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip Question</span>
          </button>

          <button
            id="btn-submit-answer"
            type="button"
            onClick={() => handleAdvance(false)}
            className="btn-primary py-3 px-7 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
          >
            <span>{currentIndex + 1 === questions.length ? 'Finish & Generate Report' : 'Submit Answer'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Exit confirmation modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm p-6 rounded-2xl"
              style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <h3 className="text-base font-bold text-[#F8F8FF] mb-2">Leave Interview Session?</h3>
              <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
                Your current answers in this session will not be saved if you leave before completing all questions.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                >
                  Exit Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
