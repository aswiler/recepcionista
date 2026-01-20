import { pgTable, text, timestamp, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const subscriptionStatus = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing'])
export const channelType = pgEnum('channel_type', ['voice', 'whatsapp'])

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Businesses
export const businesses = pgTable('businesses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  website: text('website'),
  industry: text('industry'),
  description: text('description'),
  phone: text('phone'),
  address: text('address'),
  timezone: text('timezone').default('Europe/Madrid'),
  
  // AI Configuration
  greeting: text('greeting'),
  personality: text('personality'),
  language: text('language').default('es'),
  
  // Business hours (JSON)
  hours: json('hours').$type<{
    day: string
    open: string
    close: string
  }[]>(),
  
  // Knowledge base indexed
  isIndexed: boolean('is_indexed').default(false),
  lastIndexedAt: timestamp('last_indexed_at'),
  
  // WhatsApp Business API Connection
  whatsappPhoneNumberId: text('whatsapp_phone_number_id'), // Meta's phone number ID
  whatsappPhoneNumber: text('whatsapp_phone_number'),      // Display number (+34612...)
  whatsappConnectedAt: timestamp('whatsapp_connected_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Phone Numbers
export const phoneNumbers = pgTable('phone_numbers', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  number: text('number').notNull(),
  provider: text('provider').default('telnyx'), // telnyx, twilio
  providerId: text('provider_id'), // External ID from provider
  country: text('country').default('ES'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Subscriptions
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: subscriptionStatus('status').default('trialing'),
  plan: text('plan').default('starter'), // starter, pro, enterprise
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Calls
export const calls = pgTable('calls', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  phoneNumberId: text('phone_number_id').references(() => phoneNumbers.id),
  externalId: text('external_id'), // Provider's call ID
  from: text('from').notNull(),
  to: text('to').notNull(),
  direction: text('direction').default('inbound'), // inbound, outbound
  status: text('status').default('completed'),
  duration: integer('duration'), // seconds
  transcript: text('transcript'),
  summary: text('summary'),
  sentiment: text('sentiment'),
  transferredToHuman: boolean('transferred_to_human').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// WhatsApp Conversations
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  customerPhone: text('customer_phone').notNull(),
  customerName: text('customer_name'),
  status: text('status').default('active'), // active, closed
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// WhatsApp Messages
export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  externalId: text('external_id'), // Meta message ID
  role: text('role').notNull(), // user, assistant
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Calendar Integrations (using Nango)
export const calendarIntegrations = pgTable('calendar_integrations', {
  id: text('id').primaryKey(),
  businessId: text('business_id').notNull().references(() => businesses.id),
  provider: text('provider').notNull(), // google-calendar, microsoft-outlook
  connectionId: text('connection_id').notNull().unique(), // Nango connection ID
  integrationId: text('integration_id').notNull(), // Nango integration ID (e.g., 'google-calendar')
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  businesses: many(businesses),
  subscription: one(subscriptions),
}))

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, {
    fields: [businesses.userId],
    references: [users.id],
  }),
  phoneNumbers: many(phoneNumbers),
  calls: many(calls),
  conversations: many(conversations),
  calendarIntegrations: many(calendarIntegrations),
}))
