/**
 * Local knowledge base for the TCI assistant.
 * No backend, no API keys: answers are matched locally against keyword sets
 * and only cover The Career Insights. Anything outside this scope gets the
 * fallback answer — the assistant never invents information.
 */

export interface Intent {
  id: string;
  keywords: string[];
  answer: string;
}

export const assistantConfig = {
  name: "TCI Assistant",
  fallback:
    "I can only answer questions about The Career Insights — our services, career guidance, training, workforce solutions, university programs, and how to reach us. For anything else, please email info@thecareerinsights.com or call +1 (302) 231-2961 and our team will help directly.",
  greeting:
    "Hi! I'm the TCI Assistant. I can tell you about our services, career guidance, training, workforce solutions, university programs, and how to contact us. What would you like to know?"
};

export const quickQuestions = [
  "What services do you offer?",
  "I want career guidance",
  "Tell me about training",
  "Workforce solutions",
  "How do I contact you?",
  "Book a consultation"
];

export const intents: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "namaste"],
    answer:
      "Hello! Welcome to The Career Insights. I can help with our services, career guidance, training programs, workforce solutions, university partnerships, and contact details. What can I help you with today?"
  },
  {
    id: "who-are-you",
    keywords: ["who are you", "what are you", "your name", "about this bot", "about you", "what is tci", "who is the career insights", "about the career insights", "about your company", "tell me about the company"],
    answer:
      "I'm the TCI Assistant for The Career Insights — a global career intelligence and talent solutions company. We connect organizations with verified talent, run flexible workforce programs, and help professionals grow through personalized guidance, training, and technology expertise."
  },
  {
    id: "help",
    keywords: ["what can you help", "i need help", "help me", "can you help", "what do you do", "options", "menu"],
    answer:
      "I can help you with: our services (AI & ML, DevOps, Cloud, Cybersecurity, SAP, Application Development), career guidance, technology training, workforce and staffing solutions, university programs, booking a consultation, and contact details. Just ask about any of these."
  },
  {
    id: "services",
    keywords: ["services", "what services", "what do you offer", "offerings", "capabilities", "solutions you offer", "expertise"],
    answer:
      "The Career Insights offers: Analytics and AI/ML, Cybersecurity, SAP Solutions, Cloud Solutions, Workforce Solutions (staffing, RPO, contingent workforce, total talent), Application Development, Public Sector talent, and University programs. Which area would you like to explore?"
  },
  {
    id: "career-guidance",
    keywords: ["career guidance", "career help", "career advice", "career coaching", "grow my career", "career change", "find a job", "job search", "career path", "career success"],
    answer:
      "We pair expert insight with practical tools to guide your career: discovering your current position, defining target roles, building technical capability, validating progress through practical work, preparing for certifications and interviews, and launching your next move. Start by sending a request on our Contact page, and a career specialist will follow up."
  },
  {
    id: "training",
    keywords: ["training", "courses", "learn", "upskill", "certification", "bootcamp", "it training", "corporate training", "skill development"],
    answer:
      "We provide IT and professional training: curated learning paths, certification preparation, corporate team upskilling, and campus-to-career technical programs. Focus areas include AI & ML, cloud, DevOps, cybersecurity, SAP, analytics, and application development. Contact us at info@thecareerinsights.com to discuss a program."
  },
  {
    id: "workforce",
    keywords: ["workforce", "staffing", "hiring", "recruitment", "rpo", "contingent", "talent solutions", "hire", "recruiters", "staff augmentation", "direct hire", "payroll"],
    answer:
      "Our workforce solutions include Recruitment Process Outsourcing (RPO), Contingent Workforce programs, Total Talent Solutions, IT and professional staffing, direct hire, payroll outsourcing, and campus recruitment. We support public, private, and commercial sectors, including cleared and veteran talent."
  },
  {
    id: "university",
    keywords: ["university", "campus", "college", "students", "graduate", "academic", "education program", "employability"],
    answer:
      "Our University programs cover campus recruitment, employability pathways, technical learning, and workforce-ready talent programs built with academic partners. If you represent a university or are a student, reach out via the Contact page and our education team will respond."
  },
  {
    id: "ai-ml",
    keywords: ["ai", "ml", "machine learning", "artificial intelligence", "analytics", "data science", "nlp", "computer vision", "automation", "rpa"],
    answer:
      "Our Analytics and AI/ML practice covers AI & ML services (NLP, conversational AI, computer vision, recommendation engines, RPA), analytics consulting, data modernization, and data governance. See the Services page for the full capability list, or contact us to discuss your use case."
  },
  {
    id: "devops",
    keywords: ["devops", "ci/cd", "pipeline", "sre", "dataops", "devsecops"],
    answer:
      "DevOps is part of our technology capability: DevOps integration for analytics, DevSecOps within secure SDLC, CloudOps/AIOps, infrastructure automation with IaC, and containerization. We also staff DevOps specialists through our workforce solutions."
  },
  {
    id: "cloud",
    keywords: ["cloud", "aws", "azure", "gcp", "migration", "iaas", "paas", "saas", "finops"],
    answer:
      "Our Cloud Solutions span cloud strategy and readiness assessment, migration and modernization, cloud security, IaaS/PaaS/SaaS enablement, containerization, and cloud operations including CloudOps, AIOps, and FinOps."
  },
  {
    id: "cybersecurity",
    keywords: ["cyber", "security", "infosec", "compliance", "identity", "grc", "data protection", "risk"],
    answer:
      "Our Cybersecurity services cover application security, data security and privacy, identity and access management, governance, risk and compliance, business continuity and resilience, and infrastructure and cloud security."
  },
  {
    id: "sap",
    keywords: ["sap", "s/4", "s4", "hana", "ecc", "erp"],
    answer:
      "Our SAP practice provides managed services (helpdesk, monitoring, support), SAP staffing (contract, permanent, project-based), and transformation services including SAP HANA implementation and ECC to S/4 upgrades."
  },
  {
    id: "appdev",
    keywords: ["application development", "app development", "software development", "web development", "mobile app", "ios", "android", "saas product", "ui/ux", "api"],
    answer:
      "Our Application Development services include strategy and consulting, design and engineering, modernization and re-engineering, mobile (iOS, Android, cross-platform), web and SaaS development, UI/UX, API integrations, and ongoing maintenance and support."
  },
  {
    id: "contact",
    keywords: ["contact", "email", "phone", "call", "reach you", "get in touch", "talk to someone", "speak to"],
    answer:
      "You can reach The Career Insights at: Email info@thecareerinsights.com · Desk +1 (302) 231-2961 · Contact +1 (302) 499-2545. Business hours: Mon–Fri, 9AM–6PM EST. You can also use the form on our Contact page."
  },
  {
    id: "offices",
    keywords: ["office", "location", "address", "where are you", "dover", "hyderabad", "india", "usa", "visit"],
    answer:
      "We have two offices: USA — 8 The Green, Dover, DE 19901; India — Hyderabad, Telangana, India. Our teams support clients across regions and time zones."
  },
  {
    id: "hours",
    keywords: ["hours", "open", "when are you", "business hours", "timing", "working hours"],
    answer: "Our business hours are Monday to Friday, 9AM–6PM EST. You can email info@thecareerinsights.com anytime and we'll respond during business hours."
  },
  {
    id: "booking",
    keywords: ["book", "consultation", "appointment", "schedule", "meeting", "demo", "consult"],
    answer:
      "To book a consultation, use the form on our Contact page (tell us what you're exploring and the requirement), or email info@thecareerinsights.com, or call +1 (302) 231-2961. We usually respond within two business days."
  },
  {
    id: "support",
    keywords: ["support", "issue", "problem", "complaint", "follow up", "existing request", "status of"],
    answer:
      "For support or follow-up on an existing request, email info@thecareerinsights.com with your details, or call our desk at +1 (302) 231-2961 (Mon–Fri, 9AM–6PM EST)."
  },
  {
    id: "privacy",
    keywords: ["privacy", "data policy", "personal data", "gdpr", "my information"],
    answer:
      "Our Privacy Policy explains what information we collect, how we use and protect it, and the choices you have. You can read it at /privacy-policy. For privacy questions, email info@thecareerinsights.com."
  },
  {
    id: "terms",
    keywords: ["terms", "conditions", "legal", "agreement", "terms of use"],
    answer:
      "Our Terms and Conditions cover use of the website and our services. You can read them at /terms-and-conditions. For legal questions, contact info@thecareerinsights.com."
  },
  {
    id: "industries",
    keywords: ["industries", "sectors", "verticals", "healthcare", "defense", "government", "banking", "telecom", "manufacturing"],
    answer:
      "We serve industries including Information Technology, Aerospace & Defence, Government & Public Sector, Healthcare, Energy & Utilities, Education, Semiconductor, BFSI, Media & Technology, Manufacturing, Gaming & Entertainment, and Telecommunications."
  },
  {
    id: "veterans",
    keywords: ["veteran", "military", "clearance", "cleared talent", "ts/sci", "top secret"],
    answer:
      "We support military veteran recruiting — helping veterans transition into the workforce — and cleared talent recruiting across Secret, Top Secret, TS/SCI, CI Poly, and Lifestyle Poly clearances. TCI is an equal opportunity employer."
  },
  {
    id: "e-verify",
    keywords: ["e-verify", "everify", "e verified", "verified employer", "trust badge"],
    answer:
      "The Career Insights is an E-Verified U.S. employer — a trusted and verified business partner. If you'd like documentation for a partnership, contact info@thecareerinsights.com."
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "great", "awesome", "perfect", "bye", "goodbye"],
    answer: "You're welcome! If you need anything else about The Career Insights, I'm here. You can also reach our team at info@thecareerinsights.com."
  }
];
