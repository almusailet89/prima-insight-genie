import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const SYSTEM = `You are "Prima Insight Genie", a senior FP&A assistant. Explain variances clearly, use only provided data.`

app.post('/api/chat', async (req, res) => {
  try {
    const { question, data } = req.body ?? {}
    const messages = [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: JSON.stringify({ question, data }) }
    ] as OpenAI.Chat.ChatCompletionMessageParam[]

    const r = await openai.chat.completions.create({ model: MODEL, messages, temperature: 0.2 })
    res.json({ ok: true, answer: r.choices[0]?.message?.content ?? '' })
  } catch (e:any) {
    res.status(400).json({ ok:false, error: e?.message ?? 'Bad request' })
  }
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => console.log(`[api] http://localhost:${port}`))
