/**
 * JobShield AI — Rule-based scam detection engine
 * Analyzes text for cybersecurity threat indicators common in job scams
 */

export type Severity = "low" | "medium" | "high" | "critical";
export type ThreatLevel = "low" | "medium" | "high" | "critical";

export interface IndicatorRule {
  id: string;
  category: string;
  name: string;
  description: string;
  severity: Severity;
  examples: string[];
  weight: number;
  test: (text: string) => { matched: boolean; matchedText: string | null };
}

export interface RedFlagResult {
  id: string;
  category: string;
  description: string;
  severity: Severity;
  matched: boolean;
  matchedText: string | null;
}

export interface AnalysisResult {
  riskScore: number;
  threatLevel: ThreatLevel;
  redFlags: RedFlagResult[];
  recommendations: string[];
  summary: string;
}

function makeRegexTest(
  patterns: RegExp[],
  description: string,
): (text: string) => { matched: boolean; matchedText: string | null } {
  return (text: string) => {
    const lower = text.toLowerCase();
    for (const pattern of patterns) {
      const match = lower.match(pattern);
      if (match) {
        return { matched: true, matchedText: match[0].substring(0, 80) };
      }
    }
    return { matched: false, matchedText: null };
  };
}

export const INDICATOR_RULES: IndicatorRule[] = [
  {
    id: "generic_greeting",
    category: "Social Engineering",
    name: "Generic / Non-personalized Greeting",
    description:
      "Legitimate recruiters address candidates by name. Generic greetings are a hallmark of mass-phishing campaigns.",
    severity: "low",
    examples: ["Dear Candidate", "Hello Job Seeker", "Hi Friend", "Dear Applicant"],
    weight: 10,
    test: makeRegexTest(
      [
        /\bdear\s+(candidate|applicant|job\s*seeker|friend|sir\s*or\s*madam|hiring\s*manager)\b/,
        /\bhello\s+(there|friend|candidate|applicant)\b/,
        /\bhi\s+(friend|there,?\s*friend)\b/,
      ],
      "generic greeting",
    ),
  },
  {
    id: "urgency_language",
    category: "Pressure Tactics",
    name: "Urgency / Pressure Language",
    description:
      "Creating artificial urgency is a classic social engineering tactic to prevent victims from thinking critically.",
    severity: "medium",
    examples: [
      "Apply immediately",
      "Limited spots available",
      "Respond within 24 hours",
      "Offer expires today",
      "Urgent hiring",
    ],
    weight: 20,
    test: makeRegexTest(
      [
        /\b(urgent|urgently|immediately|asap|as soon as possible)\b/,
        /\b(limited\s+(spots?|positions?|openings?|seats?))\b/,
        /\b(respond|reply|apply)\s+(within|in)\s+\d+\s+(hour|day|minute)/,
        /\b(offer\s+expires?|deadline\s+(is|today|soon|this\s+week))\b/,
        /\b(last\s+chance|final\s+round|only\s+\d+\s+(spot|seat|position)s?\s+left)\b/,
      ],
      "urgency language",
    ),
  },
  {
    id: "payment_request",
    category: "Financial Fraud",
    name: "Payment / Fee Request",
    description:
      "Legitimate employers never ask candidates to pay fees for training, equipment, background checks, or job placement.",
    severity: "critical",
    examples: [
      "Pay for training materials",
      "Background check fee",
      "Equipment deposit required",
      "Registration fee",
      "Refundable deposit",
    ],
    weight: 40,
    test: makeRegexTest(
      [
        /\b(pay|payment|fee|deposit|cost|charge)\b.{0,40}\b(training|equipment|background\s+check|registration|placement|onboarding|start)\b/,
        /\b(training|equipment|background\s+check|registration|placement)\b.{0,40}\b(fee|cost|payment|charge|deposit)\b/,
        /\b(send|wire|transfer)\b.{0,30}\b(money|funds|payment|cash|bitcoin|crypto)\b/,
        /\b(purchase|buy)\b.{0,30}\b(equipment|laptop|software|tools|kit)\b/,
        /\brefundable\s+deposit\b/,
      ],
      "payment request",
    ),
  },
  {
    id: "credential_request",
    category: "Identity Theft",
    name: "Credential / Personal Data Request",
    description:
      "Requesting SSN, bank details, passport, or passwords before a formal offer is a red flag for identity theft.",
    severity: "critical",
    examples: [
      "Send your SSN",
      "Provide bank account details",
      "Send a copy of your passport",
      "Login credentials needed",
      "Date of birth required",
    ],
    weight: 40,
    test: makeRegexTest(
      [
        /\b(social\s+security|ssn|sin\s+number|national\s+id)\b/,
        /\b(bank\s+account|routing\s+number|account\s+number|bank\s+details|financial\s+information)\b/,
        /\b(passport|driver.{0,5}s\s+licen[cs]e|government\s+id)\b.{0,30}\b(send|provide|submit|upload|copy)\b/,
        /\b(send|provide|submit|upload|copy)\b.{0,30}\b(passport|driver.{0,5}s\s+licen[cs]e|government\s+id)\b/,
        /\b(login|password|credentials|username)\b.{0,30}\b(provide|send|share|give)\b/,
        /\b(provide|send|share|give)\b.{0,30}\b(login|password|credentials|username)\b/,
      ],
      "credential request",
    ),
  },
  {
    id: "suspicious_domain",
    category: "Phishing Infrastructure",
    name: "Suspicious Email Domain",
    description:
      "Legitimate companies use corporate email addresses. Free email services (Gmail, Yahoo, Hotmail) used for recruitment is highly suspicious.",
    severity: "high",
    examples: [
      "recruiter@gmail.com",
      "hr@yahoo.com",
      "jobs@hotmail.com",
      "@outlook.com for a Fortune 500",
    ],
    weight: 30,
    test: makeRegexTest(
      [
        /\b[\w.+-]+@(gmail|yahoo|hotmail|outlook|aol|icloud|protonmail|tutanota|yandex|mail)\.(com|co\.uk|net|org)\b/,
      ],
      "suspicious domain",
    ),
  },
  {
    id: "telegram_whatsapp",
    category: "Off-Platform Communication",
    name: "Telegram / WhatsApp Recruitment",
    description:
      "Real recruiters use professional channels. Pushing communication to Telegram or WhatsApp avoids accountability and is common in scams.",
    severity: "high",
    examples: [
      "Message me on Telegram",
      "Contact via WhatsApp",
      "Add me on Telegram @recruiter",
      "Text us on WhatsApp",
    ],
    weight: 30,
    test: makeRegexTest(
      [
        /\b(telegram|whatsapp|wechat|line\s+app|signal\s+app)\b/,
        /\bt\.me\/\w+/,
        /\bwa\.me\/\w+/,
      ],
      "Telegram/WhatsApp contact",
    ),
  },
  {
    id: "interview_fee",
    category: "Financial Fraud",
    name: "Interview / Application Fee",
    description:
      "Charging candidates for interviews or application processing is always a scam. No legitimate employer does this.",
    severity: "critical",
    examples: [
      "Interview registration fee",
      "Application processing fee",
      "Pay to interview",
      "Verification fee required",
    ],
    weight: 40,
    test: makeRegexTest(
      [
        /\b(interview|application|hiring)\s*(fee|charge|cost|payment)\b/,
        /\b(fee|charge|cost|payment)\s*(for|to|before)\s*(interview|apply|proceed|continue)\b/,
        /\bverification\s+fee\b/,
        /\bprocessing\s+fee\b/,
      ],
      "interview/application fee",
    ),
  },
  {
    id: "too_good_salary",
    category: "Unrealistic Offers",
    name: "Unrealistic Salary / Compensation",
    description:
      "Unusually high salaries for minimal work are bait to attract victims. Work-from-home jobs paying $5,000+/week are almost always scams.",
    severity: "medium",
    examples: [
      "Earn $5000 per week",
      "Make $10,000 monthly from home",
      "Unlimited earning potential",
      "$500/day working part-time",
    ],
    weight: 20,
    test: makeRegexTest(
      [
        /\$(5[0-9]{3,}|[6-9]\d{3,}|\d{5,})\s*(per|\/)\s*(week|day|hour|month)\b/,
        /\bearn\s+\$\s*[\d,]+\s*(per|\/|a)\s*(week|day|hour)\b/,
        /\bmake\s+\$\s*[\d,]+\s*(per|\/|a)\s*(week|day|month|hour)\b/,
        /\bunlimited\s+(earning|income|pay|compensation)\s+potential\b/,
        /\b(weekly|monthly)\s+pay\s*:?\s*\$\s*[\d,]{4,}\b/,
      ],
      "unrealistic salary",
    ),
  },
  {
    id: "work_from_home_easy",
    category: "Unrealistic Offers",
    name: "Easy Work-From-Home Scheme",
    description:
      "Vague job descriptions promising easy work from home with high pay and no experience required are classic scam patterns.",
    severity: "medium",
    examples: [
      "No experience necessary",
      "Work from home, your own hours",
      "Easy task, high pay",
      "Be your own boss, earn daily",
    ],
    weight: 15,
    test: makeRegexTest(
      [
        /\b(no|zero)\s+experience\s+(needed|required|necessary)\b/,
        /\b(easy|simple|flexible)\b.{0,30}\b(work\s+from\s+home|remote\s+work)\b/,
        /\b(be\s+your\s+own\s+boss|set\s+your\s+own\s+hours?|work\s+anytime)\b/,
        /\b(part.?time|few\s+hours?)\b.{0,30}\b(high\s+pay|good\s+pay|\$\s*[\d,]{3,})\b/,
      ],
      "easy work from home",
    ),
  },
  {
    id: "vague_job_description",
    category: "Suspicious Job Posting",
    name: "Vague or Missing Job Description",
    description:
      "Scam postings avoid specific job duties, required skills, or company information to cast a wide net.",
    severity: "low",
    examples: [
      "Various tasks assigned daily",
      "Help with company growth",
      "General support needed",
    ],
    weight: 10,
    test: makeRegexTest(
      [
        /\b(various\s+tasks?|general\s+support|miscellaneous\s+duties|day.to.day\s+tasks?)\b/,
        /\b(help\s+with\s+(company\s+)?(growth|tasks?|operations?))\b/,
        /\b(details\s+upon|more\s+info\s+after|will\s+explain\s+later)\b/,
      ],
      "vague job description",
    ),
  },
  {
    id: "money_mule",
    category: "Financial Crime",
    name: "Money Transfer / Mule Scheme",
    description:
      "Jobs involving receiving and forwarding money, packages, or crypto are money mule schemes — participation is illegal.",
    severity: "critical",
    examples: [
      "Receive and forward payments",
      "Transfer funds on behalf of clients",
      "Package reshipping agent",
      "Financial intermediary role",
    ],
    weight: 45,
    test: makeRegexTest(
      [
        /\b(receive|accept)\b.{0,40}\b(transfer|forward|send|wire)\b.{0,40}\b(money|funds|payment|transfer)\b/,
        /\b(transfer|forward|relay)\b.{0,30}\b(money|funds|payment|crypto|bitcoin)\b/,
        /\b(package|parcel)\b.{0,30}\b(reshipping|forwarding|repackaging)\b/,
        /\bfinancial\s+(intermediary|agent|representative)\b/,
        /\b(receive|handle)\b.{0,30}\b(cryptocurrency|bitcoin|crypto)\b.{0,30}\b(on\s+behalf|for\s+client)\b/,
      ],
      "money mule scheme",
    ),
  },
  {
    id: "fake_company",
    category: "Identity Fraud",
    name: "Impersonation of Known Company",
    description:
      "Scammers impersonate legitimate companies like Amazon, Google, or Apple. Check sender domain against company name.",
    severity: "high",
    examples: [
      "Amazon recruiter using @gmail.com",
      "Google HR from @yahoo.com",
      "Microsoft hiring team via WhatsApp",
    ],
    weight: 25,
    test: (text: string) => {
      const lower = text.toLowerCase();
      const bigCompanies =
        /\b(amazon|google|microsoft|apple|facebook|meta|netflix|tesla|walmart|jpmorgan|chase|citibank|bank\s+of\s+america)\b/;
      const freeEmail =
        /\b[\w.+-]+@(gmail|yahoo|hotmail|outlook|aol|icloud)\.(com|co\.uk|net)\b/;
      const hasCompany = bigCompanies.test(lower);
      const hasFreeEmail = freeEmail.test(lower);
      if (hasCompany && hasFreeEmail) {
        const match = lower.match(freeEmail);
        return { matched: true, matchedText: match ? match[0] : null };
      }
      return { matched: false, matchedText: null };
    },
  },
  {
    id: "spelling_errors",
    category: "Communication Quality",
    name: "Poor Grammar / Spelling Errors",
    description:
      "Professional communications from real companies are carefully proofread. Multiple errors suggest automated or non-native scam content.",
    severity: "low",
    examples: [
      "We are looking to fullfill this position",
      "This is a very lucrative opportunty",
      "Kindly revert back to us",
    ],
    weight: 10,
    test: makeRegexTest(
      [
        /\bkindly\s+(revert|do\s+the\s+needful|revert\s+back)\b/,
        /\b(fullfill|oppurtunity|accomodation|recieve|occured|seperate)\b/,
        /\bdo\s+the\s+needful\b/,
        /\brevert\s+back\b/,
      ],
      "poor grammar/spelling",
    ),
  },
];

function scoreToThreatLevel(score: number): ThreatLevel {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

function generateSummary(
  redFlags: RedFlagResult[],
  riskScore: number,
  threatLevel: ThreatLevel,
): string {
  const matched = redFlags.filter((f) => f.matched);
  if (matched.length === 0) {
    return `No significant scam indicators detected. Risk score is ${riskScore}/100 (${threatLevel} threat). The content appears to be from a legitimate source, but always verify the company and recruiter independently.`;
  }

  const criticalFlags = matched.filter((f) => f.severity === "critical");
  const highFlags = matched.filter((f) => f.severity === "high");
  const categories = [...new Set(matched.map((f) => f.category))];

  let summary = `Analysis detected ${matched.length} red flag${matched.length > 1 ? "s" : ""} across ${categories.length} category${categories.length > 1 ? "ies" : "y"}, yielding a risk score of ${riskScore}/100 (${threatLevel.toUpperCase()} threat).`;

  if (criticalFlags.length > 0) {
    summary += ` CRITICAL indicators include: ${criticalFlags.map((f) => f.category).join(", ")}.`;
  }
  if (highFlags.length > 0) {
    summary += ` High-severity concerns: ${highFlags.map((f) => f.category).join(", ")}.`;
  }

  if (threatLevel === "critical") {
    summary +=
      " This content exhibits multiple hallmarks of a recruitment scam. Do not provide personal information, pay any fees, or engage further without independent verification.";
  } else if (threatLevel === "high") {
    summary +=
      " Exercise extreme caution. Research the company independently through official channels before proceeding.";
  } else if (threatLevel === "medium") {
    summary +=
      " Proceed with caution. Verify the recruiter and company through official channels before sharing any personal information.";
  } else {
    summary +=
      " Low risk, but remain vigilant. Always verify recruiter identity through LinkedIn and the company's official website.";
  }

  return summary;
}

function generateRecommendations(
  redFlags: RedFlagResult[],
  threatLevel: ThreatLevel,
): string[] {
  const matched = redFlags.filter((f) => f.matched);
  const recommendations: string[] = [];
  const categories = new Set(matched.map((f) => f.category));

  if (threatLevel === "critical" || threatLevel === "high") {
    recommendations.push(
      "Do not respond to this message or provide any personal information.",
    );
    recommendations.push(
      "Report this to the platform (LinkedIn, job board) as a fraudulent listing.",
    );
  }

  if (categories.has("Financial Fraud") || categories.has("Financial Crime")) {
    recommendations.push(
      "Never pay any fees to obtain a job — legitimate employers do not charge candidates.",
    );
    recommendations.push(
      "If you have already sent money, contact your bank immediately to attempt a reversal.",
    );
  }

  if (categories.has("Identity Theft")) {
    recommendations.push(
      "Do not provide SSN, bank details, or government ID until you have a verified offer letter from a confirmed legitimate company.",
    );
  }

  if (categories.has("Off-Platform Communication")) {
    recommendations.push(
      "Keep all recruitment communication on official platforms. Avoid moving to Telegram or WhatsApp.",
    );
  }

  if (categories.has("Phishing Infrastructure")) {
    recommendations.push(
      "Verify the recruiter's email domain matches the company's official domain (e.g., @amazon.com not @gmail.com).",
    );
  }

  if (categories.has("Identity Fraud")) {
    recommendations.push(
      "Search the company directly on LinkedIn and their official website to verify this recruiter works there.",
    );
  }

  recommendations.push(
    "Research the company on Glassdoor, LinkedIn, and their official website before engaging.",
  );
  recommendations.push(
    "If suspicious, search the job description text in Google — scam postings are often copied verbatim.",
  );

  if (threatLevel === "low") {
    recommendations.push(
      "Content appears relatively safe. Continue with standard job search precautions.",
    );
  }

  return recommendations.slice(0, 6);
}

export function analyzeContent(content: string): AnalysisResult {
  const redFlags: RedFlagResult[] = INDICATOR_RULES.map((rule) => {
    const result = rule.test(content);
    return {
      id: rule.id,
      category: rule.category,
      description: rule.description,
      severity: rule.severity,
      matched: result.matched,
      matchedText: result.matchedText,
    };
  });

  const matched = redFlags.filter((f) => f.matched);
  let rawScore = 0;

  for (const flag of matched) {
    const rule = INDICATOR_RULES.find((r) => r.id === flag.id)!;
    rawScore += rule.weight;
  }

  const riskScore = Math.min(100, rawScore);
  const threatLevel = scoreToThreatLevel(riskScore);
  const recommendations = generateRecommendations(redFlags, threatLevel);
  const summary = generateSummary(redFlags, riskScore, threatLevel);

  return { riskScore, threatLevel, redFlags, recommendations, summary };
}
