// Nutritionist roster — every account can manage these. Named
// distinctly from CLIENTS_DATA so no person reads as both a user and a
// nutritionist. Every user is assigned to exactly one nutritionist here
// (consecutive slices of CLIENTS_DATA, 48 total) so the "N members" count
// and its pop-up list are always real, distinct people.
import { daysAgo } from '@/lib/seed'
import { CLIENTS_DATA } from '@/features/clients'
import type { Nutritionist } from './types'

type SeedRow = Omit<Nutritionist, 'memberIds'> & { memberCount: number }

const SEED_ROWS: SeedRow[] = [
  {
    id: 'nut-1',
    name: 'Dr. Priya Sharma',
    initials: 'PS',
    color: '#2F5D50',
    email: 'priya.sharma@nourishwithsim.com',
    qualification: 'Registered Dietitian',
    experienceYears: 12,
    joinDate: daysAgo(520),
    memberCount: 8,
    accessEnabled: true,
  },
  {
    id: 'nut-2',
    name: 'James Okoro, RD',
    initials: 'JO',
    color: '#55789D',
    email: 'james.okoro@nourishwithsim.com',
    qualification: 'Registered Dietitian',
    experienceYears: 9,
    joinDate: daysAgo(410),
    memberCount: 7,
    accessEnabled: true,
  },
  {
    id: 'nut-3',
    name: 'Priya Anand',
    initials: 'PA',
    color: '#AF5688',
    email: 'priya.anand@nourishwithsim.com',
    qualification: 'Certified Nutrition Specialist',
    experienceYears: 7,
    joinDate: daysAgo(365),
    memberCount: 6,
    accessEnabled: true,
  },
  {
    id: 'nut-4',
    name: 'Dr. Fatima Al-Sayed',
    initials: 'FA',
    color: '#8A5FBF',
    email: 'fatima.alsayed@nourishwithsim.com',
    qualification: 'Clinical Nutritionist',
    experienceYears: 11,
    joinDate: daysAgo(300),
    memberCount: 5,
    accessEnabled: true,
  },
  {
    id: 'nut-5',
    name: 'Ben Whitfield, MS, RD',
    initials: 'BW',
    color: '#A3672E',
    email: 'ben.whitfield@nourishwithsim.com',
    qualification: 'Sports Nutritionist',
    experienceYears: 6,
    joinDate: daysAgo(260),
    memberCount: 5,
    accessEnabled: true,
  },
  {
    id: 'nut-6',
    name: 'Dr. Naomi Castillo',
    initials: 'NC',
    color: '#3C8260',
    email: 'naomi.castillo@nourishwithsim.com',
    qualification: 'Prenatal Nutrition Specialist',
    experienceYears: 8,
    joinDate: daysAgo(210),
    memberCount: 4,
    accessEnabled: false,
  },
  {
    id: 'nut-7',
    name: 'Rajesh Bhatt, RDN',
    initials: 'RB',
    color: '#4A7A9D',
    email: 'rajesh.bhatt@nourishwithsim.com',
    qualification: 'Diabetes Educator',
    experienceYears: 5,
    joinDate: daysAgo(175),
    memberCount: 4,
    accessEnabled: true,
  },
  {
    id: 'nut-8',
    name: 'Dr. Claire Bennett',
    initials: 'CB',
    color: '#786CA4',
    email: 'claire.bennett@nourishwithsim.com',
    qualification: 'Weight Management Specialist',
    experienceYears: 10,
    joinDate: daysAgo(140),
    memberCount: 4,
    accessEnabled: true,
  },
  {
    id: 'nut-9',
    name: 'Kwame Asante, CSCS',
    initials: 'KA',
    color: '#39816E',
    email: 'kwame.asante@nourishwithsim.com',
    qualification: 'Sports Performance Nutritionist',
    experienceYears: 4,
    joinDate: daysAgo(95),
    memberCount: 3,
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
    memberCount: 2,
    accessEnabled: false,
  },
]

let cursor = 0
export const NUTRITIONISTS_DATA: Nutritionist[] = SEED_ROWS.map((row) => {
  const { memberCount, ...rest } = row
  const memberIds = CLIENTS_DATA.slice(cursor, cursor + memberCount).map(
    (c) => c.id,
  )
  cursor += memberCount
  return { ...rest, memberIds }
})
