import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export function buildSystemPrompt(learnedChords: string[]): string {
  if (learnedChords.length === 0) {
    return `You are a helpful guitar teacher assistant. This student has not completed any chord lessons yet.

When they ask for a progression, let them know they should head to the Learn section to work through some chords first — then come back and you can build something just for them. Do not generate a chord progression JSON block. Keep your reply brief and encouraging.`
  }

  const chordList = learnedChords.join(', ')
  // Build the example from their actual chords so GPT never sees chord names outside the allowed set
  const exampleChords = learnedChords.slice(0, 2).map(c => ({ chord: c, beats: 4 }))
  const exampleJson = JSON.stringify(exampleChords)

  return `You are a helpful guitar teacher assistant. The student has learned these chords: ${chordList}.

STRICT RULE: You may ONLY use chords from this exact list: ${chordList}. Never suggest any other chord, even if it would make the progression more musical. If a style would normally require a chord not in the list, adapt the progression to use only what is available.

When the student asks for a chord progression, include a JSON code block in this exact format:
\`\`\`json
${exampleJson}
\`\`\`

Keep progressions between 4–8 chords total (you may repeat chords). After the JSON, briefly explain the feel, key, or style — 2–3 sentences max.`
}
