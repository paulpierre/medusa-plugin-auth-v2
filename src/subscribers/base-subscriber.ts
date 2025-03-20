// No need to import from external event bus package in this file
// Define the subscriber config type locally
export type SubscriberConfig = {
  event_names: string[];
  subscriber_config: {
    identifier: string;
  };
}

export type SubscriberContext = Record<string, unknown>

// Define specific events this subscriber handles
export const BaseEvents = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
}

// Medusa v2 subscriber configuration
export const config: SubscriberConfig = {
  event_names: Object.values(BaseEvents),
  subscriber_config: {
    identifier: "base-subscriber"
  }
}

// Medusa v2 subscribers need to export event handlers directly
type EventHandlerMap = {
  [key: string]: (data: any, eventName: string) => Promise<void>
}

// Medusa v2 subscribers are functions, not classes
export default function baseSubscriber({ eventBusService }) {
  // Individual event handlers
  async function handleUserCreated(data: any, eventName: string): Promise<void> {
    console.log(`User created: ${JSON.stringify(data.id)}`)
  }

  async function handleUserUpdated(data: any, eventName: string): Promise<void> {
    console.log(`User updated: ${JSON.stringify(data.id)}`)
  }

  async function handleUserDeleted(data: any, eventName: string): Promise<void> {
    console.log(`User deleted: ${JSON.stringify(data.id)}`)
  }

  // Create handler map for Medusa v2
  const handlers: EventHandlerMap = {
    [BaseEvents.USER_CREATED]: handleUserCreated,
    [BaseEvents.USER_UPDATED]: handleUserUpdated,
    [BaseEvents.USER_DELETED]: handleUserDeleted,
  }

  // Return handlers directly - each key matches an event name
  return handlers
}
