import {
  BookOpen,
  Layers,
  FileText,
  Star,
  Search,
  Clock,
  Plus,
  LayoutDashboard,
  GraduationCap,
  Flame,
  Award,
  Building,
  MessageSquare,
  Settings,
  Users,
  Bot,
  Brain,
  TrendingUp,
  DollarSign,
  BarChart2,
  HelpCircle,
  StickyNote,
  Wrench,
  ClipboardList
} from 'lucide-react';
import { Course, NavItemConfig, CollectionPortalConfig, BackgroundTheme, Collection, Module, AuthorProfile, Resource } from './types';

// Default Tech/Abstract Image for fallback
export const DEFAULT_COURSE_IMAGE = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop";

export const SENDER_EMAIL = 'learning@enhancedHR.ai';

export const COURSE_CATEGORIES = [
  'Business Functions',
  'Soft Skills',
  'AI for HR',
  'Book Club',
  'HR Stories',
  'Leadership',
  'Technology',
  'Communication',
  'Culture',
  'Management',
  'Analytics'
];

export const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'favorites', label: 'Favorites', color: '#FF2600', isCustom: false },
  { id: 'research', label: 'Workspace', color: '#FF9300', isCustom: false },
  { id: 'to_learn', label: 'Watchlist', color: '#78C0F0', isCustom: false },
];

// Helper to generate a date relative to today
const getRelativeDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// --- MOCK DATA GENERATORS ---

export const MOCK_AUTHOR_PROFILE: AuthorProfile = {
  name: "Dr. Sarah Chen",
  role: "Chief People Scientist",
  bio: "Dr. Chen has over 15 years of experience in organizational psychology and AI implementation. She previously led People Analytics at TechGlobal and is a frequent keynote speaker on the future of work.",
  avatar: "" // Using initials in UI
};

export const MOCK_INSTRUCTORS: import('./types').Instructor[] = [
  {
    type: 'INSTRUCTOR',
    id: 'inst-1',
    name: "Dr. Sarah Chen",
    role: "Chief People Scientist",
    bio: "Dr. Chen has over 15 years of experience in organizational psychology and AI implementation. She previously led People Analytics at TechGlobal and is a frequent keynote speaker on the future of work.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
    credentials: ["Ph.D. Organizational Psychology", "AI Ethics Board Member", "SHRM-SCP"],
    stats: {
      courses: 12,
      students: 15420,
      rating: 4.9
    },
    featured: true
  },
  {
    type: 'INSTRUCTOR',
    id: 'inst-2',
    name: "Marcus Rodriguez",
    role: "VP of Human Resources",
    bio: "Marcus is a seasoned HR executive who has guided three companies through IPOs. His expertise lies in scaling culture, crisis communication, and executive leadership development.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop",
    credentials: ["MBA Harvard Business School", "Certified Executive Coach"],
    stats: {
      courses: 8,
      students: 8900,
      rating: 4.8
    }
  },
  {
    type: 'INSTRUCTOR',
    id: 'inst-3',
    name: "Elena Fisher",
    role: "Director of Talent Acquisition",
    bio: "Elena specializes in modern recruitment strategies and employer branding. She helps organizations attract top talent in competitive markets using data-driven approaches.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop",
    credentials: ["Master's in HR Management", "LinkedIn Top Voice"],
    stats: {
      courses: 5,
      students: 12500,
      rating: 4.7
    }
  },
  {
    type: 'INSTRUCTOR',
    id: 'inst-4',
    name: "James Wilson",
    role: "Strategic HR Consultant",
    bio: "With a background in both finance and HR, James bridges the gap between people operations and business strategy. He teaches HR leaders how to speak the language of the C-Suite.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop",
    credentials: ["CPA", "SHRM-SCP", "Wharton Executive Education"],
    stats: {
      courses: 15,
      students: 22000,
      rating: 4.6
    }
  },
  {
    type: 'INSTRUCTOR',
    id: 'inst-5',
    name: "Maya Patel",
    role: "DEI Strategist",
    bio: "Maya is a globally recognized expert in Diversity, Equity, and Inclusion. She helps organizations build inclusive cultures that drive innovation and belonging.",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200&auto=format&fit=crop",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop",
    credentials: ["Certified Diversity Professional", "TEDx Speaker"],
    stats: {
      courses: 6,
      students: 18300,
      rating: 4.9
    },
    featured: true
  }
];

export const generateMockSyllabus = (courseId: number): Module[] => {
  // Deterministic "randomness" based on courseId
  const moduleCount = (courseId % 3) + 3; // 3 to 5 modules

  return Array.from({ length: moduleCount }).map((_, mIdx) => ({
    id: `m-${courseId}-${mIdx}`,
    title: `Module ${mIdx + 1}: ${['Foundations', 'Core Concepts', 'Advanced Applications', 'Case Studies', 'Final Project'][mIdx] || 'Topic Deep Dive'}`,
    duration: '45m', // Mock duration
    lessons: Array.from({ length: (courseId % 2) + 3 }).map((__, lIdx) => ({
      id: `l-${courseId}-${mIdx}-${lIdx}`,
      title: `Lesson ${mIdx + 1}.${lIdx + 1}: ${['Introduction', 'Key Theories', 'Practical Frameworks', 'Expert Interview', 'Knowledge Check'][lIdx] || 'Summary'}`,
      duration: `${10 + (lIdx * 5)} min`,
      isCompleted: false, // Will be overridden by logic in UI based on course progress
      type: lIdx === 3 ? 'quiz' : 'video'
    }))
  }));
};

export const generateMockResources = (courseId: number): Resource[] => {
  return [
    { id: `r-${courseId}-1`, title: 'Course Syllabus & Guide', type: 'PDF', size: '1.2 MB', url: '#' },
    { id: `r-${courseId}-2`, title: 'Lecture Notes: Week 1', type: 'DOC', size: '450 KB', url: '#' },
    { id: `r-${courseId}-3`, title: 'Case Study Data Set', type: 'XLS', size: '2.8 MB', url: '#' },
    { id: `r-${courseId}-4`, title: 'External References', type: 'LINK', url: '#' }
  ];
};

export const MOCK_COURSES: Course[] = [
  // --- AI FOR HR (7 Items) ---
  {
    type: "COURSE", id: 101,
    title: "AI Leadership Strategies",
    author: "Dr. Sarah Chen",
    progress: 0,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
    description: "Master the art of leading teams through the AI revolution. Learn to balance automation with human empathy.",
    duration: "4h 15m",
    rating: 4.8,
    badges: ['REQUIRED', 'SHRM'],
    isSaved: true,
    collections: ['favorites'],
    dateAdded: getRelativeDate(2) // 2 days ago
  },
  {
    type: "COURSE", id: 102,
    title: "Generative AI for Recruiters",
    author: "Tech HR Labs",
    progress: 5,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    description: "Practical applications of LLMs in sourcing, screening, and communicating with candidates.",
    duration: "3h 00m",
    rating: 4.8,
    badges: ['SHRM'],
    isSaved: true,
    collections: ['to_learn'],
    dateAdded: getRelativeDate(10) // 10 days ago
  },
  {
    type: "COURSE", id: 103,
    title: "Prompt Engineering 101",
    author: "Alex Rivera",
    progress: 45,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=1000&auto=format&fit=crop",
    description: "Learn the specific syntax and structures to get the best results from ChatGPT and Claude for HR tasks.",
    duration: "2h 15m",
    rating: 4.9,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(1) // Yesterday
  },
  {
    type: "COURSE", id: 104,
    title: "Ethical AI Governance",
    author: "Legal Dept & IT",
    progress: 100,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
    description: "Understanding bias, privacy, and security when deploying AI tools in the workplace.",
    duration: "1h 30m",
    rating: 4.5,
    badges: ['REQUIRED'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(45) // Last month
  },
  {
    type: "COURSE", id: 105,
    title: "Predictive Retention Models",
    author: "Data Science Team",
    progress: 10,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop",
    description: "Using machine learning to identify flight risks before they hand in their resignation.",
    duration: "5h 00m",
    rating: 4.7,
    badges: ['HRCI'],
    isSaved: true,
    collections: ['research'],
    dateAdded: getRelativeDate(5)
  },
  {
    type: "COURSE", id: 106,
    title: "The Automated Onboarding",
    author: "People Ops",
    progress: 0,
    category: "AI for HR",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop",
    description: "Building a seamless, AI-assisted onboarding journey that feels personal at scale.",
    duration: "3h 45m",
    rating: 4.2,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(100)
  },

  // --- LEADERSHIP (6 Items) ---
  {
    type: "COURSE", id: 201,
    title: "Change Management Essentials",
    author: "Robert Fox",
    progress: 0,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
    description: "Navigating organizational transitions with minimal disruption and maximum employee engagement.",
    duration: "5h 15m",
    rating: 4.6,
    badges: ['HRCI'],
    isSaved: true,
    collections: ['to_learn'],
    dateAdded: getRelativeDate(20)
  },
  {
    type: "COURSE", id: 202,
    title: "Leading Remote Teams",
    author: "Sarah Jenks",
    progress: 75,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop",
    description: "Strategies for maintaining culture, productivity, and connection in a distributed workforce.",
    duration: "3h 20m",
    rating: 4.5,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(0) // Today
  },
  {
    type: "COURSE", id: 203,
    title: "Executive Presence",
    author: "Marcus Aurelius II",
    progress: 0,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop",
    description: "How to command a room, speak with authority, and influence C-Suite stakeholders.",
    duration: "4h 00m",
    rating: 4.9,
    badges: ['SHRM'],
    isSaved: true,
    collections: ['favorites'],
    dateAdded: getRelativeDate(8)
  },
  {
    type: "COURSE", id: 204,
    title: "Strategic Visioning",
    author: "Board of Directors",
    progress: 10,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop",
    description: "Moving from tactical execution to long-term strategic planning.",
    duration: "6h 30m",
    rating: 4.7,
    badges: ['REQUIRED'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(300)
  },
  {
    type: "COURSE", id: 205,
    title: "Mentorship Masterclass",
    author: "Elena Fisher",
    progress: 90,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop",
    description: "How to effectively mentor junior talent and build the next generation of leaders.",
    duration: "2h 45m",
    rating: 4.8,
    badges: [],
    isSaved: true,
    collections: ['research'],
    dateAdded: getRelativeDate(15)
  },
  {
    type: "COURSE", id: 206,
    title: "Conflict Resolution",
    author: "HR Mediation Team",
    progress: 0,
    category: "Leadership",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop",
    description: "Turning workplace conflict into constructive dialogue and growth opportunities.",
    duration: "3h 15m",
    rating: 4.6,
    badges: ['HRCI'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(60)
  },

  // --- BUSINESS FUNCTIONS (6 Items) ---
  {
    type: "COURSE", id: 301,
    title: "Strategic HR Management",
    author: "James Wilson",
    progress: 12,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop",
    description: "Aligning human resources with the core business objectives to drive long-term organizational success.",
    duration: "8h 45m",
    rating: 4.2,
    badges: ['REQUIRED'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(200)
  },
  {
    type: "COURSE", id: 302,
    title: "Compensation & Benefits",
    author: "Finance Dept",
    progress: 0,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop",
    description: "Designing competitive packages that attract talent without breaking the bank.",
    duration: "5h 30m",
    rating: 4.4,
    badges: ['SHRM'],
    isSaved: true,
    collections: ['research'],
    dateAdded: getRelativeDate(4)
  },
  {
    type: "COURSE", id: 303,
    title: "The Future of HR Analytics",
    author: "Elena Fisher",
    progress: 0,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1000&auto=format&fit=crop",
    description: "Dive deep into predictive analytics and how data is shaping the future of talent acquisition.",
    duration: "6h 00m",
    rating: 4.9,
    badges: ['SHRM', 'HRCI'],
    isSaved: true,
    collections: ['to_learn'],
    dateAdded: getRelativeDate(1)
  },
  {
    type: "COURSE", id: 304,
    title: "Labor Law Compliance",
    author: "Legal Partners LLP",
    progress: 100,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop",
    description: "An essential update on federal and state labor laws for the current fiscal year.",
    duration: "4h 00m",
    rating: 4.3,
    badges: ['REQUIRED', 'HRCI'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(180)
  },
  {
    type: "COURSE", id: 305,
    title: "Agile HR Workflows",
    author: "Scrum Masters",
    progress: 20,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1000&auto=format&fit=crop",
    description: "Implementing agile methodologies within the People Operations function.",
    duration: "3h 15m",
    rating: 4.6,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(25)
  },
  {
    type: "COURSE", id: 306,
    title: "Global Mobility",
    author: "International Team",
    progress: 0,
    category: "Business Functions",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&auto=format&fit=crop",
    description: "Managing expatriate assignments, visas, and cross-border taxation issues.",
    duration: "4h 45m",
    rating: 4.5,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(40)
  },

  // --- SOFT SKILLS (6 Items) ---
  {
    type: "COURSE", id: 401,
    title: "Crisis Communication",
    author: "Marcus Rodriguez",
    progress: 35,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?q=80&w=1000&auto=format&fit=crop",
    description: "Effective frameworks for handling internal and external communications during organizational crises.",
    duration: "2h 30m",
    rating: 4.5,
    badges: ['HRCI'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(3)
  },
  {
    type: "COURSE", id: 402,
    title: "Active Listening Lab",
    author: "Dr. Lisa Su",
    progress: 0,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
    description: "Techniques to truly hear what your employees are saying, not just what they are speaking.",
    duration: "1h 45m",
    rating: 4.8,
    badges: [],
    isSaved: true,
    collections: ['favorites'],
    dateAdded: getRelativeDate(7)
  },
  {
    type: "COURSE", id: 403,
    title: "Negotiation Tactics",
    author: "The Dealmakers",
    progress: 60,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop",
    description: "Getting to 'Yes' in salary negotiations, vendor contracts, and internal disputes.",
    duration: "3h 00m",
    rating: 4.7,
    badges: ['SHRM'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(90)
  },
  {
    type: "COURSE", id: 404,
    title: "Emotional Intelligence",
    author: "Daniel Goleman (Guest)",
    progress: 0,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=1000&auto=format&fit=crop",
    description: "Understanding your own emotions and those of others to manage relationships effectively.",
    duration: "4h 15m",
    rating: 4.9,
    badges: ['REQUIRED'],
    isSaved: true,
    collections: ['to_learn'],
    dateAdded: getRelativeDate(12)
  },
  {
    type: "COURSE", id: 405,
    title: "Time Management",
    author: "Productivity Pros",
    progress: 10,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1000&auto=format&fit=crop",
    description: "Deep work, time blocking, and the art of saying no to non-essential meetings.",
    duration: "2h 00m",
    rating: 4.4,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(30)
  },
  {
    type: "COURSE", id: 406,
    title: "Public Speaking",
    author: "Toastmasters",
    progress: 0,
    category: "Soft Skills",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1000&auto=format&fit=crop",
    description: "Overcome stage fright and deliver compelling presentations to large groups.",
    duration: "3h 30m",
    rating: 4.6,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(55)
  },

  // --- HR STORIES (5 Items) ---
  {
    type: "COURSE", id: 501,
    title: "Diversity & Inclusion Stories",
    author: "Maya Patel",
    progress: 100,
    category: "HR Stories",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop",
    description: "Real-world stories of building inclusive workplace cultures that foster innovation and belonging.",
    duration: "3h 30m",
    rating: 4.7,
    badges: ['SHRM'],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(2)
  },
  {
    type: "COURSE", id: 502,
    title: "Startup to IPO: A Journey",
    author: "Founders Collective",
    progress: 0,
    category: "HR Stories",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop",
    description: "The chaotic, exciting, and difficult HR challenges faced during rapid scaling.",
    duration: "2h 00m",
    rating: 4.8,
    badges: [],
    isSaved: true,
    collections: ['research'],
    dateAdded: getRelativeDate(18)
  },
  {
    type: "COURSE", id: 503,
    title: "The 4-Day Work Week",
    author: "Case Study Group",
    progress: 25,
    category: "HR Stories",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop",
    description: "Interviews with companies that successfully made the switch, and those that failed.",
    duration: "1h 45m",
    rating: 4.5,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(0)
  },
  {
    type: "COURSE", id: 504,
    title: "From Toxic to Thriving",
    author: "Culture Turnaround",
    progress: 0,
    category: "HR Stories",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop",
    description: "A documentary-style look at how one company completely overhauled its toxic culture.",
    duration: "2h 30m",
    rating: 4.9,
    badges: ['SHRM'],
    isSaved: true,
    collections: ['favorites'],
    dateAdded: getRelativeDate(6)
  },
  {
    type: "COURSE", id: 505,
    title: "Lessons from the Factory Floor",
    author: "Manufacturing HR",
    progress: 0,
    category: "HR Stories",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
    description: "Unique HR challenges in the manufacturing sector and what corporate can learn from them.",
    duration: "2h 15m",
    rating: 4.4,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(365)
  },

  // --- BOOK CLUB (5 Items) ---
  {
    type: "COURSE", id: 601,
    title: "Radical Candor Review",
    author: "Book Club Group",
    progress: 0,
    category: "Book Club",
    image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1000&auto=format&fit=crop",
    description: "A deep dive group discussion into Kim Scott's Radical Candor and its application in modern HR.",
    duration: "1h 30m",
    rating: 4.9,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(14)
  },
  {
    type: "COURSE", id: 602,
    title: "Good to Great",
    author: "Jim Collins (Analysis)",
    progress: 0,
    category: "Book Club",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1000&auto=format&fit=crop",
    description: "Breaking down the seminal text on why some companies make the leap and others don't.",
    duration: "2h 00m",
    rating: 4.8,
    badges: [],
    isSaved: true,
    collections: ['research'],
    dateAdded: getRelativeDate(500)
  },
  {
    type: "COURSE", id: 603,
    title: "Work Rules!",
    author: "Google HR Alumni",
    progress: 50,
    category: "Book Club",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?q=80&w=1000&auto=format&fit=crop",
    description: "Discussing Laszlo Bock's insights from inside Google to transform how you live and lead.",
    duration: "1h 45m",
    rating: 4.7,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(400)
  },
  {
    type: "COURSE", id: 604,
    title: "Dare to Lead",
    author: "Brené Brown Fan Club",
    progress: 0,
    category: "Book Club",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
    description: "Exploring courage, vulnerability, and values in the workplace context.",
    duration: "2h 15m",
    rating: 4.9,
    badges: ['SHRM'],
    isSaved: true,
    collections: ['favorites'],
    dateAdded: getRelativeDate(22)
  },
  {
    type: "COURSE", id: 605,
    title: "The Culture Map",
    author: "Erin Meyer Discussion",
    progress: 10,
    category: "Book Club",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1000&auto=format&fit=crop",
    description: "Breaking through the invisible boundaries of global business.",
    duration: "1h 50m",
    rating: 4.6,
    badges: [],
    isSaved: false,
    collections: [],
    dateAdded: getRelativeDate(28)
  },
];

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'academy', label: 'Academy', icon: GraduationCap, isActive: true },
  { id: 'prometheus', label: 'Prometheus AI', icon: Flame, color: 'text-brand-orange' },
  { id: 'tools', label: 'Tools', icon: Wrench, color: 'text-teal-400' },
  { id: 'personal-context', label: 'Personal Context', icon: Brain },
  { id: 'help', label: 'Help', icon: HelpCircle, color: 'text-brand-blue-light' },
];

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
    { id: 'admin', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin/courses', label: 'Courses', icon: BookOpen },
    { id: 'admin/experts', label: 'Experts', icon: GraduationCap },
    { id: 'admin/payouts', label: 'Payouts', icon: DollarSign },
    { id: 'admin/prompts', label: 'AI Agents', icon: MessageSquare },
    { id: 'admin/prompt-suggestions', label: 'Prompt Suggestions', icon: MessageSquare },
    { id: 'admin/ai-logs', label: 'AI Logs', icon: Bot },
    { id: 'admin/users', label: 'Users', icon: Users },
    { id: 'admin/system', label: 'System Tools', icon: Layers },
];

export const ORG_NAV_ITEMS: NavItemConfig[] = [
    { id: 'org-analytics', label: 'Analytics', icon: TrendingUp, color: 'text-purple-400' },
    { id: 'org-team', label: 'All Users', icon: Users, color: 'text-brand-blue-light' },
];

export const EMPLOYEE_NAV_ITEMS: NavItemConfig[] = [
    { id: 'assigned-learning', label: 'Assigned Learning', icon: ClipboardList, color: 'text-emerald-400' },
];

export const EXPERT_NAV_ITEMS: NavItemConfig[] = [
    { id: 'author', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'author/courses', label: 'My Courses', icon: BookOpen },
    { id: 'author/analytics', label: 'AI Analytics', icon: BarChart2 },
    { id: 'author/earnings', label: 'Earnings', icon: DollarSign },
];

export const COLLECTION_NAV_ITEMS: NavItemConfig[] = [
  { id: 'conversations', label: 'Conversations', icon: MessageSquare, color: 'text-brand-blue-light' },
  { id: 'notes', label: 'All Notes', icon: StickyNote, color: 'text-amber-400' },
  { id: 'favorites', label: 'Favorites', icon: Star, color: 'text-brand-red' },
  { id: 'research', label: 'Workspace', icon: Search, color: 'text-brand-orange' },
  { id: 'to_learn', label: 'Watchlist', icon: Clock, color: 'text-brand-blue-light' },
  { id: 'company', label: 'Company', icon: Building, color: 'text-slate-400' },
  { id: 'new', label: 'New Collection', icon: Plus, color: 'text-brand-blue-light' },
];

export const CONVERSATION_NAV_ITEMS: NavItemConfig[] = [
  { id: 'chat-1', label: 'Tutor: Communicating Comp', icon: MessageSquare },
  { id: 'chat-2', label: 'Onboarding best practices', icon: MessageSquare },
  { id: 'chat-3', label: 'Course recommendations', icon: MessageSquare },
];

export const COLLECTION_PORTALS: CollectionPortalConfig[] = [
  { id: 'favorites', label: 'Favorites', icon: Star, color: '#FF2600' }, // Brand Red
  { id: 'research', label: 'Workspace', icon: Search, color: '#FF9300' }, // Brand Orange
  { id: 'to_learn', label: 'Watchlist', icon: Clock, color: '#78C0F0' }, // Brand Light Blue
  { id: 'new', label: 'New / Other', icon: Plus, color: '#3b82f6' },    // Standard Blue
];

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'deep-void',
    label: 'Deep Void (Animated)',
    type: 'preset',
    value: 'bg-[#0A0D12]'
  },
  {
    id: 'neon-horizon',
    label: 'Neon Horizon (Animated)',
    type: 'preset',
    value: 'bg-[#080512]'
  },
  {
    id: 'zen-particles',
    label: 'Zen Particles (Animated)',
    type: 'preset',
    value: 'bg-[#0F0D0A]'
  },
  {
    id: 'arctic-aurora',
    label: 'Arctic Aurora (Animated)',
    type: 'preset',
    value: 'bg-[#051114]'
  },
  {
    id: 'static-ocean',
    label: 'Ocean Depths',
    type: 'preset',
    value: 'bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#054C74]/40 via-[#0A0D12] to-black'
  }
];