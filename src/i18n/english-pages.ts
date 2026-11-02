interface MarketingItem {
  title: string;
  description: string;
}

interface MarketingSection {
  eyebrow: string;
  title: string;
  intro: string;
  items: MarketingItem[];
}

export interface EnglishMarketingPage {
  metadata: { title: string; description: string };
  badge: string;
  title: string;
  lead: string;
  primary: { text: string; href: string };
  secondary?: { text: string; href: string; external?: boolean };
  sections: MarketingSection[];
  closing: { title: string; text: string; ctaText?: string };
}

export const englishPages = {
  home: {
    metadata: {
      title: 'kieks.me – AI consultants for MCP, agent hubs and dependable software',
      description:
        'kieks.me is a Leipzig-based consultancy for agent skills, MCP servers, agent hubs, cloud infrastructure and maintainable web software.',
    },
    badge: 'kieks.me GbR · Leipzig, Germany',
    title: 'your software. your code. our experience.',
    lead: 'We help organizations connect AI assistants to real work, distribute trusted agent components and build software their teams can understand, operate and extend.',
    primary: { text: 'Book a consultation', href: '/en/contact' },
    secondary: { text: 'Explore our services', href: '#services' },
    sections: [
      {
        eyebrow: 'Services',
        title: 'practical expertise, built around your organization',
        intro: 'From the first architectural question to documented production delivery, we work alongside your team.',
        items: [
          { title: 'Agent Hub', description: 'A governed home for approved skills, MCP servers and agents.' },
          { title: 'AI & MCP', description: 'Purpose-built integrations between assistants, tools and business data.' },
          {
            title: 'Cloud & DevOps',
            description: 'Repeatable infrastructure, automated delivery and visible operations.',
          },
          { title: 'Software development', description: 'Accessible websites, web applications and reliable APIs.' },
          { title: 'Consulting', description: 'Independent advice and workshops grounded in your actual constraints.' },
        ],
      },
      {
        eyebrow: 'How we work',
        title: 'evidence before promises',
        intro: 'Our open-source work lets you inspect how we design, document and maintain software before we meet.',
        items: [
          { title: 'Open source', description: 'Our MCP servers and engineering tools are public on GitHub.' },
          {
            title: 'Direct collaboration',
            description: 'You work with the people who design and implement the solution.',
          },
          { title: 'Clean handover', description: 'Code, decisions and operating knowledge remain with your team.' },
        ],
      },
    ],
    closing: {
      title: 'let’s find out whether we are a good fit',
      text: 'A focused first conversation is enough to clarify your goal, constraints and a sensible next step.',
      ctaText: 'Start a conversation',
    },
  },
  agentHub: {
    metadata: {
      title: 'Enterprise agent hub for trusted skills, MCP servers and agents',
      description:
        'kieks.me designs internal agent hubs with review gates, versioning, policies and secure distribution for reusable AI components.',
    },
    badge: 'Agent Hub',
    title: 'one trusted place for every skill, MCP server and agent',
    lead: 'We build the internal platform and governance that let teams share AI components safely, improve them once for everyone and understand exactly what is installed.',
    primary: { text: 'Discuss your agent hub', href: '/en/contact' },
    secondary: { text: 'Explore AI & MCP', href: '/en/services/ai-mcp' },
    sections: [
      {
        eyebrow: 'The foundation',
        title: 'more than a repository',
        intro:
          'Skills, servers and agents have different risk profiles, so each needs an appropriate review and release path.',
        items: [
          { title: 'Hub design', description: 'Repository structure, ownership, versioning and distribution.' },
          {
            title: 'Review gate',
            description: 'Clear checks for instructions, executable code, connections and permissions.',
          },
          { title: 'Enforced policy', description: 'Allowlists and managed settings keep unapproved sources out.' },
        ],
      },
      {
        eyebrow: 'Operations',
        title: 'governance that helps teams move',
        intro: 'A useful hub reduces duplicated effort without turning review into a bottleneck.',
        items: [
          { title: 'Component development', description: 'We build and onboard the components your teams need.' },
          {
            title: 'Identity and secrets',
            description: 'MCP connections use explicit identities and controlled credentials.',
          },
          { title: 'Auditability', description: 'Version history and inventory answer what is installed where.' },
        ],
      },
    ],
    closing: {
      title: 'what do you call this layer today?',
      text: 'Whether you already have a registry or only scattered repositories, we can define a safe next step.',
      ctaText: 'Plan the next step',
    },
  },
  csp: {
    metadata: {
      title: 'CSP by kieks.me – an open-source customer service portal',
      description:
        'Connect service status, on-call contacts and support knowledge in an open-source portal that complements your existing ticketing system.',
    },
    badge: 'CSP · Your service portal. Your code. Your freedom.',
    title: 'status, ownership, answers: before customers need to call',
    lead: 'CSP brings your service sources into a branded open-source portal, keeps a direct route to human support and includes a handover your team can build on.',
    primary: { text: 'Discuss your service portal', href: '/en/contact' },
    secondary: { text: 'View the source', href: 'https://github.com/kieksme/csp', external: true },
    sections: [
      {
        eyebrow: 'One entry point',
        title: 'everything that happens before a ticket',
        intro: 'CSP adds a clear service layer without replacing the systems and processes that already work.',
        items: [
          { title: 'Contact', description: 'Hotline and emergency contacts remain immediately accessible.' },
          { title: 'Status and on-call', description: 'Surface monitoring, incidents, shifts and responsible teams.' },
          { title: 'Knowledge', description: 'Publish approved processes, FAQs, links and ticket templates.' },
        ],
      },
      {
        eyebrow: 'A controlled pilot',
        title: 'start small, measure honestly',
        intro: 'We agree the scope, data roles, human support channel and acceptance criteria before implementation.',
        items: [
          { title: 'No forced migration', description: 'Your ticketing, monitoring and ITSM processes stay in place.' },
          { title: 'Optional AI', description: 'Customers can bypass the assistant and contact a person directly.' },
          { title: 'MIT licensed', description: 'Operate and extend the product in your own infrastructure.' },
        ],
      },
    ],
    closing: {
      title: 'would CSP fit your support landscape?',
      text: 'We can map your sources and define a measurable pilot in one focused conversation.',
      ctaText: 'Book a consultation',
    },
  },
  consulting: {
    metadata: {
      title: 'Independent AI, cloud and software consulting and workshops',
      description:
        'kieks.me helps teams assess AI, MCP, cloud and software architecture options and builds practical workshops around their real environment.',
    },
    badge: 'Service · Consulting & Workshops',
    title: 'Understand first. Then decide. Then build.',
    lead: 'We help you ask the right questions before budget goes into technology, and transfer enough practical knowledge for your team to make informed decisions independently.',
    primary: { text: 'Request a consultation', href: '/en/contact' },
    sections: [
      {
        eyebrow: 'Consulting',
        title: 'clear decisions, grounded in reality',
        intro: 'We compare options openly, including the reasons not to build or buy something.',
        items: [
          {
            title: 'Current-state assessment',
            description: 'Map systems, workflows, data and the points where work stalls.',
          },
          {
            title: 'Technical perspective',
            description: 'Separate durable opportunities from hype and avoidable complexity.',
          },
          { title: 'Decision brief', description: 'Compare effort, risks, dependencies and operating implications.' },
        ],
      },
      {
        eyebrow: 'Workshops',
        title: 'knowledge your team can apply',
        intro: 'Sessions are shaped around your tools, responsibilities and current level of experience.',
        items: [
          {
            title: 'AI assistants and MCP',
            description: 'Understand integration patterns, permissions and boundaries.',
          },
          { title: 'Agent skills', description: 'Design reusable, reviewable instructions for development teams.' },
          {
            title: 'Modern delivery',
            description: 'Work hands-on with infrastructure as code, CI/CD and web platforms.',
          },
        ],
      },
    ],
    closing: {
      title: 'what question is holding up your next decision?',
      text: 'Bring the context and constraints; we will help turn them into a useful course of action.',
    },
  },
  cloudDevops: {
    metadata: {
      title: 'Cloud and DevOps engineering with infrastructure as code',
      description:
        'kieks.me builds repeatable cloud infrastructure, automated delivery pipelines, monitoring and maintainable operational documentation.',
    },
    badge: 'Service · Cloud & DevOps',
    title: 'infrastructure your team can understand and reproduce',
    lead: 'We describe infrastructure as code, automate checks and deployments, and document operations so a platform never depends on knowledge held by one person.',
    primary: { text: 'Discuss your infrastructure', href: '/en/contact' },
    sections: [
      {
        eyebrow: 'Engineering',
        title: 'repeatable delivery from DNS to deployment',
        intro: 'Every change should be reviewable, testable and recoverable.',
        items: [
          {
            title: 'Infrastructure as code',
            description: 'Version DNS, hosting and cloud resources with tools such as Terraform.',
          },
          { title: 'CI/CD', description: 'Automate tests, builds and deployments with transparent pipelines.' },
          { title: 'Containers', description: 'Run workloads on appropriate container and self-hosting platforms.' },
        ],
      },
      {
        eyebrow: 'Operations',
        title: 'fewer surprises in production',
        intro: 'Visibility and documentation make reliable operations a team capability.',
        items: [
          { title: 'Monitoring', description: 'Expose status, service health and actionable alerts.' },
          { title: 'On-call integration', description: 'Route incidents to the right people with useful context.' },
          { title: 'Handover', description: 'Document what runs, why it exists and how to change it safely.' },
        ],
      },
    ],
    closing: {
      title: 'where does your delivery process get stuck?',
      text: 'We can improve one deployment path or help establish the foundations for an entire platform.',
    },
  },
  development: {
    metadata: {
      title: 'Web and software development for maintainable digital products',
      description:
        'kieks.me develops accessible websites, web applications and APIs with modern, documented technology and a clean technical handover.',
    },
    badge: 'Service · Web & Software Development',
    title: 'software designed around the way your organization works',
    lead: 'We build websites, applications and integrations from scratch where that adds value, and extend proven systems where replacement would only create risk.',
    primary: { text: 'Discuss your project', href: '/en/contact' },
    sections: [
      {
        eyebrow: 'What we build',
        title: 'useful software, without unnecessary reinvention',
        intro: 'The architecture follows your users, processes and operating model.',
        items: [
          { title: 'Websites', description: 'Fast, accessible and straightforward for your team to maintain.' },
          { title: 'Web applications', description: 'Internal tools, customer experiences and progressive web apps.' },
          { title: 'System integration', description: 'Connect existing services through clear, documented APIs.' },
        ],
      },
      {
        eyebrow: 'Delivery',
        title: 'visible progress and a clean handover',
        intro: 'Regular working increments keep scope and technical decisions understandable.',
        items: [
          { title: 'Discovery', description: 'Clarify users, outcomes, constraints and the smallest useful scope.' },
          { title: 'Implementation', description: 'Deliver in reviewable stages with automated quality checks.' },
          { title: 'Ownership', description: 'Hand over source code, documentation and team enablement.' },
        ],
      },
    ],
    closing: {
      title: 'what should your software make easier?',
      text: 'Tell us about the people and process behind the requirement, and we will identify a practical approach.',
    },
  },
  aiMcp: {
    metadata: {
      title: 'AI and MCP integration for secure access to business systems',
      description:
        'kieks.me builds MCP servers and agent skills that connect AI assistants to business tools with explicit functions, permissions and boundaries.',
    },
    badge: 'Service · AI & MCP',
    title: 'AI that works with your systems, not around them',
    lead: 'We connect assistants such as Claude, Cursor and VS Code to tools and data through the Model Context Protocol, with only the functions and access they genuinely need.',
    primary: { text: 'Discuss your AI use case', href: '/en/contact' },
    secondary: { text: 'See our MCP servers', href: '/en/projects/mcp-server' },
    sections: [
      {
        eyebrow: 'Model Context Protocol',
        title: 'defined tools instead of copy and paste',
        intro: 'An assistant invokes explicit functions while your organization controls what each function can do.',
        items: [
          { title: 'Custom MCP servers', description: 'Connect internal applications and external services.' },
          {
            title: 'Local or remote',
            description: 'Use stdio locally or Streamable HTTP with appropriate authentication.',
          },
          { title: 'Agent skills', description: 'Give teams reusable, reviewed workflows for coding assistants.' },
        ],
      },
      {
        eyebrow: 'Our process',
        title: 'scope permissions before implementation',
        intro: 'We separate reading from writing and make boundaries part of the technical design.',
        items: [
          { title: 'Understand', description: 'Define the task, users, data and expected outcome.' },
          { title: 'Constrain', description: 'Choose functions, permissions and explicit non-goals.' },
          { title: 'Deliver', description: 'Build, test, document and hand over the integration.' },
        ],
      },
    ],
    closing: {
      title: 'which system should your AI be able to work with?',
      text: 'We can determine whether MCP is a sound fit and what the smallest safe integration looks like.',
    },
  },
  mcpServers: {
    metadata: {
      title: 'Open-source MCP servers and integration tools from kieks.me',
      description:
        'Explore open-source kieks.me MCP servers for services including Contabo, Swetrix, Listmonk and Balena, available on GitHub and npm.',
    },
    badge: 'Projects · MCP Servers',
    title: 'open-source MCP servers, ready to inspect',
    lead: 'Our public servers let assistants such as Claude, Cursor and VS Code work with established services through explicit tools, documented setup and reviewable source code.',
    primary: { text: 'Build an MCP server with us', href: '/en/contact' },
    secondary: { text: 'Browse all projects on GitHub', href: 'https://github.com/kieksme', external: true },
    sections: [
      {
        eyebrow: 'Published servers',
        title: 'integrations for real services',
        intro: 'Each repository documents its supported tools, installation and authentication model.',
        items: [
          { title: 'Contabo', description: 'Manage cloud compute resources through a focused MCP interface.' },
          { title: 'Swetrix', description: 'Query privacy-oriented web analytics from an AI-assisted workflow.' },
          { title: 'Listmonk & Balena', description: 'Connect campaign operations and edge-device management.' },
        ],
      },
      {
        eyebrow: 'Engineering standards',
        title: 'source code is the evidence',
        intro: 'Public implementation and package metadata make behavior easier to evaluate before adoption.',
        items: [
          { title: 'Reviewable', description: 'Inspect every tool definition and upstream request on GitHub.' },
          { title: 'Reusable', description: 'Install published npm packages in supported MCP clients.' },
          { title: 'Extensible', description: 'Use our HTTP kit and patterns as a foundation for new servers.' },
        ],
      },
    ],
    closing: {
      title: 'need an MCP server for your system?',
      text: 'We design custom integrations with the same emphasis on narrow permissions, documentation and maintainability.',
    },
  },
} as const satisfies Record<string, EnglishMarketingPage>;
