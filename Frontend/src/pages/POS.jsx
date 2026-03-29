import React, { useState, useEffect, useRef } from 'react';
import { fetchRecipeData, createPaymentOrder, verifyPayment, loadRazorpayScript, submitSalesData } from '../services/api';
import { ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle } from 'lucide-react';

const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Razorpay'];

const POS = () => {
  const [recipes, setRecipes]               = useState([]);
  const [cart, setCart]                     = useState([]);
  const [tableNumber, setTableNumber]       = useState('');
  const [customerName, setCustomerName]     = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('Cash');
  const [loading, setLoading]               = useState(true);
  const [submitting, setSubmitting]         = useState(false);
  const [orderSuccess, setOrderSuccess]     = useState(false);
  const [lastOrder, setLastOrder]           = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError]                   = useState('');
  const receiptRef = useRef();

  useEffect(() => { loadMenu(); }, []);

  const loadMenu = async () => {
    setLoading(true);
    const data = await fetchRecipeData();
    setRecipes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const addToCart = (recipe) => setCart(prev => {
    const existing = prev.find(i => i._id === recipe._id);
    if (existing) return prev.map(i => i._id === recipe._id ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { ...recipe, qty: 1 }];
  });

  const updateQty = (id, delta) => setCart(prev =>
    prev.map(i => i._id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
  );

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id));

  const clearCart = () => { setCart([]); setTableNumber(''); setCustomerName(''); setPaymentMethod('Cash'); setError(''); };

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const tax      = subtotal * 0.18;
  const total    = subtotal + tax;

  const categories      = ['All', ...new Set(recipes.map(r => r.category || 'General'))];
  const filteredRecipes = selectedCategory === 'All' ? recipes : recipes.filter(r => (r.category || 'General') === selectedCategory);

  const buildOrderPayload = () => ({
    table: tableNumber, customer_name: customerName || 'Walk-in', payment_method: paymentMethod,
    items: cart.map(i => ({ item_name: i.item_name, qty: i.qty, unit_price: i.price, total: i.price * i.qty })),
    subtotal: Number(subtotal.toFixed(2)), tax: Number(tax.toFixed(2)), total: Number(total.toFixed(2)),
    date: new Date().toISOString(),
  });

  const handleOfflineOrder = async () => {
    setSubmitting(true); setError('');
    try {
      for (const item of cart) {
        await submitSalesData({ item_name: item.item_name, qty_sold: item.qty, revenue: item.price * item.qty, date: new Date().toISOString().split('T')[0] });
      }
      setLastOrder(buildOrderPayload());
      setOrderSuccess(true);
      clearCart();
    } catch (err) {
      setError('Failed to save order. Is the backend running on port 5001?');
    } finally { setSubmitting(false); }
  };

  const handleRazorpayOrder = async () => {
    setSubmitting(true); setError('');
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load Razorpay. Check your internet.");
      const { order_id, key_id, amount } = await createPaymentOrder(total);
      const orderPayload = buildOrderPayload();
      const options = {
        key: key_id, amount, currency: 'INR',
        name: 'Pantri Systems', description: `Table ${tableNumber} Order`, order_id,
        prefill: { name: customerName || 'Walk-in' },
        theme: { color: '#8B5E3C' },
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, orderPayload);
            if (result.success) {
              setLastOrder({ ...orderPayload, payment_id: result.payment_id });
              setOrderSuccess(true); clearCart();
            } else { setError('Payment verification failed.'); }
          } catch { setError('Payment done but order save failed. Payment ID: ' + response.razorpay_payment_id); }
          finally { setSubmitting(false); }
        },
        modal: { ondismiss: () => { setError('Payment cancelled.'); setSubmitting(false); } }
      };
      new window.Razorpay(options).open();
    } catch (err) { setError(err.message || 'Payment failed.'); setSubmitting(false); }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return setError('Add items to the order first!');
    if (!tableNumber)      return setError('Please enter a table number!');
    paymentMethod === 'Razorpay' ? await handleRazorpayOrder() : await handleOfflineOrder();
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;font-size:13px;padding:20px;max-width:300px;margin:auto}h2{text-align:center}hr{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;margin:4px 0}.center{text-align:center}.small{font-size:11px;color:#666}</style></head><body>${receiptRef.current?.innerHTML || ''}</body></html>`);
    win.document.close(); win.print();
  };

  if (orderSuccess && lastOrder) return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-pantri-bc/30 p-8 text-center">
        <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-charcoal mb-1">Order Placed!</h2>
        <p className="text-sage mb-2">Table {lastOrder.table} · {lastOrder.payment_method}</p>
        {lastOrder.payment_id && <p className="text-xs text-sage mb-4">Payment ID: {lastOrder.payment_id}</p>}
        <div ref={receiptRef} className="text-left bg-pantri-bg/30 rounded-2xl p-6 mb-6 border border-pantri-bc/30">
          <h2 className="text-center font-bold text-lg mb-1">Pantri Systems</h2>
          <p className="text-center text-sage text-xs mb-1">{new Date(lastOrder.date).toLocaleString()}</p>
          <p className="text-center text-sage text-xs mb-3">Table: {lastOrder.table} · {lastOrder.customer_name}</p>
          <hr className="border-dashed border-pantri-bc" />
          <div className="my-3 space-y-1">
            {lastOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm"><span>{item.qty}x {item.item_name}</span><span>₹{item.total.toFixed(2)}</span></div>
            ))}
          </div>
          <hr className="border-dashed border-pantri-bc" />
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-sm text-sage"><span>Subtotal</span><span>₹{lastOrder.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-sage"><span>GST (18%)</span><span>₹{lastOrder.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base mt-1"><span>Total</span><span>₹{lastOrder.total.toFixed(2)}</span></div>
          </div>
          <hr className="border-dashed border-pantri-bc mt-3" />
          <p className="text-center text-xs text-sage mt-2">Payment: {lastOrder.payment_method}</p>
          <p className="text-center text-xs text-sage">Thank you for dining with us! 🙏</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-pantri-bg border border-pantri-bc text-charcoal font-bold py-3 rounded-xl hover:bg-pantri-bc/30 transition"><Printer size={18} /> Print</button>
          <button onClick={() => setOrderSuccess(false)} className="flex-1 bg-charcoal text-white font-bold py-3 rounded-xl hover:bg-pantri-primary transition">New Order</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6 h-full p-6 max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="mb-4">
          <h2 className="text-3xl font-bold text-pantri-primary">Point of Sale</h2>
          <p className="text-sage">Select items to build the order.</p>
        </header>
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === cat ? 'bg-pantri-primary text-white shadow' : 'bg-white border border-pantri-bc text-charcoal hover:bg-pantri-bc/20'}`}
            >{cat}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="flex items-center justify-center h-40 text-sage animate-pulse">Loading menu...</div>
          : filteredRecipes.length === 0 ? <div className="flex items-center justify-center h-40 text-sage">No items found.</div>
          : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => {
                const inCart = cart.find(i => i._id === recipe._id);
                return (
                  <button key={recipe._id} onClick={() => addToCart(recipe)}
                    className={`bg-white p-5 rounded-2xl shadow-sm border text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${inCart ? 'border-pantri-primary ring-2 ring-pantri-primary/20' : 'border-pantri-bc/30'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-sage uppercase tracking-wider">{recipe.category || 'General'}</span>
                      {inCart && <span className="bg-pantri-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{inCart.qty} in cart</span>}
                    </div>
                    <h3 className="font-bold text-charcoal text-base mb-1">{recipe.item_name}</h3>
                    <p className="text-pantri-primary font-bold text-lg">₹{(recipe.price || 0).toFixed(2)}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-sage"><Plus size={12} /> Tap to add</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-80 xl:w-96 flex flex-col bg-white rounded-3xl shadow-sm border border-pantri-bc/30 overflow-hidden">
        <div className="p-5 border-b border-pantri-bc/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><ShoppingCart size={20} className="text-pantri-primary" /><h3 className="font-bold text-charcoal">Current Order</h3></div>
          {cart.length > 0 && <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All</button>}
        </div>
        <div className="p-4 border-b border-pantri-bc/30">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-sage uppercase mb-1 block">Table No. *</label>
              <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. T4"
                className="w-full p-2 border border-pantri-bc rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pantri-primary/50" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-sage uppercase mb-1 block">Customer</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Optional"
                className="w-full p-2 border border-pantri-bc rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pantri-primary/50" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sage text-sm">
              <ShoppingCart size={32} className="mb-2 opacity-30" /><p>No items added yet</p><p className="text-xs">Tap menu items to add</p>
            </div>
          ) : cart.map(item => (
            <div key={item._id} className="flex items-center gap-3 bg-pantri-bg/40 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-charcoal text-sm truncate">{item.item_name}</p>
                <p className="text-sage text-xs">₹{item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item._id, -1)} className="w-7 h-7 rounded-full bg-white border border-pantri-bc flex items-center justify-center hover:bg-red-50 transition"><Minus size={12} /></button>
                <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                <button onClick={() => updateQty(item._id, 1)} className="w-7 h-7 rounded-full bg-white border border-pantri-bc flex items-center justify-center hover:bg-green-50 transition"><Plus size={12} /></button>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">₹{(item.price * item.qty).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-600 mt-0.5"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-pantri-bc/30 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-sage"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-sage"><span>GST (18%)</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base text-charcoal pt-2 border-t border-pantri-bc/30"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
            </div>
            <div>
              <label className="text-xs font-bold text-sage uppercase mb-2 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <button key={method} onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-sm font-bold transition ${
                      paymentMethod === method
                        ? method === 'Razorpay' ? 'bg-blue-600 text-white' : 'bg-charcoal text-white'
                        : 'bg-pantri-bg border border-pantri-bc text-charcoal hover:bg-pantri-bc/30'
                    }`}
                  >{method}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
            <button onClick={handlePlaceOrder} disabled={submitting}
              className={`w-full text-white font-bold py-4 rounded-2xl transition text-base disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'Razorpay' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pantri-primary hover:bg-charcoal'}`}
            >
              {submitting
                ? (paymentMethod === 'Razorpay' ? 'Opening Payment...' : 'Placing Order...')
                : paymentMethod === 'Razorpay' ? `Pay ₹${total.toFixed(2)} via Razorpay` : `Place Order · ₹${total.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;