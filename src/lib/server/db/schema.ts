import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});

export const project = pgTable('project', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const projectRelations = relations(project, ({ many }) => ({
	actions: many(action)
}));

export const action = pgTable('action', {
	id: serial('id').primaryKey(),
	projectId: integer('project_id').references(() => project.id).notNull(),
	title: text('title').notNull(),
	description: text('description'),
	targetCount: integer('target_count').default(100).notNull(),
	currentCount: integer('current_count').default(0).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const actionRelations = relations(action, ({ one, many }) => ({
	project: one(project, {
		fields: [action.projectId],
		references: [project.id]
	}),
	progress: many(progress)
}));

export const progress = pgTable('progress', {
	id: serial('id').primaryKey(),
	actionId: integer('action_id').references(() => action.id).notNull(),
	count: integer('count').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const progressRelations = relations(progress, ({ one }) => ({
	action: one(action, {
		fields: [progress.actionId],
		references: [action.id]
	})
}));
