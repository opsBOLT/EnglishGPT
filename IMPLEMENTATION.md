# IGCSE English Study Platform - Implementation Guide

## Overview

This document describes the complete backend implementation for the IGCSE English Study Platform, including database schema, AI agent system, and API services.

## Architecture

### Database Layer (Supabase)

All tables have Row Level Security (RLS) enabled and are scoped to individual users via `auth.uid()`.

#### Tables Created:

1. **users**
   - `id` (UUID, primary key)
   - `email` (text, unique)
   - `name` (text, nullable)
   - `created_at` (timestamp)

2. **student_assessment**
   - Stores initial 10-question assessment
   - Unique per user (UNIQUE constraint on user_id)
   - Fields: reading_skill, writing_skill, analysis_skill, weak_questions (array), struggle_reasons, study_methods_tried (array), preferred_method, plan_structure, weekly_hours, exam_timeline

3. **study_plan**
   - Stores AI-generated personalized study plans
   - Unique per user
   - `plan_data` (JSONB) contains weekly/daily tasks
   - Auto-updates `updated_at` timestamp via trigger

4. **study_sessions**
   - Tracks all study and practice sessions
   - Stores quiz results, AI questions, notes, revision methods
   - `weak_topics_identified` populated by AI after sessions >30min

5. **practice_sessions**
   - Tracks practice question attempts
   - Stores `questions_data` (JSONB array), total_grade, weak_points
   - Supports both personalized and past_paper practice types

6. **ai_memory**
   - Long-term memory for AI personalization
   - Types: weak_topic, preferred_method, strength, misconception
   - Includes confidence_score for weighting
   - Links to source_session_id for traceability

### AI Service Layer

#### xAI Integration (`src/services/xai.ts`)

**Key Functions:**

- `searchDocuments()` - Hybrid search across Grok Collections
- `createChatCompletion()` - Chat with Grok model (grok-4-1-fast-non-reasoning)
- `searchAndChat()` - RAG pattern combining search + chat
- All functions include exponential backoff retry logic

**Collections:**
- Paper 1: `collection_6d4eefee-9853-435c-953a-f9a32d564bc6`
- Paper 2: `collection_6272e422-be1c-46c8-8c84-e3543fe83bac`
- Text Types: `collection_91875ea9-e1e1-4c94-99f0-78da587e1d40`
- Vocabulary: `collection_d421f996-e132-4f2e-a140-eb20c8d2a118`

#### AI Agents (`src/services/ai-agents.ts`)

**1. Study Plan Generator**
- Input: student_assessment data
- Process: Searches Paper 1/2 collections for marking criteria → generates 4-8 week plan
- Output: JSON with weekly focus areas and daily tasks
- Considers: weak questions, time available, exam timeline, preferred structure

**2. Study Session AI Assistant**
- Real-time help during study sessions
- Dynamically selects relevant collection based on category
- Aware of user's weak topics from ai_memory
- Keeps responses concise (2-3 sentences)

**3. Session Analyzer**
- Triggers after sessions >30 minutes
- Analyzes: quiz performance, AI questions asked, notes made
- Extracts: weak topics (granular), preferred methods, misconceptions, strengths
- Saves insights to ai_memory table

**4. Practice Marker AI**
- Searches collections for official mark schemes
- Provides: score, band level, specific strengths, improvement areas, actionable tip
- Uses exam board terminology

**5. Personalized Practice Generator**
- Combines: weak topics from ai_memory + recent practice scores
- Generates: 5-8 question sequence with progressive difficulty
- Starts easy (confidence building) → targets weaknesses → ends moderate

### API Service Layer (`src/services/api.ts`)

**Assessment Endpoints:**
- `submitAssessment(userId, assessment)` - Save initial assessment
- `getAssessment(userId)` - Retrieve user's assessment

**Study Plan Endpoints:**
- `createStudyPlan(userId)` - Generate AI plan (triggers Study Plan Generator)
- `getStudyPlan(userId)` - Retrieve existing plan

**Study Session Endpoints:**
- `startStudySession(userId, category, type)` - Create new session
- `updateStudySession(sessionId, updates)` - Update during session
- `completeStudySession(sessionId, userId)` - Finalize + trigger AI analysis
- `chatWithStudyAI(userId, message, category, history)` - Chat during study

**Practice Session Endpoints:**
- `createPracticeSession(userId, type, paperId)` - Start practice (personalized or past paper)
- `submitPracticeAnswer(userId, question, answer, maxMarks, type)` - Get AI marking
- `completePracticeSession(sessionId, data, grade, weakPoints)` - Finalize practice

**Data Retrieval:**
- `getAIMemory(userId)` - Get all AI insights
- `getStudySessions(userId, limit)` - Get study history
- `getPracticeSessions(userId, limit)` - Get practice history

### React Hooks (`src/hooks/useStudyPlatform.ts`)

**Available Hooks:**

1. `useAssessment(userId)`
   - State: assessment, loading, error
   - Methods: submitAssessment, refetch

2. `useStudyPlan(userId)`
   - State: plan, loading, error
   - Methods: generatePlan, refetch

3. `useStudySession(userId)`
   - State: currentSessionId, loading, error
   - Methods: startSession, updateSession, completeSession

4. `useStudyAI(userId, category)`
   - State: messages, loading, error
   - Methods: sendMessage, clearMessages

5. `usePracticeSession(userId)`
   - State: currentSessionId, questions, loading, error
   - Methods: startPractice, submitAnswer, completePractice

6. `useSessionHistory(userId)`
   - State: studySessions, practiceSessions, loading, error
   - Methods: refetch

7. `useAIMemory(userId)`
   - State: memory, groupedMemory, loading, error
   - Methods: refetch

## User Journeys

### 1. Initial Assessment → Study Plan

```typescript
// In Onboarding component
const { submitAssessment } = useAssessment(userId);
const { generatePlan } = useStudyPlan(userId);

// Student completes 10 questions
await submitAssessment({
  reading_skill: 'B',
  writing_skill: 'C',
  analysis_skill: 'B',
  weak_questions: ['Paper 1 Q2d', 'Paper 1 Q3'],
  // ... other fields
});

// Generate personalized plan
await generatePlan(); // Triggers AI Study Plan Generator
```

### 2. Study Session with AI

```typescript
// In Study page
const { startSession, updateSession, completeSession } = useStudySession(userId);
const { messages, sendMessage } = useStudyAI(userId, 'Paper 1 Guide/Revision');

// Start session
const sessionId = await startSession('Paper 1 Guide/Revision');

// Student asks AI questions
await sendMessage("How do I identify writer's effect?");
// AI searches Paper 1 collection and responds

// Update with quiz results
await updateSession(sessionId, {
  duration_minutes: 45,
  quiz_correct: 7,
  quiz_incorrect: 3,
  notes_made: "Learned about language techniques...",
  revision_methods: ['video', 'notes']
});

// Complete session (triggers AI analysis if >30min)
const analysis = await completeSession(sessionId);
// analysis contains: weak_topics, strengths, misconceptions
```

### 3. Practice Session

```typescript
// In Practice page
const { startPractice, submitAnswer, completePractice } = usePracticeSession(userId);

// Start personalized practice
const { sessionId, questions } = await startPractice('personalized');
// AI generates 5-8 questions targeting weak areas

// Submit answer for marking
const result = await submitAnswer(
  "Analyze how the writer creates tension in this passage",
  studentAnswer,
  8,
  "Paper 1 Q2d"
);
// result: { score: 5, max_marks: 8, band_level: "Band 2", strengths: [...], ... }

// Complete practice
await completePractice(sessionId, questionsData, totalGrade, weakPoints);
```

### 4. AI Memory Evolution

The system builds long-term memory through:

1. **Session Analysis** (after every 30+ min session)
   - Extracts weak topics from quiz errors + AI questions
   - Identifies preferred study methods
   - Detects misconceptions

2. **Practice Results**
   - Tracks weak_points from each practice session
   - Monitors grade trends

3. **Confidence Scoring**
   - weak_topic: 0.7 confidence
   - misconception: 0.8 confidence
   - strength: 0.7 confidence
   - preferred_method: 0.6 confidence

4. **Usage in Future Sessions**
   - Study AI sees weak topics when answering questions
   - Personalized practice generator prioritizes high-confidence weak topics
   - Study plan regeneration considers accumulated insights

## Integration with Frontend

### Connecting Onboarding Page

```typescript
// src/pages/Onboarding/Onboarding.tsx
import { useAssessment, useStudyPlan } from '@/hooks/useStudyPlatform';

function Onboarding() {
  const userId = 'get-from-auth-context';
  const { submitAssessment, loading } = useAssessment(userId);
  const { generatePlan } = useStudyPlan(userId);

  const handleSubmit = async (formData) => {
    const success = await submitAssessment(formData);
    if (success) {
      await generatePlan();
      navigate('/dashboard');
    }
  };

  // ... rest of component
}
```

### Connecting Study Page

```typescript
// src/pages/Study/Study.tsx
import { useStudySession, useStudyAI } from '@/hooks/useStudyPlatform';

function Study() {
  const userId = 'get-from-auth-context';
  const [category, setCategory] = useState('Paper 1 Guide/Revision');
  const { startSession, updateSession, completeSession } = useStudySession(userId);
  const { messages, sendMessage } = useStudyAI(userId, category);

  // Integrate with existing StudyInterface component
}
```

### Connecting Practice Page

```typescript
// src/pages/Practice/Practice.tsx
import { usePracticeSession } from '@/hooks/useStudyPlatform';

function Practice() {
  const userId = 'get-from-auth-context';
  const { startPractice, submitAnswer, completePractice } = usePracticeSession(userId);

  // Integrate with practice UI
}
```

## Environment Setup

1. **Create `.env` file** (copy from `.env.example`):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **xAI API Key**: Currently hardcoded in `src/services/xai.ts`. For production:
   ```typescript
   const XAI_API_KEY = import.meta.env.VITE_XAI_API_KEY;
   ```

3. **Database Migrations**: Already applied to your Supabase instance

## Testing

### Manual Testing Checklist

- [ ] Submit assessment → verify saved in student_assessment table
- [ ] Generate study plan → verify plan_data in study_plan table
- [ ] Start study session → verify new row in study_sessions
- [ ] Chat with study AI → verify responses relevant to category
- [ ] Complete 30+ min session → verify weak_topics_identified populated + ai_memory entries created
- [ ] Start personalized practice → verify questions generated based on weak topics
- [ ] Submit practice answer → verify AI marking with score + feedback
- [ ] Check AI memory → verify insights accumulate over time

### Database Advisors

Run security and performance checks:

```typescript
import { mcp__supabase__get_advisors } from '@/mcp-tools';

// Check for missing RLS policies, indexes, etc.
const { data } = await mcp__supabase__get_advisors({ type: 'security' });
```

## Known Limitations

1. **Auth Integration**: Backend assumes userId is provided. You need to integrate with your existing AuthContext to pass the authenticated user's ID.

2. **Quiz Questions**: The system tracks quiz results but doesn't include a quiz question bank. You'll need to implement quiz data separately.

3. **Video/PDF Content**: The study session UI references videos/PDFs but content URLs need to be configured.

4. **Past Paper Database**: The practice session references past papers by ID but you'll need to create a past_papers table with actual questions.

## Next Steps

1. **Integrate Authentication**: Update all hooks to get userId from AuthContext
2. **Create Quiz System**: Build quiz component with question bank
3. **Add Content URLs**: Configure video/PDF links for each study category
4. **Build Past Paper Database**: Create table + data for past paper questions
5. **Add Analytics Dashboard**: Use study_sessions + practice_sessions data for progress tracking
6. **Implement Notifications**: Remind students of scheduled tasks from study plan

## Security Considerations

- All tables have RLS policies ensuring users only access their own data
- xAI API key should be moved to server-side environment (consider Edge Functions)
- Validate all user inputs before saving to database
- Rate limit AI requests to prevent abuse

## Cost Optimization

- AI responses are cached in database (session analysis results, practice feedback)
- Document search reduces token usage vs passing full guides
- Use `grok-4-1-fast-non-reasoning` (cheaper than reasoning models)
- Implement request queuing if multiple users active simultaneously

## Support

For questions about:
- **Supabase**: Check RLS policies, table schemas, migrations
- **xAI API**: Review `src/services/xai.ts` and Grok Collections documentation
- **AI Agents**: See `src/services/ai-agents.ts` for prompts and logic
- **React Integration**: Review `src/hooks/useStudyPlatform.ts`
