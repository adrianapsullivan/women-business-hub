import type { DNAType } from "./quiz-data";

export interface DNAProfile {
  type: DNAType;
  tagline: string;
  rarity: number;
  color: string;
  secondaryColor: string;
  symbol: string;
  personality: string;
  strengths: string[];
  skillsToDevelop: string[];
  whyItHasntWorked: string;
  futurePotential: string;
}

export const dnaProfiles: Record<DNAType, DNAProfile> = {
  "Strategic Builder": {
    type: "Strategic Builder",
    tagline: "You don't build businesses. You build empires with blueprints.",
    rarity: 8,
    color: "#D4AF37",
    secondaryColor: "#E8C96A",
    symbol: "◆",
    personality:
      "You are a master builder at your core. While others dream, you design. While others talk, you construct. Your mind naturally sees the interconnected systems behind success — the frameworks, the funnels, the foundations that make everything else possible. You think in long timelines and large scale. The details don't intimidate you; they excite you. You are not just building a business — you are architecting a legacy.",
    strengths: [
      "Systems and process design",
      "Long-term strategic planning",
      "Building scalable structures",
      "Seeing the big picture AND the details",
      "Creating automated income engines",
      "Turning vision into executable blueprints",
    ],
    skillsToDevelop: [
      "Showing vulnerability and personal storytelling",
      "Speed and agility — sometimes done is better than perfect",
      "Delegation and trusting others with your systems",
      "Emotional connection in marketing",
    ],
    whyItHasntWorked:
      "You've likely over-engineered before launching, waited for perfection, or been so focused on building the perfect system that you never invited anyone into it. Your biggest block is visibility — you build beautiful things in private.",
    futurePotential:
      "When you release your empire to the world, nothing will stop you. You have the rare ability to create businesses that genuinely scale — systems that earn while you sleep, funnels that convert automatically, and frameworks others pay premium prices to learn. Your empire will be built to last.",
  },

  "Visionary Leader": {
    type: "Visionary Leader",
    tagline: "You see what doesn't exist yet — and make it inevitable.",
    rarity: 11,
    color: "#C8B49A",
    secondaryColor: "#DED0BC",
    symbol: "✦",
    personality:
      "You operate in a frequency most people cannot access. You sense shifts before they happen. You see opportunities in voids. Your mind is always ten moves ahead of the conversation. People are magnetically drawn to you because you radiate conviction and possibility. You have been told you think too big — and those people were wrong. The world needs your vision more than your comfort zone needs protecting.",
    strengths: [
      "Trend identification and market positioning",
      "Inspiring and mobilizing audiences",
      "Creating categories, not just products",
      "Magnetic personal presence",
      "Pivoting quickly when vision shifts",
      "Painting compelling futures people want to step into",
    ],
    skillsToDevelop: [
      "Execution and follow-through on one idea at a time",
      "Building operational infrastructure",
      "Consistency in content and systems",
      "Letting go of new ideas long enough to complete existing ones",
    ],
    whyItHasntWorked:
      "You've likely been pulled in too many directions by too many brilliant ideas. You start strong, get bored when it's no longer shiny, and move to the next thing. Your empire is scattered across 17 half-finished ideas. The business you started last year was brilliant — you just moved too soon.",
    futurePotential:
      "Channel your vision through one singular offer or platform and your impact will be historic. You have the ability to create cultural moments, launch movements, and build brands that define industries. The future is waiting for you to claim it.",
  },

  "Influence Creator": {
    type: "Influence Creator",
    tagline: "Your presence alone changes rooms. Imagine what your brand will do.",
    rarity: 14,
    color: "#E8A0BF",
    secondaryColor: "#F0C4D8",
    symbol: "★",
    personality:
      "You are a force of nature in human form. When you speak, people lean in. When you share, people share it forward. You have a natural magnetism that no strategy can teach — a rare gift that makes people feel something real when they encounter you. You don't just sell products; you sell transformation through your presence. Your personal brand is your most powerful asset, and it always has been.",
    strengths: [
      "Personal branding and storytelling",
      "Captivating communication across formats",
      "Building loyal, devoted audiences",
      "Emotional resonance and authentic vulnerability",
      "Influencing at scale through personality",
      "Creating desire and aspiration",
    ],
    skillsToDevelop: [
      "Building backend systems and scalable structures",
      "Monetizing beyond your own presence",
      "Strategic business planning",
      "Creating products that don't require your constant energy",
    ],
    whyItHasntWorked:
      "Your business has likely been too dependent on your energy, time, and presence. You've created income that stops the moment you stop showing up. Or perhaps you haven't fully committed to your own brand because impostor syndrome told you who you are isn't enough. It is more than enough.",
    futurePotential:
      "When you marry your magnetic presence with smart systems, you become unstoppable. Think personal brand empire — courses, memberships, and a media presence that generates millions from your authentic self. The world doesn't just want what you know. They want YOU.",
  },

  "Community Builder": {
    type: "Community Builder",
    tagline: "Where you go, belonging follows. That is your superpower.",
    rarity: 12,
    color: "#C07888",
    secondaryColor: "#D4A0B0",
    symbol: "⬡",
    personality:
      "You are the rare woman who walks into any room and makes everyone feel like they belong. You don't just build businesses — you build homes for people who have been searching for their tribe. Your deepest gift is your ability to create safety, connection, and transformation in groups. People don't buy from you; they join you. And once they do, they rarely leave, because what you create is irreplaceable.",
    strengths: [
      "Creating deep belonging and psychological safety",
      "Facilitating transformation through community",
      "Building recurring community-based revenue",
      "Loyalty and long-term retention",
      "Empowering others to become leaders",
      "Creating spaces of radical connection",
    ],
    skillsToDevelop: [
      "Setting stronger personal boundaries",
      "Scaling without losing intimacy",
      "Selling and self-promotion",
      "Systematizing and automating community processes",
    ],
    whyItHasntWorked:
      "You've likely been giving away your gift for free — creating incredible community experiences without monetizing them properly. You may also be struggling with boundaries, pouring yourself empty for others. Your community loves you, but your bank account doesn't reflect your impact yet.",
    futurePotential:
      "Membership communities, mastermind groups, and paid sisterhood spaces built by Community Builders are among the highest-retention, highest-lifetime-value businesses in the online world. Your ability to make people feel at home is worth millions.",
  },

  "Knowledge Authority": {
    type: "Knowledge Authority",
    tagline: "You hold keys that unlock destinies. It's time to share them.",
    rarity: 16,
    color: "#B4A898",
    secondaryColor: "#CCC4B8",
    symbol: "◎",
    personality:
      "You are a walking library of hard-won wisdom. Years of research, study, and experience have given you something most people search their whole lives for: true expertise. You don't just know things — you understand them at a cellular level. You can take complexity and transform it into clarity. You are the woman people go to when they need real answers, not just inspiration. Your depth is your edge.",
    strengths: [
      "Deep expertise and intellectual authority",
      "Creating educational content and curriculum",
      "Problem-solving with nuanced, layered thinking",
      "Research and synthesis of complex information",
      "Building trust through credibility and depth",
      "Creating transformative learning experiences",
    ],
    skillsToDevelop: [
      "Marketing and selling your knowledge confidently",
      "Simplifying your message for broader audiences",
      "Visibility and showing up consistently",
      "Charging what your expertise is truly worth",
    ],
    whyItHasntWorked:
      "You likely undercharge because you assume everyone knows what you know — they don't. You may also over-deliver and under-sell, or get so deep in creation mode that you forget to market. You've been the best-kept secret in your industry, and that ends now.",
    futurePotential:
      "Courses, certifications, books, and consulting programs built around your expertise create some of the most powerful and leveraged businesses online. Your knowledge empire is your intellectual property — and it can generate income long after you've moved on to the next level.",
  },

  "Action Taker": {
    type: "Action Taker",
    tagline: "While others plan, you execute. Speed is your superpower.",
    rarity: 10,
    color: "#C88C50",
    secondaryColor: "#DEB07A",
    symbol: "⚡",
    personality:
      "You are built for action. While other women are still creating vision boards, you've already launched. You have a rare capacity for speed, decisiveness, and bold execution that most people can barely imagine. You don't wait for perfect conditions — you create momentum and figure it out in motion. You have more launch energy in one morning than most people have in a month. The market respects you because you show up, repeatedly, without excuses.",
    strengths: [
      "Speed of execution and decisive action",
      "Launching and iterating rapidly",
      "High energy and persistence under pressure",
      "Natural urgency that drives results",
      "Resilience after setbacks",
      "Leading from the front with action",
    ],
    skillsToDevelop: [
      "Slowing down to build sustainable systems",
      "Strategic patience and long-term thinking",
      "Delegation and building support teams",
      "Deep brand building and positioning",
    ],
    whyItHasntWorked:
      "You move so fast you sometimes build on weak foundations, then wonder why things collapse. You may have launched multiple offers before perfecting one. Or your brand lacks depth because you've been too busy executing to build the story around what you do. Speed is a gift — but so is strategy.",
    futurePotential:
      "Action Takers who marry their execution energy with a strong strategy and brand become the most prolific empire-builders in the space. You have the capacity to outwork, outlast, and outperform — now it's time to out-strategize too.",
  },

  "Freedom Strategist": {
    type: "Freedom Strategist",
    tagline: "You don't want a business. You want a life, and a business that funds it.",
    rarity: 13,
    color: "#D8C060",
    secondaryColor: "#E8D888",
    symbol: "∞",
    personality:
      "Freedom is not just a goal for you — it is a core value that shapes every decision you make. You refuse to build a prison with a profit margin. You want to earn while you travel, create while you rest, and live while others work. This is not laziness; this is clarity. You understand that the greatest business asset is a life well-lived, and you are determined to have both: the empire and the experience. You are the architect of liberation.",
    strengths: [
      "Creating location-independent income streams",
      "Passive and semi-passive business models",
      "Affiliate marketing and partnership income",
      "Knowing what you want and what you won't compromise",
      "Inspiring others through authentic lifestyle",
      "Minimalist and efficient business design",
    ],
    skillsToDevelop: [
      "Deeper community building for long-term loyalty",
      "Creating branded intellectual property",
      "Building visible authority in your niche",
      "Consistency despite the pull of new adventures",
    ],
    whyItHasntWorked:
      "You've likely resisted building anything that feels like a job — which sometimes means you've avoided building anything at all. Or you've built income streams without a personal brand connecting them, so nothing compounds. You have the model right; you just need the structure.",
    futurePotential:
      "The Freedom Strategist who builds a brand around her lifestyle creates one of the most aspirational and monetizable empires online. Affiliate income, digital products, and lifestyle content can fund a life most people only dream of — and you can do it all from a rooftop in Bali.",
  },

  "Legacy Builder": {
    type: "Legacy Builder",
    tagline: "You are not building for now. You are building for forever.",
    rarity: 16,
    color: "#A888A8",
    secondaryColor: "#C4AABC",
    symbol: "⬟",
    personality:
      "You think in decades, not quarters. You are building something that will outlast trends, algorithms, and even you. You have an unshakeable commitment to impact that goes beyond your own generation. Your business is not just a vehicle for income — it is a vessel for change. You are building for the daughters who will look back and say: she changed everything. That long-game thinking is rare, and it is your highest power.",
    strengths: [
      "Long-term vision and strategic depth",
      "Building brand equity and lasting reputation",
      "Inspiring generational transformation",
      "Creating businesses with values at the core",
      "Mentorship and empowering others",
      "Patience and persistence through long cycles",
    ],
    skillsToDevelop: [
      "Short-term monetization and cash flow",
      "Speed of execution in early stages",
      "Marketing and visibility now, not just eventually",
      "Revenue generation without waiting for 'the right time'",
    ],
    whyItHasntWorked:
      "You may be so focused on building something perfect and lasting that you haven't started charging yet. Or you've invested in brand and depth without prioritizing cash flow. Your vision is generational, but your bills are monthly. It's time to balance legacy with income.",
    futurePotential:
      "Legacy Builders create some of the most iconic brands in history. Your business will be referenced, studied, and celebrated long after others have come and gone. When you align your long-term vision with short-term monetization, you become truly unstoppable.",
  },
};
