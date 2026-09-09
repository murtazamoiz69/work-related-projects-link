// Nutritionist roster — every account can manage these. Named distinctly from
// CLIENTS_DATA so no person reads as both a user and a nutritionist. Every user
// is assigned to exactly one nutritionist here (consecutive slices of
// CLIENTS_DATA) so the "N members" count and its pop-up list are always real,
// distinct people. SEED_ROWS holds the people; ROSTER below picks which of them
// are on the team and how big each caseload starts out.
import { daysAgo } from '@/lib/seed'
import { CLIENTS_DATA } from '@/features/clients'
import type { Nutritionist } from './types'

type SeedRow = Omit<Nutritionist, 'memberIds'>

const SEED_ROWS: SeedRow[] = [
  {
    id: 'nut-1',
    name: 'Dr. Priya Sharma',
    initials: 'PS',
    color: '#2F5D50',
    email: 'priya.sharma@nourishwithsim.com',
    phone: '+91 98765 43201',
    qualification: 'Registered Dietitian',
    experienceYears: 12,
    joinDate: daysAgo(520),
    accessEnabled: true,
  },
  {
    id: 'nut-2',
    name: 'James Okoro, RD',
    initials: 'JO',
    color: '#55789D',
    email: 'james.okoro@nourishwithsim.com',
    phone: '+91 98765 43202',
    qualification: 'Registered Dietitian',
    experienceYears: 9,
    joinDate: daysAgo(410),
    accessEnabled: true,
  },
  {
    id: 'nut-3',
    name: 'Priya Anand',
    initials: 'PA',
    color: '#AF5688',
    email: 'priya.anand@nourishwithsim.com',
    phone: '+91 98765 43203',
    qualification: 'Certified Nutrition Specialist',
    experienceYears: 7,
    joinDate: daysAgo(365),
    accessEnabled: true,
  },
  {
    id: 'nut-4',
    name: 'Dr. Fatima Al-Sayed',
    initials: 'FA',
    color: '#8A5FBF',
    email: 'fatima.alsayed@nourishwithsim.com',
    phone: '+91 98765 43204',
    qualification: 'Clinical Nutritionist',
    experienceYears: 11,
    joinDate: daysAgo(300),
    accessEnabled: true,
  },
  {
    id: 'nut-5',
    name: 'Ben Whitfield, MS, RD',
    initials: 'BW',
    color: '#A3672E',
    email: 'ben.whitfield@nourishwithsim.com',
    phone: '+91 98765 43205',
    qualification: 'Sports Nutritionist',
    experienceYears: 6,
    joinDate: daysAgo(260),
    accessEnabled: true,
  },
  {
    id: 'nut-6',
    name: 'Dr. Naomi Castillo',
    initials: 'NC',
    color: '#3C8260',
    email: 'naomi.castillo@nourishwithsim.com',
    phone: '+91 98765 43206',
    qualification: 'Prenatal Nutrition Specialist',
    experienceYears: 8,
    joinDate: daysAgo(210),
    accessEnabled: false,
  },
  {
    id: 'nut-7',
    name: 'Rajesh Bhatt, RDN',
    initials: 'RB',
    color: '#4A7A9D',
    email: 'rajesh.bhatt@nourishwithsim.com',
    phone: '+91 98765 43207',
    qualification: 'Diabetes Educator',
    experienceYears: 5,
    joinDate: daysAgo(175),
    accessEnabled: true,
  },
  {
    id: 'nut-8',
    name: 'Dr. Claire Bennett',
    initials: 'CB',
    color: '#786CA4',
    email: 'claire.bennett@nourishwithsim.com',
    phone: '+91 98765 43208',
    qualification: 'Weight Management Specialist',
    experienceYears: 10,
    joinDate: daysAgo(140),
    accessEnabled: true,
  },
  {
    id: 'nut-9',
    name: 'Kwame Asante, CSCS',
    initials: 'KA',
    color: '#39816E',
    email: 'kwame.asante@nourishwithsim.com',
    phone: '+91 98765 43209',
    qualification: 'Sports Performance Nutritionist',
    experienceYears: 4,
    joinDate: daysAgo(95),
    accessEnabled: true,
  },
  {
    id: 'nut-10',
    name: 'Yuki Tanaka, RD',
    initials: 'YT',
    color: '#BE4F70',
    email: 'yuki.tanaka@nourishwithsim.com',
    qualification: "Women's Health Nutritionist",
    experienceYears: 3,
    joinDate: daysAgo(60),
    accessEnabled: false,
  },
]

// The team is sized to the cohort: ten users across four practising
// nutritionists, plus one whose access is switched off. The counts below add up
// to exactly CLIENTS_DATA.length, so every user has a nutritionist and no
// nutritionist is carrying an empty caseload. Naomi keeps zero — a disabled
// nutritionist can't take a caseload, which is also what
// `assignLeastLoaded` enforces when new users are added.
const ROSTER: { id: string; memberCount: number }[] = [
  { id: 'nut-1', memberCount: 3 },
  { id: 'nut-2', memberCount: 3 },
  { id: 'nut-3', memberCount: 2 },
  { id: 'nut-7', memberCount: 2 },
  { id: 'nut-6', memberCount: 0 },
]

let cursor = 0
export const NUTRITIONISTS_DATA: Nutritionist[] = ROSTER.map(
  ({ id, memberCount }) => {
    const seedRow = SEED_ROWS.find((r) => r.id === id)
    if (!seedRow) throw new Error(`Roster id ${id} is not in SEED_ROWS`)
    const memberIds = CLIENTS_DATA.slice(cursor, cursor + memberCount).map(
      (c) => c.id,
    )
    cursor += memberCount
    return { ...seedRow, memberIds }
  },
)
