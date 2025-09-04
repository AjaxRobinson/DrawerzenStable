
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dobvwnfsglqzdnsymzsp.supabase.co' || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_URL)  ;
const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnZ3bmZzZ2xxemRuc3ltenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQ2MDYsImV4cCI6MjA3MDUzMDYwNn0.5hAAfdqya9ggpIC2cUdCHrruNxEN4TMaMWuR0KhSdqs' || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ANON_KEY);
const SUPABASE_BUCKET = 'drawerzen' || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_BUCKET)  ;
const SUPABASE_TABLE = 'dataset' || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_TABLE);
const SUPABASE_ORDERS_TABLE = 'orders' || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_SUPABASE_ORDERS_TABLE)  ;

class SupabaseService {
  constructor() {
  this.bucket = SUPABASE_BUCKET;
  this.table = SUPABASE_TABLE; 
  this.ordersTable = SUPABASE_ORDERS_TABLE;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase URL or Anon Key');
    this.client = null;
    this.enabled = false;
    return;
  }
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.enabled = true;
        console.log('DB Connection Success');
      } catch (e) {
        console.warn('Supabase init failed', e);
        this.client = null;
        this.enabled = false;

      }
    } else {
      this.client = null;
      this.enabled = false;
      console.warn('Missing Supabase URL or Anon Key Else Part');
    }
  }

  isEnabled() { return !!this.enabled; }

  async uploadImage(path, blob, contentType = 'image/jpeg') {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await this.client.storage.from(this.bucket).upload(path, blob, { contentType, upsert: true });
    if (error) return { success: false, error };
    const { data: pub } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return { success: true, data, publicUrl: pub?.publicUrl };
  }

  async insertRecord(record) { 
    return this.insertInto(this.table, record);
  }

  async insertInto(tableName, record) {
    if (!this.enabled) return { success: false, error: 'Supabase not configured' };
    try {
      const { data, error } = await this.client.from(tableName).insert(record).select();
      if (error) return { success: false, error };
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e };
    }
  }

  async insertOrder(orderRecord) {
    return this.insertInto(this.ordersTable, orderRecord);
  }
}

export default new SupabaseService();
