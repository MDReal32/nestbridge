export const EMAIL_EVENTS = {
  requested: 'email.requested',
  bounced: 'email.bounced',
} as const;

export const COUNT_COMMAND = { cmd: 'email.count', retry: true, version: 2 } as const;
