import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/cart-context';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/lib/api';
import LayoutDashboard from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  MapPin, 
  Phone,
  Save,
  ExternalLink
} from 'lucide-react';
import type { CheckoutFormData, ShippingAddress } from '@/types';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartProducts, getTotalAmount, getTotalItems } = useCart();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    phoneNumber: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    notes: ''
  });
  
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid Indian phone number';
    }

    if (!formData.shippingAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.shippingAddress.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.shippingAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{6}$/.test(formData.shippingAddress.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('shippingAddress.')) {
      const addressField = field.replace('shippingAddress.', '');
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Save order (draft state)
  const handleSaveOrder = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setSaving(true);

    try {
      // Prepare order data
      const orderData = {
        buyerId: user.uid,
        items: cartProducts.map(product => ({
          productId: product._id,
          sellerId: product.createdBy,
          quantity: product.quantity,
          unitPrice: product.price,
          totalItemPrice: product.price * product.quantity
        })),
        shippingAddress: formData.shippingAddress,
        phoneNumber: formData.phoneNumber,
        notes: formData.notes
      };

      const response = await apiService.saveOrderFromCart(orderData);
      setSavedOrderId(response.order._id);
      
      // Success message
      alert('Order saved successfully! You can now proceed with payment.');
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle payment redirect
  const handlePayNow = async () => {
    if (!savedOrderId) {
      alert('Please save your order first.');
      return;
    }

    setPaying(true);

    try {
      // Ensure order is ready for payment
      await apiService.markOrderForCheckout(savedOrderId);

      // Open payment page in web browser
      const paymentUrl = `http://localhost:3000/payment/${savedOrderId}?buyerId=${user?.uid}`;
      
      // Use Electron's shell to open external browser
      if (window.require) {
        const { shell } = window.require('electron');
        shell.openExternal(paymentUrl);
      } else {
        // Fallback for non-Electron environment
        window.open(paymentUrl, '_blank');
      }

      // Redirect to orders page to track payment status
      navigate('/orders');
      
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  // Check if user should be redirected
  if (!user) {
    navigate('/login');
    return null;
  }

  if (cartProducts.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <LayoutDashboard>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate('/cart')}
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-green-600" />
            Checkout
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Billing Details Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    This is your registered email address
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    placeholder="Enter your street address"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange('shippingAddress.street', e.target.value)}
                    className={errors.street ? 'border-red-500' : ''}
                  />
                  {errors.street && (
                    <p className="text-xs text-red-500">{errors.street}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={formData.shippingAddress.city}
                      onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="Enter your state"
                      value={formData.shippingAddress.state}
                      onChange={(e) => handleInputChange('shippingAddress.state', e.target.value)}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-xs text-red-500">{errors.state}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      placeholder="Enter ZIP code"
                      value={formData.shippingAddress.zipCode}
                      onChange={(e) => handleInputChange('shippingAddress.zipCode', e.target.value)}
                      className={errors.zipCode ? 'border-red-500' : ''}
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-red-500">{errors.zipCode}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.shippingAddress.country}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Order Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Special Instructions</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Any special instructions for your order..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cartProducts.map((product) => (
                    <div key={product._id} className="flex gap-3">
                      <img 
                        src={product.image || '/placeholder.svg'} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {product.title}
                        </h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-600">
                            Qty: {product.quantity}
                          </span>
                          <span className="text-sm font-medium">
                            ₹{(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({getTotalItems()} items):</span>
                    <span>₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6 space-y-4">
                {!savedOrderId ? (
                  <Button 
                    onClick={handleSaveOrder}
                    disabled={saving}
                    className="w-full"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving Order...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Order
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-green-700 font-medium">Order Saved Successfully!</div>
                      <div className="text-sm text-green-600">Order ID: {savedOrderId}</div>
                    </div>
                    
                    <Button 
                      onClick={handlePayNow}
                      disabled={paying}
                      className="w-full"
                      size="lg"
                    >
                      {paying ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Opening Payment Gateway...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now <ExternalLink className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-gray-500">
                      You'll be redirected to our secure payment gateway
                    </p>
                  </div>
                )}

                <div className="text-center text-xs text-gray-500">
                  By placing this order, you agree to our terms and conditions
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm text-blue-800 font-medium">
                    🔒 Your data is secure
                  </div>
                  <div className="text-xs text-blue-700">
                    All payments are processed through secure SSL encryption
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutDashboard>
  );
}
