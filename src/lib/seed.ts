import type { Project } from './types';

/** Fallback projects when Notion env vars are missing (mirrors current portfolio). */
export const seedProjects: Project[] = [
  {
    id: 'seed-foodma',
    name: 'Foodma',
    description:
      'CTO at Foodma: Digital infrastructure for Restaurants & food businesses.',
    tags: [
      'Restaurant ordering Apps',
      'Inventory and payment platforms',
      'Point of sales systems',
      'Analytics and performance systems',
    ],
    siteUrl: 'https://foodma.co/',
    githubUrl: null,
    imageUrl: 'Images/foodma.png',
    featured: true,
    order: 1,
  },
  {
    id: 'seed-awadoc',
    name: 'Awadoc',
    description:
      'Backend engineer at Awadoc: Instant Healthcare via WhatsApp, Powered by AI.',
    tags: [
      'Quality Assurance',
      'API Development',
      'DevOps & Meta services',
      'API Integrations',
    ],
    siteUrl: 'https://awadoc.com/',
    githubUrl: null,
    imageUrl: 'Images/awadoc.png',
    featured: true,
    order: 2,
  },
  {
    id: 'seed-pangeamedics',
    name: 'PangeaMedics',
    description:
      'Co-founded Pangeamedics, a healthcare platform that connects patients with medical professionals for online consultations and healthcare services.',
    tags: [
      'Online consultations',
      'Healthcare services',
      'Patient management',
      'Medical professional networking',
    ],
    siteUrl: 'https://pangeamedics.com',
    githubUrl: null,
    imageUrl: 'Images/pangeamedics.png',
    featured: true,
    order: 3,
  },
  {
    id: 'seed-formlr',
    name: 'Formlr',
    description:
      'Formlr is a survey creation tool that lets users create, distribute, and analyze surveys with ease.',
    tags: ['Forms', 'Surveys', 'Quizs', 'Questionaire'],
    siteUrl: 'https://formlr.onrender.com/',
    githubUrl: 'https://github.com/abkaaar/formlr',
    imageUrl: 'Images/formlr.png',
    featured: true,
    order: 4,
  },
  {
    id: 'seed-scholardex',
    name: 'Scholardex',
    description:
      'Scholaarship managament system that allows users to manage scholarships, applications, and reviews efficiently. It provides a user-friendly interface for students to apply for scholarships and for administrators to review and award them.',
    tags: [
      'Manage scholarships',
      'Applications',
      'Review Scholarships',
      'Award Scholarships',
    ],
    siteUrl: 'https://scholardex.vercel.app',
    githubUrl: 'https://github.com/abkaaar/scholardex',
    imageUrl: 'Images/scholadex.png',
    featured: true,
    order: 5,
  },
  {
    id: 'seed-quizines',
    name: 'Quizines',
    description:
      'Quizines lets you create and host quizzes with different question types, images, videos, and more. You can also import quizzes from other sources, and get instant results.',
    tags: ['Quizs', 'Competitions', 'Games', 'Gradings'],
    siteUrl: 'https://quizines.vercel.app',
    githubUrl: 'https://github.com/abkaaar/Quiz-App',
    imageUrl: 'Images/quizines.png',
    featured: true,
    order: 6,
  },
  {
    id: 'seed-ecommerce',
    name: 'Ecommerce',
    description:
      'Mordern Ecommerce platform that allows customers to buy products seamlessly online. It provides a user-friendly and modern interface for customers to browse and purchase products.',
    tags: [
      'Product Catalog',
      'Shopping Cart',
      'Order Management',
      'Payment Integration',
    ],
    siteUrl: 'https://ecommerce-nu-orpin.vercel.app',
    githubUrl: 'https://github.com/abkaaar/ecommerce',
    imageUrl: 'Images/ecommerce.png',
    featured: true,
    order: 7,
  },
  {
    id: 'seed-allospace',
    name: 'AlloSpace',
    description:
      'AlloSpace is a platform designed to help space managers seamlessly manage bookings, promote their venues, and connect with individuals or businesses looking for workspaces, meeting rooms, or event spaces. With user-friendly tools and insightful analytics, AlloSpaces empowers you to focus on what matters most — providing exceptional experiences for your clients.',
    tags: ['Workspace', 'Office Space', 'Reservation', 'Flexibility'],
    siteUrl: 'https://www.allospace.co',
    githubUrl: 'https://github.com/abkaaar/allospace',
    imageUrl: 'Images/allospace.png',
    featured: false,
    order: 8,
  },
];
