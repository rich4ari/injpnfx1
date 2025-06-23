
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Order } from '@/types';

const ORDERS_COLLECTION = 'orders';

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrdersByUser = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef, 
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

export const getPendingOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef,
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    throw error;
  }
};

export const createOrder = async (orderData: {
  user_id?: string;
  customer_info: {
    name: string;
    email: string;
    prefecture: string;
    postal_code: string;
    address: string;
    phone: string;
    notes?: string;
  };
  items: any[];
  total_price: number;
  status?: string;
}) => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const docRef = await addDoc(ordersRef, {
      user_id: orderData.user_id || null,
      customer_info: orderData.customer_info,
      items: orderData.items,
      total_price: orderData.total_price,
      status: orderData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: status,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const getOrder = async (id: string): Promise<Order | null> => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, id);
    const snapshot = await getDoc(orderRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};
