// Mock mail data for a static demo (thread-friendly)
window.MAIL_DEMO_DATA = {
  folders: [
    { id: "inbox", name: "Inbox", icon: "📥" },
    { id: "starred", name: "Starred", icon: "⭐" },
    { id: "sent", name: "Sent", icon: "📤" },
    { id: "drafts", name: "Drafts", icon: "📝" },
    { id: "archive", name: "Archive", icon: "📦" },
    { id: "spam", name: "Spam", icon: "🚫" },
    { id: "trash", name: "Trash", icon: "🗑️" }
  ],
  messages: [
    // --- Seed messages (kept; mailbox updated) ---
    {
      id: "m1",
      folder: "inbox",
      from: "Support Team <support@example.com>",
      to: "demo_user@nsats.com",
      subject: "Welcome to Mail Demo",
      date: "2026-01-27T08:10:00Z",
      unread: true,
      body:
`Hi there,

This is a static email UI demo. Nothing is actually sent or received.

Try:
- Search “invoice”
- Press j/k to move
- Press u to toggle unread

Regards,
Support`
    },
    {
      id: "m2",
      folder: "inbox",
      from: "Billing <billing@example.com>",
      to: "demo_user@nsats.com",
      subject: "Invoice #1042 is ready",
      date: "2026-01-26T17:40:00Z",
      unread: false,
      body:
`Hello,

Your invoice #1042 is ready for review.

Thanks,
Billing`
    },
    {
      id: "m3",
      folder: "inbox",
      from: "HR <hr@example.com>",
      to: "demo_user@nsats.com",
      subject: "Policy update: remote work",
      date: "2026-01-20T09:05:00Z",
      unread: true,
      body:
`Team,

We’ve published a minor update to the remote work policy.

Best,
HR`
    },
    {
      id: "m4",
      folder: "sent",
      from: "demo_user@nsats.com",
      to: "ops@example.com",
      subject: "Re: Access request",
      date: "2026-01-22T14:15:00Z",
      unread: false,
      body:
`Approved. Please proceed and keep me posted.`
    },
    {
      id: "m5",
      folder: "spam",
      from: "“Prize Center” <win-now@shady.tld>",
      to: "demo_user@nsats.com",
      subject: "You were selected!!!",
      date: "2026-01-19T03:20:00Z",
      unread: false,
      body:
`Congratulations! Click here to claim your prize...`
    }
  ]
};

/* --- Add bulk dummy messages (threaded, realistic, no seed removal) --- */
(function generateBulkMail(){
  const ME = "demo_user@nsats.com";

  const senders = [
    "Alerts <alerts@nsats.com>",
    "Security Ops <soc@nsats.com>",
    "Vendors <vendor@market.example>",
    "Finance <finance@nsats.com>",
    "IT Helpdesk <helpdesk@nsats.com>",
    "Recruiting <talent@nsats.com>",
    "Newsletters <updates@newsletter.example>",
    "DevOps <devops@nsats.com>",
    "Legal <legal@nsats.com>",
    "Project Team <project@nsats.com>"
  ];

  const threadTopics = [
    "Quarterly report draft",
    "Meeting notes and next steps",
    "Action required: password rotation",
    "Service status update",
    "Invoice reminder",
    "Travel request confirmation",
    "Security advisory summary",
    "Policy acknowledgement required",
    "Release checklist",
    "Incident follow-up",
    "Supplier onboarding: compliance",
    "VPN access review",
    "Change request approval",
    "SOC escalation: suspicious login",
    "Weekly status: platform rollout",
    "Data retention notice",
    "Contract redlines and comments",
    "Endpoint agent rollout",
    "Customer ticket escalation",
    "Maintenance window notification"
  ];

  const paragraphs = [
`Hello,

Sharing a quick update for visibility. Please review the details below and reply if anything looks off.

Regards,`,
`Hi,

This is a generated message for the mail demo. It includes multiple lines so the list preview looks realistic.

Thanks,`,
`Team,

No action required at this time. This is informational and logged for audit context in the demo environment.

Best,`,
`Hello,

Attached summary is a placeholder (demo). Please cross-check the reference ID and folder label for consistency.

Kind regards,`,
`Hi,

Testing end-to-end UI behaviors: pagination, preview rendering, unread state changes, and simulated decompression notices.

— NSATS Mail Demo`
  ];

  function pad(n){ return String(n).padStart(2,"0"); }

  // Make many real threads: 240 threads, average 5 messages/thread = 1200
  const THREADS = 240;
  const PER_THREAD_AVG = 5;
  const total = THREADS * PER_THREAD_AVG; // 1200

  const base = new Date("2026-01-27T09:00:00Z").getTime();

  // Pre-create thread metadata (topic + participants + folder)
  const threadMeta = Array.from({ length: THREADS }, (_, t) => {
    const topic = threadTopics[t % threadTopics.length];
    const ref = `T${pad(Math.floor(t/10))}${pad(t%10)}`;
    const sender = senders[t % senders.length];

    // Folder distribution
    const roll = t % 24;
    const folder =
      roll === 0 ? "spam" :
      roll === 1 ? "drafts" :
      roll === 2 ? "sent" :
      roll === 3 ? "archive" :
      "inbox";

    return { topic, ref, sender, folder };
  });

  let idCounter = 1;

  for (let t = 0; t < THREADS; t++){
    const meta = threadMeta[t];

    for (let k = 0; k < PER_THREAD_AVG; k++){
      const i = idCounter++;

      const folder = meta.folder;
      const isSentThread = folder === "sent";

      // Alternate senders within a thread to simulate conversation
      const from = (isSentThread || k % 2 === 1) ? ME : meta.sender;
      const to = (isSentThread || k % 2 === 1) ? `recipient${t}@example.com` : ME;

      // Subject evolves with Re:/Fwd:
      const baseSubject = `${meta.topic} — Ref ${meta.ref}`;
      const subject =
        k === 0 ? baseSubject :
        k === 1 ? `Re: ${baseSubject}` :
        k === 2 ? `Re: Re: ${baseSubject}` :
        `Re: ${baseSubject}`;

      const body = `${paragraphs[(t + k) % paragraphs.length]}

Reference: DEMO-${meta.ref}-${pad(k)}
Thread: ${meta.topic}
Folder: ${folder}
Notes: Multi-line content is intentionally included to improve list rendering and preview realism.

Context:
- Item ${pad(k + 1)} of ${PER_THREAD_AVG}
- This is part of a threaded demo conversation.`;

      // Spread dates backward but keep thread messages close together
      const minutesBack = (t * 11) + (k * 23);
      const date = new Date(base - minutesBack * 60 * 1000).toISOString();

      window.MAIL_DEMO_DATA.messages.push({
        id: "bulk_" + i,
        folder,
        from,
        to,
        subject,
        date,
        unread: ((t + k) % 7 === 0),
        body
      });
    }
  }
})();