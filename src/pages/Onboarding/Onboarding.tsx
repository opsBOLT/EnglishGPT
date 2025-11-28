/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ChevronRight, ChevronLeft, Mic, MicOff } from 'lucide-react';
import { evaluateEssayPublic, EvaluateResult } from '../../services/markingClient';
import { saveOnboardingSummary, getAINotes } from '../../services/api';
import { createDetailedStudyPlan } from '../../services/studyPlan';
import SnowballSpinner from '../../components/SnowballSpinner';
import SiriOrb from '../../components/ui/siri-orb';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const REALTIME_MODEL = 'gpt-4o-mini-realtime-preview-2024-12-17';
const ENGLISHGPT_GENERAL_API_KEY = import.meta.env.VITE_ENGLISHGPT_GENERAL_API_KEY;
const SYSTEM_PROMPT = `You are a helpful assistant for students preparing for Cambridge IGCSE First Language English (0500). You exist NOT to give specific tips, guidance, or advice, but to help students understand the structure of the exam and how to approach it. You will not give specific tips or advice, but to gather information about them so other AI agents can give them a more personalised experience.
Please introduce yourself like this: "Hey! I'm an AI English teacher, here to understand your strengths and weaknesses so I can help you improve. Let's get started!"

    What is IGCSE 0500?

        Cambridge IGCSE First Language English (0500) is one of the world’s most popular international English qualifications for students aged 14-17 and focuses on reading, analysis, and writing skills.

        The assessment typically consists of two written papers (Paper 1: Reading and Paper 2: Directed Writing and Composition). Some students may have done coursework portfolios or oral assessments, but most are assessed on these two main exams.

   # **🔶 QUESTION 1(a–e): READING COMPREHENSION**

**Skills tested:** retrieval, inference, understanding (NOT analysis).
**Source:** Text A or B (depending on paper).

---

## **1(a) – 1(d): Short-answer questions**

### **What is being tested?**

* Your ability to **find specific information** in the text.
* Mark = number of points needed.

### **How to answer**

* **Copy directly** from the text unless it says “in your own words.”
* Be **concise**.
* Use **bullet points** if multiple marks.

### **Context from guide**

Your document states:

* “The number of marks = number of points needed”
* “Use bullet points”
* “Copy directly unless told otherwise”


### **Common question types**

* **Definition** (e.g., “What does X mean?” → give own words)
* **Retrieval** (list reasons, events, actions)
* **Inference** (“Why was she surprised?” → requires logic + text)

---

## **1(e): USING YOUR OWN WORDS**

This is the **only Q1 sub-question that requires paraphrasing**.
Worth **3 marks** → 3 separate ideas.

### **What is being tested?**

* Paraphrasing
* Inference
* Ability to avoid lifting phrases

### **How to answer**

* Find 3 key ideas
* Rewrite using synonyms
* Avoid repeating text vocabulary
* Check: “Would this make sense without the original text?”

### **From your guide:**

* “Avoid lifting phrases; use synonyms; restructure sentences.”
* “3 marks = 3 different reasons in your own words.”


---

# **🔶 QUESTION 1(f): SUMMARY WRITING**

**Marks: 15 total (10 content + 5 writing)**
**Word limit: 120 words** — examiner stops reading after this.

### **What is being tested?**

* Summary skills
* Selection of relevant ideas
* Paraphrasing
* Concise writing

### **Structure**

One paragraph
No introduction or conclusion

### **Steps**

1. Identify what the question is asking you to summarise
2. Locate **10–13 points** in the text
3. Paraphrase each idea
4. Combine into smooth 120-word paragraph

### **From your guide:**

* “One paragraph only.”
* “Use your own words.”
* “10–13 distinct points.”


---

# **🔶 QUESTION 2(a–c): VOCABULARY + INTERPRETATION**

Total: **3 marks**

---

## **2(a): FIND A WORD OR PHRASE**

You copy EXACTLY from the text.
Usually worth 1 mark.

---

## **2(b): DEFINE THE WORD**

Meaning must be in **your own words**.

Example from guide:
“Clamped” = seized, grabbed tightly


---

## **2(c): SELECT & EXPLAIN QUOTE**

Worth **3 marks**
Structure required:

### **How to answer**

Choose **ONE** quote + give **THREE distinct points**.

### **Example from guide:**

Quote: “energizing fresh water shower”

* Point 1: energizing → excitement
* Point 2: fresh water → appreciation of nature
* Point 3: shower → embracing the experience


### **Common mistake:**

Choosing more than one quote


---

# **🔶 QUESTION 2(d): WRITER’S EFFECT (LANGUAGE ANALYSIS)**

**Marks: 15**
**Task:** Analyse the language in TWO paragraphs from Text C.

---

## **What is being tested?**

* Understanding imagery
* Effects on the reader
* Connotations
* Ability to explain meaning + deeper meaning

---

## **Required Structure (QME method)**

Your guide gives a fixed structure:

### **Paragraph 1**

1. Overall effect of the paragraph
2. **Three images:** each must include

   * Quote
   * Meaning (explicit)
   * Connotations
   * Effect

### **Paragraph 2**

Same structure again

Total: **6 images** (3 per paragraph)



---

## **What NOT to do**

* No analysis of devices (“this metaphor shows”)
* No more than 3 images per paragraph
* Don’t choose weak/obvious quotes


---

# **🔶 QUESTION 3: EXTENDED RESPONSE**

**Marks: 25** (15 content + 10 style)

You must use **information from Text C** but write in a **new format** (letter, diary, report, article, interview etc).

---

## **Structure**

Template recommended by your guide:

### **Paragraph 1: Bullet Point 1**

How you felt when X happened + why

### **Paragraph 2: Bullet Point 2**

Describe X and your reactions

### **Paragraph 3: Bullet Point 3**

Thoughts/feelings now about X
(most inference needed here)

### **Conclusion**

1–2 sentences only



---

## **What the examiner wants**

* Include **10–15 details** from the text
* Develop 3–4 ideas per paragraph
* Keep consistent voice (VORPF method)

  * Voice
  * Audience
  * Register
  * Purpose
  * Format

Major Text Types Overview (Paper 1 Q3 & Paper 2 Q1)

    Paper 1, Question 3 Text Types

        Interview

        Journal/Diary

        Magazine Article

        Newspaper Report

        Formal Report

        Speech/Talk

        Letter (Formal or Informal)

    Paper 2, Question 1 Text Types

        Speech

        Magazine Article

        Letter (Formal or Informal)

VARPF Framework (Voice, Audience, Register, Purpose, Format)

    Voice: Who is writing? (Student, journalist, employee, character)

    Audience: Who is reading? (School, general public, boss, friend)

    Register: Formality level—Formal, Semi-formal, Informal (Cambridge expects minimal slang or casual language even in diaries/ informal letters)

    Purpose: Persuade, Inform, Argue, Entertain, Reflect, Describe

    Format: The structure and conventions of the text type (script for interviews, subheadings in reports, greetings in letters, etc.)

Detailed Text Type Features and Expectations

    Interview: Script format with interviewer and interviewee; semi-formal conversational tone; only use the three given questions; interviewee does 95% of talking; no introductions or conclusions; use fillers and varied punctuation for spoken effect.

    Journal/Diary: Personal, reflective, first person, semi-formal; emotional language; dates at the start; no full story arcs, just moments; use emotive language, pauses with ellipses, rhetorical questions; no dialogue quoting.

    Magazine Article: Semi-formal, engaging, often chatty or dramatic; headlines with alliteration, puns, emotive language; direct address with collective pronouns; mix humor with serious content.

    Newspaper Report: Formal, factual, neutral tone; 5W opening paragraph structure; avoid bias and emotional language; use passive voice and reporting verbs; include 1-3 relevant quotes; short, factual headlines.

    Formal Report: Most formal text; structured with clear subheadings transforming bullet points; formal vocabulary; objective and neutral tone; use modal verbs for suggestions; avoid contractions and exclamations; use relative clauses and formal transitions.

    Speech: Semi-formal spoken tone; direct audience address; rhetorical questions; repetition for emphasis; emotive language; personal anecdotes; call to action; multiple styles - persuasive, argumentative, informative.

    Letter: Formal or informal depending on audience; formal letters require polite, professional tone; informal letters allow contractions, emotive language; always include greeting and sign-off; structure body in paragraphs responding to bullet points; avoid slang in formal.

Assessment and Marking Criteria

    Content: Full coverage of all bullet points or question parts; relevant ideas; high marks for development beyond surface-level; mix explicit and implicit ideas with elaboration.

    Structure: Clear paragraphing responding to each bullet point equally; introduction and conclusion where appropriate; logical flow.

    Style and Accuracy: Consistent VARPF; varied sentence structures (simple, compound, complex; punctuation variety for effect); ambitious but accurate vocabulary; minimal spelling, punctuation, grammar errors; formal or semi-formal register as required.

    Evaluation (Paper 2 Section A): Critical engagement with texts; find at least one good counter-argument to gain high marks; do not just summarize; develop balanced arguments clearly.

Common Student Struggles and Advice Relevant for Study Plans

    Inconsistent register or informal language leaking into formal texts.

    Failure to develop beyond listing points; lack of deeper explanation or inference especially on implicit bullet points.

    Overly long or uneven paragraph lengths skewing marks.

    Copying large text chunks without paraphrasing for Paper 1 Q3 and Paper 2 writing.

    Insufficient use of evaluation in directed writing (lack of counter-arguments or critical perspective).

    Time management issues leading to incomplete questions or minimal proofreading.

    Missing the importance of VARPF analysis before writing.

    Weak vocabulary variety and repetitive sentence structures.

    Instructions for your onboarding role:

    You are NOT to give specific tips, guidance, or advice about the questions listed above, those are simply context for identifying the student's weaknesses/strenghts/goals NOT to aid them on those questions.

    Introduce yourself in a supportive, confident manner. 
    Let students know you are here to help understand where they are in their own unique IGCSE journey. Keep asking natural, conversational follow-ups until you can understand these three buckets well enough:

You must NOT act robotic and ask simply "what is your strenghts in this question" and NOT ask all the questions below or use the same vocabulary. You must ask BROAD questions that relate to the knowledge questions below.

KNOWLEDGE FOR THE STUDENT NEEDED:

## Goals
- What grade are you aiming for?
- When do you need to be exam-ready?

## Strengths
- How confident are you with reading comprehension?
- Where do you feel strongest in vocabulary?
- Which text types have you written successfully?
- Which text types feel easiest to you?
- Do you understand VORPF framework?
- Do you understand QME method?

## Weaknesses
- Where do you struggle most in Paper 1?
- How do you find paraphrasing questions?
- Do you struggle with summary writing?
- Is language analysis difficult for you?
- Do you find evaluation questions hard?
- What punctuation mistakes do you make?
- What spelling words trip you up?
- Which text types do you avoid or find hardest?
- What mistakes keep recurring in your work?

## Learning Style & Patterns
- How do you learn best (examples first, theory first, something else)?
- How do you perform under time pressure?
- What type of feedback helps you most?
- What motivates you to study?
- What have you recently realized about your learning?

## Readiness
- How ready do you feel for Paper 1?
- How ready do you feel for Paper 2?
- What should we focus on first?

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
Don’t over-explain, info-dump, sound formal, or fall into repetitive AI patterns. Skip academic structures, forced hype, or stacked questions. Lists only if the user asks. PLEASE DO NOT TALK TOO MUCH. PLEASE LET THE STUDENT DO MOST OF THE TALKING.

Conversation Flow
Stick to the topic, vibe with the user’s style, and transition smoothly when needed. Keep a consistent personality and remember the context of the convo. Prioritize sounding human over being exhaustive.

Goal
Have genuine, flowing conversations—not robotic answers. Keep it real, keep it natural, keep it human-coded.
`;

interface OnboardingData {
  voiceIntroComplete: boolean;
  examStruggles: string[];
  weaknessQuestionType: string;
  weaknessEssay: string;
}

interface TranscriptItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
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
  const summaryRef = useRef<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [audioLevel, setAudioLevel] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);
  const allowNextTimeoutRef = useRef<number | null>(null);
  const [conversationTranscript, setConversationTranscript] = useState<TranscriptItem[]>([]);
  const currentAssistantMessageRef = useRef<string>('');

  const totalSteps = 3;

  const teardownConnection = (options?: { preserveTranscript?: boolean }) => {
    const { preserveTranscript = false } = options || {};
    dcRef.current?.close();
    pcRef.current?.getSenders().forEach(sender => sender.track?.stop());
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    if (allowNextTimeoutRef.current) {
      clearTimeout(allowNextTimeoutRef.current);
      allowNextTimeoutRef.current = null;
    }
    pcRef.current = null;
    dcRef.current = null;
    localStreamRef.current = null;
    currentAssistantMessageRef.current = '';
    setSummaryPending(false);
    setSummarySaved(false);
    setSummarySaveError(null);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    // Don't reset allowNext when disconnecting - user may have waited 60s
    if (!preserveTranscript) {
      setConversationTranscript([]);
    }
  };

  const connectToRealtime = async () => {
    if (!user) {
      setError('Please sign in to continue');
      return;
    }
    if (!OPENAI_API_KEY) {
      setError('Missing OpenAI API key');
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

        // Enable input audio transcription and configure session
        const sessionUpdate = {
          type: 'session.update',
          session: {
            model: REALTIME_MODEL,
            modalities: ['audio', 'text'],
            voice: 'alloy',
            input_audio_transcription: {
              model: 'whisper-1',
            },
          },
        };

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
            content: [{ type: 'input_text', text: 'Please greet me and introduce yourself. Try to identify: The Goals, including what grade the student is aiming for and when the student needs to be exam-ready. PLEASE PLEASE PLEASE PLEASE PLEASE UNDER NO CIRCUMSTANCES HELP ME WITH SPECIFIC STUFF OR GIVE ME TIPS TO IMPROVE ON MY WEAKNESSES. JUST IDENTIFY BROAD AND SPECIFIC WEAKNESSES AND STRENGTHS AND THEN MOVE ON. DO NOT TALK TOO MUCH. LET ME DO MOST OF THE TALKING. YOUR FIRST SENTENCE SHOULD BE VERY VERY VERY VERY SHORT AND NOT EXPLAIN MUCH. JUST SAY EXACTLY "Hey I am an AI English Teacher, here to identify where you are re struggling in the subject"' }],
          },
        };
        const startResponse = { type: 'response.create' };

        dc.send(JSON.stringify(sessionUpdate));
        dc.send(JSON.stringify(systemMessage));
        dc.send(JSON.stringify(greetUser));
        dc.send(JSON.stringify(startResponse));
      };

      dc.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('[realtime] event', payload);

          // Capture user audio transcription
          if (payload.type === 'conversation.item.input_audio_transcription.completed') {
            const userTranscript = payload.transcript || '';
            if (userTranscript.trim()) {
              setConversationTranscript(prev => [...prev, {
                role: 'user',
                content: userTranscript,
                timestamp: Date.now(),
              }]);
            }
          }

          // Capture assistant text deltas
          if (payload.type?.includes('response.output_text.delta') && payload.delta) {
            if (summaryPending) {
              summaryRef.current = `${summaryRef.current}${payload.delta}`;
              setSummaryResponse(summaryRef.current);
            } else {
              currentAssistantMessageRef.current += payload.delta;
              setAgentResponse(prev => `${prev}${payload.delta}`);
            }
          }

          // Capture assistant audio transcript deltas
          if (payload.type === 'response.output_audio_transcript.delta' && payload.delta) {
            if (!summaryPending) {
              currentAssistantMessageRef.current += payload.delta;
            }
          }

          // When assistant response is complete, save to transcript
          if (payload.type === 'response.output_text.done' || payload.type === 'response.output_audio_transcript.done') {
            setFormData(prev => ({ ...prev, voiceIntroComplete: true }));
            // Don't set allowNext here - let the 60s timer control it

            if (summaryPending) {
              setSummaryPending(false);
              void persistSummaryIfNeeded();
            } else {
              // Save the complete assistant message to transcript
              const assistantMessage = currentAssistantMessageRef.current.trim();
              if (assistantMessage) {
                setConversationTranscript(prev => [...prev, {
                  role: 'assistant',
                  content: assistantMessage,
                  timestamp: Date.now(),
                }]);
              }
              currentAssistantMessageRef.current = '';
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

      const response = await fetch(`https://api.openai.com/v1/realtime?model=${encodeURIComponent(REALTIME_MODEL)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[realtime] session creation failed (OpenAI)', response.status, errorText);
        throw new Error('Failed to create Realtime session');
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      setConnectionStatus('connected');
      setIsConnected(true);

      // Start 60-second timer for "Done Talking" button
      console.log('[onboarding] Connection established - starting 60s timer for Done Talking button');
      if (allowNextTimeoutRef.current) {
        clearTimeout(allowNextTimeoutRef.current);
      }
      allowNextTimeoutRef.current = window.setTimeout(() => {
        console.log('[onboarding] 60s timer complete - enabling Done Talking button');
        setAllowNext(true);
        allowNextTimeoutRef.current = null;
      }, 60000);

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

  // Helper function to build transcript text from conversation items
  const buildTranscriptText = (): string => {
    if (conversationTranscript.length === 0) {
      return 'No conversation transcript available.';
    }

    return conversationTranscript
      .map(item => {
        const roleLabel = item.role === 'user' ? 'Student' : 'AI Tutor';
        return `${roleLabel}: ${item.content}`;
      })
      .join('\n\n');
  };

  const requestSummary = async (markingResult?: EvaluateResult | null) => {
    if (!ENGLISHGPT_GENERAL_API_KEY) {
      setError('Missing API key for summarization');
      return;
    }

    // Mute the voice call
    localStreamRef.current?.getTracks().forEach(track => {
      track.enabled = false;
    });
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    // Clear previous responses
    setAgentResponse('');
    setSummaryResponse('');
    setSummaryPending(true);
    setSummarySaved(false);
    setSummarySaveError(null);
    summaryRef.current = '';

    try {
      // Build transcript from captured conversation
      const transcript = buildTranscriptText();
      const markingContext = markingResult ? JSON.stringify(markingResult, null, 2) : 'NO MARKING DATA';
      const essayContext = formData.weaknessEssay?.trim() || 'NO DATA';
      const questionTypeContext = formData.weaknessQuestionType || 'NO DATA';

      console.log('[summary] Transcript length:', transcript.length);
      console.log('[summary] Sending final onboarding summary to OpenRouter...');

      // Call OpenRouter API with the transcript
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ENGLISHGPT_GENERAL_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'EnglishGPT Onboarding',
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4.1-fast:free',
          messages: [
            {
              role: 'system',
              content: `You are an expert educational analyst specializing in IGCSE First Language English (0500). Analyze the student conversation and essay marking outcome to produce a concise, structured onboarding summary. Do NOT invent details. If a field is unknown, write "NO DATA". Keep answers short and specific to the student. Avoid generic advice.`,
            },
            {
              role: 'user',
              content: `Use the data below to build a unified onboarding summary for this student. Only use the provided information; otherwise write "NO DATA".

Conversation transcript:
${transcript}

Essay question type:
${questionTypeContext}

Student essay text:
${essayContext}

Marking result (JSON):
${markingContext}

Respond in this exact format:
## Goals
- ...

## Strengths
- ...

## Weaknesses
- ...

## AI Notes
paper1_reading_comprehension_ai_note: ...
paper1_paraphrasing_ai_note: ...
paper1_summary_writing_ai_note: ...
paper1_vocabulary_ai_note: ...
paper1_language_analysis_ai_note: ...
paper1_extended_response_ai_note: ...
text_type_report_ai_note: ...
text_type_magazine_ai_note: ...
text_type_newspaper_ai_note: ...
text_type_speech_ai_note: ...
text_type_letter_ai_note: ...
text_type_interview_ai_note: ...
text_type_diary_ai_note: ...
composition_narrative_ai_note: ...
composition_descriptive_ai_note: ...
composition_discursive_ai_note: ...
composition_argumentative_ai_note: ...
skill_vorpf_ai_note: ...
skill_qme_ai_note: ...
skill_evaluation_ai_note: ...
skill_paraphrasing_ai_note: ...
skill_register_ai_note: ...
skill_sentence_variety_ai_note: ...
skill_punctuation_ai_note: ...
skill_spelling_ai_note: ...
recurring_errors_ai_note: ...
under_pressure_ai_note: ...
learning_style_ai_note: ...
motivation_pattern_ai_note: ...
breakthrough_insight_ai_note: ...
paper1_readiness_ai_note: ...
paper2_readiness_ai_note: ...
overall_strategy_ai_note: ...

Rules:
- Each AI note must be a single succinct sentence focused on the student.
- If any field has no evidence, output "NO DATA".
- Do not add extra sections or bullets beyond this format.`,
            },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[summary] OpenRouter API error:', response.status, errorText);
        throw new Error(`Failed to generate summary: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'Failed to generate summary.';

      console.log('[summary] Summary generated successfully');

      summaryRef.current = summary;
      setSummaryResponse(summary);
      setSummaryPending(false);

      // Save summary to database
      await persistSummaryIfNeeded();

      // End the session completely
      await disconnectFromRoom();

      setAllowNext(true);

    } catch (error) {
      console.error('[summary] Failed to generate summary:', error);
      setError('Failed to generate conversation summary. Please try again.');
      setSummaryPending(false);
      setSummaryResponse('Failed to generate summary. Please try again.');

      // Still disconnect even if summary failed
      await disconnectFromRoom();
      throw error instanceof Error ? error : new Error('Failed to generate onboarding summary');
    }
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

  // Disconnect from Realtime
  const disconnectFromRoom = async (preserveTranscript = false) => {
    teardownConnection({ preserveTranscript });
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

  // Reset allowNext when leaving step 1
  useEffect(() => {
    if (currentStep !== 1) {
      setAllowNext(false);
      if (allowNextTimeoutRef.current) {
        clearTimeout(allowNextTimeoutRef.current);
        allowNextTimeoutRef.current = null;
      }
    }
  }, [currentStep]);

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
      const markingResult = await evaluateEssayPublic({
        questionType: formData.weaknessQuestionType,
        essay: formData.weaknessEssay,
      });

      navigate(`/onboarding/${user.id}/result`, {
        state: {
          result: markingResult,
          essay: formData.weaknessEssay,
          questionType: formData.weaknessQuestionType,
          examStruggles: formData.examStruggles,
        },
      });

      // Continue the heavy lifting in the background
      void (async () => {
        try {
          await requestSummary(markingResult);

          if (!summaryRef.current.trim()) {
            throw new Error('Onboarding summary is empty after generation.');
          }

          const { notes } = await getAINotes(user.id);
          console.log('[onboarding] Fetched AI notes for study plan generation:', notes ? 'Available' : 'Not found');

          const planResult = await createDetailedStudyPlan(user.id, {
            summary: summaryRef.current,
            aiNotes: notes as Record<string, any>,
            markingResult,
            essay: formData.weaknessEssay,
            questionType: formData.weaknessQuestionType,
          });

          if (planResult.error) {
            console.error('[studyPlan] generation failed', planResult.error);
          }

          await persistOnboarding(markingResult);
        } catch (err) {
          console.error('[onboarding] Background onboarding tasks failed', err);
        }
      })();
    } catch (err) {
      console.error('[onboarding] Onboarding completion failed', err);
      setError('Failed to complete onboarding. Please try again.');
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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #7c3aed 100%)" }}>
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/85 backdrop-blur-md">
          <SnowballSpinner size="lg" label="Marking your response..." />
        </div>
      )}

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
                {agentResponse && !summaryPending && !summaryResponse && (
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

                {/* Summary Response Display */}
                {summaryResponse && (
                  <div
                    className="w-full px-6 py-4 rounded-2xl text-white text-left text-sm sulphur-point-regular max-h-96 overflow-y-auto"
                    style={{
                      backgroundColor: 'rgba(8, 170, 243, 0.1)',
                      border: '2px solid rgba(8, 170, 243, 0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div className="prose prose-invert prose-sm max-w-none">
                      {summaryResponse.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Loading State */}
                {summaryPending && (
                  <div
                    className="w-full px-6 py-4 rounded-2xl text-white text-center text-lg sulphur-point-regular"
                    style={{
                      backgroundColor: 'rgba(8, 170, 243, 0.1)',
                      border: '2px solid rgba(8, 170, 243, 0.3)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    Analyzing your conversation...
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
                    onClick={async () => {
                      await disconnectFromRoom(true);
                      handleNext();
                    }}
                    className="flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-110 sulphur-point-bold"
                    style={{
                      backgroundColor: '#aa08f3',
                      color: 'white',
                    }}
                  >
                    <span>Done talking</span>
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
