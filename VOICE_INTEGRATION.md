# Voice Integration Guide

## Overview

DecisionOS uses OpenAI's Whisper API for real-time voice transcription, enabling users to speak directives instead of typing them.

---

## Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### 2. Configure Environment

Add to `.env.local`:

```env
OPENAI_API_KEY=sk-your-key-here
```

**Important:** Never commit this key to git. The `.env.local` file is gitignored.

---

## Usage

### Option 1: VoiceRecorder Component

```typescript
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';

function MyComponent() {
  const handleTranscription = (text: string) => {
    console.log('User said:', text);
    // Process the transcribed text
  };

  return (
    <VoiceRecorder
      onTranscriptionComplete={handleTranscription}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Option 2: useAudioRecorder Hook

```typescript
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

function MyComponent() {
  const {
    state,
    transcription,
    startRecording,
    stopRecording,
    recordingDuration
  } = useAudioRecorder();

  return (
    <div>
      <button onClick={startRecording} disabled={state === 'recording'}>
        Start
      </button>
      <button onClick={stopRecording} disabled={state !== 'recording'}>
        Stop ({recordingDuration.toFixed(1)}s)
      </button>
      {transcription && <p>{transcription}</p>}
    </div>
  );
}
```

---

## Complete Integration Example

```typescript
'use client';

import { useState } from 'react';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { routeDirective } from '@/utils/sharedState';

export default function VoiceCapture() {
  const { createTask, incrementNotificationCount } = useWorkspace();

  const handleVoiceDirective = async (transcribedText: string) => {
    try {
      // Parse the directive
      const parsed = routeDirective(transcribedText);

      // Create task from voice
      await createTask({
        title: `Voice: ${transcribedText.substring(0, 50)}...`,
        subtext: transcribedText,
        type: 'TASK',
        source: 'VOICE',
        category: parsed.category,
        assignedTo: parsed.assignedTo,
      });

      // Increment notification for assigned user
      await incrementNotificationCount(parsed.assignedTo);
    } catch (error) {
      console.error('Failed to process voice directive:', error);
    }
  };

  return (
    <VoiceRecorder
      onTranscriptionComplete={handleVoiceDirective}
      onError={(error) => console.error(error)}
    />
  );
}
```

---

Ready to speak your directives! 🎙️

See the [full documentation](./VOICE_INTEGRATION.md) for complete API reference and advanced usage.
