import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/cart-context';
import { useNavigate } from 'react-router-dom';
import LayoutDashboard from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Package,
  ArrowLeft,
  CreditCard,
  Leaf
} from 'lucide-react';

export default function CartPage() {
  const { user } = useAuth();
  const { 
    cartProducts, 
    loading, 
    error, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getTotalItems,
    getTotalAmount
  } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartProducts.length === 0) return;
    navigate('/checkout');
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear all items from your cart?')) {
      await clearCart();
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <LayoutDashboard>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/products')}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              Shopping Cart
            </h1>
          </div>
          
          {cartProducts.length > 0 && (
            <Button 
              onClick={handleClearCart}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty Cart State */}
        {cartProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">
                Discover amazing eco-friendly products and add them to your cart!
              </p>
              <Button onClick={() => navigate('/products')} size="lg">
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Items in Your Cart</span>
                    <Badge variant="secondary">
                      {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartProducts.map((product, index) => (
                    <div key={product._id}>
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div 
                          className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          <img 
                            src={product.image || '/placeholder.svg'} 
                            alt={product.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 
                                className="font-semibold text-lg cursor-pointer hover:text-green-600 transition-colors"
                                onClick={() => navigate(`/product/${product._id}`)}
                              >
                                {product.title}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            </div>
                            <Button
                              onClick={() => removeFromCart(product._id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Qty:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleQuantityChange(product._id, product.quantity - 1)}
                                  variant="outline"
                                  size="sm"
                                  disabled={loading}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {product.quantity}
                                </span>
                                <Button
                                  onClick={() => handleQuantityChange(product._id, product.quantity + 1)}
                                  variant="outline"
                                  size="sm"
                                  disabled={loading || product.quantity >= product.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs text-gray-500">
                                (Max {product.stock})
                              </span>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                ₹{product.price.toFixed(2)} each
                              </div>
                              <div className="text-lg font-semibold text-green-600">
                                ₹{(product.price * product.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Stock Warning */}
                          {product.quantity > product.stock && (
                            <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              Only {product.stock} items available. Quantity will be adjusted.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {index < cartProducts.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({getTotalItems()} items):</span>
                      <span className="font-medium">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>🌱 Eco Impact Points:</span>
                      <span className="font-medium">+{Math.floor(getTotalAmount() / 10)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    className="w-full" 
                    size="lg"
                    disabled={cartProducts.length === 0 || loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <div className="text-center">
                    <Button 
                      onClick={() => navigate('/products')}
                      variant="ghost" 
                      size="sm"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Eco Impact */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Leaf className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-semibold text-green-800">Eco Impact</h4>
                      <p className="text-sm text-green-700">
                        By choosing these products, you're helping reduce carbon footprint 
                        and supporting sustainable practices!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-600">
                      🔒 Secure checkout with 256-bit SSL encryption
                    </div>
                    <div className="text-sm text-gray-600">
                      💳 Multiple payment options available
                    </div>
                    <div className="text-sm text-gray-600">
                      📦 Fast and eco-friendly delivery
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </LayoutDashboard>
  );
}
