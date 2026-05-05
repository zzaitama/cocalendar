export type TimeBucket = "morning" | "afternoon" | "evening" | "anytime"
export type RecurrenceType = "manual" | "daily" | "selectedDays"
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export interface ChoreTemplate {
  id: string
  title: string
  personId: string | null
  timeBucket: TimeBucket
  points: number
  recurrenceType: RecurrenceType
  selectedDays: Weekday[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ChoreCompletion {
  id: string
  choreId: string
  personId: string | null
  date: string
  isCompleted: boolean
  completedAt: string | null
  pointsEarned: number
  createdAt: string
  updatedAt: string
}

export type ChoreWithCompletion = ChoreTemplate & {
  completion: ChoreCompletion | null
}

export interface RewardCard {
  id: string
  title: string
  description: string
  pointsCost: number
  emoji: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PointRedemption {
  id: string
  personId: string
  rewardCardId: string
  rewardTitle: string
  pointsCost: number
  redeemedAt: string
}

export interface PersonPoints {
  personId: string
  earned: number
  redeemed: number
  available: number
}
