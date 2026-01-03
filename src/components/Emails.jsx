import React, { useState, useMemo } from 'react'
import { PlusCircle, CheckCircle, Clock, Search, X, ChevronDown, Trash2, Save, Copy, Check, Mail, FileText } from 'lucide-react'

const EMAIL_TYPES = [
  { name: 'Catching Up', phase: 'Pre-Launch' },
  { name: 'Quick Question', phase: 'Pre-Launch' },
  { name: 'The Heads Up', phase: 'Pre-Launch' },
  { name: 'Official Outreach', phase: 'Launch' },
  { name: 'Traction Update', phase: 'Launch' },
  { name: 'Scheduling Push', phase: 'Launch' },
  { name: 'Post-Meeting Follow-Up', phase: 'Roadshow' },
  { name: 'Process Update', phase: 'Roadshow' },
  { name: 'Customer Win', phase: 'Roadshow' },
  { name: 'Partner Meeting Request', phase: 'Roadshow' },
  { name: 'Timeline Clarity', phase: 'Close' },
  { name: 'Term Sheet Received', phase: 'Close' },
  { name: 'Final Call', phase: 'Close' },
  { name: 'Graceful Close', phase: 'Close' }
]

const EMAIL_TEMPLATES = {
  'Pre-Launch': [
    {
      type: 'Catching Up',
      description: 'Reconnect with investors you know before formally launching the raise',
      subject: 'Quick catch up?',
      body: `Hi [Name],

Hope you're doing well! It's been a while since we last connected, and I wanted to reach out.

[Company] has been making great progress since we last spoke. We've [brief 1-2 sentence update on key milestone or traction].

Would love to grab coffee or hop on a quick call to catch up and hear what you're seeing in the market. I'd also appreciate any thoughts you might have as we think through our next phase of growth.

What does your calendar look like in the next week or two?

Best,
[Your Name]`
    },
    {
      type: 'Quick Question',
      description: 'Seek advice to build relationship and signal upcoming raise',
      subject: 'Quick question on [specific topic]',
      body: `Hi [Name],

I hope this finds you well. I'm reaching out because I've always valued your perspective on [specific area – market, GTM, etc.].

We're at an interesting inflection point at [Company]. We've [brief traction point] and are now thinking through [specific strategic question].

Would you have 15 minutes for a quick call? I'd love to get your thoughts on [specific question]. No pressure on timing – whenever works for you.

Thanks in advance,
[Your Name]`
    },
    {
      type: 'The Heads Up',
      description: 'Signal your upcoming raise to warm investors 2-4 weeks before launch',
      subject: 'Heads up – [Company] Series B',
      body: `Hi [Name],

I wanted to give you an early heads up – we're planning to kick off our Series B process in the coming weeks.

Since our last conversation, we've hit some exciting milestones:
• [Key metric 1 – e.g., ARR growth]
• [Key metric 2 – e.g., customer wins or expansion]
• [Key metric 3 – e.g., efficiency or product milestone]

Given your interest in [relevant sector/thesis], I wanted to make sure you had early visibility before we formally launch.

I'll be reaching out soon with more details. In the meantime, happy to share our updated deck if helpful.

Best,
[Your Name]`
    }
  ],
  'Launch': [
    {
      type: 'Official Outreach',
      description: 'The formal kick-off email when you launch your fundraise',
      subject: '[Company] Series B – [brief hook]',
      body: `Hi [Name],

I'm reaching out because we're raising our Series B and I believe [Company] could be a strong fit for [Fund Name]'s thesis around [relevant focus area].

Quick context on [Company]:
• We're building [one sentence on what you do]
• Currently at $[X]M ARR, growing [X]% YoY
• [Key differentiator or moat]
• Targeting $[X]M raise to [primary use of funds]

I've attached our deck for your review. Would love to find time to walk you through the opportunity in more detail.

Are you available for a 30-minute call next week?

Best,
[Your Name]

[Deck link or attachment]`
    },
    {
      type: 'Traction Update',
      description: 'Share momentum during the process to create urgency',
      subject: 'Quick update – [Company] momentum',
      body: `Hi [Name],

Wanted to share a quick update as our process progresses.

Since we last spoke:
• [New milestone – closed customer, hit revenue target, etc.]
• [Process update – partner meetings scheduled, strong interest from X funds]
• [Any other momentum signal]

We're continuing to move quickly and expect to have a clearer picture on timing in the next [timeframe].

If you'd like to dive deeper, I'd love to schedule a follow-up. Let me know what works on your end.

Best,
[Your Name]`
    },
    {
      type: 'Scheduling Push',
      description: "Nudge to schedule when initial outreach hasn't gotten a response",
      subject: 'Re: [Company] Series B – scheduling',
      body: `Hi [Name],

Just wanted to follow up on my note from last week. I know things get busy, so no worries if timing isn't right.

We've had strong early interest and are starting to schedule partner meetings for [timeframe]. I'd hate for you to miss the window if this is something you'd want to explore.

Would [specific day/time] or [alternative] work for a quick call?

Best,
[Your Name]`
    }
  ],
  'Roadshow': [
    {
      type: 'Post-Meeting Follow-Up',
      description: 'Send within 24 hours of every investor meeting',
      subject: 'Great connecting – [Company] follow-up',
      body: `Hi [Name],

Thank you for taking the time to meet today. I really enjoyed our conversation, particularly your questions around [specific topic discussed].

As promised, here are the follow-up materials:
• [Item 1 – additional data, customer references, etc.]
• [Item 2 – any requested information]

To recap next steps:
• [Action item 1 – e.g., you'll review with partners]
• [Action item 2 – e.g., we'll send customer intro]
• [Timeline – e.g., reconnect next week]

Please don't hesitate to reach out if any questions come up in the meantime. Looking forward to continuing the conversation.

Best,
[Your Name]`
    },
    {
      type: 'Process Update',
      description: 'Keep engaged investors informed on process momentum',
      subject: '[Company] process update',
      body: `Hi [Name],

I wanted to keep you in the loop on where things stand.

Our process has been progressing well:
• We've completed [X] partner meetings with [tier of funds]
• [Any specific momentum – LOI, deep diligence, etc.]
• We're expecting to make decisions in the next [timeframe]

I want to make sure you have everything you need to move forward on your end. Are there any additional questions or materials that would be helpful at this stage?

Happy to hop on a quick call if useful.

Best,
[Your Name]`
    },
    {
      type: 'Customer Win',
      description: 'Share significant customer or business wins during the process',
      subject: 'News – [Company] signs [Customer/Milestone]',
      body: `Hi [Name],

Wanted to share some exciting news – we just [signed/closed/launched] [Customer Name/Milestone].

This is significant because:
• [Why it matters – logo, deal size, strategic value]
• [What it signals – market validation, expansion, etc.]
• [Impact on metrics – ARR, growth rate, etc.]

Thought you'd want to know as you're evaluating the opportunity. Happy to discuss further if helpful.

Best,
[Your Name]`
    },
    {
      type: 'Partner Meeting Request',
      description: 'Request to present to the full partnership',
      subject: 'Next steps – partner meeting?',
      body: `Hi [Name],

Thank you again for the great conversations so far. Based on our discussions, it sounds like there could be a strong fit between [Company] and [Fund Name].

As we think about next steps, I wanted to see if it makes sense to schedule time with the broader partnership. We're at the stage in our process where we're starting to have those conversations with a few funds.

Would a partner meeting be the right next step on your end? If so, I'm happy to work with your team on scheduling.

Looking forward to hearing your thoughts.

Best,
[Your Name]`
    }
  ],
  'Close': [
    {
      type: 'Timeline Clarity',
      description: 'Get clear commitment on decision timeline',
      subject: '[Company] – timeline check-in',
      body: `Hi [Name],

I hope you're well. I wanted to check in on timing as we're getting closer to wrapping up our process.

We're expecting to have clarity on our round in the next [timeframe]. I want to make sure we're aligned on where things stand on your end.

A few questions:
• Is there anything else you need from us to reach a decision?
• What does your internal timeline look like?
• Are there any concerns we should address?

Happy to hop on a call to discuss. I want to make sure we're being respectful of everyone's time as we move toward close.

Best,
[Your Name]`
    },
    {
      type: 'Term Sheet Received',
      description: 'Inform other investors when you receive a term sheet',
      subject: '[Company] – process update (time sensitive)',
      body: `Hi [Name],

I wanted to let you know that we've received [a term sheet / term sheets] and are working toward a decision in the next [specific timeframe – e.g., 5 business days].

I've really valued our conversations and wanted to give you visibility before we finalize anything. If [Fund Name] is interested in being part of this round, now would be the time to let us know.

Is there anything you need from us to move quickly on your end?

Happy to jump on a call today or tomorrow to discuss.

Best,
[Your Name]`
    },
    {
      type: 'Final Call',
      description: 'Last chance before you close the round',
      subject: '[Company] – final update before close',
      body: `Hi [Name],

I wanted to reach out one more time before we finalize our round.

We're planning to sign [today/tomorrow/this week]. If there's any interest in participating, I'd need to know by [specific deadline].

I've appreciated all our conversations throughout this process. If the timing doesn't work for this round, I hope we can stay in touch for the future.

Let me know if you'd like to connect before we close.

Best,
[Your Name]`
    },
    {
      type: 'Graceful Close',
      description: "Professional close for investors who passed or didn't participate",
      subject: 'Thank you – [Company] Series B closed',
      body: `Hi [Name],

I wanted to let you know that we've closed our Series B with [Lead Investor], raising $[X]M.

Thank you for taking the time to meet with us and learn about [Company]. Even though we didn't end up working together this round, I really appreciated your thoughtful questions and feedback throughout the process.

I hope we can stay in touch. I'll continue to send periodic updates on our progress, and I'd love to reconnect as we hit future milestones.

Wishing you and the [Fund Name] team all the best.

Best,
[Your Name]`
    }
  ]
}

// Additional template categories
const ADDITIONAL_TEMPLATES = {
  'Follow-Up Sequences': [
    {
      type: 'First Follow-Up (Day 3)',
      description: 'First gentle nudge after initial outreach',
      subject: 'Re: [Previous Subject]',
      body: `Hi [Name],

Just wanted to bump this to the top of your inbox. I know you're busy, so I'll keep this brief.

We're raising our Series B and I think there's a strong fit with [Fund Name]'s focus on [relevant thesis]. Happy to share more context whenever works for you.

Would you have 20 minutes this week or next?

Best,
[Your Name]`
    },
    {
      type: 'Second Follow-Up (Day 7)',
      description: 'Add new information or social proof',
      subject: 'Re: [Previous Subject] – quick update',
      body: `Hi [Name],

Following up one more time with a quick update – since I last reached out, we've [new development: signed customer, hit milestone, got intro from X].

I'd still love to connect if there's interest. If now isn't the right time, no worries at all – just let me know and I'll circle back later.

Best,
[Your Name]`
    },
    {
      type: 'Final Follow-Up (Day 14)',
      description: 'Last attempt with clear close',
      subject: 'Re: [Previous Subject] – closing the loop',
      body: `Hi [Name],

I wanted to follow up one last time. I know timing doesn't always line up, and I don't want to clog your inbox.

If [Company] isn't a fit right now, no problem at all – I'll take you off my follow-up list. But if there's any interest, I'd love to find 20 minutes to connect before we get too far into our process.

Either way, thanks for your time.

Best,
[Your Name]`
    }
  ],
  'Special Situations': [
    {
      type: 'Warm Intro Request',
      description: 'Ask someone to make an introduction',
      subject: 'Quick favor – intro to [Investor Name]?',
      body: `Hi [Connector Name],

Hope you're doing well! I'm reaching out because I noticed you're connected to [Investor Name] at [Fund Name], and I was hoping you might be able to make an introduction.

We're raising our Series B at [Company], and I think there could be a strong fit given [Fund Name]'s focus on [relevant area].

Quick context to share with them:
• [One-liner on what you do]
• [Key traction metric]
• [Why relevant to this investor]

Totally understand if it's not a good fit or if you'd rather not – just thought I'd ask. Happy to send over a forwardable blurb if that's helpful.

Thanks so much,
[Your Name]`
    },
    {
      type: 'Warm Intro (Forwardable Blurb)',
      description: 'A blurb your connector can forward directly',
      subject: 'Intro: [Your Name] / [Company] <> [Investor Name]',
      body: `Hi [Investor Name],

I wanted to introduce you to [Your Name], CEO of [Company]. They're raising their Series B and I think it could be a great fit for [Fund Name].

[Company] is [one sentence description]. They're at $[X]M ARR growing [X]% and have customers including [notable names].

I'll let [Your Name] share more details, but wanted to make the connection. I think it's worth a look.

[Your Name] – I'll let you take it from here!

Best,
[Connector Name]`
    },
    {
      type: 'Reactivating Old Relationship',
      description: 'Reach out to an investor who passed in a previous round',
      subject: 'Checking back in – [Company] update',
      body: `Hi [Name],

I hope you're doing well. It's been a while since we last connected during our [Series A / Seed] process.

I wanted to reach out because a lot has changed since then:
• [Key growth metric since last conversation]
• [Major milestone or pivot]
• [What's different now]

I know the timing or fit wasn't right before, but I thought it was worth reconnecting given our progress. We're currently raising our Series B and I'd love to share what we've built.

Would you be open to a fresh conversation?

Best,
[Your Name]`
    },
    {
      type: 'Declining a Term Sheet',
      description: 'Professionally decline an offer',
      subject: 'Re: [Company] Term Sheet – decision',
      body: `Hi [Name],

Thank you so much for the term sheet and for your partnership's interest in [Company]. We've been incredibly impressed with [Fund Name] throughout this process.

After careful consideration, we've decided to move forward with another partner for this round. This was a difficult decision – your team's expertise in [area] and the conversations we've had made this a very close call.

I hope this doesn't close the door on working together in the future. I'd love to stay in touch and keep you updated on our progress.

Thank you again for your time and consideration.

Best,
[Your Name]`
    },
    {
      type: 'Asking for References on an Investor',
      description: "Request references from founders in an investor's portfolio",
      subject: 'Quick question about [Fund Name]',
      body: `Hi [Founder Name],

I hope you're doing well. I'm reaching out because I'm in conversations with [Fund Name] / [Partner Name] for our Series B, and I saw that they're investors in [Company].

If you have a few minutes, I'd love to hear about your experience working with them:
• How have they been as board members / partners?
• What's their style when things get challenging?
• Anything you wish you'd known before partnering with them?

Totally understand if you'd rather not share – just trying to do my diligence on our side. Happy to return the favor anytime.

Thanks so much,
[Your Name]`
    }
  ]
}

function TemplateCard({ template, onCopy, copiedId }) {
  const isCopied = copiedId === template.type

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-slate-800">{template.type}</h4>
          <p className="text-xs text-slate-500 mt-1">{template.description}</p>
        </div>
        <button
          onClick={() => onCopy(template)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isCopied
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <label className="text-xs font-medium text-slate-500">Subject:</label>
          <p className="text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded mt-1">{template.subject}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">Body:</label>
          <pre className="text-xs text-slate-600 bg-slate-50 px-2 py-2 rounded mt-1 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
            {template.body}
          </pre>
        </div>
      </div>
    </div>
  )
}

function EmailTemplates() {
  const [copiedId, setCopiedId] = useState(null)
  const [activePhase, setActivePhase] = useState('Pre-Launch')
  const [searchQuery, setSearchQuery] = useState('')

  const phases = ['Pre-Launch', 'Launch', 'Roadshow', 'Close', 'Follow-Up Sequences', 'Special Situations']

  const handleCopy = async (template) => {
    const textToCopy = `Subject: ${template.subject}\n\n${template.body}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopiedId(template.type)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getTemplatesForPhase = (phase) => {
    if (phase === 'Follow-Up Sequences' || phase === 'Special Situations') {
      return ADDITIONAL_TEMPLATES[phase] || []
    }
    return EMAIL_TEMPLATES[phase] || []
  }

  const filteredTemplates = useMemo(() => {
    const templates = getTemplatesForPhase(activePhase)
    if (!searchQuery.trim()) return templates
    const q = searchQuery.toLowerCase()
    return templates.filter(t =>
      t.type.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.body.toLowerCase().includes(q)
    )
  }, [activePhase, searchQuery])

  return (
    <div className="space-y-4">
      {/* Phase tabs */}
      <div className="bg-white rounded-lg border p-1 flex flex-wrap gap-1">
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activePhase === phase
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Phase description */}
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg border p-4">
        <h3 className="font-semibold text-slate-800 mb-1">
          {activePhase === 'Pre-Launch' && '🎯 Pre-Launch Phase'}
          {activePhase === 'Launch' && '🚀 Launch Phase'}
          {activePhase === 'Roadshow' && '🎪 Roadshow Phase'}
          {activePhase === 'Close' && '🤝 Closing Phase'}
          {activePhase === 'Follow-Up Sequences' && '🔄 Follow-Up Sequences'}
          {activePhase === 'Special Situations' && '✨ Special Situations'}
        </h3>
        <p className="text-sm text-slate-600">
          {activePhase === 'Pre-Launch' && 'Build relationships and signal your upcoming raise 4-8 weeks before launch. Focus on reconnecting with warm contacts and seeking advice.'}
          {activePhase === 'Launch' && 'Formally kick off your fundraise with compelling outreach. Share your story, metrics, and create urgency.'}
          {activePhase === 'Roadshow' && 'Keep momentum during meetings. Follow up promptly, share wins, and push toward partner meetings.'}
          {activePhase === 'Close' && 'Drive to decision. Communicate timelines clearly and close the round professionally.'}
          {activePhase === 'Follow-Up Sequences' && 'Structured follow-up cadence for when you don\'t get an initial response. Space these 3-4 days apart.'}
          {activePhase === 'Special Situations' && 'Templates for unique scenarios: intros, reactivation, declining offers, and reference checks.'}
        </p>
      </div>

      {/* Templates grid */}
      <div className="grid gap-4">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.type}
            template={template}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        ))}
        {filteredTemplates.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No templates found</p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Email Best Practices</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Personalize every email</strong> – Replace all [brackets] with specific details</li>
          <li>• <strong>Keep it short</strong> – Investors receive hundreds of emails; respect their time</li>
          <li>• <strong>Lead with metrics</strong> – Put your strongest numbers early</li>
          <li>• <strong>Clear CTA</strong> – Every email should have one clear ask</li>
          <li>• <strong>Follow up</strong> – 80% of deals happen after the 5th follow-up</li>
          <li>• <strong>Send Tuesday-Thursday</strong> – Best open rates are mid-week, 8-10am</li>
        </ul>
      </div>
    </div>
  )
}

function EmailTracker({ data, addEmail, updateEmail, deleteEmail }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ investor: '', type: '', subject: '', sent_date: '', replied: false })
  const [search, setSearch] = useState('')
  const [filterReplied, setFilterReplied] = useState('all')
  const [expandedRow, setExpandedRow] = useState(null)
  const [editData, setEditData] = useState({})

  const handleSubmit = async () => {
    if (!form.investor || !form.type) return
    await addEmail(form)
    setForm({ investor: '', type: '', subject: '', sent_date: '', replied: false })
    setShowForm(false)
  }

  const handleExpand = (email) => {
    if (expandedRow === email.id) {
      setExpandedRow(null)
      setEditData({})
    } else {
      setExpandedRow(email.id)
      setEditData({ ...email })
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (expandedRow && editData) {
      await updateEmail(expandedRow, editData)
      setExpandedRow(null)
      setEditData({})
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this email?')) {
      await deleteEmail(id)
      setExpandedRow(null)
    }
  }

  const toggleReplied = async (e, id, currentValue) => {
    e.stopPropagation()
    await updateEmail(id, { replied: !currentValue })
  }

  const filtered = useMemo(() => {
    let result = [...data.emails].reverse()
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.investor?.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q) ||
        e.subject?.toLowerCase().includes(q)
      )
    }
    if (filterReplied === 'replied') {
      result = result.filter(e => e.replied)
    } else if (filterReplied === 'waiting') {
      result = result.filter(e => !e.replied)
    }
    return result
  }, [data.emails, search, filterReplied])

  const stats = useMemo(() => {
    const total = data.emails.length
    const replied = data.emails.filter(e => e.replied).length
    return { total, replied, waiting: total - replied }
  }, [data.emails])

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-500">Total Sent</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
          <div className="text-xs text-slate-500">Replied</div>
        </div>
        <div className="bg-white rounded-lg p-3 border text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.waiting}</div>
          <div className="text-xs text-slate-500">Waiting</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={filterReplied}
          onChange={e => setFilterReplied(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white"
        >
          <option value="all">All ({stats.total})</option>
          <option value="replied">Replied ({stats.replied})</option>
          <option value="waiting">Waiting ({stats.waiting})</option>
        </select>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center space-x-1 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
        <PlusCircle size={16} /><span>Log Email</span>
      </button>

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="grid grid-cols-2 gap-2">
            <select value={form.investor} onChange={e => setForm({ ...form, investor: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="">Select Investor</option>
              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border rounded px-3 py-2 text-sm">
              <option value="">Email Type</option>
              {EMAIL_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <input placeholder="Subject Line" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="border rounded px-3 py-2 text-sm" />
            <input type="date" value={form.sent_date} onChange={e => setForm({ ...form, sent_date: e.target.value })} className="border rounded px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center space-x-2 mt-2">
            <input type="checkbox" checked={form.replied} onChange={e => setForm({ ...form, replied: e.target.checked })} />
            <span className="text-sm">Reply Received</span>
          </label>
          <div className="flex space-x-2 mt-3">
            <button onClick={handleSubmit} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="bg-slate-100 px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Investor</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden sm:table-cell">Subject</th>
                <th className="text-left px-3 py-2 font-medium text-slate-600 hidden md:table-cell">Date</th>
                <th className="text-center px-3 py-2 font-medium text-slate-600">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <React.Fragment key={e.id}>
                  <tr
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleExpand(e)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{e.investor}</div>
                      <div className="text-xs text-slate-400 sm:hidden">{e.sent_date}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      <div>{e.type}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-500 hidden sm:table-cell max-w-48 truncate">
                      {e.subject || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell">
                      {e.sent_date}
                    </td>
                    <td className="px-3 py-2 text-center" onClick={ev => ev.stopPropagation()}>
                      <button
                        onClick={(ev) => toggleReplied(ev, e.id, e.replied)}
                        className="inline-flex items-center"
                      >
                        {e.replied ? (
                          <span className="inline-flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                            <CheckCircle size={12} className="mr-1" />Replied
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">
                            <Clock size={12} className="mr-1" />Waiting
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${expandedRow === e.id ? 'rotate-180' : ''}`} />
                    </td>
                  </tr>
                  {expandedRow === e.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-slate-500 block mb-1">Investor</label>
                            <select
                              value={editData.investor || ''}
                              onChange={ev => handleEditChange('investor', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            >
                              <option value="">Select Investor</option>
                              {data.investors.map(i => <option key={i.id} value={i.firm}>{i.firm}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Email Type</label>
                            <select
                              value={editData.type || ''}
                              onChange={ev => handleEditChange('type', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            >
                              <option value="">Select Type</option>
                              {EMAIL_TYPES.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Subject</label>
                            <input
                              value={editData.subject || ''}
                              onChange={ev => handleEditChange('subject', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Date Sent</label>
                            <input
                              type="date"
                              value={editData.sent_date || ''}
                              onChange={ev => handleEditChange('sent_date', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 block mb-1">Reply Date</label>
                            <input
                              type="date"
                              value={editData.reply_date || ''}
                              onChange={ev => handleEditChange('reply_date', ev.target.value)}
                              className="w-full border rounded px-2 py-1.5"
                            />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editData.replied || false}
                                onChange={ev => handleEditChange('replied', ev.target.checked)}
                              />
                              <span className="text-slate-600">Reply Received</span>
                            </label>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="text-slate-500 block mb-1 text-xs">Notes</label>
                          <textarea
                            value={editData.notes || ''}
                            onChange={ev => handleEditChange('notes', ev.target.value)}
                            className="w-full border rounded px-2 py-1.5 text-xs"
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="flex items-center text-red-500 hover:text-red-700 text-xs"
                          >
                            <Trash2 size={12} className="mr-1" /> Delete
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setExpandedRow(null); setEditData({}) }}
                              className="px-3 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              className="flex items-center px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-700"
                            >
                              <Save size={12} className="mr-1" /> Save
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-slate-400 text-sm">No emails logged yet</p>
        )}
      </div>

      {/* Email Sequence Reference */}
      <details className="bg-blue-50 rounded-lg border border-blue-200">
        <summary className="px-3 py-2 cursor-pointer font-medium text-blue-900 text-sm">Email Sequence Reference</summary>
        <div className="px-3 pb-3 text-xs text-blue-700 space-y-1">
          <p><strong>Pre-Launch:</strong> Catching Up → Quick Question → The Heads Up</p>
          <p><strong>Launch:</strong> Official Outreach → Traction Update → Scheduling Push</p>
          <p><strong>Roadshow:</strong> Post-Meeting → Process Update → Customer Win → Partner Meeting</p>
          <p><strong>Close:</strong> Timeline Clarity → Term Sheet Received → Final Call → Graceful Close</p>
        </div>
      </details>
    </div>
  )
}

export default function Emails({ data, addEmail, updateEmail, deleteEmail }) {
  const [activeSubTab, setActiveSubTab] = useState('tracker')

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 bg-white rounded-lg border p-1">
        <button
          onClick={() => setActiveSubTab('tracker')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSubTab === 'tracker'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail size={16} />
          Tracker
        </button>
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSubTab === 'templates'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText size={16} />
          Templates
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'tracker' ? (
        <EmailTracker
          data={data}
          addEmail={addEmail}
          updateEmail={updateEmail}
          deleteEmail={deleteEmail}
        />
      ) : (
        <EmailTemplates />
      )}
    </div>
  )
}
