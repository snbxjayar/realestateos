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
import { Lead } from '../types';

export const leadService = {
  // Get all leads for the current user
  async getLeads(agentId: string): Promise<Lead[]> {
    try {
      const q = query(
        collection(db, 'leads'),
        where('agentId', '==', agentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Lead[];
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  // Get a single lead
  async getLead(leadId: string): Promise<Lead | null> {
    try {
      const docSnap = await getDoc(doc(db, 'leads', leadId));
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id,
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as Lead;
      }
      return null;
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  },

  // Create a new lead
  async createLead(
    lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Lead> {
    try {
      const docRef = await addDoc(collection(db, 'leads'), {
        ...lead,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        ...lead,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  // Update a lead
  async updateLead(
    leadId: string,
    updates: Partial<Lead>
  ): Promise<void> {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  // Delete a lead
  async deleteLead(leadId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'leads', leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },
};
