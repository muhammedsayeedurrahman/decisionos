# Phase 2: AI-Powered Features - Implementation Roadmap

**Status**: 🚧 In Progress
**Started**: 2026-08-14
**Estimated Duration**: 2-3 weeks

## Overview

Phase 2 builds on the UX foundations from Phase 1 by adding AI-powered intelligence to DecisionOS, making it competitive with leading tools like Todoist Pro (AI Task Assist), Swiss Army Knife AI (document intelligence), and Otter.ai (multi-language transcription).

---

## ✅ Completed

### 1. Multi-Language Voice Support (STARTED)

**Status**: 60% Complete

**Files Created:**
- ✅ `src/types/languages.ts` - Language definitions (15 languages + auto-detect)
- ✅ `src/components/ui/LanguageSelector.tsx` - Language picker dropdown
- ✅ Updated `src/lib/whisper/client.ts` - Added language parameter support

**Next Steps:**
- [ ] Update `useAudioRecorder` hook to accept language parameter
- [ ] Update `/api/transcribe` route to pass language to Whisper API
- [ ] Integrate LanguageSelector into VoiceRecorder component
- [ ] Store language preference in user profile (not just localStorage)
- [ ] Add language confidence score display

**Languages Supported:**
- 🇺🇸 English
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇮🇳 Hindi
- 🇯🇵 Japanese
- 🇰🇷 Korean
- 🇨🇳 Chinese
- 🇧🇷 Portuguese
- 🇷🇺 Russian
- 🇮🇹 Italian
- 🇸🇦 Arabic
- 🇹🇷 Turkish
- 🇻🇳 Vietnamese
- 🇹🇭 Thai
- 🌐 Auto-detect

---

## 🎯 High Priority (Week 1-2)

### 2. AI Task Breakdown Assistant

**Goal**: Automatically decompose large tasks into actionable subtasks using GPT-4

**Implementation Plan:**

**Backend (`/api/task-breakdown`):**
```typescript
POST /api/task-breakdown
Body: {
  task: string,
  context?: string, // Workspace context
  workspaceId: string
}

Response: {
  subtasks: Array<{
    title: string,
    description: string,
    estimatedHours: number,
    priority: 'HIGH' | 'MEDIUM' | 'LOW',
    suggestedAssignee?: Role
  }>,
  duplicates: Array<TaskId>, // Existing similar tasks
  checklist: string[]
}
```

**Frontend Components:**
- [ ] `TaskBreakdownModal.tsx` - Shows AI-generated subtasks
- [ ] `TaskDetailsPanel` - Add "Break Down Task" button
- [ ] `useTaskBreakdown` hook - Handles API calls

**AI Prompt Engineering:**
```
Given this task: "{task}"

Context: SME textile manufacturing business with roles: Owner, Sales, Production, Finance

Analyze and provide:
1. Break down into 3-7 actionable subtasks
2. Estimate effort for each (in hours)
3. Suggest priority level
4. Detect if similar tasks exist in workspace
5. Generate checklist items

Format as JSON...
```

**Estimated Time**: 6-8 hours

---

### 3. Document Intelligence (RAG)

**Goal**: Semantic search and Q&A over uploaded documents using vector embeddings

**Database Schema:**
```sql
CREATE EXTENSION vector;

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  file_id UUID REFERENCES uploads(id),
  chunk_text TEXT NOT NULL,
  chunk_index INT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**API Endpoints:**
```typescript
// 1. Generate embeddings when document uploaded
POST /api/document/embed
Body: { fileId: string, workspaceId: string }
Response: { chunks: number, processingTime: number }

// 2. Semantic search
POST /api/document/search
Body: { query: string, workspaceId: string, limit?: number }
Response: {
  results: Array<{
    text: string,
    score: number,
    fileName: string,
    fileId: string,
    chunkIndex: number
  }>
}

// 3. Ask question about document
POST /api/document/ask
Body: { question: string, fileId: string }
Response: {
  answer: string,
  sources: Array<{ text: string, page: number }>
}
```

**Frontend Components:**
- [ ] `DocumentSearchBar.tsx` - Semantic search interface
- [ ] `DocumentQA.tsx` - Ask questions about uploaded PDFs
- [ ] `SearchResults.tsx` - Display results with highlighting
- [ ] Auto-embed on file upload (background job)

**Tech Stack:**
- Neon Postgres + pgvector extension
- OpenAI `text-embedding-ada-002` for embeddings
- GPT-4 for question answering
- PDF.js for text extraction

**Estimated Time**: 12-16 hours

---

### 4. In-App File Preview

**Goal**: Preview PDFs, images, videos without leaving the app

**Implementation:**

**Install Dependencies:**
```bash
npm install react-pdf pdfjs-dist
npm install @types/react-pdf -D
```

**Components:**
- [ ] `FilePreviewModal.tsx` - Main preview modal
- [ ] `PDFViewer.tsx` - PDF rendering with react-pdf
- [ ] `ImageViewer.tsx` - Image preview with zoom
- [ ] `VideoPlayer.tsx` - Video playback
- [ ] `TextViewer.tsx` - Text file viewer with syntax highlighting

**Features:**
- Zoom in/out for PDFs and images
- Page navigation for PDFs
- Download and share buttons
- Keyboard shortcuts (arrow keys for pages, ESC to close)
- Loading states and error handling
- Thumbnail strip for multi-page PDFs

**Estimated Time**: 8-10 hours

---

## 📅 Medium Priority (Week 2-3)

### 5. Threaded Comments with @Mentions

**Goal**: Enable team collaboration on tasks with threaded discussions

**Database Schema:**
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threading
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb, -- Array of user IDs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);
```

**Components:**
- [ ] `CommentThread.tsx` - Main comment list
- [ ] `CommentInput.tsx` - Rich text editor with @ autocomplete
- [ ] `CommentItem.tsx` - Single comment with actions
- [ ] `MentionAutocomplete.tsx` - @ mention dropdown
- [ ] `useComments` hook - Real-time comment subscriptions

**Real-Time Features:**
- Supabase Realtime subscription for new comments
- "User is typing..." indicator
- Optimistic UI updates
- Notification on @mention

**Estimated Time**: 10-12 hours

---

## 🔄 Low Priority (Week 3+)

### 6. Advanced Features

**Smart Notifications:**
- Digest mode (hourly/daily summary instead of instant)
- Intelligent filtering (high priority only)
- Do not disturb schedule
- Push notifications (Web Push API)

**Meeting Prep Agent:**
- Scan Google Calendar for upcoming meetings
- Pull related emails, Slack messages, documents
- Generate meeting brief with context
- Suggest agenda items

**Multi-Model AI Routing:**
- Use GPT-4 for complex analysis
- Use GPT-3.5 for simple tasks (cost optimization)
- Use Claude for long-context tasks
- Model selection based on task complexity

---

## 📊 Success Metrics

**Phase 2 Goals:**
- [ ] **50%+ of tasks** auto-broken down by AI
- [ ] **15+ languages** supported for voice
- [ ] **10+ documents** with semantic search working
- [ ] **@mentions** drive 30%+ of collaboration
- [ ] **File preview** reduces external app usage by 80%

**Performance Targets:**
- Task breakdown: < 3 seconds
- Document embedding: < 30 seconds per PDF
- Semantic search: < 1 second
- Comment posting: < 500ms (with real-time)

---

## 🛠️ Technical Decisions

### AI Model Selection

| Feature | Model | Reasoning |
|---------|-------|-----------|
| Task Breakdown | GPT-4 | Complex reasoning, better subtask generation |
| Document Q&A | GPT-4 | Long context, better answers |
| Embeddings | text-embedding-ada-002 | Cost-effective, good quality |
| Transcription | Whisper-1 | Best in class, 50+ languages |

### Database Optimizations

- Use pgvector with IVFFlat index for fast semantic search
- Partition comments table by workspace_id for multi-tenancy
- Real-time subscriptions only for active workspace
- Cache embeddings to avoid regeneration

---

## 🚀 Deployment Strategy

### Staging Rollout (Week 1)
1. Deploy multi-language voice to staging
2. User testing with 5-10 beta users
3. Collect language detection accuracy metrics

### Production Rollout (Week 2)
1. Feature flags for gradual rollout
2. Monitor OpenAI API costs and usage
3. A/B test task breakdown prompts
4. Gather user feedback

### Full Launch (Week 3)
1. Public announcement of AI features
2. Update marketing site with new capabilities
3. Create tutorial videos for each feature
4. Monitor performance and iterate

---

## 💰 Cost Estimates

**OpenAI API Costs (Monthly, 100 Active Users):**
- Transcription (Whisper): ~$30-50 (1000 minutes @ $0.006/min)
- Task Breakdown (GPT-4): ~$50-100 (5000 requests @ $0.01/request)
- Document Q&A (GPT-4): ~$100-200 (2000 questions @ $0.05/question)
- Embeddings (ada-002): ~$10-20 (500 documents @ $0.0001/1K tokens)

**Total**: $190-370/month for 100 users
**Per User**: $1.90-3.70/month

---

## 📚 References

- [OpenAI Whisper Language Support](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [React-PDF Documentation](https://react-pdf.org/)
- [Todoist AI Features](https://todoist.com/ai) - Competitive benchmark

---

**Next Action**: Complete multi-language voice support, then move to AI task breakdown.
