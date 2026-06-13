"use client"
import { useState, useRef, useEffect, useCallback } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_REPLIES = [
  "What is CCO United?",
  "How do I join a CCO?",
  "Tell me about upcoming events",
  "Tell me about the Strawberry Dispatch",
  "What tools does the platform offer?",
  "How can I get involved?",
  "Tell me about Josh Barteaux",
]

const COMPARE_CHIPS = [
  "What is CCO United?",
  "How do I join a CCO?",
  "Tell me about upcoming events",
  "Tell me about the Strawberry Dispatch",
  "Tell me about Josh Barteaux",
]

const AGENTFORCE_MOCK: Record<string, string> = {
  "What is CCO United?": "CCO United is the shared digital workspace for Cherokee Nation's Community & Cultural Outreach organizations. It connects all 106+ CCO groups on a single platform powered by Monday.com and AI.",
  "How do I join a CCO?": "To join a CCO organization, submit a Request Access inquiry through the Get Involved form on the CCO United website. A coordinator will match you with the right community organization.",
  "Tell me about upcoming events": "Upcoming events are listed on the Events page at cco-united.joshbarteaux.com/events. All approved public events from Cherokee Nation CCO organizations are shown there with dates, locations, and details.",
  "Tell me about the Strawberry Dispatch": "The Strawberry Dispatch is a food distribution program coordinated by the Keys CCO, connecting Cherokee Nation community members with fresh strawberries and other food resources. Distribution campaigns are tracked and managed through CCO United.",
  "Tell me about Josh Barteaux": "Josh Barteaux is a Salesforce QA Engineer and Certified Administrator with 15+ years of enterprise QA experience across defense, healthcare, B2B SaaS, and nonprofit environments. He built and is testing the CCO United platform — configuring Salesforce for 225,000 users, implementing Playwright automation, GitHub Actions CI/CD, and an Agentforce assistant with RAG and Data Cloud. Previously Lead QA Engineer at SiriusDecisions (acquired by Forrester for $245M) and QA Engineer at Raytheon with a DoD Secret Clearance. Learn more: [joshbarteaux.com](https://joshbarteaux.com) · [LinkedIn](https://linkedin.com/in/joshbarteaux) · [GitHub](https://github.com/murdadrum)",
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} style={{ color: '#E8B84B', fontWeight: 600 }}>{part.slice(2, -2)}</span>
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#E8B84B', textDecoration: 'underline' }}>{linkMatch[1]}</a>
    }
    return <span key={i}>{part}</span>
  })
}

function ChatColumn({
  title, accent, bg, headerBg, inputBg, bubbleUserBg, bubbleUserColor,
  messages, chips, highlightChip, streaming, onChip, inputRef, onSubmit, onKeyDown, onInput,
  placeholder, chipsExtra,
}: {
  title: React.ReactNode
  accent: string
  bg: string
  headerBg: string
  inputBg: string
  bubbleUserBg: string
  bubbleUserColor: string
  messages: Message[]
  chips: string[]
  highlightChip?: string
  streaming: boolean
  onChip: (q: string) => void
  inputRef: React.RefObject<HTMLTextAreaElement>
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onInput: (e: React.FormEvent<HTMLTextAreaElement>) => void
  placeholder: string
  chipsExtra?: React.ReactNode
}) {
  const msgsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${accent}22` }}>
      {/* Column header */}
      <div style={{ padding: '.5rem .75rem', background: headerBg, borderBottom: `1px solid ${accent}33`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{ flex: 1, overflow: 'auto', padding: '.65rem', background: bg, display: 'flex', flexDirection: 'column', gap: '.55rem', minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '90%',
            padding: '.45rem .7rem',
            borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
            fontSize: '.8rem',
            lineHeight: 1.5,
            background: m.role === 'user' ? bubbleUserBg : `${accent}18`,
            color: m.role === 'user' ? bubbleUserColor : '#F5EDD8',
            border: m.role === 'assistant' ? `1px solid ${accent}28` : 'none',
          }}>
            {m.role === 'assistant' ? renderContent(m.content) : m.content}
          </div>
        ))}
        {/* Chips shown when only the greeting is present */}
        {messages.length <= 1 && !streaming && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', alignSelf: 'flex-start', width: '100%' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
              {chips.map(q => {
                const isHighlight = highlightChip && q === highlightChip
                return (
                  <button key={q} onClick={() => onChip(q)} style={{
                    background: isHighlight ? accent : 'transparent',
                    border: `1px solid ${accent}${isHighlight ? 'ff' : '55'}`,
                    color: isHighlight ? (accent === '#C8960C' ? '#1A0F0A' : '#fff') : accent,
                    borderRadius: '20px',
                    padding: '.25rem .6rem',
                    fontSize: '.7rem',
                    cursor: 'pointer',
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: isHighlight ? 700 : 400,
                    transition: 'background .2s, opacity .2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >{q}</button>
                )
              })}
            </div>
            {chipsExtra}
          </div>
        )}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '.4rem', padding: '.55rem .65rem', background: inputBg, borderTop: `1px solid ${accent}22`, flexShrink: 0 }}>
        <textarea
          ref={inputRef}
          placeholder={placeholder}
          rows={1}
          onKeyDown={onKeyDown}
          onInput={onInput}
          style={{
            flex: 1, resize: 'none', overflow: 'hidden',
            border: `1px solid ${accent}33`, borderRadius: '8px',
            padding: '.45rem .65rem',
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '.8rem', background: bg,
            color: '#F5EDD8', outline: 'none',
          }}
        />
        <button onClick={onSubmit} disabled={streaming} aria-label="Send" style={{
          background: accent, border: 'none', borderRadius: '8px',
          width: '32px', height: '32px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: streaming ? 0.5 : 1, flexShrink: 0, alignSelf: 'flex-end',
        }}>
          <svg viewBox="0 0 16 16" fill="#fff" width="13" height="13"><path d="M15 8L1 1l3 7-3 7 14-7z" /></svg>
        </button>
      </div>

    </div>
  )
}

const SF_INSTANCE = process.env.NEXT_PUBLIC_SF_INSTANCE_URL ?? 'https://orgfarm-f8c9044497-dev-ed.develop.my.salesforce.com'

function ComparePanel({ onClose }: { onClose: () => void }) {
  const GREETING_ALIS = "Osiyo! I'm Alis — CCO United's AI assistant. Ask me anything about our platform, CCO organizations, events, or how to get involved."
  const GREETING_AF = "Hello! I'm the Agentforce assistant for CCO United. Ask me about the platform, organizations, events, or how to get involved."

  const [alisHist, setAlisHist] = useState<Message[]>([{ role: 'assistant', content: GREETING_ALIS }])
  const [afHist, setAfHist] = useState<Message[]>([{ role: 'assistant', content: GREETING_AF }])
  const [alisStreaming, setAlisStreaming] = useState(false)
  const [afStreaming, setAfStreaming] = useState(false)
  const alisInputRef = useRef<HTMLTextAreaElement>(null)
  const afInputRef = useRef<HTMLTextAreaElement>(null)

  const sendAlis = useCallback(async (text: string) => {
    if (!text.trim() || alisStreaming) return
    if (alisInputRef.current) { alisInputRef.current.value = ''; alisInputRef.current.style.height = 'auto' }
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newHist = [...alisHist, userMsg]
    setAlisHist([...newHist, { role: 'assistant', content: '…' }])
    setAlisStreaming(true)
    let out = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHist }),
      })
      if (!res.ok) throw new Error()
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let buf = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6).trim(); if (d === '[DONE]') break
          try { const p = JSON.parse(d); if (p.type === 'content_block_delta' && p.delta?.text) { out += p.delta.text; setAlisHist([...newHist, { role: 'assistant', content: out }]) } } catch { /* skip */ }
        }
      }
    } catch { out = 'Something went wrong. Please try again.'; setAlisHist([...newHist, { role: 'assistant', content: out }]) }
    finally { setAlisStreaming(false); if (out) setAlisHist([...newHist, { role: 'assistant', content: out }]) }
  }, [alisHist, alisStreaming])

  const sendAf = useCallback(async (text: string) => {
    if (!text.trim() || afStreaming) return
    if (afInputRef.current) { afInputRef.current.value = ''; afInputRef.current.style.height = 'auto' }
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newHist = [...afHist, userMsg]
    const mockReply = AGENTFORCE_MOCK[text.trim()] ?? "I'm the Agentforce assistant for CCO United. For detailed information, please visit the CCO United platform or contact a coordinator directly."
    setAfHist([...newHist, { role: 'assistant', content: '…' }])
    setAfStreaming(true)
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    setAfHist([...newHist, { role: 'assistant', content: mockReply }])
    setAfStreaming(false)
  }, [afHist, afStreaming])

  const makeHandlers = (sendFn: (t: string) => void, ref: React.RefObject<HTMLTextAreaElement>) => ({
    onSubmit: () => { const t = ref.current?.value.trim() || ''; if (t) sendFn(t) },
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = ref.current?.value.trim() || ''; if (t) sendFn(t) } },
    onInput: (e: React.FormEvent<HTMLTextAreaElement>) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 80) + 'px' },
  })

  const alisHandlers = makeHandlers(sendAlis, alisInputRef)
  const afHandlers = makeHandlers(sendAf, afInputRef)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#120A06' }}>
      {/* Two columns */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <ChatColumn
          title={<span style={{ fontFamily: 'Cinzel, serif', fontSize: '.68rem', color: '#E8B84B', letterSpacing: '.06em' }}>ALIS · ANTHROPIC</span>}
          accent="#C8960C" bg="#120A06" headerBg="#1A0F0A" inputBg="#1A0F0A"
          bubbleUserBg="#C8960C" bubbleUserColor="#1A0F0A"
          messages={alisHist} chips={COMPARE_CHIPS} highlightChip="Tell me about Josh Barteaux" streaming={alisStreaming}
          onChip={sendAlis} inputRef={alisInputRef}
          placeholder="Ask Alis…"
          {...alisHandlers}
        />
        <ChatColumn
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '.68rem', color: '#00A0E6', letterSpacing: '.06em' }}>AGENTFORCE</span>
                <span style={{ fontSize: '.6rem', color: 'rgba(0,160,230,0.5)' }}>(mock)</span>
              </div>
              <a
                href={SF_INSTANCE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'rgba(0,160,230,0.12)',
                  border: '1px solid rgba(0,160,230,0.3)',
                  borderRadius: '6px', padding: '.2rem .45rem',
                  color: '#00A0E6', fontSize: '.62rem',
                  textDecoration: 'none', letterSpacing: '.03em',
                  fontFamily: "'Source Sans 3', sans-serif",
                  transition: 'background .2s', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,160,230,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,160,230,0.12)')}
              >View in Salesforce</a>
            </div>
          }
          accent="#00A0E6" bg="#0d1820" headerBg="#0f1923" inputBg="#0f1923"
          bubbleUserBg="#00A0E6" bubbleUserColor="#fff"
          messages={afHist} chips={COMPARE_CHIPS} highlightChip="Tell me about Josh Barteaux" streaming={afStreaming}
          onChip={sendAf} inputRef={afInputRef}
          placeholder="Ask Agentforce…"
          {...afHandlers}
        />
      </div>

      {/* Footer */}
      <div style={{ padding: '.4rem .75rem', borderTop: '1px solid rgba(200,150,12,0.12)', background: '#1A0F0A', flexShrink: 0, textAlign: 'center' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(232,184,75,0.55)', fontSize: '.72rem', cursor: 'pointer', letterSpacing: '.04em' }}>
          ← Back to chat
        </button>
      </div>
    </div>
  )
}

export default function AliWidget() {
  const [collapsed, setCollapsed] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [hist, setHist] = useState<Message[]>([])
  const [showChips, setShowChips] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHist([{ role: 'assistant', content: "Osiyo! I'm Alis — CCO United's AI assistant. Ask me anything about our platform, CCO organizations, events, or how to get involved." }])
  }, [])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [hist])

  const sendMsg = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.style.height = 'auto' }
    setShowChips(false)
    const userMsg: Message = { role: 'user', content: text.trim() }
    const newHist = [...hist, userMsg]
    setHist([...newHist, { role: 'assistant', content: '…' }])
    setStreaming(true)

    let out = ''
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHist }),
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop()!
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const d = line.slice(6).trim()
          if (d === '[DONE]') break
          try {
            const p = JSON.parse(d)
            if (p.type === 'content_block_delta' && p.delta?.text) {
              out += p.delta.text
              setHist([...newHist, { role: 'assistant', content: out }])
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      console.error('Alis chat error', err)
      out = 'Something went wrong. Please try again.'
      setHist([...newHist, { role: 'assistant', content: out }])
    } finally {
      setStreaming(false)
      if (out) setHist([...newHist, { role: 'assistant', content: out }])
    }
  }, [hist, streaming])

  const onSubmit = () => {
    const text = inputRef.current?.value.trim() || ''
    if (text) sendMsg(text)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() }
  }

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const t = e.currentTarget
    t.style.height = 'auto'
    t.style.height = Math.min(t.scrollHeight, 120) + 'px'
  }

  const widgetWidth = compareMode && !collapsed ? 680 : 360

  return (
    <div
      id="ali-widget"
      style={{
        maxHeight: collapsed ? '54px' : '560px',
        width: `${widgetWidth}px`,
        transition: 'max-height .35s cubic-bezier(0.4,0,0.2,1), width .3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div id="ali-header" onClick={() => setCollapsed(c => !c)}>
        <div className="ali-hname">Alisdelisgi · ᎠᎵᏍᏓᎵᏍᎩ</div>
        <div className="ali-hright">
          {!collapsed && (
            <button
              onClick={e => { e.stopPropagation(); setCompareMode(m => !m) }}
              title={compareMode ? 'Single chat' : 'Compare with Agentforce'}
              style={{
                background: compareMode ? 'rgba(200,150,12,0.18)' : 'none',
                border: `1px solid ${compareMode ? '#C8960C' : 'rgba(200,150,12,0.3)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#E8B84B',
                fontSize: '.65rem',
                padding: '.2rem .45rem',
                marginRight: '.5rem',
                letterSpacing: '.04em',
                fontFamily: "'Source Sans 3', sans-serif",
                transition: 'all .2s',
              }}
            >Agentforce</button>
          )}
          <div className="ali-hdot"></div>
          <button
            id="ali-toggle"
            aria-label={collapsed ? 'Expand chat' : 'Collapse chat'}
            onClick={e => { e.stopPropagation(); setCollapsed(c => !c) }}
          >{collapsed ? '+' : '−'}</button>
        </div>
      </div>

      {!collapsed && compareMode ? (
        <ComparePanel onClose={() => setCompareMode(false)} />
      ) : (
        <>
          <div id="ali-msgs" ref={msgsRef} style={{ display: collapsed ? 'none' : 'flex' }}>
            <div style={{ alignSelf: 'flex-start', padding: '0 .25rem .25rem', borderBottom: '1px solid rgba(200,150,12,0.1)', marginBottom: '.25rem', width: '100%' }}>
              <div className="ali-hsub">Uh-lee-s-deh-lee-s-gee</div>
              <div className="ali-hsub">&ldquo;One who helps&rdquo;</div>
            </div>
            {hist.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '.55rem .85rem',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '.9rem',
                  lineHeight: 1.55,
                  background: m.role === 'user' ? '#C8960C' : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? '#1A0F0A' : '#F5EDD8',
                }}
              >{m.role === 'assistant' ? renderContent(m.content) : m.content}</div>
            ))}
            {showChips && !streaming && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', padding: '.25rem 0', alignSelf: 'flex-start' }}>
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMsg(q)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(200,150,12,0.45)',
                      color: '#E8B84B',
                      borderRadius: '20px',
                      padding: '.3rem .75rem',
                      fontSize: '.75rem',
                      cursor: 'pointer',
                      fontFamily: "'Source Sans 3', sans-serif",
                      letterSpacing: '.04em',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(200,150,12,0.12)'; (e.target as HTMLButtonElement).style.borderColor = '#C8960C' }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.borderColor = 'rgba(200,150,12,0.45)' }}
                  >{q}</button>
                ))}
              </div>
            )}
          </div>
          <div id="ali-row" style={{ display: collapsed ? 'none' : 'flex' }}>
            <textarea
              id="ali-input"
              ref={inputRef}
              placeholder="Ask Alisdelisgi…"
              rows={1}
              onKeyDown={onKeyDown}
              onInput={onInput}
            />
            <button id="ali-send" onClick={onSubmit} disabled={streaming} aria-label="Send message">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M15 8L1 1l3 7-3 7 14-7z" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
