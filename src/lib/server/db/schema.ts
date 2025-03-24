import { pgTable, serial, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});

export const action = pgTable('action', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	targetCount: integer('target_count').default(100).notNull(),
	currentCount: integer('current_count').default(0).notNull(),
	completed: boolean('completed').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const actionRelations = relations(action, ({ many }) => ({
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
