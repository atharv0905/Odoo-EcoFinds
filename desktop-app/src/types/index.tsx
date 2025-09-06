// User Types
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Product Types
export interface Product {
  _id: string;
  id?: string; // For compatibility
  title: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  stock: number;
  status?: 'Active' | 'Inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  views?: number;
}

// Cart Types
export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalItems?: number;
}

export interface CartProduct extends Product {
  quantity: number;
}

// Address Types
export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order Types
export interface ProductOrder {
  _id: string;
  productId: Product;
  sellerId: string;
  buyerId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'razorpay' | 'manual' | 'cash_on_delivery';
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  orderId: string;
  shippingAddress: ShippingAddress;
  phoneNumber: string;
  notes?: string;
  orderDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  buyerId: string;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'razorpay' | 'manual' | 'cash_on_delivery';
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  shippingAddress: ShippingAddress;
  phoneNumber: string;
  orderDate: string;
  notes?: string;
  status: 'draft' | 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  productOrders?: ProductOrder[];
  vendorGroups?: VendorGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorGroup {
  vendorId: string;
  items: ProductOrder[];
  totalAmount: number;
}

// API Response Types
export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface ProductsResponse extends ApiResponse<Product[]> {
  products: Product[];
  count?: number;
}

export interface CartResponse extends ApiResponse<Cart> {
  cart: Cart;
  totalItems: number;
}

export interface OrderResponse extends ApiResponse<Order> {
  order: Order;
}

export interface OrdersResponse extends ApiResponse<Order[]> {
  orders: Order[];
  count: number;
}

// Form Types
export interface CheckoutFormData {
  phoneNumber: string;
  shippingAddress: ShippingAddress;
  notes?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Context Types
export interface CartContextType {
  cart: Cart | null;
  cartProducts: CartProduct[];
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalAmount: () => number;
}

export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  getOrderById: (orderId: string) => Order | null;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
}