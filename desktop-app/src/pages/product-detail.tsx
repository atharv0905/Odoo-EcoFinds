import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/cart-context';
import { apiService } from '@/lib/api';
import LayoutDashboard from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  ArrowLeft, 
  Package, 
  Eye, 
  Calendar,
  User,
  Tag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Minus,
  Plus
} from 'lucide-react';
import type { Product } from '@/types';

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { addToCart, updateQuantity, cartProducts } = useCart();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Load product details
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getProductById(productId);
      setProduct(response.product);
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!product) return;

    // Check if user is trying to add their own product
    if (product.createdBy === user.uid) {
      alert('You cannot add your own products to cart.');
      return;
    }

    // Check stock
    if (product.stock < quantity) {
      alert(`Only ${product.stock} items available in stock.`);
      return;
    }

    setAddingToCart(true);

    try {
      const existingCartItem = cartProducts.find(cp => cp._id === product._id);
      
      if (existingCartItem) {
        // Update quantity if already in cart
        await updateQuantity(product._id, existingCartItem.quantity + quantity);
      } else {
        // Add new item to cart
        await addToCart(product._id, quantity);
      }

      // Success feedback
      alert(`Added ${quantity} item(s) to cart successfully!`);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  // Get cart info for this product
  const getCartInfo = () => {
    if (!product) return { inCart: false, cartQuantity: 0 };
    const cartProduct = cartProducts.find(cp => cp._id === product._id);
    return {
      inCart: !!cartProduct,
      cartQuantity: cartProduct?.quantity || 0
    };
  };

  const { inCart, cartQuantity } = getCartInfo();

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <LayoutDashboard>
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </LayoutDashboard>
    );
  }

  if (error) {
    return (
      <LayoutDashboard>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Product</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={loadProduct} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/products')}>
                  Back to Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </LayoutDashboard>
    );
  }

  if (!product) {
    return (
      <LayoutDashboard>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Card>
            <CardContent className="p-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</h3>
              <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/products')}>
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </LayoutDashboard>
    );
  }

  const isOwnProduct = product.createdBy === user?.uid;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock <= 5 && product.stock > 0;

  return (
    <LayoutDashboard>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate('/products')}
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <h1 className="text-2xl font-bold">Product Details</h1>
        </div>

        {/* Product Detail Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative">
                <img 
                  src={product.image || '/placeholder.svg'} 
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
                
                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {isOutOfStock && (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Out of Stock
                    </Badge>
                  )}
                  {isLowStock && (
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock ({product.stock})
                    </Badge>
                  )}
                  {isOwnProduct && (
                    <Badge className="bg-purple-500 hover:bg-purple-600">
                      <User className="h-3 w-3 mr-1" />
                      Your Product
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Additional Product Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Product Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="font-medium">{product.views || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock Available</span>
                  <span className={`font-medium ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-500'}`}>
                    {product.stock} units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Listed On</span>
                  <span className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {/* Title and Price */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {product.category}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(product.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-4xl font-bold text-green-600">
                    ₹{product.price.toFixed(2)}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>

                <Separator className="my-6" />

                {/* Stock Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Availability</h3>
                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600 font-medium">Out of Stock</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-600 font-medium">
                          {product.stock} units available
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cart Status */}
                {inCart && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <ShoppingCart className="h-5 w-5" />
                      <span className="font-medium">
                        Already in cart: {cartQuantity} item{cartQuantity !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add to Cart Section */}
            {!isOwnProduct && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-medium min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Max {product.stock} items available
                    </p>
                  </div>

                  {/* Total Price */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Price:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || addingToCart}
                      className="w-full"
                      size="lg"
                    >
                      {addingToCart ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding to Cart...
                        </>
                      ) : isOutOfStock ? (
                        'Out of Stock'
                      ) : inCart ? (
                        'Add More to Cart'
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>

                    {inCart && (
                      <Button 
                        onClick={() => navigate('/cart')}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        View Cart ({cartQuantity} items)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Own Product Message */}
            {isOwnProduct && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-purple-700">
                    <User className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold">This is your product</h3>
                      <p className="text-sm">You cannot add your own products to cart.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/dashboard/mylisting')}
                    variant="outline"
                    className="mt-3 w-full"
                  >
                    Manage Your Products
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}
