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
	status: text('status').notNull().default('active'),
	targetCount: integer('target_count').notNull().default(100),
	currentCount: integer('current_count').notNull().default(0),
	completed: boolean('completed').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
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
