import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, ChevronLeft, Mic, MicOff } from 'lucide-react';
import { PixelAnimation } from '../../components/PixelAnimation';
import { evaluateEssayPublic, EvaluateResult } from '../../services/markingClient';
import { saveOnboardingSummary } from '../../services/api';
import { createDetailedStudyPlan } from '../../services/studyPlan';
import SnowballSpinner from '../../components/SnowballSpinner';
import SiriOrb from '../../components/ui/siri-orb';
const SYSTEM_PROMPT = `You are an onboarding assistant for a study platform used by students preparing for the Cambridge IGCSE First Language English exam (syllabus 0500). Many users are from a wide variety of countries, backgrounds, and first languages. Your role is not to explain what to do in the exam, but rather to set a welcoming, expert tone, and intelligently gather information about a student’s journey, strengths, and concerns.

Background and FAQ (internal context, do not summarize for the user):

    What is IGCSE 0500?

        Cambridge IGCSE First Language English (0500) is one of the world’s most popular international English qualifications for students aged 14-17 and focuses on reading, analysis, and writing skills.

        The assessment typically consists of two written papers (Paper 1: Reading and Paper 2: Directed Writing and Composition). Some students may have done coursework portfolios or oral assessments, but most are assessed on these two main exams.

    Papers and Question Types:

        Paper 1 (Reading)

            Three compulsory questions worth 80 marks

            Q1 (Comprehension and summary): Short-answer questions based on a reading passage, summary writing

            Q2 (Language analysis/Writer’s Effect): Analyzing how writers use language to create effect, usually demanding evidence, explanation, and effect in students' own words

            Q3 (Extended response): Longer writing, requiring students to synthesize ideas from the passage, often with an instruction to assume a role or point of view

        Paper 2 (Directed Writing and Composition)

            Q1 (Directed writing): Using information from reading passages to complete a task such as a speech, letter, report, or article, focusing on evaluation and reworking of ideas

            Q2 (Composition): Choice between narrative writing (a short story or personal account) and descriptive writing (vivid description of a place, event, or situation)

    Key skills assessed:

        Understanding explicit details and information from texts

        Inferring implicit meaning, attitudes, and opinions

        Analyzing language and structure for effect

        Summarizing information concisely

        Writing for different purposes and audiences with accurate grammar, spelling, and punctuation

        Planning and structuring both non-fiction and creative compositions

    Common struggles/mistakes:

        Misinterpreting question requirements or missing key bullet points

        Quoting/copying too much instead of using own words

        Not balancing coverage between all required points

        Running out of time, especially in composition or summary

        Finding it hard to develop analysis (especially on Writer’s Effect)

        Issues with planning, cohesion, or paragraph structure

        Writing narratives/descriptions that lack focus, structure, or originality

        Overly informal language or incorrect register in directed writing

Instructions for your onboarding role:

    Introduce yourself in a supportive, confident manner. Convey that you understand the range of experiences, backgrounds, and pressures students can face while preparing for IGCSE English 0500.

    Let students know you are here to help understand where they are in their own unique IGCSE journey—not to give them advice or judge their level.

    Ask genuinely open, thoughtful questions to build context. Examples:

        How do you feel about IGCSE English as a subject overall?

        Which papers or question types do you feel most or least confident about?

        Have you found any particular skills (like summary, language analysis, or extended writing) to be challenging?

        Are there particular topics, tasks, or experiences (mock exams, timed practice, coursework, etc.) that affected your feelings about English?

        Do you manage your time well in the exam, or do you sometimes find yourself rushed?

        What do you hope to achieve with your IGCSE English exam (e.g., a certain grade, more confidence, or something else)?

    Feel free to ask natural follow up questions based on their answers, e.g. ask for examples, goals, or stories of good/bad experiences with specific questions or papers.

    At this stage, do NOT offer study tips, syllabus policies, or model answers—your job is only to listen, learn, and understand each user’s perspective in detail.
    
    # Natural Conversation Framework (Condensed + Gen Z-Friendly)

You’re a conversational AI that talks like a real person, not a script. Keep the vibe natural, thoughtful, and a little bit Gen Z—but don’t force it.

Core Style
Respond like you’re actually talking to someone: flow with the convo, match the vibe, and show real interest. Keep language natural, use contractions, and sprinkle in light Gen Z slang when it fits (nothing over the top).

How to Respond
Give direct, relevant answers first, then build on them naturally. It’s okay to be unsure sometimes or to disagree respectfully. Follow the user’s tone and develop thoughts the way a real person would.

Avoid
Don’t over-explain, info-dump, sound formal, or fall into repetitive AI patterns. Skip academic structures, forced hype, or stacked questions. Lists only if the user asks.

Conversation Flow
Stick to the topic, vibe with the user’s style, and transition smoothly when needed. Keep a consistent personality and remember the context of the convo. Prioritize sounding human over being exhaustive.

Goal
Have genuine, flowing conversations—not robotic answers. Keep it real, keep it natural, keep it human-coded.`;

interface OnboardingData {
  voiceIntroComplete: boolean;
  examStruggles: string[];
  weaknessQuestionType: string;
  weaknessEssay: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    voiceIntroComplete: false,
    examStruggles: [],
    weaknessQuestionType: '',
    weaknessEssay: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [agentResponse, setAgentResponse] = useState('');
  const [summaryResponse, setSummaryResponse] = useState('');
  const [summaryPending, setSummaryPending] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);
  const [summarySaveError, setSummarySaveError] = useState<string | null>(null);
  const [allowNext, setAllowNext] = useState(false);
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const summaryRef = useRef<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);

  const totalSteps = 3;

  const teardownConnection = () => {
    dcRef.current?.close();
    pcRef.current?.getSenders().forEach(sender => sender.track?.stop());
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    pcRef.current = null;
    dcRef.current = null;
    localStreamRef.current = null;
    setConnectedAt(null);
    setShowDoneButton(false);
    setSummaryPending(false);
    setAllowNext(false);
    setSummarySaved(false);
    setSummarySaveError(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const connectToRealtime = async () => {
    if (!user) {
      setError('Please sign in to continue');
      return;
    }

    teardownConnection();
    setConnectionStatus('connecting');
    setError(null);

    try {
      const pc = new RTCPeerConnection();
      const dc = pc.createDataChannel('oai-events');
      pcRef.current = pc;
      dcRef.current = dc;

      pc.onconnectionstatechange = () => {
        console.log('[realtime] pc state', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          teardownConnection();
        }
      };

      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          const audioEl = new Audio();
          audioEl.autoplay = true;
          remoteAudioRef.current = audioEl;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {
          /* ignore autoplay failures */
        });
      };

      dc.onopen = () => {
        console.log('[realtime] data channel open');
        const systemMessage = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'system',
            content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
          },
        };
        const greetUser = {
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'Please greet me and introduce yourself' }],
          },
        };
        const startResponse = { type: 'response.create' };
        dc.send(JSON.stringify(systemMessage));
        dc.send(JSON.stringify(greetUser));
        dc.send(JSON.stringify(startResponse));
      };

      dc.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[realtime] event', payload);
          if (payload.type?.includes('response.output_text.delta') && payload.delta) {
            if (summaryPending) {
              summaryRef.current = `${summaryRef.current}${payload.delta}`;
              setSummaryResponse(summaryRef.current);
            } else {
              setAgentResponse(prev => `${prev}${payload.delta}`);
            }
          }
          if (payload.type === 'response.output_text.done') {
            setFormData(prev => ({ ...prev, voiceIntroComplete: true }));
            if (summaryPending) {
              setSummaryPending(false);
              void persistSummaryIfNeeded();
            }
          }
        } catch (err) {
          console.log('[realtime] raw message', event.data);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp || '',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[realtime] session creation failed', response.status, errorText);
        throw new Error('Failed to create Realtime session');
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setConnectionStatus('connected');
      setIsConnected(true);
      setFormData(prev => ({ ...prev, voiceIntroComplete: true }));
      setConnectedAt(Date.now());

      // Simulated audio level animation while connected
      audioLevelIntervalRef.current = window.setInterval(() => {
        if (pc.connectionState === 'connected') {
          setAudioLevel(Math.random() * 0.5 + 0.5);
        }
      }, 120);

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
          }
          teardownConnection();
        }
      };
    } catch (err) {
      console.error('Failed to connect to voice AI:', err);
      setError('Failed to connect to voice AI. Please try again.');
      setConnectionStatus('disconnected');
    }
  };

  const requestSummary = () => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== 'open') return;

    // Mute the voice call so the summary happens silently in the background.
    localStreamRef.current?.getTracks().forEach(track => {
      track.enabled = false;
    });
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    // Ask the model to summarize what it learned about the user.
    const summaryRequest = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Please summarize our conversation in concise bullet points: goals, weaknesses, strengths, and any follow-up suggestions.',
          },
        ],
      },
    };
    const startResponse = { type: 'response.create', response: { modalities: ['text'] } };
    setSummaryResponse('');
    setSummaryPending(true);
    summaryRef.current = '';
    dc.send(JSON.stringify(summaryRequest));
    dc.send(JSON.stringify(startResponse));
    setAllowNext(true);
  };

  const persistSummaryIfNeeded = async () => {
    if (!user) return;
    if (summarySaved) return;
    if (!summaryRef.current.trim()) return;
    const { success, error } = await saveOnboardingSummary(user.id, summaryRef.current);
    if (success) {
      setSummarySaved(true);
      setSummarySaveError(null);
    } else {
      setSummarySaveError(error || 'Failed to save summary');
    }
  };

  // Delay showing the "Done talking?" button for at least 60s after connect.
  useEffect(() => {
    if (connectionStatus === 'connected' && connectedAt) {
      const timer = setTimeout(() => setShowDoneButton(true), 60000);
      return () => clearTimeout(timer);
    }
    setShowDoneButton(false);
    return;
  }, [connectionStatus, connectedAt]);

  // Disconnect from Realtime
  const disconnectFromRoom = async () => {
    teardownConnection();
    setAudioLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardownConnection();
    };
  }, []);

  useEffect(() => {
    if (user?.id && userId && user.id !== userId) {
      navigate(`/onboarding/${user.id}`, { replace: true });
    }
  }, [user?.id, userId, navigate]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTestResult = () => {
    const targetId = userId || user?.id;
    if (!targetId) return;
    navigate(`/onboarding/${targetId}/result?test=true`);
  };

  const handleComplete = async () => {
    if (!user) return;

    if (!formData.weaknessQuestionType || !formData.weaknessEssay.trim()) {
      setError('Select a question type and paste your response so we can mark it.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await persistSummaryIfNeeded();

      const markingResult = await evaluateEssayPublic({
        questionType: formData.weaknessQuestionType,
        essay: formData.weaknessEssay,
      });

      const planResult = await createDetailedStudyPlan(user.id, {
        summary: summaryRef.current,
        markingResult,
        essay: formData.weaknessEssay,
        questionType: formData.weaknessQuestionType,
      });

      if (planResult.error) {
        console.error('[studyPlan] generation failed', planResult.error);
      }

      await persistOnboarding(markingResult);

      navigate(`/onboarding/${user.id}/result`, {
        state: {
          result: markingResult,
          essay: formData.weaknessEssay,
          questionType: formData.weaknessQuestionType,
        },
      });
    } catch (err) {
      console.error('[onboarding] Marking failed', err);
      setError('Failed to mark the essay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const persistOnboarding = async (markingResult: EvaluateResult) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('onboarding_responses').insert({
        user_id: user.id,
        exam_struggles: formData.examStruggles,
        voice_intro_complete: formData.voiceIntroComplete,
        // TODO: Persist markingResult to a dedicated table when backend is ready
      });

      if (error) {
        throw error;
      }

      await updateProfile({ onboarding_completed: true });

      const progressCategories = ['paper1', 'paper2', 'examples', 'text_types', 'vocabulary'];
      const progressInserts = progressCategories.map(category => ({
        user_id: user.id,
        category,
        sections_completed: 0,
        total_sections: 10,
        quiz_average: 0,
      }));

      const { error: progressError } = await supabase.from('student_progress').insert(progressInserts);
      if (progressError) {
        // Ignore seeding errors so onboarding flow can complete.
      }
    } catch (error) {
      console.error('[onboarding] Failed to persist onboarding', error);
      setError('Failed to save your onboarding. Please try again.');
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const getQuestionContent = (): {
    section: string;
    question: string;
    subtitle?: string;
    type: 'single' | 'multiple' | 'text' | 'essay' | 'voice';
    field: string;
    options?: { value: string; label: string }[] | string[];
    placeholder?: string;
  } | null => {
    switch (currentStep) {
      case 1:
        return {
          section: 'Step 1: Meet Your AI Tutor',
          question: 'Let\'s start with a conversation',
          subtitle: 'Click the microphone and tell us about your English exam goals',
          type: 'voice' as const,
          field: 'voiceIntroComplete',
        };
      case 2:
        return {
          section: 'Step 2: Identify Your Weaknesses',
          question: 'Which paper questions do you struggle with most?',
          subtitle: 'Select as many as apply',
          type: 'multiple',
          field: 'examStruggles',
          options: [
            'Paper 1 Q1 (a-e) - Simple Comprehension',
            'Paper 1 Q1f - Summary',
            'Paper 1 Q2(a-c) - Comprehension and Vocabulary',
            'Paper 1 Q2d - Writer\'s Effect',
            'Paper 1 Q3 - Extended Response',
            'Paper 2 Q1 - Directed Writing',
            'Paper 2 Q2 - Narrative',
            'Paper 2 Q2 - Descriptive',
            'I\'m not sure — I need help identifying them',
          ],
        };
      case 3:
        return {
          section: 'Step 3: Analyze Your Writing',
          question: 'Share a short response for the question type you struggle with most.',
          subtitle: 'Pick the weakest question type from Step 2 and paste your essay/response so we can mark it automatically.',
          type: 'essay',
          field: 'weaknessEssay',
          options: formData.examStruggles.length
            ? formData.examStruggles
            : ['Pick a question type in the previous step to select it here'],
          placeholder: 'Paste your essay/response here (a short paragraph is fine).',
        };
      default:
        return null;
    }
  };

  const content = getQuestionContent();

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/85 backdrop-blur-md">
          <SnowballSpinner size="lg" label="Marking your response..." />
        </div>
      )}
      {/* Pixel Animation Background */}
      <div className="absolute inset-0 z-0">
        <PixelAnimation
          colorHueStart={280}
          colorHueRange={40}
          pixelGap={8}
          animationSpeed={0.2}
          animationDuration={400}
        />
      </div>

      {/* Content */}
      <div className="w-full h-screen flex items-center justify-center relative z-10 px-8">
        <div className="w-full max-w-7xl grid grid-cols-2 gap-16 items-center">
          {/* Left Side - Question */}
          <div
            key={`question-${currentStep}`}
            className="space-y-6 animate-slide-in-left"
            style={{
              animation: direction === 'forward' ? 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(currentStep / totalSteps) * 100}%`,
                    backgroundColor: '#aa08f3',
                  }}
                />
              </div>
            </div>

            {/* Section Label */}
            <div className="opacity-60">
              <p className="text-sm font-bold tracking-wider sulphur-point-bold uppercase" style={{ color: '#aa08f3' }}>
                {content?.section}
              </p>
            </div>

            {/* Question */}
            <div className="space-y-4">
              <h1
                className="text-5xl font-bold sulphur-point-bold leading-tight"
                style={{ color: '#2b0c44' }}
              >
                {content?.question}
              </h1>
              {content?.subtitle && (
                <p className="text-xl sulphur-point-regular" style={{ color: '#6a0bbd' }}>
                  {content.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Side - Options */}
          <div
            key={`options-${currentStep}`}
            className="space-y-4"
            style={{
              animation: direction === 'forward' ? 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sulphur-point-regular"
                style={{ animation: 'fadeInUp 0.5s ease-out backwards' }}
              >
                {error}
              </div>
            )}
            {content?.type === 'single' && content.options && (
              <div className="space-y-3">
                {(content.options as { value: string; label: string }[]).map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, [content.field]: option.value })}
                    className="w-full p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
                    style={{
                      backgroundColor: formData[content.field as keyof OnboardingData] === option.value
                        ? 'rgba(170, 8, 243, 0.3)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: formData[content.field as keyof OnboardingData] === option.value
                        ? '2px solid #aa08f3'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.5s ease-out backwards',
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <span
                        className="font-bold text-2xl sulphur-point-bold transition-colors duration-300"
                        style={{
                          color: formData[content.field as keyof OnboardingData] === option.value ? '#aa08f3' : 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {option.value}.
                      </span>
                      <span
                        className="text-lg sulphur-point-regular group-hover:text-white/90 transition-colors duration-300"
                        style={{
                          color: formData[content.field as keyof OnboardingData] === option.value ? '#ffffff' : '#2b0c44',
                        }}
                      >
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {content?.type === 'multiple' && content.options && (
              <div className="space-y-3">
                {(content.options as string[]).map((option, index) => (
                  <button
                    key={option}
                    onClick={() => setFormData({
                      ...formData,
                      examStruggles: toggleArrayItem(formData.examStruggles, option),
                    })}
                    className="w-full p-6 rounded-2xl text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                    style={{
                      backgroundColor: formData.examStruggles.includes(option)
                        ? 'rgba(170, 8, 243, 0.3)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: formData.examStruggles.includes(option)
                        ? '2px solid #aa08f3'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.5s ease-out backwards',
                    }}
                  >
                    <span
                      className="text-lg sulphur-point-regular transition-colors duration-300"
                      style={{
                        color: formData.examStruggles.includes(option) ? '#ffffff' : '#2b0c44',
                      }}
                    >
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {content?.type === 'essay' && (
              <div className="space-y-4" style={{ animation: 'fadeInUp 0.5s ease-out backwards' }}>
                <div className="space-y-2">
                  <label className="text-base sulphur-point-bold" style={{ color: '#2b0c44' }}>
                    Which question type is this essay for?
                  </label>
                  <select
                    value={formData.weaknessQuestionType}
                    onChange={(e) => setFormData({ ...formData, weaknessQuestionType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl sulphur-point-regular text-base"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      color: '#2b0c44',
                      border: '2px solid #aa08f3',
                      backdropFilter: 'blur(8px)',
                    }}
                    disabled={!formData.examStruggles.length}
                  >
                    {!formData.examStruggles.length ? (
                      <option value="">Select a question type in Step 2 first</option>
                    ) : (
                      <>
                        <option value="">Select one</option>
                        {formData.examStruggles.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <textarea
                    value={formData.weaknessEssay}
                    onChange={(e) => setFormData({ ...formData, weaknessEssay: e.target.value })}
                    rows={10}
                    className="w-full px-6 py-4 rounded-2xl text-white text-lg sulphur-point-regular transition-all duration-300 focus:scale-105"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                    placeholder={content.placeholder}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#aa08f3';
                      e.target.style.backgroundColor = 'rgba(170, 8, 243, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  />
                </div>
              </div>
            )}

            {content?.type === 'voice' && (
              <div className="flex flex-col items-center justify-center space-y-8" style={{ animation: 'fadeInUp 0.5s ease-out backwards' }}>
                {/* AI Orb */}
                <div className="relative">
                  <SiriOrb
                    size="320px"
                    colors={{
                      c1: '#aa08f3',
                      c2: '#6a0bbd',
                      c3: '#ff00ff',
                    }}
                    animationDuration={isConnected && audioLevel > 0 ? 8 : 20}
                  />
                </div>

                {/* Agent Response Display */}
                {agentResponse && (
                  <div
                    className="w-full px-6 py-4 rounded-2xl text-white text-center text-lg sulphur-point-regular"
                    style={{
                      backgroundColor: 'rgba(170, 8, 243, 0.1)',
                      border: '2px solid rgba(170, 8, 243, 0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {agentResponse}
                  </div>
                )}

                {/* Status Text */}
                <p className="text-lg sulphur-point-regular text-center" style={{ color: '#6a0bbd' }}>
                  {connectionStatus === 'connecting' && 'Connecting to AI tutor...'}
              {connectionStatus === 'connected' && 'Connected! Start speaking with your AI tutor'}
              {connectionStatus === 'disconnected' && 'Click the microphone to connect and start speaking'}
            </p>

            {/* Microphone Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (isConnected) {
                    disconnectFromRoom();
                  } else {
                    connectToRealtime();
                  }
                }}
                disabled={connectionStatus === 'connecting'}
                className="p-8 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50"
                style={{
                  backgroundColor: isConnected ? 'rgba(170, 8, 243, 0.9)' : 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {isConnected ? (
                  <MicOff className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12" style={{ color: '#aa08f3' }} />
                )}
              </button>

              {showDoneButton && (
                <button
                  onClick={requestSummary}
                  disabled={!isConnected || connectionStatus !== 'connected'}
                  className="px-4 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 sulphur-point-bold"
                  style={{
                    backgroundColor: '#08aaf3',
                    color: 'white',
                  }}
                >
                  Done talking?
                </button>
              )}
            </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: '#aa08f3' }} />
                <span className="text-white sulphur-point-bold">Back</span>
              </button>

              {currentStep === 1 ? (
                allowNext ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 sulphur-point-bold"
                    style={{
                      backgroundColor: '#aa08f3',
                      color: 'white',
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div></div>
                )
              ) : currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 sulphur-point-bold"
                  style={{
                    backgroundColor: '#aa08f3',
                    color: 'white',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={handleTestResult}
                    className="px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 sulphur-point-bold border border-white/30"
                    style={{ color: '#aa08f3', backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  >
                    View test result
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={
                      loading ||
                      !formData.weaknessQuestionType ||
                      !formData.weaknessEssay.trim()
                    }
                    className="px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 disabled:opacity-50 sulphur-point-bold"
                    style={{
                      backgroundColor: '#aa08f3',
                      color: 'white',
                    }}
                  >
                    {loading ? 'Marking your response...' : 'Mark this response'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        ::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
