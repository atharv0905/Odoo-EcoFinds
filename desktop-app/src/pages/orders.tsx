import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/lib/api';
import LayoutDashboard from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard,
  AlertTriangle,
  RefreshCcw,
  ExternalLink,
  Eye,
  MapPin,
  Phone
} from 'lucide-react';
import type { Order, OrdersResponse } from '@/types';

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load user orders
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response: OrdersResponse = await apiService.getBuyerOrders(user.uid);
      setOrders(response.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save order for payment (draft -> pending_payment)
  const handleSaveOrder = async (orderId: string) => {
    setActionLoading(orderId);

    try {
      await apiService.markOrderForCheckout(orderId);
      await loadOrders(); // Reload orders
      alert('Order saved successfully! You can now proceed with payment.');
    } catch (err) {
      console.error('Failed to save order:', err);
      alert('Failed to save order. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle payment redirect
  const handlePayOrder = async (orderId: string) => {
    setActionLoading(orderId);

    try {
      // Ensure order is ready for payment
      const order = orders.find(o => o._id === orderId);
      if (order && order.status === 'draft') {
        await apiService.markOrderForCheckout(orderId);
      }

      // Open payment page in web browser
      const paymentUrl = `http://localhost:3000/payment/${orderId}?buyerId=${user?.uid}`;
      
      // Use Electron's shell to open external browser
      if (window.require) {
        const { shell } = window.require('electron');
        shell.openExternal(paymentUrl);
      } else {
        window.open(paymentUrl, '_blank');
      }

      // Start polling for payment status
      startPaymentStatusPolling(orderId);
      
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Poll payment status
  const startPaymentStatusPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes

    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await apiService.getOrderById(orderId);
        const order = response.order;
        
        if (order.paymentStatus === 'paid') {
          clearInterval(pollInterval);
          await loadOrders(); // Reload to reflect payment status
          alert('Payment completed successfully! 🎉');
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          alert('Payment status check timed out. Please refresh to see updates.');
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
        if (attempts >= 5) { // Stop polling if too many errors
          clearInterval(pollInterval);
        }
      }
    }, 5000); // Check every 5 seconds
  };

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setActionLoading(orderId);

    try {
      await apiService.cancelOrder(orderId, user!.uid, 'Cancelled by customer');
      await loadOrders(); // Reload orders
      alert('Order cancelled successfully.');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (order: Order) => {
    const { status, paymentStatus } = order;

    if (status === 'draft') {
      return {
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock className="h-3 w-3" />,
        text: 'Draft'
      };
    }

    if (status === 'pending_payment' && paymentStatus === 'unpaid') {
      return {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Payment Pending'
      };
    }

    if (paymentStatus === 'paid') {
      return {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3" />,
        text: 'Paid'
      };
    }

    if (paymentStatus === 'failed') {
      return {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3" />,
        text: 'Payment Failed'
      };
    }

    if (status === 'cancelled') {
      return {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3" />,
        text: 'Cancelled'
      };
    }

    return {
      color: 'bg-blue-100 text-blue-800',
      icon: <Package className="h-3 w-3" />,
      text: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
    };
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <LayoutDashboard>
        <div className="max-w-6xl mx-auto">
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-green-600" />
            My Orders
          </h1>
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button onClick={loadOrders} variant="outline" className="mt-2" size="sm">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Button onClick={() => navigate('/products')} size="lg">
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusDisplay = getStatusDisplay(order);
              const isDraft = order.status === 'draft';
              const isUnpaid = order.paymentStatus === 'unpaid' && order.status === 'pending_payment';
              const canCancel = ['draft', 'pending_payment', 'paid', 'processing'].includes(order.status);

              return (
                <Card key={order._id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order._id}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className={statusDisplay.color}>
                        {statusDisplay.icon}
                        <span className="ml-1">{statusDisplay.text}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.productOrders?.map((productOrder) => (
                        <div key={productOrder._id} className="flex gap-3">
                          <img 
                            src={productOrder.productId?.image || '/placeholder.svg'} 
                            alt={productOrder.productId?.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {productOrder.productId?.title}
                            </h4>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-600">
                                Qty: {productOrder.quantity} × ₹{productOrder.unitPrice?.toFixed(2)}
                              </span>
                              <span className="text-sm font-medium">
                                ₹{productOrder.totalPrice?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Order Details */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.shippingAddress.street}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                          {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4" />
                          Contact Information
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.phoneNumber}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-1">Order Notes</h4>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}

                    <Separator className="my-4" />

                    {/* Total and Actions */}
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold text-green-600">
                        Total: ₹{order.totalAmount?.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>

                        {isDraft && (
                          <Button
                            onClick={() => handleSaveOrder(order._id)}
                            disabled={actionLoading === order._id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === order._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Saving...
                              </>
                            ) : (
                              'Save Order'
                            )}
                          </Button>
                        )}

                        {isUnpaid && (
                          <Button
                            onClick={() => handlePayOrder(order._id)}
                            disabled={actionLoading === order._id}
                            size="sm"
                          >
                            {actionLoading === order._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Opening...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay Now <ExternalLink className="h-3 w-3 ml-1" />
                              </>
                            )}
                          </Button>
                        )}

                        {canCancel && (
                          <Button
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={actionLoading === order._id}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Status Hints */}
                    {isDraft && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          <span>This order is in draft mode. Click "Save Order" to prepare it for payment.</span>
                        </div>
                      </div>
                    )}

                    {isUnpaid && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-700 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Payment is pending. Click "Pay Now" to complete your purchase.</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Order Details #{selectedOrder._id}</CardTitle>
                  <Button
                    onClick={() => setSelectedOrder(null)}
                    variant="ghost"
                    size="sm"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Full order details would go here */}
                <p className="text-gray-600">
                  Detailed order information for order #{selectedOrder._id}
                </p>
                <div className="mt-4">
                  <Button onClick={() => setSelectedOrder(null)} className="w-full">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </LayoutDashboard>
  );
}
