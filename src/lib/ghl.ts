import axios, { AxiosInstance } from 'axios';

class GHLClient {
  private client: AxiosInstance;
  private locationId: string;

  constructor() {
    this.locationId = import.meta.env.VITE_GHL_LOCATION_ID || '';
    this.client = axios.create({
      baseURL: 'https://services.leadconnectorhq.com',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
    });
  }

  async createContact(data: {
    name: string;
    email?: string;
    phone?: string;
    tags?: string[];
    source?: string;
  }): Promise<{ id: string } | null> {
    const [firstName, ...rest] = (data.name || '').trim().split(' ');
    const response = await this.client.post('/contacts/', {
      firstName,
      lastName: rest.join(' ') || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      locationId: this.locationId,
      source: data.source,
      tags: data.tags ?? [],
    });
    return response.data?.contact ?? null;
  }

  async updateContact(
    contactId: string,
    data: { name?: string; email?: string; phone?: string; tags?: string[] }
  ): Promise<void> {
    let firstName: string | undefined;
    let lastName: string | undefined;
    if (data.name) {
      const [f, ...r] = data.name.trim().split(' ');
      firstName = f;
      lastName = r.join(' ') || undefined;
    }
    await this.client.put(`/contacts/${contactId}`, {
      firstName,
      lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      tags: data.tags ?? [],
    });
  }

  async sendSMS(contactId: string, message: string): Promise<void> {
    await this.client.post('/conversations/messages', {
      type: 'SMS',
      contactId,
      message,
    });
  }

  async sendEmail(contactId: string, subject: string, htmlBody: string): Promise<void> {
    await this.client.post('/conversations/messages', {
      type: 'Email',
      contactId,
      subject,
      html: htmlBody,
    });
  }
}

export const ghlClient = new GHLClient();
