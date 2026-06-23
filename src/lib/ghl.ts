import axios, { AxiosInstance } from 'axios';

export interface GHLContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLStage[];
}

export interface GHLStage {
  id: string;
  name: string;
}

class GHLClient {
  private client: AxiosInstance;
  private apiKey: string;
  private locationId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GHL_API_KEY || '';
    this.locationId = import.meta.env.VITE_GHL_LOCATION_ID || '';

    this.client = axios.create({
      baseURL: 'https://rest.gohighlevel.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new contact in GHL
   */
  async createContact(data: Partial<GHLContact>) {
    try {
      const response = await this.client.post('/contacts', {
        locationId: this.locationId,
        ...data,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating GHL contact:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact in GHL
   */
  async updateContact(contactId: string, data: Partial<GHLContact>) {
    try {
      const response = await this.client.put(`/contacts/${contactId}`, {
        locationId: this.locationId,
        ...data,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating GHL contact:', error);
      throw error;
    }
  }

  /**
   * Get a contact from GHL
   */
  async getContact(contactId: string) {
    try {
      const response = await this.client.get(`/contacts/${contactId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching GHL contact:', error);
      throw error;
    }
  }

  /**
   * Add contact to a pipeline stage
   */
  async addToPipeline(contactId: string, pipelineId: string, stageId: string) {
    try {
      const response = await this.client.post('/contacts/pipeline-add', {
        contactId,
        pipelineId,
        stageId,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding contact to pipeline:', error);
      throw error;
    }
  }

  /**
   * Send SMS via GHL
   */
  async sendSMS(contactId: string, message: string) {
    try {
      const response = await this.client.post('/message/sms', {
        contactId,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send Email via GHL
   */
  async sendEmail(contactId: string, subject: string, body: string) {
    try {
      const response = await this.client.post('/message/email', {
        contactId,
        subject,
        body,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Trigger a workflow by ID
   */
  async triggerWorkflow(contactId: string, workflowId: string) {
    try {
      const response = await this.client.post('/workflows/trigger', {
        contactId,
        workflowId,
      });
      return response.data;
    } catch (error) {
      console.error('Error triggering workflow:', error);
      throw error;
    }
  }

  /**
   * Get pipelines
   */
  async getPipelines() {
    try {
      const response = await this.client.get('/pipelines', {
        params: { locationId: this.locationId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      throw error;
    }
  }
}

export const ghlClient = new GHLClient();
