import type { CanonicalDnaIdentity, EntrepreneurDnaQuestion } from "./types";

// Frozen V1 instrument. Keep question and option wording, order and weights in sync with the specification.
export const ENTREPRENEUR_DNA_V2_QUESTIONS: readonly EntrepreneurDnaQuestion[] = [
  {
    id: 1, category: "Natural Instinct",
    question: "You come across an opportunity in an area you don't know very well. What are you most naturally drawn to do first?",
    options: [
      { value: "A", label: "Break it into smaller pieces so I can see how it could realistically work.", weights: { strategic_builder: 3 } },
      { value: "B", label: "Explore the possibilities and imagine what could be created from it.", weights: { visionary_leader: 3 } },
      { value: "C", label: "Try something small in the real world and learn from what actually happens.", weights: { action_taker: 3 } },
      { value: "D", label: "Learn enough about the subject to understand what I'm really dealing with.", weights: { knowledge_authority: 3 } },
    ],
  },
  {
    id: 2, category: "People Orientation",
    question: "A project you care about has good people involved, but no one is really leading it. What are you most naturally drawn to do?",
    options: [
      { value: "A", label: "Create enough structure so everyone knows what needs to happen and how the pieces fit together.", weights: { strategic_builder: 3 } },
      { value: "B", label: "Find a compelling way to communicate what we're doing so people feel excited to move forward.", weights: { influence_creator: 3, visionary_leader: 1 } },
      { value: "C", label: "Understand the people involved, what each person brings, and help everyone find where they can contribute best.", weights: { community_builder: 3 } },
      { value: "D", label: "Step back and shape a clearer direction for where the project could go.", weights: { visionary_leader: 3, influence_creator: 1 } },
    ],
  },
  {
    id: 3, category: "Motivation",
    question: "Imagine you spent several years building something you genuinely cared about. Which outcome would feel most satisfying to you personally?",
    options: [
      { value: "A", label: "I turned an idea into something real instead of leaving it as a possibility.", weights: { action_taker: 3 } },
      { value: "B", label: "It became something strong and dependable that continued to work well.", weights: { strategic_builder: 3 } },
      { value: "C", label: "People connected through what I created, supported one another, and became stronger together.", weights: { community_builder: 3 } },
      { value: "D", label: "It opened possibilities that I hadn't even imagined when I started.", weights: { visionary_leader: 3 } },
    ],
  },
  {
    id: 4, category: "People Orientation",
    question: "A woman you care about has a business idea she believes in, but she feels stuck and doesn't know how to move forward. What would you most naturally want to do?",
    options: [
      { value: "A", label: "Help her understand what she needs to learn or what information could help her make a better decision.", weights: { knowledge_authority: 3 } },
      { value: "B", label: "Help her see possibilities she may not have considered yet.", weights: { visionary_leader: 3 } },
      { value: "C", label: "Help her turn the idea into a realistic path with clearer steps forward.", weights: { strategic_builder: 3 } },
      { value: "D", label: "Help her connect with people who understand what she is trying to build, so she has support, perspective, and relationships she can grow with.", weights: { community_builder: 3 } },
    ],
  },
  {
    id: 5, category: "Growth Orientation",
    question: "Something you created becomes unexpectedly successful and starts growing quickly. What would you be most naturally drawn to focus on next?",
    options: [
      { value: "A", label: "Find ways for it to grow without depending so heavily on my personal time and involvement.", weights: { freedom_strategist: 3 } },
      { value: "B", label: "Explore what else might now be possible because of this success.", weights: { visionary_leader: 3 } },
      { value: "C", label: "Strengthen the foundation so the growth is sustainable and doesn't create unnecessary problems.", weights: { strategic_builder: 3, legacy_builder: 1 } },
      { value: "D", label: "Deepen the experience and value for the people already involved.", weights: { community_builder: 3 } },
    ],
  },
  {
    id: 6, category: "Intrinsic Energy",
    question: "Imagine you have an entire uninterrupted day to work on something of your choice, with no deadlines or obligations. Which kind of activity would you naturally enjoy most?",
    options: [
      { value: "A", label: "Having meaningful conversations, exchanging perspectives, and building connections with people.", weights: { community_builder: 3 } },
      { value: "B", label: "Diving deeply into a subject that interests me and becoming much more knowledgeable about it.", weights: { knowledge_authority: 3 } },
      { value: "C", label: "Exploring new ideas and imagining possibilities I haven't considered before.", weights: { visionary_leader: 3 } },
      { value: "D", label: "Improving something that already exists so it works more smoothly and effectively.", weights: { strategic_builder: 3 } },
    ],
  },
  {
    id: 7, category: "Reward and Satisfaction",
    question: "Think about something difficult you worked hard to accomplish. Which part would make you feel most proud?",
    options: [
      { value: "A", label: "I found a way to make something happen despite uncertainty and learned through doing it.", weights: { action_taker: 3 } },
      { value: "B", label: "People became part of it, formed meaningful connections, supported one another, and grew together because of what I created.", weights: { community_builder: 3 } },
      { value: "C", label: "I turned something uncertain into something strong, organized, and capable of growing.", weights: { strategic_builder: 3 } },
      { value: "D", label: "I saw a possibility that wasn't obvious at first and helped turn it into something meaningful.", weights: { visionary_leader: 3 } },
    ],
  },
  {
    id: 8, category: "Decision Style",
    question: "You feel strongly about an idea, but several people you respect suggest a different approach. What are you most naturally inclined to do?",
    options: [
      { value: "A", label: "Talk with them more deeply to understand their perspectives and what each person may be seeing.", weights: { community_builder: 3 } },
      { value: "B", label: "Look for additional evidence, examples, or information before deciding.", weights: { knowledge_authority: 3 } },
      { value: "C", label: "Compare the different approaches carefully and determine which one has the strongest chance of actually working.", weights: { strategic_builder: 3 } },
      { value: "D", label: "Stay focused on the larger possibility I see, even if others don't see it yet.", weights: { visionary_leader: 3 } },
    ],
  },
  {
    id: 9, category: "Growth Orientation",
    question: "Something you built is growing so quickly that you can no longer personally oversee everything. What would you most naturally focus on?",
    options: [
      { value: "A", label: "Stay closely involved in the most important areas so the momentum doesn't slow down.", weights: { action_taker: 3 } },
      { value: "B", label: "Put stronger processes and systems in place so everything can continue working reliably as it grows.", weights: { strategic_builder: 3 } },
      { value: "C", label: "Build a capable group of people who trust one another, contribute their strengths, and can grow together.", weights: { community_builder: 3 } },
      { value: "D", label: "Identify what truly requires me, then create support around everything else so the business depends less on my constant involvement.", weights: { freedom_strategist: 3, strategic_builder: 1 } },
    ],
  },
  {
    id: 10, category: "Problem Solving",
    question: "You launch something you believed people would want, but the response is much weaker than expected. What are you most naturally drawn to do first?",
    options: [
      { value: "A", label: "Examine where the plan, process, or execution may have broken down.", weights: { strategic_builder: 3 } },
      { value: "B", label: "Try a different approach quickly and see whether the response changes.", weights: { action_taker: 3 } },
      { value: "C", label: "Learn more about the market and what may explain the weak response.", weights: { knowledge_authority: 3 } },
      { value: "D", label: "Bring some of the people it was created for together, listen to their experiences, and let the conversation between them help reveal what needs to change.", weights: { community_builder: 3 } },
    ],
  },
  {
    id: 11, category: "Intrinsic Energy",
    question: "Imagine you could spend the next several years building work that feels genuinely natural and satisfying to you. Which would appeal to you most?",
    options: [
      { value: "A", label: "Becoming deeply knowledgeable in an area and creating expertise or resources that others can rely on.", weights: { knowledge_authority: 3 } },
      { value: "B", label: "Building something established, organized, and effective that works extremely well.", weights: { strategic_builder: 3 } },
      { value: "C", label: "Creating something that brings people together and gives them a real sense of connection and belonging.", weights: { community_builder: 3 } },
      { value: "D", label: "Exploring possibilities, developing new ideas, and continually seeing what could come next.", weights: { visionary_leader: 3 } },
    ],
  },
  {
    id: 12, category: "Decision Style",
    question: "You have something ready to share, but you can still see several ways it could be improved. What are you most naturally inclined to do?",
    options: [
      { value: "A", label: "Share it with a small group of people I trust and use their reactions to help shape the next version.", weights: { community_builder: 3 } },
      { value: "B", label: "Release it now and learn from what happens once it's in the real world.", weights: { action_taker: 3 } },
      { value: "C", label: "Step back and make sure it still reflects the larger direction and possibility I originally saw.", weights: { visionary_leader: 3 } },
      { value: "D", label: "Strengthen the important pieces first so I feel confident the foundation is solid before releasing it.", weights: { strategic_builder: 3 } },
    ],
  },
  {
    id: 13, category: "Meaningful Tradeoff",
    question: "You have several business ideas that all seem financially promising and equally realistic to pursue. If practical considerations were roughly equal, which one would naturally pull you most?",
    options: [
      { value: "A", label: "The one that gives me the greatest control over my time, schedule, and how involved I need to be.", weights: { freedom_strategist: 3 } },
      { value: "B", label: "The one that could create the strongest sense of connection, belonging, and shared growth among the people involved.", weights: { community_builder: 3 } },
      { value: "C", label: "The one that feels most new or different and has the potential to become something much bigger than it appears today.", weights: { visionary_leader: 3 } },
      { value: "D", label: "The one with the clearest path to becoming stable, sustainable, and well established.", weights: { strategic_builder: 3 } },
    ],
  },
  {
    id: 14, category: "People Orientation",
    question: "You develop an idea that could genuinely help a lot of people. Which role would feel most natural for you to take?",
    options: [
      { value: "A", label: "Organize the pieces behind the scenes so the idea can be delivered consistently and effectively.", weights: { strategic_builder: 3 } },
      { value: "B", label: "Explain what I know clearly so people understand it and can use it themselves.", weights: { knowledge_authority: 3 } },
      { value: "C", label: "Bring people together around the idea so they can connect, participate, and grow through it together.", weights: { community_builder: 3 } },
      { value: "D", label: "Become the person who communicates the idea in a compelling way and inspires people to take action.", weights: { influence_creator: 3 } },
    ],
  },
  {
    id: 15, category: "Reward and Long Term Orientation",
    question: "Imagine your business becomes very successful. Years later, which aspect of that success would feel most meaningful to you?",
    options: [
      { value: "A", label: "People used the knowledge, methods, or resources I created to become more capable themselves.", weights: { knowledge_authority: 3 } },
      { value: "B", label: "My voice or message changed how people thought about something important.", weights: { influence_creator: 3 } },
      { value: "C", label: "I built something exceptionally well organized and dependable that people could trust.", weights: { strategic_builder: 3 } },
      { value: "D", label: "I made decisions that allowed what I built to remain strong and useful beyond my own involvement, even when protecting its future required giving up easier short term opportunities.", weights: { legacy_builder: 3 } },
    ],
  },
  {
    id: 16, category: "Meaningful Tradeoff",
    question: "Your business could grow much faster if you became significantly more visible and personally associated with it. Which response feels most natural to you?",
    options: [
      { value: "A", label: "I would use the visibility to communicate ideas in a way that inspires people and moves them to act.", weights: { influence_creator: 3 } },
      { value: "B", label: "I would want the visibility to strengthen a larger mission and help people feel part of something bigger than themselves.", weights: { community_builder: 3 } },
      { value: "C", label: "I would use visibility mainly to establish credibility around what I know and what I can teach.", weights: { knowledge_authority: 3 } },
      { value: "D", label: "I would rather design the business so its growth depends as little as possible on my personal visibility.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 17, category: "People and Delivery Orientation",
    question: "Imagine you become highly knowledgeable in an area and people regularly come to you to learn. Which direction would feel most natural?",
    options: [
      { value: "A", label: "Develop a clear method or body of knowledge that people can learn and apply.", weights: { knowledge_authority: 3 } },
      { value: "B", label: "Create a group environment where people learn from me, but also support and learn from one another.", weights: { community_builder: 3 } },
      { value: "C", label: "Build a platform where I can communicate what I know to a much larger audience in an engaging way.", weights: { influence_creator: 3 } },
      { value: "D", label: "Build a business that trains other capable people to deliver the knowledge well so its impact can expand without depending entirely on me.", weights: { freedom_strategist: 2, legacy_builder: 1 } },
    ],
  },
  {
    id: 18, category: "Long Term Orientation",
    question: "Imagine something you built becomes successful enough that it could continue without your daily oversight. What possibility would excite you most?",
    options: [
      { value: "A", label: "Using what I learned to explore entirely new ideas or opportunities.", weights: { visionary_leader: 3 } },
      { value: "B", label: "Knowing that a strong culture exists where people trust one another and continue growing together.", weights: { community_builder: 3 } },
      { value: "C", label: "Knowing that what I created could remain valuable under future leaders and continue well beyond my own involvement.", weights: { legacy_builder: 3 } },
      { value: "D", label: "Being able to step away when I choose and know the business does not depend on me.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 19, category: "Opportunity and Growth Orientation",
    question: "Imagine several exciting opportunities appear at the same time, but you can pursue only one. Which would be hardest for you to turn down?",
    options: [
      { value: "A", label: "The chance to communicate an important idea or story in a way that could influence a much larger audience.", weights: { influence_creator: 3 } },
      { value: "B", label: "The chance to take a promising idea that hasn't been proven yet, put it into action quickly, and discover what it can become through real world results.", weights: { action_taker: 3 } },
      { value: "C", label: "The chance to introduce an idea that could significantly change how people currently do or think about something.", weights: { visionary_leader: 3 } },
      { value: "D", label: "The chance to build something whose value could continue for many years, even beyond my own involvement.", weights: { legacy_builder: 3 } },
    ],
  },
  {
    id: 20, category: "Intrinsic Energy",
    question: "Imagine the operational side of your business is completely handled for a month. You can spend your time however you naturally want. Which would you be most drawn to?",
    options: [
      { value: "A", label: "Spend time with the people involved, strengthening relationships and understanding what matters to them.", weights: { community_builder: 3 } },
      { value: "B", label: "Explore new ideas, possibilities, or directions the business could take next.", weights: { visionary_leader: 3 } },
      { value: "C", label: "Create messages, stories, or content that could move people and get them excited about what we're doing.", weights: { influence_creator: 3 } },
      { value: "D", label: "Go deeply into a subject, develop my expertise, or create useful knowledge and resources.", weights: { knowledge_authority: 3 } },
    ],
  },
  {
    id: 21, category: "Meaningful Tradeoff",
    question: "A larger company offers you an opportunity that could accelerate your business dramatically, but you would have to give up meaningful control over how it develops. What would matter most in your decision?",
    options: [
      { value: "A", label: "Whether the opportunity could help the original idea reach its fullest potential.", weights: { visionary_leader: 3 } },
      { value: "B", label: "Whether the business could remain well structured and continue operating effectively as it grows.", weights: { strategic_builder: 3 } },
      { value: "C", label: "Whether the people, relationships, and sense of connection around the business could be protected.", weights: { community_builder: 3 } },
      { value: "D", label: "Whether I could retain enough independence to make important decisions and shape my own role.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 22, category: "Problem Solving",
    question: "You have an idea you believe could be valuable, but people don't immediately understand why it matters. What are you most naturally drawn to do?",
    options: [
      { value: "A", label: "Find a more compelling way to communicate the idea so people can understand its value and feel drawn to it.", weights: { influence_creator: 3 } },
      { value: "B", label: "Put a small working version into the real world so people can experience it, then learn from what actually happens.", weights: { action_taker: 3 } },
      { value: "C", label: "Bring a small group of the right people together and let their perspectives and reactions help shape the idea.", weights: { community_builder: 3 } },
      { value: "D", label: "Strengthen the underlying model so the idea can become sustainable even if the initial excitement is limited.", weights: { strategic_builder: 3, legacy_builder: 1 } },
    ],
  },
  {
    id: 23, category: "Meaningful Tradeoff",
    question: "Imagine you are choosing one major project to devote several years of your life to. All four have similar financial potential. Which would pull you most strongly?",
    options: [
      { value: "A", label: "The one that could shape something new or change how people currently think about what is possible.", weights: { visionary_leader: 3 } },
      { value: "B", label: "The one with the clearest path to becoming substantial, stable, and successful over time.", weights: { strategic_builder: 3 } },
      { value: "C", label: "The one where people could participate, connect, and become part of something meaningful together.", weights: { community_builder: 3 } },
      { value: "D", label: "The one that would still allow me to protect meaningful freedom and flexibility in how I live and work.", weights: { freedom_strategist: 3 } },
    ],
  },
  {
    id: 24, category: "Long Term Orientation",
    question: "Imagine looking back many years from now at a company you built. Which outcome would make you feel most proud?",
    options: [
      { value: "A", label: "It developed leaders who continued seeing new possibilities and taking the organization in meaningful new directions.", weights: { visionary_leader: 3 } },
      { value: "B", label: "It became known for strong systems, high standards, and consistently doing things well.", weights: { strategic_builder: 3 } },
      { value: "C", label: "It created an environment where people developed, collaborated, and built a strong culture together.", weights: { community_builder: 3 } },
      { value: "D", label: "I protected what mattered most for the long term, even when doing so meant giving up attractive short term opportunities.", weights: { legacy_builder: 3 } },
    ],
  },
  {
    id: 25, category: "Long Term Orientation and Reward",
    question: "Imagine that decades from now, only one part of your work could continue. Which would you most want preserved?",
    options: [
      { value: "A", label: "The ideas I introduced continued influencing how people think about what is possible.", weights: { visionary_leader: 3 } },
      { value: "B", label: "The knowledge or methods I developed continued being taught and used by others.", weights: { knowledge_authority: 3 } },
      { value: "C", label: "The relationships and growth created through my work continued spreading from person to person.", weights: { community_builder: 3 } },
      { value: "D", label: "The organization or work itself continued creating value for future generations.", weights: { legacy_builder: 3 } },
    ],
  },
];

export const THEORETICAL_MAXIMA: Readonly<Record<CanonicalDnaIdentity, number>> =
  Object.fromEntries(
    ([
      "strategic_builder", "visionary_leader", "influence_creator",
      "community_builder", "knowledge_authority", "action_taker",
      "freedom_strategist", "legacy_builder",
    ] as const).map((identity) => [
      identity,
      ENTREPRENEUR_DNA_V2_QUESTIONS.reduce(
        (total, question) => total + Math.max(...question.options.map((option) => option.weights[identity] ?? 0)),
        0,
      ),
    ]),
  ) as Record<CanonicalDnaIdentity, number>;