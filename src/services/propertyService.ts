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
import { Property } from '../types';

export const propertyService = {
  // Get all available/for-rent properties for the public listing page
  // Requires Firestore rules to allow unauthenticated reads on 'properties'
  async getPublicListings(): Promise<Property[]> {
    try {
      const q = query(
        collection(db, 'properties'),
        where('status', 'in', ['available', 'for_rent'])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
      })) as Property[];
    } catch (error) {
      console.error('Error fetching public listings:', error);
      throw error;
    }
  },

  // Get all properties for the current user
  async getProperties(agentId: string): Promise<Property[]> {
    try {
      const q = query(
        collection(db, 'properties'),
        where('agentId', '==', agentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as Property[];
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a single property
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const docSnap = await getDoc(doc(db, 'properties', propertyId));
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id,
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate?.() || new Date(),
        } as Property;
      }
      return null;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  // Create a new property
  async createProperty(
    property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Property> {
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        ...property,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        ...property,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Property;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  // Update a property
  async updateProperty(
    propertyId: string,
    updates: Partial<Property>
  ): Promise<void> {
    try {
      const propertyRef = doc(db, 'properties', propertyId);
      await updateDoc(propertyRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Delete a property
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },
};
