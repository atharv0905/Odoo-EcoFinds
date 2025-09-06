export type User = {
  _id: string;
  firebaseId: string; // Firebase authentication ID
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  paymentConfig?: {
    mode?: 'razorpay_direct' | 'manual_payout';
    razorpayKeyId?: string;
    razorpaySecret?: string;
  };
  gamification?: {
    points?: number;
    badges?: string[];
    level?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: ProductImage[];
  image?: string; // Legacy field for backward compatibility
  createdByFId: string; // Firebase ID of the creator
  createdBy: string; // MongoDB ObjectId of the creator
  stock?: number;
  isActive?: boolean;
  totalSold?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductImage = {
  _id?: string;
  url: string;
  publicId: string;
  alt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type Cart = {
  _id?: string;
  userId: string;
  items: CartItem[];
};

export type Purchase = {
  _id: string;
  userId: string;
  products: string[];
  createdAt?: string;
};

export type ProductOrder = {
  _id: string;
  productId: string | Product;
  sellerId: string;
  buyerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
};

export type ApiListResponse<T> = {
  message: string;
  count?: number;
  products?: T[];
  users?: T[];
};


