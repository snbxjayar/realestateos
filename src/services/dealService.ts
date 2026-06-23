import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deal } from '../types';

export const dealService = {
  // Get all deals for the current user
  async getDeals(agentId: string): Promise<Deal[]> {
    try {
      const q = query(
        collection(db, 'deals'),
        where('agentId', '==', agentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Deal[];
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  },

  // Get a single deal
  async getDeal(dealId: string): Promise<Deal | null> {
    try {
      const docSnap = await getDoc(doc(db, 'deals', dealId));
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id,
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as Deal;
      }
      return null;
    } catch (error) {
      console.error('Error fetching deal:', error);
      throw error;
    }
  },

  // Create a new deal
  async createDeal(
    deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Deal> {
    try {
      const docRef = await addDoc(collection(db, 'deals'), {
        ...deal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        ...deal,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Deal;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  },

  // Update a deal
  async updateDeal(
    dealId: string,
    updates: Partial<Deal>
  ): Promise<void> {
    try {
      const dealRef = doc(db, 'deals', dealId);
      await updateDoc(dealRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  },

  // Delete a deal
  async deleteDeal(dealId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'deals', dealId));
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  },
};
