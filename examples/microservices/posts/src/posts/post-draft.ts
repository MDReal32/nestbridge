import type { Post } from './post';

export type PostDraft = Omit<Post, 'id'>;
