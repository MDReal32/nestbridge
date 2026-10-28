import type { Post } from './post';

export interface PublishedPost extends Post {
  authorName: string;
}
