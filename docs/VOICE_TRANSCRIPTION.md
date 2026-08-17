# Voice Transcription Guide

DecisionOS now supports **two voice transcription methods**:

## 1. Web Speech API (Real-Time) ✨ NEW

**Browser-native, real-time transcription with no server required.**

### Features
- ✅ **Real-time streaming** - See text appear as you speak
- ✅ **Free** - No API costs
- ✅ **Fast** - Instant transcription
- ✅ **Offline capable** - Works without internet (browser-dependent)
- ✅ **Multi-language** - Supports 100+ languages
- ✅ **Interim results** - Live feedback while speaking

### Browser Support
| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support |
| Safari (iOS 14.5+) | ✅ Full support |
| Firefox | ⚠️ Limited support |
| Opera | ✅ Full support |

### Usage

#### Option A: RealTimeVoiceInput Component

```typescript
import { RealTimeVoiceInput } from '@/components/ui/RealTimeVoiceInput';

function MyComponent() {
  return (
    <RealTimeVoiceInput
      language="en-US" // or "hi-IN" for Hindi
      onTranscriptionComplete={(text) => {
        console.log('Final transcription:', text);
      }}
      onTranscriptionUpdate={(text, isFinal) => {
        console.log('Live update:', text, 'Final?', isFinal);
      }}
      autoSubmit={true} // Auto-submit when user stops speaking
      placeholder="Click to start speaking..."
    />
  );
}
```

#### Option B: useWebSpeechRecognition Hook

```typescript
import { useWebSpeechRecognition } from '@/hooks/useWebSpeechRecognition';

function MyComponent() {
  const {
    state,
    isListening,
    transcription,
    interimTranscription,
    error,
    startListening,
    stopListening,
    reset,
    isSupported,
  } = useWebSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    onTranscriptionUpdate: (text, isFinal) => {
      console.log('Update:', text, isFinal);
    },
  });

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        Start Listening
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Stop Listening
      </button>

      {isListening && <p>Listening: {interimTranscription}</p>}
      {transcription && <p>Final: {transcription}</p>}
    </div>
  );
}
```

### Supported Languages

Common language codes:
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `hi-IN` - Hindi (India)
- `es-ES` - Spanish (Spain)
- `fr-FR` - French (France)
- `de-DE` - German (Germany)
- `ja-JP` - Japanese (Japan)
- `zh-CN` - Chinese (Simplified)
- `ar-SA` - Arabic (Saudi Arabia)

[Full list of BCP 47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag)

---

## 2. Whisper API (High Accuracy)

**OpenAI Whisper API for maximum accuracy.**

### Features
- ✅ **Highest accuracy** - State-of-the-art transcription
- ✅ **Multi-language** - 99 languages
- ✅ **Automatic language detection**
- ✅ **Noise robust** - Works in noisy environments
- ⚠️ **Requires server** - Needs API key
- ⚠️ **Cost** - $0.006 per minute

### Usage

```typescript
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';

function MyComponent() {
  return (
    <VoiceRecorder
      onTranscriptionComplete={(text) => {
        console.log('Transcribed:', text);
      }}
      onError={(error) => {
        console.error('Error:', error);
      }}
    />
  );
}
```

---

## Comparison

| Feature | Web Speech API | Whisper API |
|---------|----------------|-------------|
| **Speed** | Instant (real-time) | 2-5 seconds delay |
| **Cost** | Free | $0.006/min |
| **Accuracy** | Good (90-95%) | Excellent (95-99%) |
| **Languages** | 100+ | 99 |
| **Offline** | Partial (browser-dependent) | No |
| **Live feedback** | Yes (streaming) | No (batch) |
| **Server required** | No | Yes |
| **Best for** | Quick inputs, mobile | Long recordings, critical accuracy |

---

## When to Use Which?

### Use Web Speech API when:
- ✅ Quick voice inputs (task creation, notes)
- ✅ Mobile/on-the-go usage
- ✅ Need real-time feedback
- ✅ Want to minimize costs
- ✅ Good internet not guaranteed

### Use Whisper API when:
- ✅ Recording long sessions (meetings, dictation)
- ✅ Transcription accuracy is critical
- ✅ Noisy environments
- ✅ Need automatic language detection
- ✅ Archival/legal transcriptions

---

## Integration in DecisionOS

### Capture Bar (Desk Tab)

The Capture Bar at the bottom of the Desk tab supports both methods:

1. **Quick Voice Input** (Web Speech API)
   - Click the microphone icon
   - Start speaking immediately
   - See live transcription
   - Press Enter or stop speaking to create task

2. **Voice Upload** (Whisper API)
   - Click upload icon → Record audio
   - Record your message
   - Stop recording
   - Wait for transcription
   - Review and submit

### Settings

Configure default transcription method in Settings → Preferences:
- **Quick Mode** (Web Speech API) - Default
- **Accuracy Mode** (Whisper API) - Requires API key

---

## Troubleshooting

### Web Speech API

**"Speech recognition not supported"**
- Use Chrome, Edge, or Safari
- Update browser to latest version

**"Microphone permission denied"**
- Allow microphone access in browser settings
- Check system microphone permissions

**"No speech detected"**
- Speak clearly and louder
- Check microphone is working
- Reduce background noise

**Transcription stops after a few seconds**
- This is normal for some browsers
- Click mic again to continue
- Use continuous mode: `continuous: true`

### Whisper API

**"Transcription failed"**
- Check OpenAI API key is configured
- Verify API key has credits
- Check network connection

**Slow transcription**
- API response time varies (2-5 seconds)
- Consider using Web Speech API for quick inputs

---

## Privacy & Security

### Web Speech API
- Audio is processed by the browser's speech service
- On Chrome/Edge: Audio sent to Google servers
- On Safari: Audio processed on-device (iOS 15+)
- No audio is stored by DecisionOS

### Whisper API
- Audio sent to OpenAI servers for transcription
- Audio not stored by OpenAI after transcription
- No audio is stored by DecisionOS
- See [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy)

**Recommendation**: Use Web Speech API for sensitive information.

---

## Examples

### Create Task with Voice

```typescript
import { RealTimeVoiceInput } from '@/components/ui/RealTimeVoiceInput';

function QuickTaskCapture() {
  const handleVoiceInput = (text: string) => {
    // Create task from voice input
    createTask({
      title: text,
      category: classifyCategory(text),
      assignedTo: determineAssignee(text),
    });
  };

  return (
    <RealTimeVoiceInput
      language="en-US"
      onTranscriptionComplete={handleVoiceInput}
      autoSubmit={true}
      placeholder="Say something like: 'Call customer about invoice 1234'"
    />
  );
}
```

### Dictate Long Notes

```typescript
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';

function MeetingNotes() {
  const handleTranscription = (text: string) => {
    // Save meeting notes
    saveMeetingNotes(text);
  };

  return (
    <VoiceRecorder
      onTranscriptionComplete={handleTranscription}
    />
  );
}
```

---

## Next Steps

1. ✅ Try Web Speech API in the Capture Bar
2. ✅ Test with different languages
3. ✅ Configure Whisper API for high-accuracy needs
4. 📖 Read [Web Speech API docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
5. 📖 Read [OpenAI Whisper docs](https://platform.openai.com/docs/guides/speech-to-text)

---

**Questions?** Open an issue or check the [Voice Transcription FAQ](./FAQ.md#voice-transcription).
