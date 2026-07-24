import { pgTable, text, integer, boolean, timestamp, serial, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table from Better Auth
export const users = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: boolean('emailVerified'),
  image: text('image'),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Sessions table from Better Auth
export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt'),
  token: text('token').unique(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').references(() => users.id),
});

// Accounts table from Better Auth
export const accounts = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId'),
  providerId: text('providerId'),
  userId: text('userId').references(() => users.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
});

// Courses table
export const courses = pgTable('course', {
  id: serial('id').primaryKey(),
  courseCode: text('courseCode').unique(),
  courseName: text('courseName'),
  credits: integer('credits'),
  semester: integer('semester'),
  isMandatory: boolean('isMandatory'),
  prerequisite: text('prerequisite'), // Prerequisites as comma-separated codes
  feeType: text('feeType').default('A'), // Fee tier: A or B
  createdAt: timestamp('createdAt').defaultNow(),
});

// User exemptions (courses the student has completed or exempted)
export const exemptions = pgTable('exemption', {
  id: serial('id').primaryKey(),
  userId: text('userId').references(() => users.id),
  courseId: integer('courseId').references(() => courses.id),
  createdAt: timestamp('createdAt').defaultNow(),
});

// User credit summary
export const creditSummaries = pgTable('credit_summary', {
  id: serial('id').primaryKey(),
  userId: text('userId').references(() => users.id).unique(),
  mandatoryCreditsRequired: integer('mandatoryCreditsRequired').default(120),
  electiveCreditsRequired: integer('electiveCreditsRequired').default(12),
  mandatoryCreditsCompleted: integer('mandatoryCreditsCompleted').default(0),
  electiveCreditsCompleted: integer('electiveCreditsCompleted').default(0),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  exemptions: many(exemptions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const exemptionsRelations = relations(exemptions, ({ one }) => ({
  user: one(users, { fields: [exemptions.userId], references: [users.id] }),
  course: one(courses, { fields: [exemptions.courseId], references: [courses.id] }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  exemptions: many(exemptions),
}));

export const creditSummariesRelations = relations(creditSummaries, ({ one }) => ({
  user: one(users, { fields: [creditSummaries.userId], references: [users.id] }),
}));

// Grades table - stores student grades for courses
export const grades = pgTable('grade', {
  id: serial('id').primaryKey(),
  userId: text('userId').references(() => users.id),
  courseId: integer('courseId').references(() => courses.id),
  score: numeric('score', { precision: 4, scale: 2 }), // Scale 10 (0-10)
  scoreScale4: numeric('scoreScale4', { precision: 4, scale: 2 }), // Scale 4 (0-4)
  letterGrade: text('letterGrade'), // A, B, C, D, F
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const gradesRelations = relations(grades, ({ one }) => ({
  user: one(users, { fields: [grades.userId], references: [users.id] }),
  course: one(courses, { fields: [grades.courseId], references: [courses.id] }),
}));
