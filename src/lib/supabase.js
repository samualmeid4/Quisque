import { v4 as uuidv4 } from 'uuid';

const MOCK_DB_KEY = 'mesaFlowDb';

const getStore = () => JSON.parse(localStorage.getItem(MOCK_DB_KEY)) || {
  users: [],
  profiles: [],
  tenants: [],
  tables: [],
  categories: [],
  products: [],
  orders: [],
  order_items: [],
  bills: []
};

const saveStore = (db) => localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));

// Initialize dummy data if empty
let initialDb = getStore();
if (!initialDb.tenants.length) {
  const tenantId = '00000000-0000-0000-0000-000000000000';
  initialDb.tenants.push({ id: tenantId, name: 'Restaurante Teste', status: 'ativo' });
  
  initialDb.users.push({ id: 'admin-id', email: 'admin@teste.com', password: '123' });
  initialDb.profiles.push({ id: 'admin-id', tenant_id: tenantId, name: 'Admin', role: 'admin' });

  initialDb.users.push({ id: 'garcom-id', email: 'garcom@teste.com', password: '123' });
  initialDb.profiles.push({ id: 'garcom-id', tenant_id: tenantId, name: 'Garçom', role: 'garcom' });

  initialDb.users.push({ id: 'cozinha-id', email: 'cozinha@teste.com', password: '123' });
  initialDb.profiles.push({ id: 'cozinha-id', tenant_id: tenantId, name: 'Cozinha', role: 'cozinha' });

  // Add tables
  initialDb.tables.push({ id: uuidv4(), tenant_id: tenantId, number: 1, status: 'livre' });
  initialDb.tables.push({ id: uuidv4(), tenant_id: tenantId, number: 2, status: 'livre' });
  initialDb.tables.push({ id: uuidv4(), tenant_id: tenantId, number: 3, status: 'livre' });

  // Add categories and products
  const cat1 = uuidv4();
  initialDb.categories.push({ id: cat1, tenant_id: tenantId, name: 'Lanches', active: true });
  initialDb.products.push({ id: uuidv4(), tenant_id: tenantId, category_id: cat1, name: 'X-Burger', price: 25.00, active: true });
  initialDb.products.push({ id: uuidv4(), tenant_id: tenantId, category_id: cat1, name: 'Hot Dog', price: 15.00, active: true });
  
  const cat2 = uuidv4();
  initialDb.categories.push({ id: cat2, tenant_id: tenantId, name: 'Bebidas', active: true });
  initialDb.products.push({ id: uuidv4(), tenant_id: tenantId, category_id: cat2, name: 'Coca-Cola', price: 6.00, active: true });
  initialDb.products.push({ id: uuidv4(), tenant_id: tenantId, category_id: cat2, name: 'Água', price: 4.00, active: true });

  saveStore(initialDb);
}

const bc = new BroadcastChannel('supabase_mock');

let currentUser = JSON.parse(localStorage.getItem('supabase_user')) || null;
const authListeners = new Set();

const emitAuth = (event, session) => {
  authListeners.forEach(listener => listener(event, session));
};

// Very simple query builder
class QueryBuilder {
  constructor(table, isCount = false) {
    this.table = table;
    this.isCount = isCount;
    this.db = getStore();
    this.data = [...(this.db[table] || [])];
  }

  select(columns, opts = {}) {
    if (opts && opts.count) {
      this.isCount = true;
    }
    // simple join mocks
    if (columns && columns.includes('(')) {
      if (this.table === 'orders') {
        this.data = this.data.map(order => {
          const tables = this.db.tables.find(t => t.id === order.table_id);
          const order_items = this.db.order_items.filter(oi => oi.order_id === order.id).map(oi => {
            const products = this.db.products.find(p => p.id === oi.product_id);
            return { ...oi, products };
          });
          return { ...order, tables, order_items };
        });
      }
      if (this.table === 'products') {
        this.data = this.data.map(p => {
          const categories = this.db.categories.find(c => c.id === p.category_id);
          return { ...p, categories };
        });
      }
    }
    return this;
  }

  eq(key, val) {
    this.data = this.data.filter(i => i[key] === val);
    return this;
  }

  neq(key, val) {
    this.data = this.data.filter(i => i[key] !== val);
    return this;
  }

  in(key, vals) {
    this.data = this.data.filter(i => vals.includes(i[key]));
    return this;
  }

  gte(key, val) {
    this.data = this.data.filter(i => new Date(i[key]) >= new Date(val));
    return this;
  }

  order(key, opts = { ascending: true }) {
    this.data.sort((a, b) => {
      if (a[key] < b[key]) return opts.ascending ? -1 : 1;
      if (a[key] > b[key]) return opts.ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  async single() {
    return { data: this.data[0] || null, error: this.data.length ? null : { message: 'Not found' } };
  }

  then(resolve) {
    if (this.isCount) {
      resolve({ count: this.data.length, data: null, error: null });
    } else {
      resolve({ data: this.data, count: null, error: null });
    }
  }
}

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      const db = getStore();
      const user = db.users.find(u => u.email === email && u.password === password);
      if (user) {
        currentUser = user;
        localStorage.setItem('supabase_user', JSON.stringify(user));
        const session = { user };
        setTimeout(() => emitAuth('SIGNED_IN', session), 0);
        return { data: { user, session }, error: null };
      }
      return { data: null, error: { message: 'Credenciais inválidas' } };
    },
    signOut: async () => {
      currentUser = null;
      localStorage.removeItem('supabase_user');
      setTimeout(() => emitAuth('SIGNED_OUT', null), 0);
      return { error: null };
    },
    getSession: async () => {
      return { data: { session: currentUser ? { user: currentUser } : null } };
    },
    onAuthStateChange: (listener) => {
      authListeners.add(listener);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(listener) } } };
    }
  },
  from: (table) => ({
    select: (columns, opts) => new QueryBuilder(table).select(columns, opts),
    insert: (payload) => {
      let db = getStore();
      const records = Array.isArray(payload) ? payload : [payload];
      const newRecords = records.map(p => ({
          id: uuidv4(),
          created_at: new Date().toISOString(),
          ...p
      }));
      if (!db[table]) db[table] = [];
      db[table].push(...newRecords);
      saveStore(db);
      bc.postMessage({ event: 'INSERT', table, payload: newRecords });
      return {
        select: () => ({
          single: async () => ({ data: newRecords[0], error: null })
        }),
        then: (resolve) => resolve({ data: newRecords, error: null })
      };
    },
    update: (payload) => ({
      eq: async (key, val) => {
        let db = getStore();
        if (!db[table]) db[table] = [];
        let updated = null;
        db[table] = db[table].map(item => {
          if (item[key] === val) {
              updated = { ...item, ...payload };
              return updated;
          }
          return item;
        });
        saveStore(db);
        if (updated) bc.postMessage({ event: 'UPDATE', table, payload: updated });
        return { data: updated, error: null };
      }
    })
  }),
  channel: (name) => {
    let listeners = [];
    bc.onmessage = (event) => {
      const msg = event.data;
      listeners.forEach(l => {
        if (l.table === msg.table) {
          l.callback(msg);
        }
      });
    };
    return {
      on: function(type, config, callback) {
        listeners.push({ table: config.table, callback });
        return this;
      },
      subscribe: function() { return this; }
    };
  },
  removeChannel: () => {}
};
