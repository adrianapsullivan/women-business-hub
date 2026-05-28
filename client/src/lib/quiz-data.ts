export interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: { label: string; value: string; weights: Record<string, number> }[];
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    category: "Leadership Style",
    question: "When you imagine leading a team or community, you see yourself as...",
    options: [
      { label: "The visionary who sets the direction and inspires others", value: "a", weights: { visionary: 3, architect: 2, momentum: 1 } },
      { label: "The strategist who builds systems and structures for success", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "The connector who brings the right people together", value: "c", weights: { community: 3, catalyst: 2, freedom: 1 } },
      { label: "The expert who leads by sharing knowledge and results", value: "d", weights: { guardian: 3, catalyst: 2, visionary: 1 } },
    ],
  },
  {
    id: 2,
    category: "Leadership Style",
    question: "A major challenge arises in your business. Your instinct is to...",
    options: [
      { label: "Pivot quickly and trust your gut with bold decisions", value: "a", weights: { momentum: 3, freedom: 2, visionary: 1 } },
      { label: "Analyze the problem deeply and build a structured solution", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "Rally your community and solve it together", value: "c", weights: { community: 3, catalyst: 2, legacy: 1 } },
      { label: "Research, learn, and implement the best proven strategy", value: "d", weights: { guardian: 3, architect: 2, momentum: 1 } },
    ],
  },
  {
    id: 3,
    category: "Leadership Style",
    question: "The type of legacy you most want to leave is...",
    options: [
      { label: "A movement or revolution that changed an industry", value: "a", weights: { visionary: 3, catalyst: 2, momentum: 2 } },
      { label: "A thriving empire built to last for generations", value: "b", weights: { legacy: 3, architect: 3, guardian: 1 } },
      { label: "A community of empowered, transformed women", value: "c", weights: { community: 3, legacy: 2, guardian: 1 } },
      { label: "A life of total freedom and adventure on your terms", value: "d", weights: { freedom: 3, catalyst: 2, visionary: 1 } },
    ],
  },
  {
    id: 4,
    category: "Independence vs Collaboration",
    question: "Your ideal way of working day-to-day is...",
    options: [
      { label: "Completely solo — I do my best work alone and free", value: "a", weights: { freedom: 3, guardian: 2, architect: 1 } },
      { label: "With a small, carefully chosen team I trust deeply", value: "b", weights: { legacy: 3, architect: 2, momentum: 1 } },
      { label: "At the center of a vibrant, active community", value: "c", weights: { community: 3, catalyst: 2, visionary: 1 } },
      { label: "Leading from the front with a team executing my vision", value: "d", weights: { momentum: 3, visionary: 2, architect: 2 } },
    ],
  },
  {
    id: 5,
    category: "Independence vs Collaboration",
    question: "When it comes to partnerships and collaborations, you feel...",
    options: [
      { label: "They slow me down — I prefer full control", value: "a", weights: { freedom: 3, architect: 2, guardian: 1 } },
      { label: "They amplify my impact when with aligned people", value: "b", weights: { catalyst: 3, community: 2, visionary: 1 } },
      { label: "Essential — the right partners are everything", value: "c", weights: { legacy: 3, community: 2, momentum: 1 } },
      { label: "Valuable if they bring knowledge or expertise I lack", value: "d", weights: { guardian: 3, architect: 2, legacy: 1 } },
    ],
  },
  {
    id: 6,
    category: "Independence vs Collaboration",
    question: "When building income streams, you prefer...",
    options: [
      { label: "Passive income that runs while I sleep", value: "a", weights: { freedom: 3, architect: 2, guardian: 2 } },
      { label: "High-touch offers I deliver personally", value: "b", weights: { catalyst: 3, guardian: 2, community: 1 } },
      { label: "Group programs where transformation happens in community", value: "c", weights: { community: 3, legacy: 2, visionary: 1 } },
      { label: "Scalable systems that grow without my constant involvement", value: "d", weights: { architect: 3, momentum: 2, legacy: 2 } },
    ],
  },
  {
    id: 7,
    category: "Communication Style",
    question: "When you imagine yourself at your most powerful, you are...",
    options: [
      { label: "On stage, speaking to thousands who hang on every word", value: "a", weights: { catalyst: 3, visionary: 2, momentum: 1 } },
      { label: "Writing deep content that transforms how people think", value: "b", weights: { guardian: 3, legacy: 2, freedom: 1 } },
      { label: "Hosting intimate experiences that change women's lives", value: "c", weights: { community: 3, catalyst: 2, guardian: 1 } },
      { label: "Building massive systems that create impact at scale", value: "d", weights: { architect: 3, momentum: 2, legacy: 2 } },
    ],
  },
  {
    id: 8,
    category: "Communication Style",
    question: "Your natural communication strength is...",
    options: [
      { label: "Inspiring and motivating — people feel fired up after talking to me", value: "a", weights: { catalyst: 3, visionary: 2, momentum: 2 } },
      { label: "Teaching and explaining — I make complex things clear", value: "b", weights: { guardian: 3, legacy: 2, community: 1 } },
      { label: "Connecting and empathizing — I make people feel deeply seen", value: "c", weights: { community: 3, catalyst: 2, freedom: 1 } },
      { label: "Strategizing and planning — I see the big picture clearly", value: "d", weights: { architect: 3, legacy: 2, momentum: 1 } },
    ],
  },
  {
    id: 9,
    category: "Communication Style",
    question: "On social media, you naturally gravitate towards...",
    options: [
      { label: "Personal branding — sharing my story, thoughts, and presence", value: "a", weights: { catalyst: 3, visionary: 2, freedom: 2 } },
      { label: "Educational content that teaches and positions me as expert", value: "b", weights: { guardian: 3, architect: 1, legacy: 2 } },
      { label: "Community building and starting meaningful conversations", value: "c", weights: { community: 3, catalyst: 2, visionary: 1 } },
      { label: "Curating and sharing what already works — with my filter", value: "d", weights: { freedom: 3, architect: 2, guardian: 1 } },
    ],
  },
  {
    id: 10,
    category: "Risk Tolerance",
    question: "When faced with a big financial investment in your business, you...",
    options: [
      { label: "Go all in — fortune favors the bold", value: "a", weights: { momentum: 3, visionary: 2, catalyst: 1 } },
      { label: "Invest strategically after thorough research and planning", value: "b", weights: { architect: 3, legacy: 2, guardian: 2 } },
      { label: "Start small and scale only when proven", value: "c", weights: { guardian: 3, freedom: 2, architect: 1 } },
      { label: "Build community first, then monetize with confidence", value: "d", weights: { community: 3, legacy: 2, freedom: 1 } },
    ],
  },
  {
    id: 11,
    category: "Risk Tolerance",
    question: "How do you feel about uncertainty in your business?",
    options: [
      { label: "I thrive in uncertainty — it means opportunity", value: "a", weights: { momentum: 3, freedom: 3, visionary: 1 } },
      { label: "I accept it but manage it with systems and contingency plans", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "I minimize it by building predictable recurring income", value: "c", weights: { guardian: 3, architect: 2, community: 1 } },
      { label: "I find power in the journey, not just the destination", value: "d", weights: { freedom: 3, catalyst: 2, visionary: 2 } },
    ],
  },
  {
    id: 12,
    category: "Risk Tolerance",
    question: "Your relationship with failure is best described as...",
    options: [
      { label: "Necessary fuel — every failure teaches me something priceless", value: "a", weights: { momentum: 3, visionary: 2, freedom: 2 } },
      { label: "Something to analyze and avoid repeating through better systems", value: "b", weights: { architect: 3, legacy: 2, guardian: 2 } },
      { label: "Painful but it brings me closer to my community and purpose", value: "c", weights: { community: 3, catalyst: 2, guardian: 1 } },
      { label: "A detour, not a dead end — I always find another path", value: "d", weights: { freedom: 3, momentum: 2, visionary: 1 } },
    ],
  },
  {
    id: 13,
    category: "Creativity",
    question: "Your creative process is best described as...",
    options: [
      { label: "Wildly innovative — I love creating things that have never existed", value: "a", weights: { visionary: 3, freedom: 2, catalyst: 1 } },
      { label: "Purposefully creative — I create systems and frameworks that endure", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "Collaboratively creative — ideas flow best when bounced off others", value: "c", weights: { community: 3, catalyst: 2, legacy: 1 } },
      { label: "Curative — I spot and amplify what already resonates deeply", value: "d", weights: { guardian: 3, freedom: 2, architect: 1 } },
    ],
  },
  {
    id: 14,
    category: "Creativity",
    question: "When you have a new business idea, you...",
    options: [
      { label: "Jump in immediately and figure it out as I go", value: "a", weights: { momentum: 3, freedom: 2, visionary: 2 } },
      { label: "Map it all out first — strategy before action", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "Ask my community for input before building", value: "c", weights: { community: 3, catalyst: 2, legacy: 1 } },
      { label: "Research deeply, then build something flawless", value: "d", weights: { guardian: 3, architect: 2, momentum: 1 } },
    ],
  },
  {
    id: 15,
    category: "Creativity",
    question: "The type of content that comes most naturally to you is...",
    options: [
      { label: "Bold, opinionated stories and thought leadership", value: "a", weights: { catalyst: 3, visionary: 2, momentum: 2 } },
      { label: "Deep educational content, guides, and frameworks", value: "b", weights: { guardian: 3, legacy: 2, architect: 1 } },
      { label: "Vulnerable, personal storytelling that connects deeply", value: "c", weights: { community: 3, catalyst: 2, freedom: 1 } },
      { label: "Curated lists, reviews, and recommendations", value: "d", weights: { freedom: 3, architect: 1, guardian: 2 } },
    ],
  },
  {
    id: 16,
    category: "Desire for Freedom",
    question: "Your dream work lifestyle looks like...",
    options: [
      { label: "Working from anywhere in the world, no fixed schedule", value: "a", weights: { freedom: 3, catalyst: 2, visionary: 1 } },
      { label: "Building something so powerful it runs without me daily", value: "b", weights: { architect: 3, legacy: 3, momentum: 1 } },
      { label: "Deep work surrounded by a close-knit community", value: "c", weights: { community: 3, guardian: 2, legacy: 1 } },
      { label: "A structured empire I built from the ground up with intention", value: "d", weights: { legacy: 3, architect: 2, momentum: 2 } },
    ],
  },
  {
    id: 17,
    category: "Desire for Freedom",
    question: "Financial freedom to you means...",
    options: [
      { label: "Never having to check my bank account before booking a flight", value: "a", weights: { freedom: 3, catalyst: 2, visionary: 1 } },
      { label: "Multiple streams of income that flow regardless of my effort", value: "b", weights: { architect: 3, legacy: 2, guardian: 2 } },
      { label: "Earning enough to pour back into my community's transformation", value: "c", weights: { community: 3, legacy: 2, guardian: 1 } },
      { label: "Building real wealth that changes my family's lineage", value: "d", weights: { legacy: 3, architect: 2, momentum: 2 } },
    ],
  },
  {
    id: 18,
    category: "Desire for Freedom",
    question: "The constraint you are most desperate to break free from is...",
    options: [
      { label: "Time — I want to earn without trading hours for dollars", value: "a", weights: { architect: 3, freedom: 3, guardian: 1 } },
      { label: "Location — I want to build from anywhere on earth", value: "b", weights: { freedom: 3, catalyst: 2, visionary: 1 } },
      { label: "Isolation — I want to do this alongside powerful women", value: "c", weights: { community: 3, legacy: 2, catalyst: 1 } },
      { label: "Invisibility — I want the world to know who I am", value: "d", weights: { catalyst: 3, visionary: 2, momentum: 2 } },
    ],
  },
  {
    id: 19,
    category: "Strategic Thinking",
    question: "When planning your business, you naturally think...",
    options: [
      { label: "3-5 years ahead — building the foundation for an empire", value: "a", weights: { architect: 3, legacy: 3, momentum: 1 } },
      { label: "In terms of what can generate results in 90 days", value: "b", weights: { momentum: 3, freedom: 2, catalyst: 1 } },
      { label: "About what my audience needs right now and create for them", value: "c", weights: { community: 3, guardian: 2, catalyst: 2 } },
      { label: "About how to position myself uniquely in the market", value: "d", weights: { visionary: 3, catalyst: 2, architect: 1 } },
    ],
  },
  {
    id: 20,
    category: "Strategic Thinking",
    question: "Your superpower in business is...",
    options: [
      { label: "Spotting opportunity before anyone else does", value: "a", weights: { visionary: 3, momentum: 2, freedom: 1 } },
      { label: "Building airtight systems and scalable structures", value: "b", weights: { architect: 3, legacy: 2, guardian: 1 } },
      { label: "Knowing exactly what people need and creating it perfectly", value: "c", weights: { guardian: 3, community: 2, catalyst: 1 } },
      { label: "Making people feel something — connection, aspiration, trust", value: "d", weights: { catalyst: 3, community: 2, visionary: 2 } },
    ],
  },
  {
    id: 21,
    category: "Strategic Thinking",
    question: "When you think of building wealth, you focus most on...",
    options: [
      { label: "Creating intellectual property that earns repeatedly", value: "a", weights: { guardian: 3, architect: 2, legacy: 2 } },
      { label: "Rapid growth strategies that scale quickly", value: "b", weights: { momentum: 3, visionary: 2, architect: 1 } },
      { label: "Community-based models that create recurring revenue", value: "c", weights: { community: 3, legacy: 2, guardian: 1 } },
      { label: "Affiliate and partnership income that compounds over time", value: "d", weights: { freedom: 3, architect: 2, guardian: 1 } },
    ],
  },
  {
    id: 22,
    category: "Teaching Ability",
    question: "Do you feel called to teach others what you know?",
    options: [
      { label: "Deeply — teaching and sharing is my highest purpose", value: "a", weights: { guardian: 3, community: 2, legacy: 2 } },
      { label: "Yes, but through doing alongside them, not lecturing", value: "b", weights: { community: 3, catalyst: 2, momentum: 1 } },
      { label: "When I have truly mastered something, yes", value: "c", weights: { guardian: 3, architect: 2, legacy: 2 } },
      { label: "Not really — I prefer to inspire rather than teach step-by-step", value: "d", weights: { catalyst: 3, visionary: 3, freedom: 1 } },
    ],
  },
  {
    id: 23,
    category: "Teaching Ability",
    question: "If you were to create a course or program, it would be about...",
    options: [
      { label: "A skill or expertise I've spent years mastering", value: "a", weights: { guardian: 3, legacy: 2, architect: 1 } },
      { label: "My personal journey and transformation story", value: "b", weights: { catalyst: 3, visionary: 2, community: 2 } },
      { label: "A system I built that others can replicate", value: "c", weights: { architect: 3, momentum: 2, legacy: 2 } },
      { label: "Building a specific kind of freedom lifestyle", value: "d", weights: { freedom: 3, catalyst: 2, visionary: 1 } },
    ],
  },
  {
    id: 24,
    category: "Motivation Style",
    question: "You wake up most energized when you know the day involves...",
    options: [
      { label: "Creating — writing, designing, building something new", value: "a", weights: { visionary: 3, freedom: 2, guardian: 1 } },
      { label: "Connecting — conversations, collaborations, community moments", value: "b", weights: { community: 3, catalyst: 2, legacy: 1 } },
      { label: "Executing — crossing big things off a powerful plan", value: "c", weights: { momentum: 3, architect: 2, legacy: 2 } },
      { label: "Learning — deep-diving into something that expands your mind", value: "d", weights: { guardian: 3, visionary: 2, freedom: 1 } },
    ],
  },
  {
    id: 25,
    category: "Motivation Style",
    question: "At the end of the day, what makes you feel most alive in your empire?",
    options: [
      { label: "Knowing I moved faster than everyone else and seized the moment", value: "a", weights: { momentum: 3, freedom: 2, visionary: 1 } },
      { label: "Knowing I built something that will outlast me", value: "b", weights: { legacy: 3, architect: 3, guardian: 1 } },
      { label: "Knowing a woman's life changed because of what I created", value: "c", weights: { community: 3, guardian: 2, catalyst: 2 } },
      { label: "Knowing I did it entirely on my own terms", value: "d", weights: { freedom: 3, catalyst: 2, visionary: 2 } },
    ],
  },
];

export type DNAType =
  | "Strategic Builder"
  | "Visionary Leader"
  | "Influence Creator"
  | "Community Builder"
  | "Knowledge Authority"
  | "Action Taker"
  | "Freedom Strategist"
  | "Legacy Builder";

const dnaKeyMap: Record<string, DNAType> = {
  architect: "Strategic Builder",
  visionary: "Visionary Leader",
  catalyst: "Influence Creator",
  community: "Community Builder",
  guardian: "Knowledge Authority",
  momentum: "Action Taker",
  freedom: "Freedom Strategist",
  legacy: "Legacy Builder",
};

export interface BusinessScores {
  affiliate: number;
  digital: number;
  personalBrand: number;
  knowledge: number;
  community: number;
}

const dnaToBusinessWeights: Record<string, BusinessScores> = {
  architect: { affiliate: 72, digital: 88, personalBrand: 65, knowledge: 70, community: 55 },
  visionary: { affiliate: 60, digital: 75, personalBrand: 92, knowledge: 68, community: 70 },
  catalyst: { affiliate: 70, digital: 65, personalBrand: 96, knowledge: 62, community: 75 },
  community: { affiliate: 55, digital: 60, personalBrand: 78, knowledge: 65, community: 95 },
  guardian: { affiliate: 65, digital: 82, personalBrand: 60, knowledge: 95, community: 68 },
  momentum: { affiliate: 75, digital: 80, personalBrand: 85, knowledge: 60, community: 65 },
  freedom: { affiliate: 90, digital: 78, personalBrand: 72, knowledge: 68, community: 50 },
  legacy: { affiliate: 68, digital: 85, personalBrand: 80, knowledge: 78, community: 82 },
};

export function scoreQuiz(answers: Record<number, string>): { dnaType: DNAType; secondaryDnaType?: DNAType; businessScores: BusinessScores } {
  const scores: Record<string, number> = {
    architect: 0, visionary: 0, catalyst: 0, community: 0,
    guardian: 0, momentum: 0, freedom: 0, legacy: 0,
  };

  Object.entries(answers).forEach(([questionIdStr, answerValue]) => {
    const questionId = parseInt(questionIdStr);
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question) return;
    const option = question.options.find(o => o.value === answerValue);
    if (!option) return;
    Object.entries(option.weights).forEach(([key, weight]) => {
      if (scores[key] !== undefined) {
        scores[key] += weight;
      }
    });
  });

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topKey = sorted[0][0];
  const topScore = sorted[0][1];
  const secondKey = sorted[1][0];
  const secondScore = sorted[1][1];
  const dominanceGap = topScore - secondScore;

  const dnaType = dnaKeyMap[topKey];
  const secondaryDnaType = dominanceGap < 10 ? dnaKeyMap[secondKey] : undefined;

  const base = dnaToBusinessWeights[topKey];

  const jitter = (v: number) => Math.min(99, Math.max(40, v + Math.floor(Math.random() * 11) - 5));
  const businessScores: BusinessScores = {
    affiliate: jitter(base.affiliate),
    digital: jitter(base.digital),
    personalBrand: jitter(base.personalBrand),
    knowledge: jitter(base.knowledge),
    community: jitter(base.community),
  };

  return { dnaType, secondaryDnaType, businessScores };
}
