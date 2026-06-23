import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, where, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lead, LeadStatus, Activity, ActivityType } from '../types';
import { ghlClient } from '../lib/ghl';

const toLead = (id: string, data: any): Lead => ({
  ...data,
  id,
  createdAt: data.createdAt?.toDate?.() ?? new Date(),
  updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
});

const toActivity = (id: string, data: any): Activity => ({
  ...data,
  id,
  createdAt: data.createdAt?.toDate?.() ?? new Date(),
});

// Best-effort GHL contact sync — never throws, returns ghlContactId or null
const syncToGHL = async (
  lead: { name: string; email?: string; phone?: string; source: string; status: string },
  ghlContactId?: string
): Promise<string | null> => {
  try {
    const tags = [lead.source, lead.status];
    if (ghlContactId) {
      await ghlClient.updateContact(ghlContactId, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        tags,
      });
      return ghlContactId;
    } else {
      const contact = await ghlClient.createContact({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        tags,
        source: lead.source,
      });
      return contact?.id ?? null;
    }
  } catch {
    return ghlContactId ?? null;
  }
};

export const leadService = {
  async getLeads(agentId: string): Promise<Lead[]> {
    const q = query(collection(db, 'leads'), where('agentId', '==', agentId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toLead(d.id, d.data()));
  },

  async getLead(leadId: string): Promise<Lead | null> {
    const snap = await getDoc(doc(db, 'leads', leadId));
    return snap.exists() ? toLead(snap.id, snap.data()) : null;
  },

  async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    const ref = await addDoc(collection(db, 'leads'), {
      ...lead,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // GHL sync (best-effort)
    const ghlContactId = await syncToGHL(lead);
    if (ghlContactId) {
      await updateDoc(ref, { ghlContactId });
    }

    return {
      ...lead,
      id: ref.id,
      ghlContactId: ghlContactId ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Lead;
  },

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<void> {
    const ref = doc(db, 'leads', leadId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });

    // GHL sync (best-effort)
    if (updates.name || updates.email || updates.phone) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        await syncToGHL(
          { name: data.name, email: data.email, phone: data.phone, source: data.source, status: data.status },
          data.ghlContactId
        );
      }
    }
  },

  async updateLeadStatus(leadId: string, newStatus: LeadStatus, userId: string): Promise<void> {
    const ref = doc(db, 'leads', leadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const oldStatus = data.status as LeadStatus;

    await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });

    // Log status change activity
    await addDoc(collection(db, 'leads', leadId, 'activities'), {
      type: 'status_change' as ActivityType,
      content: `Status changed from ${STATUS_LABELS[oldStatus] ?? oldStatus} to ${STATUS_LABELS[newStatus] ?? newStatus}`,
      createdBy: userId,
      createdAt: serverTimestamp(),
    });

    // GHL sync tags (best-effort)
    if (data.ghlContactId) {
      await syncToGHL(
        { name: data.name, email: data.email, phone: data.phone, source: data.source, status: newStatus },
        data.ghlContactId
      );
    }
  },

  async deleteLead(leadId: string): Promise<void> {
    await deleteDoc(doc(db, 'leads', leadId));
  },

  async addActivity(
    leadId: string,
    activity: { type: ActivityType; content: string; createdBy: string }
  ): Promise<Activity> {
    const ref = await addDoc(collection(db, 'leads', leadId, 'activities'), {
      ...activity,
      createdAt: serverTimestamp(),
    });
    return { ...activity, id: ref.id, createdAt: new Date() };
  },

  async getActivities(leadId: string): Promise<Activity[]> {
    const q = query(
      collection(db, 'leads', leadId, 'activities'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => toActivity(d.id, d.data()));
  },
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing Scheduled',
  offer_made: 'Offer Made',
  won: 'Won',
  lost: 'Lost',
};
