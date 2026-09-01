import type {
  CanonicalDnaIdentity,
  EntrepreneurDnaQuestion,
} from "./types";

export const ENTREPRENEUR_DNA_V2_QUESTIONS: readonly EntrepreneurDnaQuestion[] = [
  {
    id: 1,
    category: "Natural Leadership Role",
    question: "When you're part of a group working toward something important, what role do you naturally find yourself taking?",
    options: [
      { value: "A", label: "I get people excited about the bigger vision and where we're going.", weights: { visionary_leader: 3, influence_creator: 2 } },
      { value: "B", label: "I organize the ideas and figure out how we're actually going to make it work.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "C", label: "I bring people together and make sure everyone feels connected.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "I become the person people turn to for answers, knowledge or guidance.", weights: { knowledge_authority: 3, community_builder: 1 } },
    ],
  },
  {
    id: 2,
    category: "Problem Solving Style",
    question: "When something important isn't working the way you expected, your first instinct is usually to…",
    options: [
      { value: "A", label: "Change direction quickly and trust my instincts.", weights: { action_taker: 3 } },
      { value: "B", label: "Step back, analyze what went wrong and create a structured solution.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Talk it through with people I trust and solve it together.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "Research the problem, learn from people who have solved it and apply what works.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
    ],
  },
  {
    id: 3,
    category: "Meaning of Success",
    question: "When you imagine building something truly successful, what would make you feel most proud?",
    options: [
      { value: "A", label: "Knowing I created something that changed how people think or do things.", weights: { visionary_leader: 3, influence_creator: 2 } },
      { value: "B", label: "Knowing I built something lasting that could create wealth and opportunity for generations.", weights: { legacy_builder: 3, strategic_builder: 1 } },
      { value: "C", label: "Knowing I created a community that genuinely changed people's lives.", weights: { community_builder: 3, legacy_builder: 1 } },
      { value: "D", label: "Knowing I created the freedom to live life on my own terms.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 4,
    category: "Work Environment",
    question: "If you think about the environment where you naturally do your best work, which feels most like you?",
    options: [
      { value: "A", label: "Having plenty of independence and space to work things out in my own way.", weights: { freedom_strategist: 3, knowledge_authority: 1 } },
      { value: "B", label: "Working with a small group of people I trust, where everyone brings something valuable.", weights: { community_builder: 3, strategic_builder: 1 } },
      { value: "C", label: "Being surrounded by people, conversations and shared energy.", weights: { community_builder: 3, influence_creator: 2 } },
      { value: "D", label: "Leading a team where I set the direction and others help bring the vision to life.", weights: { visionary_leader: 3, legacy_builder: 2 } },
    ],
  },
  {
    id: 5,
    category: "Collaboration Style",
    question: "When you're working toward an important goal, which feels most natural?",
    options: [
      { value: "A", label: "I prefer having independence and making most decisions myself.", weights: { freedom_strategist: 3, action_taker: 1 } },
      { value: "B", label: "I enjoy collaborating when the people and vision are strongly aligned.", weights: { visionary_leader: 2, community_builder: 2 } },
      { value: "C", label: "I do my best work through close partnerships and shared strengths.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "I value collaboration most when someone brings expertise or perspective I don't have.", weights: { strategic_builder: 2, knowledge_authority: 2 } },
    ],
  },
  {
    id: 6,
    category: "Moving Ideas Forward",
    question: "When you have an idea you're excited about and want to make it happen, what feels most natural to you?",
    options: [
      { value: "A", label: "I like having the freedom to work it out my own way, without too many people influencing the process.", weights: { freedom_strategist: 3, strategic_builder: 1 } },
      { value: "B", label: "I naturally start organizing the idea into steps, systems and a clear plan.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "C", label: "I want to talk it through with other people, exchange ideas and build on what we discover together.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "I get excited and want to start doing something with the idea right away, even if I don't have every detail figured out yet.", weights: { action_taker: 3, visionary_leader: 1 } },
    ],
  },
  {
    id: 7,
    category: "Expression Style",
    question: "When you have an idea you really care about, how does it feel most natural for you to share it?",
    options: [
      { value: "A", label: "Speaking about it with energy and getting other people excited.", weights: { influence_creator: 3, visionary_leader: 2 } },
      { value: "B", label: "Writing or creating thoughtful content that helps people see things differently.", weights: { knowledge_authority: 3, influence_creator: 1 } },
      { value: "C", label: "Having meaningful conversations where I can connect with people personally.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "Turning the idea into a plan, system or something practical people can use.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
    ],
  },
  {
    id: 8,
    category: "Communication Strength",
    question: "Which communication strength sounds most like you?",
    options: [
      { value: "A", label: "Inspiring and motivating people to believe something is possible.", weights: { influence_creator: 3, visionary_leader: 2 } },
      { value: "B", label: "Teaching and explaining things in a way that makes them easier to understand.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
      { value: "C", label: "Connecting and empathizing so people feel heard and understood.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "Helping people organize their thoughts, see the bigger picture and figure out what to do next.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
    ],
  },
  {
    id: 9,
    category: "Helping Orientation",
    question: "When someone comes to you for help with a problem, what do you naturally tend to do first?",
    options: [
      { value: "A", label: "Help them see possibilities they may not have considered and encourage them to think bigger.", weights: { visionary_leader: 3, influence_creator: 1 } },
      { value: "B", label: "Ask questions, understand what's really happening and help them think through a practical solution.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Listen carefully, make sure they feel understood and help them work through it with support.", weights: { community_builder: 3 } },
      { value: "D", label: "Share what I know, explain what I've learned and give them information that could help.", weights: { knowledge_authority: 3 } },
    ],
  },
  {
    id: 10,
    category: "Risk Response",
    question: "When an exciting opportunity requires a meaningful amount of your time or money, what do you usually do?",
    options: [
      { value: "A", label: "If I believe in it, I'm comfortable taking a big chance and figuring things out as I go.", weights: { action_taker: 3, visionary_leader: 1 } },
      { value: "B", label: "I research carefully, weigh the risks and create a plan before committing.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "I prefer to test it on a smaller scale before making a bigger commitment.", weights: { strategic_builder: 2, action_taker: 2 } },
      { value: "D", label: "I usually want input or reassurance from people I trust before committing.", weights: { community_builder: 2, knowledge_authority: 1 } },
    ],
  },
  {
    id: 11,
    category: "Uncertainty Tolerance",
    question: "When you're moving toward something important but can't know exactly how it will turn out, what feels most like you?",
    options: [
      { value: "A", label: "Uncertainty energizes me. I see possibilities and I'm comfortable figuring things out along the way.", weights: { visionary_leader: 3, action_taker: 2 } },
      { value: "B", label: "I'm okay with uncertainty when I can create a plan and prepare for different outcomes.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "C", label: "I prefer reducing uncertainty as much as possible before making my move.", weights: { knowledge_authority: 3, strategic_builder: 2 } },
      { value: "D", label: "Uncertainty feels easier when I can talk things through with people I trust and get different perspectives.", weights: { community_builder: 2, knowledge_authority: 1 } },
    ],
  },
  {
    id: 12,
    category: "Response to Setbacks",
    question: "When something you've worked hard on doesn't work out, what do you naturally do next?",
    options: [
      { value: "A", label: "Learn what I can and try again quickly.", weights: { action_taker: 3 } },
      { value: "B", label: "Analyze what went wrong so I can avoid repeating the same mistake.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Talk it through with people I trust and use their perspective to help me move forward.", weights: { community_builder: 2, influence_creator: 1 } },
      { value: "D", label: "Look for another path. One setback rarely means the goal itself is impossible.", weights: { visionary_leader: 3, freedom_strategist: 1 } },
    ],
  },
  {
    id: 13,
    category: "Creative Process",
    question: "When you're creating or improving something, which approach feels most natural?",
    options: [
      { value: "A", label: "I love coming up with original ideas and trying things that haven't been done before.", weights: { visionary_leader: 3, influence_creator: 1 } },
      { value: "B", label: "I enjoy taking ideas and organizing them into something useful, structured and practical.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "My best ideas often come from talking, brainstorming and building with other people.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "I'm good at noticing what already works and finding ways to improve, combine or present it better.", weights: { knowledge_authority: 2, strategic_builder: 2 } },
    ],
  },
  {
    id: 14,
    category: "Decision Making With Incomplete Information",
    question: "When you need to make an important decision but don't have all the information you would like, what do you usually do?",
    options: [
      { value: "A", label: "Make the best decision I can and adjust quickly if needed.", weights: { action_taker: 3 } },
      { value: "B", label: "Organize what I know, compare the options and choose based on a clear plan.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Talk it through with people whose perspective I value before deciding.", weights: { community_builder: 2, knowledge_authority: 1 } },
      { value: "D", label: "Keep researching until I feel confident that I understand the situation well enough.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
    ],
  },
  {
    id: 15,
    category: "Improvement Thinking",
    question: "When you notice something that could be better, what does your mind naturally do?",
    options: [
      { value: "A", label: "I imagine a completely different or more exciting way it could be done.", weights: { visionary_leader: 3, influence_creator: 1 } },
      { value: "B", label: "I start figuring out how to organize or improve the way it works.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "C", label: "I think about how the change could make the experience better for the people involved.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "I look at what's already working and think about how it could be adapted or improved.", weights: { knowledge_authority: 2, strategic_builder: 2 } },
    ],
    beta_analysis: { possible_redundancy_with_q13: true },
  },
  {
    id: 16,
    category: "Work Autonomy",
    question: "If you could design the way you work around what brings out the best in you, which would matter most?",
    options: [
      { value: "A", label: "Having flexibility over where and when I work.", weights: { freedom_strategist: 3 } },
      { value: "B", label: "Creating systems so everything doesn't always depend on me.", weights: { strategic_builder: 3, legacy_builder: 2 } },
      { value: "C", label: "Working closely with people and feeling part of something meaningful.", weights: { community_builder: 3, influence_creator: 1 } },
      { value: "D", label: "Building something structured, ambitious and designed to grow over time.", weights: { legacy_builder: 3, strategic_builder: 2 } },
    ],
  },
  {
    id: 17,
    category: "Persistence Style",
    question: "When you're working toward something that matters to you and progress is much slower than you hoped, what are you most likely to do?",
    options: [
      { value: "A", label: "Keep pushing and try different approaches until something works.", weights: { action_taker: 3 } },
      { value: "B", label: "Step back, figure out what's blocking progress and adjust the plan.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Reach out to people I trust for ideas, encouragement or perspective.", weights: { community_builder: 2, influence_creator: 1 } },
      { value: "D", label: "Reconsider whether the goal or approach is still worth pursuing before investing more energy.", weights: { knowledge_authority: 2, strategic_builder: 1 } },
    ],
  },
  {
    id: 18,
    category: "Learning & Resourcefulness Style",
    question: "When you need to do something you've never done before, what comes most naturally?",
    options: [
      { value: "A", label: "I start experimenting and learn by doing.", weights: { action_taker: 3 } },
      { value: "B", label: "I research first so I understand what I'm getting into.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
      { value: "C", label: "I ask someone who knows more than I do and learn from them.", weights: { knowledge_authority: 2, community_builder: 1 } },
      { value: "D", label: "I break it into pieces, figure out what I need to learn and create a plan.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
    ],
  },
  {
    id: 19,
    category: "Strategic Orientation",
    question: "When you're working toward an important goal, what does your mind naturally focus on first?",
    options: [
      { value: "A", label: "Where this could lead long term and what foundation I need to build now.", weights: { legacy_builder: 3, strategic_builder: 2 } },
      { value: "B", label: "What I can accomplish relatively quickly so I can create momentum.", weights: { action_taker: 3 } },
      { value: "C", label: "Who will be affected and what they actually need from me.", weights: { community_builder: 3, knowledge_authority: 1 } },
      { value: "D", label: "How I could approach it differently or find an angle others might overlook.", weights: { visionary_leader: 3, influence_creator: 1 } },
    ],
  },
  {
    id: 20,
    category: "Recognized Natural Strength",
    question: "Which of these do people tend to recognize in you, even if you don't always notice it yourself?",
    options: [
      { value: "A", label: "I often notice possibilities or opportunities that other people don't see right away.", weights: { visionary_leader: 3, influence_creator: 1 } },
      { value: "B", label: "I'm good at organizing messy situations and creating order, structure or a better way of doing things.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "C", label: "I tend to understand what people need and find practical ways to help.", weights: { community_builder: 3, knowledge_authority: 1 } },
      { value: "D", label: "I'm good at connecting with people and making them feel understood, excited or inspired.", weights: { influence_creator: 3, community_builder: 2 } },
    ],
  },
  {
    id: 21,
    category: "Response to Opportunity",
    question: "When several exciting opportunities are in front of you, what are you most likely to do?",
    options: [
      { value: "A", label: "Choose the one with the biggest potential and go after it boldly.", weights: { visionary_leader: 3, action_taker: 2 } },
      { value: "B", label: "Compare them carefully and choose the one that makes the most strategic sense.", weights: { strategic_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "Think about which opportunity could create the most meaningful value for other people.", weights: { community_builder: 3, legacy_builder: 1 } },
      { value: "D", label: "Choose the one that gives me the greatest freedom and flexibility in how I pursue it.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 22,
    category: "Natural Teaching Response",
    question: "When you understand something well and someone else is struggling with it, what comes most naturally to you?",
    options: [
      { value: "A", label: "I enjoy breaking it down and explaining it until it makes sense to them.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
      { value: "B", label: "I prefer working through it alongside them and helping them figure it out.", weights: { community_builder: 3, knowledge_authority: 1 } },
      { value: "C", label: "I'm happy to teach it once I feel confident that I really understand it myself.", weights: { knowledge_authority: 3, strategic_builder: 1 } },
      { value: "D", label: "I usually prefer giving them encouragement, perspective or direction rather than teaching every step.", weights: { influence_creator: 3, visionary_leader: 1 } },
    ],
  },
  {
    id: 23,
    category: "Teaching Style",
    question: "When you're helping someone learn something new, what approach feels most natural to you?",
    options: [
      { value: "A", label: "Explain the why behind it so they really understand what they're doing.", weights: { knowledge_authority: 3, visionary_leader: 1 } },
      { value: "B", label: "Show them how to do it and let them learn through action.", weights: { action_taker: 3, knowledge_authority: 1 } },
      { value: "C", label: "Create clear steps, examples or a process they can follow.", weights: { strategic_builder: 3, knowledge_authority: 2 } },
      { value: "D", label: "Encourage them to think differently and discover what works best for them.", weights: { visionary_leader: 3, influence_creator: 2 } },
    ],
  },
  {
    id: 24,
    category: "Energy Source",
    question: "Which kind of day tends to leave you feeling most energized?",
    options: [
      { value: "A", title: "Creating", label: "Writing, designing, imagining or building something new.", weights: { visionary_leader: 3, influence_creator: 1 } },
      { value: "B", title: "Connecting", label: "Meaningful conversations, collaboration and time with people.", weights: { community_builder: 3, influence_creator: 2 } },
      { value: "C", title: "Executing", label: "Making progress, completing important things and seeing results.", weights: { action_taker: 3, strategic_builder: 1 } },
      { value: "D", title: "Learning", label: "Discovering something new and expanding what I know.", weights: { knowledge_authority: 3 } },
    ],
  },
  {
    id: 25,
    category: "Meaningful Achievement",
    question: "When you accomplish something that really matters to you, what gives you the deepest sense of satisfaction?",
    options: [
      { value: "A", label: "Knowing I took action, made progress and turned an opportunity into something real.", weights: { action_taker: 3, visionary_leader: 1 } },
      { value: "B", label: "Knowing I created something meaningful that can continue growing and lasting over time.", weights: { legacy_builder: 3, strategic_builder: 2 } },
      { value: "C", label: "Knowing something I did genuinely made another person's life better.", weights: { community_builder: 3, knowledge_authority: 1 } },
      { value: "D", label: "Knowing I accomplished it in a way that stayed true to who I am and the life I want.", weights: { freedom_strategist: 3, influence_creator: 1 } },
    ],
  },
];

export const THEORETICAL_MAXIMA: Readonly<Record<CanonicalDnaIdentity, number>> = {
  strategic_builder: 64,
  visionary_leader: 49,
  influence_creator: 33,
  community_builder: 65,
  knowledge_authority: 48,
  action_taker: 38,
  freedom_strategist: 22,
  legacy_builder: 20,
};
