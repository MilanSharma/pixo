export interface User {
  id: string;
  username: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
  likes: number;
  collects: number;
  isVerified?: boolean;
}

export interface Tag {
  type: 'brand' | 'product' | 'user' | 'location';
  text: string;
  x?: number; // percentage 0-100
  y?: number; // percentage 0-100
}

export interface Note {
  id: string;
  userId: string;
  user: User;
  title: string;
  description: string;
  media: string[]; // URLs
  tags: string[]; // Hashtags
  imageTags?: Tag[];
  likes: number;
  collects: number;
  commentsCount: number;
  isShoppable?: boolean;
  productId?: string;
  location?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  noteId: string;
  user: User;
  text: string;
  createdAt: string;
  replies?: Comment[];
}

export interface Product {
  id: string;
  brandId: string;
  title: string;
  price: number;
  image: string;
  description: string;
  brandName: string;
  brandLogo: string;
}
