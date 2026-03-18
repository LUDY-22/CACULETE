/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ChevronRight, 
  AlertTriangle, 
  Printer, 
  Download, 
  UserPlus, 
  History, 
  Store,
  Menu,
  X,
  CreditCard,
  DollarSign,
  ArrowRightLeft,
  Barcode,
  Camera,
  AlertCircle,
  Lock,
  User
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  limit,
  getDoc,
  setDoc,
  increment,
  getDocs,
  getDocFromCache,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  UserProfile, 
  Product, 
  Sale, 
  SaleItem, 
  Supplier, 
  Expense, 
  AuditLog, 
  UserRole 
} from './types';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Optional: show a toast or alert to the user
  return errInfo;
}
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      {...props} 
      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
    />
  </div>
);

const Card = ({ children, className = '', title, action }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-bottom border-gray-100 flex justify-between items-center">
        {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If user exists in Auth but not in Firestore, create a basic profile
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || u.email?.split('@')[0] || 'Usuário',
            role: 'admin',
            storeId: `store_${u.uid.slice(0, 8)}`,
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
        setUser(u);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Listeners (Scoped by Store)
  useEffect(() => {
    if (!profile) return;

    const storeId = profile.storeId;

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('storeId', '==', storeId)),
      (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))),
      (err) => handleFirestoreError(err, OperationType.GET, 'products')
    );

    const unsubSales = onSnapshot(
      query(collection(db, 'sales'), where('storeId', '==', storeId), orderBy('timestamp', 'desc'), limit(100)),
      (snap) => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale))),
      (err) => handleFirestoreError(err, OperationType.GET, 'sales')
    );

    const unsubSuppliers = onSnapshot(
      query(collection(db, 'suppliers'), where('storeId', '==', storeId)),
      (snap) => setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier))),
      (err) => handleFirestoreError(err, OperationType.GET, 'suppliers')
    );

    const unsubExpenses = onSnapshot(
      query(collection(db, 'expenses'), where('storeId', '==', storeId)),
      (snap) => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))),
      (err) => handleFirestoreError(err, OperationType.GET, 'expenses')
    );

    const unsubLogs = onSnapshot(
      query(collection(db, 'logs'), where('storeId', '==', storeId), orderBy('timestamp', 'desc'), limit(50)),
      (snap) => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog))),
      (err) => handleFirestoreError(err, OperationType.GET, 'logs')
    );

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('storeId', '==', storeId)),
      (snap) => setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))),
      (err) => handleFirestoreError(err, OperationType.GET, 'users')
    );

    const unsubSettings = onSnapshot(
      query(collection(db, 'settings'), where('storeId', '==', storeId)),
      (snap) => {
        if (!snap.empty) {
          setSettings({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setSettings(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings')
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubSuppliers();
      unsubExpenses();
      unsubLogs();
      unsubUsers();
      unsubSettings();
    };
  }, [profile]);

  const logAction = async (action: string, description: string) => {
    if (!profile) return;
    await addDoc(collection(db, 'logs'), {
      userId: profile.uid,
      action,
      description,
      timestamp: new Date().toISOString(),
      storeId: profile.storeId
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginScreen onLoginSuccess={(u: any) => setUser(u)} setProfile={setProfile} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard products={products} sales={sales} expenses={expenses} />;
      case 'pos': return <POS products={products} profile={profile!} logAction={logAction} setSelectedSaleForReceipt={setSelectedSaleForReceipt} />;
      case 'products': return <ProductManagement products={products} profile={profile!} logAction={logAction} suppliers={suppliers} />;
      case 'inventory': return <Inventory products={products} profile={profile!} logAction={logAction} suppliers={suppliers} />;
      case 'suppliers': return <SupplierManagement suppliers={suppliers} profile={profile!} logAction={logAction} />;
      case 'finance': return <Finance expenses={expenses} sales={sales} profile={profile!} logAction={logAction} />;
      case 'reports': return <Reports sales={sales} products={products} expenses={expenses} />;
      case 'sales_history': return <SalesHistory sales={sales} onPrint={(sale: Sale) => setSelectedSaleForReceipt(sale)} />;
      case 'settings': return <StoreSettings settings={settings} profile={profile!} logAction={logAction} />;
      case 'users': return <UserManagement users={users} profile={profile!} logAction={logAction} />;
      case 'logs': return <AuditLogs logs={logs} users={users} />;
      default: return <Dashboard products={products} sales={sales} expenses={expenses} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6" />
          <span className="font-bold text-lg">LUV Zecu soft</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-0 z-40 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        bg-blue-900 text-white w-64 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-blue-800">
          <div className="bg-white p-2 rounded-lg">
            <Store className="w-6 h-6 text-blue-900" />
          </div>
          <span className="font-bold text-xl tracking-tight">LUV Zecu soft</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={currentTab === 'dashboard'} onClick={() => { setCurrentTab('dashboard'); setIsSidebarOpen(false); }} />
          <NavItem icon={<ShoppingCart />} label="Vendas (POS)" active={currentTab === 'pos'} onClick={() => { setCurrentTab('pos'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Package />} label="Produtos" active={currentTab === 'products'} onClick={() => { setCurrentTab('products'); setIsSidebarOpen(false); }} />
          <NavItem icon={<History />} label="Estoque" active={currentTab === 'inventory'} onClick={() => { setCurrentTab('inventory'); setIsSidebarOpen(false); }} />
          <NavItem icon={<Users />} label="Fornecedores" active={currentTab === 'suppliers'} onClick={() => { setCurrentTab('suppliers'); setIsSidebarOpen(false); }} />
          <NavItem icon={<DollarSign />} label="Financeiro" active={currentTab === 'finance'} onClick={() => { setCurrentTab('finance'); setIsSidebarOpen(false); }} />
          <NavItem icon={<FileText />} label="Relatórios" active={currentTab === 'reports'} onClick={() => { setCurrentTab('reports'); setIsSidebarOpen(false); }} />
          <NavItem icon={<History />} label="Histórico de Vendas" active={currentTab === 'sales_history'} onClick={() => { setCurrentTab('sales_history'); setIsSidebarOpen(false); }} />
          {profile?.role === 'admin' && (
            <NavItem icon={<Settings />} label="Configurações" active={currentTab === 'settings'} onClick={() => { setCurrentTab('settings'); setIsSidebarOpen(false); }} />
          )}
          {profile?.role === 'admin' && (
            <NavItem icon={<UserPlus />} label="Usuários" active={currentTab === 'users'} onClick={() => { setCurrentTab('users'); setIsSidebarOpen(false); }} />
          )}
          {profile?.role !== 'cashier' && (
            <NavItem icon={<History />} label="Auditoria" active={currentTab === 'logs'} onClick={() => { setCurrentTab('logs'); setIsSidebarOpen(false); }} />
          )}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold text-lg">
              {profile?.displayName?.[0] || profile?.email.split('@')[0][0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{profile?.displayName || profile?.email.split('@')[0]}</p>
              <p className="text-xs text-blue-300 capitalize">{profile?.role === 'cashier' ? 'Vendedor' : profile?.role === 'admin' ? 'Administrador' : profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-4 py-2 text-blue-300 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal 
          sale={selectedSaleForReceipt} 
          onClose={() => setSelectedSaleForReceipt(null)} 
          storeName={profile?.displayName || 'LUV Zecu soft'}
          settings={settings}
        />
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
        ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}
      `}
    >
      {React.cloneElement(icon, { size: 20 })}
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

// --- Screens ---

function LoginScreen({ onLoginSuccess, setProfile }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUsername = username.trim();
    let finalPassword = password;

    // Mapping special credentials requested by the user
    if (finalUsername.toLowerCase() === 'admini' && finalPassword === '1234') {
      finalUsername = 'admini';
      finalPassword = 'password1234'; // Firebase requires 6+ chars
    } else if (finalUsername.toLowerCase() === 'vende' && finalPassword === '4321') {
      finalUsername = 'vende';
      finalPassword = 'password4321'; // Firebase requires 6+ chars
    } else if (finalPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let email = finalUsername.toLowerCase();
      if (!email.includes('@')) {
        email = `${email}@luvzecu.com`;
      }
      await signInWithEmailAndPassword(auth, email, finalPassword);
    } catch (err: any) {
      // Auto-provision default users if they don't exist
      const isSpecial = (username.toLowerCase() === 'admini' && password === '1234') || 
                        (username.toLowerCase() === 'vende' && password === '4321');
      
      if (isSpecial && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          const email = `${finalUsername.toLowerCase()}@luvzecu.com`;
          const userCredential = await createUserWithEmailAndPassword(auth, email, finalPassword);
          const u = userCredential.user;
          
          const newProfile = {
            uid: u.uid,
            email: email,
            displayName: username.toLowerCase() === 'admini' ? 'Administrador' : 'Vendedor',
            role: username.toLowerCase() === 'admini' ? 'admin' : 'cashier',
            storeId: 'store_default',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
          return; // Success
        } catch (regErr: any) {
          setError('Erro ao configurar acesso padrão: ' + regErr.message);
        }
      }

      if (err.code === 'auth/configuration-not-found') {
        setError('O login não está configurado corretamente no Firebase.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Usuário ou senha incorretos.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const email = `${username.toLowerCase().trim()}@luvzecu.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const u = userCredential.user;
      
      const storeId = `store_${Date.now()}`;
      const newProfile = {
        uid: u.uid,
        email: email,
        displayName,
        role: role,
        storeId,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', u.uid), newProfile);
      setProfile(newProfile);

      await addDoc(collection(db, 'logs'), {
        userId: u.uid,
        action: 'REGISTER',
        description: `Nova loja criada: ${storeName} (Usuário: ${username})`,
        timestamp: new Date().toISOString(),
        storeId
      });

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este nome de usuário já está em uso. Escolha outro.');
      } else {
        setError('Erro ao criar conta. Verifique os dados inseridos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">LUV Zecu soft</h1>
            <p className="text-gray-500">{isRegistering ? 'Crie sua conta de acesso' : 'Acesse seu sistema de gestão'}</p>
            {!isRegistering && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                <p className="font-bold mb-1">Acessos Padrão:</p>
                <div className="flex justify-around">
                  <div>Admin: <span className="font-mono">Admini</span> / <span className="font-mono">1234</span></div>
                  <div>Vendedor: <span className="font-mono">Vende</span> / <span className="font-mono">4321</span></div>
                </div>
              </div>
            )}
          </div>

        <div className="space-y-4">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <>
                <Input label="Nome Completo" value={displayName} onChange={(e: any) => setDisplayName(e.target.value)} required />
                <Input label="Nome da Loja" value={storeName} onChange={(e: any) => setStoreName(e.target.value)} required />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo de Acesso</label>
                  <select 
                    className="px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="admin">Administrador</option>
                    <option value="cashier">Vendedor</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-1">
              <Input label="Nome de Usuário ou Email" value={username} onChange={(e: any) => setUsername(e.target.value)} required />
              {!isRegistering && (
                <p className="text-[10px] text-gray-400 px-1">
                  Dica: Você pode usar seu nome de usuário (ex: joao) ou seu e-mail completo.
                </p>
              )}
            </div>
            <Input label="Senha" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {error.includes('operation-not-allowed') && (
                  <div className="mt-1 p-2 bg-white rounded border border-red-200 text-[11px]">
                    <p className="font-bold mb-1">Ação Necessária:</p>
                    <p>O login por E-mail está desativado no Firebase.</p>
                    <button 
                      onClick={() => window.open('https://console.firebase.google.com/project/x-alcove-387912/authentication/providers', '_blank')}
                      className="text-blue-600 underline font-bold mt-1 block"
                    >
                      Clique aqui para abrir o painel e ativar
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full py-3 text-lg" disabled={loading}>
              {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Entrar no Sistema')}
            </Button>

            {!isRegistering && (
              <div className="space-y-3 mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 bg-white text-gray-400">Ou use</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const provider = new GoogleAuthProvider();
                        await signInWithPopup(auth, provider);
                      } catch (err: any) {
                        setError('Erro Google: ' + err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                    Entrar com Google
                  </Button>

                  <Button 
                    type="button"
                    onClick={() => {
                      const demoProfile: UserProfile = {
                        uid: 'demo_user',
                        email: 'demo@luvzecu.com',
                        displayName: 'Usuário Demo',
                        role: 'admin',
                        storeId: 'store_demo',
                        createdAt: new Date().toISOString()
                      };
                      setProfile(demoProfile);
                      onLoginSuccess({ uid: 'demo_user', email: 'demo@luvzecu.com' });
                    }}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-medium hover:bg-emerald-100 flex items-center justify-center gap-2"
                  >
                    🚀 Modo de Demonstração
                  </Button>
                </div>
              </div>
            )}

            {isRegistering && (
              <button 
                type="button"
                onClick={() => setIsRegistering(false)}
                className="w-full text-center text-sm text-gray-500 hover:underline mt-2"
              >
                Já tem uma conta? Faça login
              </button>
            )}

            {!isRegistering && (
              <div className="space-y-2 mt-4">
                <button 
                  type="button"
                  onClick={async () => {
                    if (!username.includes('@')) {
                      alert('Por favor, insira seu e-mail completo para redefinir a senha.');
                      return;
                    }
                    try {
                      await sendPasswordResetEmail(auth, username.trim());
                      alert('E-mail de redefinição enviado!');
                    } catch (err: any) {
                      alert('Erro ao enviar e-mail: ' + err.message);
                    }
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:underline"
                >
                  Esqueceu a senha?
                </button>
                <div className="border-t border-gray-100 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="w-full text-center text-sm text-gray-500 hover:underline"
                  >
                    Não tem uma conta? Registre sua loja
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Registre sua loja'}
          </button>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ products, sales, expenses }: { products: Product[], sales: Sale[], expenses: Expense[] }) {
  const today = new Date().toISOString().split('T')[0];
  
  const todaySales = useMemo(() => sales.filter(s => s.timestamp.startsWith(today)), [sales, today]);
  const totalRevenueToday = useMemo(() => todaySales.reduce((acc, s) => acc + s.total, 0), [todaySales]);
  
  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.minStock), [products]);
  
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const data = last7Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      vendas: sales.filter(s => s.timestamp.startsWith(date)).reduce((acc, s) => acc + s.total, 0)
    }));

    // Simple Sales Forecast (Linear)
    if (data.length >= 2) {
      const last = data[data.length - 1].vendas;
      const prev = data[data.length - 2].vendas;
      const trend = last - prev;
      data.push({
        date: 'Previsão',
        vendas: Math.max(0, last + trend)
      });
    }

    return data;
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500 font-medium bg-white px-4 py-2 rounded-lg shadow-sm">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign className="text-green-600" />} label="Vendas Hoje" value={`Kz ${totalRevenueToday.toLocaleString()}`} color="bg-green-50" />
        <StatCard icon={<ShoppingCart className="text-blue-600" />} label="Pedidos Hoje" value={todaySales.length.toString()} color="bg-blue-50" />
        <StatCard icon={<Package className="text-orange-600" />} label="Estoque Baixo" value={lowStockProducts.length.toString()} color="bg-orange-50" />
        <StatCard icon={<TrendingUp className="text-purple-600" />} label="Lucro Estimado" value={`Kz ${(totalRevenueToday * 0.3).toLocaleString()}`} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2" title="Desempenho de Vendas (7 dias)">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="vendas" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card title="Alertas de Estoque" action={<Button variant="ghost" size="sm">Ver Tudo</Button>}>
          <div className="space-y-4">
            {lowStockProducts.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.stock} unidades restantes</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  Repor
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Package size={48} className="mx-auto mb-2 opacity-20" />
                <p>Estoque em dia!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <Card className="border-none">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function POS({ products, profile, logAction, setSelectedSaleForReceipt }: { products: Product[], profile: UserProfile, logAction: any, setSelectedSaleForReceipt: any }) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todas', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.barcode.includes(search);
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const total = cart.reduce((acc, item) => acc + item.total, 0);
  const change = amountReceived > total ? amountReceived - total : 0;

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Produto sem estoque!");
      return;
    }
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert("Limite de estoque atingido!");
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.salePrice,
        total: product.salePrice
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Dinheiro' && amountReceived < total) {
      alert("Valor recebido é inferior ao total da venda!");
      return;
    }
    setIsProcessing(true);
    try {
      const saleData = {
        items: cart,
        total,
        paymentMethod,
        amountReceived: paymentMethod === 'Dinheiro' ? amountReceived : total,
        change: paymentMethod === 'Dinheiro' ? change : 0,
        cashierId: profile.uid,
        storeId: profile.storeId,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'sales'), saleData).then((docRef) => {
        setSelectedSaleForReceipt({ ...saleData, id: docRef.id } as Sale);
      });

      // Update stock
      for (const item of cart) {
        const productRef = doc(db, 'products', item.productId);
        await updateDoc(productRef, {
          stock: increment(-item.quantity)
        });
      }

      await logAction('SALE', `Venda realizada: Kz ${total.toLocaleString()} - ${paymentMethod}`);
      
      setCart([]);
      setAmountReceived(0);
      setShowCartMobile(false);
      alert("Venda finalizada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao processar venda.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    
    // Auto-add if exact barcode match
    const exactMatch = products.find(p => p.barcode === val && val.length > 5);
    if (exactMatch) {
      addToCart(exactMatch);
      setSearch('');
    }
  };

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Product Selection */}
      <div className={`lg:col-span-2 flex flex-col gap-4 ${showCartMobile ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Pesquisar produto ou bipar código..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length === 1) {
                  addToCart(filteredProducts[0]);
                  setSearch('');
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-100 hover:border-blue-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-4">
          {filteredProducts.map(p => (
            <button 
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col gap-2 group"
            >
              <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={32} className="text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-800 line-clamp-1">{p.name}</p>
                <p className="text-blue-600 font-bold">Kz {p.salePrice.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Estoque: {p.stock}</p>
              </div>
              <div className="mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-600 text-white text-xs py-1 rounded-lg text-center font-bold">Adicionar</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      <Card className={`flex flex-col h-full ${showCartMobile ? 'flex' : 'hidden lg:flex'}`} title="Carrinho de Compras">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {cart.map(item => (
            <div key={item.productId} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">{item.quantity}x Kz {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm">Kz {item.total.toLocaleString()}</p>
                <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
              <p>Carrinho vazio</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">Kz {total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Dinheiro', 'Multicaixa', 'Transferência'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Dinheiro' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Valor Recebido (Kz)</label>
              <input 
                type="number"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={amountReceived || ''}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                placeholder="0"
              />
              {amountReceived > 0 && (
                <div className="flex justify-between items-center p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
                  <span className="text-xs font-bold uppercase">Troco:</span>
                  <span className="font-bold">Kz {change.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {showCartMobile && (
              <Button variant="secondary" onClick={() => setShowCartMobile(false)} className="lg:hidden">
                Voltar
              </Button>
            )}
            <Button 
              onClick={handleCheckout} 
              className="flex-1 py-4 text-xl shadow-lg shadow-blue-200"
              disabled={cart.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processando...' : 'Finalizar'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Cart Toggle Button */}
      {!showCartMobile && cart.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 lg:hidden z-50">
          <button 
            onClick={() => setShowCartMobile(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-bounce"
          >
            <ShoppingCart size={20} />
            Ver Carrinho ({cart.length}) - Kz {total.toLocaleString()}
          </button>
        </div>
      )}
    </div>
  );
}

function BarcodeScanner({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Camera className="text-blue-600" />
          Escanear Código de Barras
        </h3>
        <div id="reader" className="w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-200"></div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Posicione o código de barras dentro do quadrado para escanear.
        </p>
      </div>
    </div>
  );
}

function ProductManagement({ products, profile, logAction, suppliers }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplierId: '',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    barcode: ''
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p: Product) => p.category).filter(Boolean));
    return ['Todas', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = products.filter((p: Product) => {
    const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.barcode.includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const path = `products/${editingProduct.id}`;
        try {
          await updateDoc(doc(db, 'products', editingProduct.id), formData);
          await logAction('PRODUCT_UPDATE', `Produto atualizado: ${formData.name}`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
          throw err;
        }
      } else {
        const path = 'products';
        try {
          await addDoc(collection(db, 'products'), {
            ...formData,
            storeId: profile.storeId,
            createdAt: new Date().toISOString()
          });
          await logAction('PRODUCT_CREATE', `Novo produto criado: ${formData.name}`);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
          throw err;
        }
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', category: '', supplierId: '', purchasePrice: 0, salePrice: 0, stock: 0, minStock: 5, barcode: '' });
    } catch (err: any) {
      alert(`Erro ao salvar produto: ${err.message || 'Verifique sua conexão ou permissões.'}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o produto ${name}?`)) {
      await deleteDoc(doc(db, 'products', id));
      await logAction('PRODUCT_DELETE', `Produto excluído: ${name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Produtos</h1>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus size={20} />
            Novo Produto
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-600">Produto</th>
                <th className="pb-4 font-semibold text-gray-600">Categoria</th>
                <th className="pb-4 font-semibold text-gray-600">Preço Venda</th>
                <th className="pb-4 font-semibold text-gray-600">Estoque</th>
                <th className="pb-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p: Product) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-500">#{p.barcode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">{p.category}</td>
                  <td className="py-4 font-bold text-blue-600">Kz {p.salePrice.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock <= p.minStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {p.stock} un
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setEditingProduct(p); setFormData(p as any); setIsModalOpen(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome do Produto" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
              <Input label="Categoria" value={formData.category} onChange={(e: any) => setFormData({...formData, category: e.target.value})} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fornecedor</label>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Código de Barras</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  />
                  <Button type="button" variant="secondary" onClick={() => setIsScannerOpen(true)}>
                    <Camera size={20} />
                  </Button>
                </div>
              </div>
              <Input label="Preço de Compra (Kz)" type="number" value={formData.purchasePrice} onChange={(e: any) => setFormData({...formData, purchasePrice: Number(e.target.value)})} />
              <Input label="Preço de Venda (Kz)" type="number" value={formData.salePrice} onChange={(e: any) => setFormData({...formData, salePrice: Number(e.target.value)})} />
              <Input label="Estoque Inicial" type="number" value={formData.stock} onChange={(e: any) => setFormData({...formData, stock: Number(e.target.value)})} />
              <Input label="Estoque Mínimo" type="number" value={formData.minStock} onChange={(e: any) => setFormData({...formData, minStock: Number(e.target.value)})} />
              
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar Produto</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={(code) => setFormData({...formData, barcode: code})} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}

function Inventory({ products, profile, logAction, suppliers }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplierId: '',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    barcode: ''
  });

  const handleStockUpdate = async (id: string, name: string, current: number, amount: number) => {
    const newStock = current + amount;
    if (newStock < 0) return;
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), { stock: newStock });
      await logAction('STOCK_ADJUST', `Ajuste de estoque: ${name} (${amount > 0 ? '+' : ''}${amount})`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = 'products';
    try {
      await addDoc(collection(db, 'products'), {
        ...formData,
        storeId: profile.storeId,
        createdAt: new Date().toISOString()
      });
      await logAction('PRODUCT_CREATE', `Novo produto criado (via Estoque): ${formData.name}`);
      setIsModalOpen(false);
      setFormData({ name: '', category: '', supplierId: '', purchasePrice: 0, salePrice: 0, stock: 0, minStock: 5, barcode: '' });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, path);
      alert(`Erro ao adicionar produto: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Adicionar Produto ao Estoque
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          {products.map((p: Product) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between p-4 bg-gray-50 rounded-2xl gap-4">
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className={`p-3 rounded-xl ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Package size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">Mínimo: {p.minStock} un</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Disponível</p>
                  <p className={`text-2xl font-black ${p.stock <= p.minStock ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleStockUpdate(p.id, p.name, p.stock, -1)}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => handleStockUpdate(p.id, p.name, p.stock, 1)}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition-all shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package size={64} className="mx-auto mb-4 opacity-10" />
              <p>Nenhum produto no estoque. Adicione o seu primeiro produto!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Adição Rápida */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Novo Produto no Estoque</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <Input label="Nome do Produto" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Preço Venda (Kz)" type="number" value={formData.salePrice} onChange={(e: any) => setFormData({...formData, salePrice: Number(e.target.value)})} required />
                <Input label="Estoque Inicial" type="number" value={formData.stock} onChange={(e: any) => setFormData({...formData, stock: Number(e.target.value)})} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fornecedor</label>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Adicionar ao Estoque</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SupplierManagement({ suppliers, profile, logAction }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'suppliers'), { ...formData, storeId: profile.storeId });
    await logAction('SUPPLIER_CREATE', `Novo fornecedor: ${formData.name}`);
    setIsModalOpen(false);
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={20} /> Adicionar</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s: Supplier) => (
          <Card key={s.id} title={s.name}>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2"><TrendingUp size={16} /> {s.email}</p>
              <p className="flex items-center gap-2"><TrendingUp size={16} /> {s.phone}</p>
              <p className="flex items-center gap-2"><TrendingUp size={16} /> {s.address}</p>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md" title="Novo Fornecedor">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
              <Input label="Telefone" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
              <Input label="Email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
              <Input label="Endereço" value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value})} />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Finance({ expenses, sales, profile, logAction }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: 0, category: 'Geral' });

  const totalRevenue = sales.reduce((acc: number, s: Sale) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc: number, e: Expense) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'expenses'), { 
      ...formData, 
      date: new Date().toISOString(), 
      storeId: profile.storeId 
    });
    await logAction('EXPENSE_CREATE', `Nova despesa: ${formData.description} - Kz ${formData.amount}`);
    setIsModalOpen(false);
    setFormData({ description: '', amount: 0, category: 'Geral' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
        <Button onClick={() => setIsModalOpen(true)} variant="danger"><Plus size={20} /> Registrar Despesa</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<TrendingUp className="text-green-600" />} label="Receita Total" value={`Kz ${totalRevenue.toLocaleString()}`} color="bg-green-50" />
        <StatCard icon={<TrendingUp className="text-red-600" />} label="Despesas Totais" value={`Kz ${totalExpenses.toLocaleString()}`} color="bg-red-50" />
        <StatCard icon={<TrendingUp className="text-blue-600" />} label="Lucro Líquido" value={`Kz ${netProfit.toLocaleString()}`} color="bg-blue-50" />
      </div>

      <Card title="Histórico de Despesas">
        <div className="space-y-3">
          {expenses.map((e: Expense) => (
            <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-800">{e.description}</p>
                <p className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()}</p>
              </div>
              <p className="font-bold text-red-600">- Kz {e.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md" title="Registrar Despesa">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Descrição" value={formData.description} onChange={(e: any) => setFormData({...formData, description: e.target.value})} required />
              <Input label="Valor (Kz)" type="number" value={formData.amount} onChange={(e: any) => setFormData({...formData, amount: Number(e.target.value)})} required />
              <Input label="Categoria" value={formData.category} onChange={(e: any) => setFormData({...formData, category: e.target.value})} />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="danger">Salvar Despesa</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Reports({ sales, products, expenses }: any) {
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Vendas - LUV Zecu soft", 10, 10);
    let y = 20;
    sales.forEach((s: Sale) => {
      doc.text(`${new Date(s.timestamp).toLocaleDateString()} - Kz ${s.total.toLocaleString()}`, 10, y);
      y += 10;
    });
    doc.save("relatorio-vendas.pdf");
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sales);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "relatorio-vendas.xlsx");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios e Exportação</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Vendas por Período">
          <div className="space-y-4">
            <Button onClick={exportToPDF} className="w-full"><FileText size={20} /> Exportar Vendas (PDF)</Button>
            <Button onClick={exportToExcel} className="w-full" variant="secondary"><Download size={20} /> Exportar Vendas (Excel)</Button>
          </div>
        </Card>
        <Card title="Produtos mais Vendidos">
          <div className="space-y-2">
            {/* Simple list for now */}
            <p className="text-sm text-gray-500">Em breve: Gráficos detalhados de desempenho por produto.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function UserManagement({ users, profile, logAction }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', displayName: '', role: 'cashier' as UserRole });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, you'd use a Cloud Function to create users without logging out the admin
      alert("Para criar novos usuários, use o console do Firebase ou uma Cloud Function. Esta interface demonstra a gestão.");
      setIsModalOpen(false);
    } catch (err) {
      alert("Erro ao criar usuário.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
        <Button onClick={() => setIsModalOpen(true)}><UserPlus size={20} /> Novo Usuário</Button>
      </div>
      <Card>
        <div className="divide-y divide-gray-50">
          {users.map((u: UserProfile) => (
            <div key={u.uid} className="py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {u.displayName?.[0] || u.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{u.displayName || 'Sem Nome'}</p>
                  <p className="text-xs text-gray-500">Usuário: {u.email.split('@')[0]}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' : u.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                {u.role === 'cashier' ? 'Vendedor' : u.role === 'admin' ? 'Administrador' : u.role}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md" title="Novo Usuário">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input label="Nome" value={formData.displayName} onChange={(e: any) => setFormData({...formData, displayName: e.target.value})} required />
              <Input label="Nome de Usuário" value={formData.username} onChange={(e: any) => setFormData({...formData, username: e.target.value})} required />
              <Input label="Senha" type="password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Cargo</label>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  <option value="cashier">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Criar Usuário</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function StoreSettings({ settings, profile, logAction }: { settings: any, profile: UserProfile, logAction: any }) {
  const [formData, setFormData] = useState({
    receiptHeader: '',
    receiptFooter: '',
    nif: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        receiptHeader: settings.receiptHeader || '',
        receiptFooter: settings.receiptFooter || '',
        nif: settings.nif || '',
        address: settings.address || '',
        phone: settings.phone || ''
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (settings?.id) {
        await updateDoc(doc(db, 'settings', settings.id), formData);
      } else {
        await addDoc(collection(db, 'settings'), {
          ...formData,
          storeId: profile.storeId
        });
      }
      await logAction('SETTINGS_UPDATE', 'Configurações da loja atualizadas');
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Configurações da Loja</h1>
      
      <Card title="Personalização do Recibo">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="NIF da Empresa" 
              value={formData.nif} 
              onChange={(e: any) => setFormData({...formData, nif: e.target.value})} 
            />
            <Input 
              label="Telefone de Contato" 
              value={formData.phone} 
              onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
            />
          </div>
          <Input 
            label="Endereço" 
            value={formData.address} 
            onChange={(e: any) => setFormData({...formData, address: e.target.value})} 
          />
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cabeçalho Personalizado (Opcional)</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Ex: Bem-vindo à nossa loja!&#10;NIF: 123456789"
              value={formData.receiptHeader}
              onChange={(e) => setFormData({...formData, receiptHeader: e.target.value})}
            />
            <p className="text-xs text-gray-400 italic">Se preenchido, substituirá o NIF/Endereço padrão no topo do recibo.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Rodapé Personalizado (Opcional)</label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Ex: Obrigado pela preferência!&#10;Trocas em até 15 dias."
              value={formData.receiptFooter}
              onChange={(e) => setFormData({...formData, receiptFooter: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AuditLogs({ logs, users }: any) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Auditoria do Sistema</h1>
      <Card>
        <div className="space-y-4">
          {logs.map((log: AuditLog) => {
            const user = users.find((u: any) => u.uid === log.userId);
            return (
              <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className={`p-2 rounded-lg ${log.action.includes('DELETE') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <History size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-gray-600">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Por: {user?.displayName || user?.email?.split('@')[0] || 'Sistema'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SalesHistory({ sales, onPrint }: { sales: Sale[], onPrint: (sale: Sale) => void }) {
  const [search, setSearch] = useState('');
  
  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) || 
    s.paymentMethod.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID ou Pagamento..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 font-semibold text-gray-600">ID Venda</th>
                <th className="pb-4 font-semibold text-gray-600">Data/Hora</th>
                <th className="pb-4 font-semibold text-gray-600">Pagamento</th>
                <th className="pb-4 font-semibold text-gray-600">Total</th>
                <th className="pb-4 font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-sm font-mono text-gray-500">#{s.id.slice(-6).toUpperCase()}</td>
                  <td className="py-4 text-sm text-gray-600">{new Date(s.timestamp).toLocaleString('pt-BR')}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-gray-900">Kz {s.total.toLocaleString()}</td>
                  <td className="py-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => onPrint(s)}>
                      <Printer size={16} />
                      Recibo
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p>Nenhuma venda encontrada</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ReceiptModal({ sale, onClose, storeName, settings }: { sale: Sale, onClose: () => void, storeName: string, settings?: any }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print-overlay">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 no-print">
          <h2 className="text-lg font-bold text-gray-900">Recibo de Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white print-area" id="receipt-content">
          {/* Thermal Receipt Style (58mm) */}
          <div className="text-center mb-4 font-mono text-sm whitespace-pre-wrap">
            <h1 className="font-bold text-lg uppercase">{storeName}</h1>
            {settings?.receiptHeader ? (
              <p>{settings.receiptHeader}</p>
            ) : (
              <>
                <p>NIF: {settings?.nif || '0000000000'}</p>
                <p>Endereço: {settings?.address || 'Luanda, Angola'}</p>
                <p>Tel: {settings?.phone || '+244 900 000 000'}</p>
              </>
            )}
            <div className="border-b border-dashed border-black my-2"></div>
            <p className="font-bold">RECIBO DE VENDA</p>
            <p>ID: #{sale.id.slice(-8).toUpperCase()}</p>
            <p>{new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
            <div className="border-b border-dashed border-black my-2"></div>
          </div>

          <table className="w-full font-mono text-xs mb-4">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left pb-1">ITEM</th>
                <th className="text-center pb-1">QTD</th>
                <th className="text-right pb-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">{item.name}</td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1">{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="font-mono text-sm space-y-1">
            <div className="border-t border-dashed border-black pt-2 flex justify-between font-bold">
              <span>TOTAL</span>
              <span>Kz {sale.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>PAGAMENTO</span>
              <span>{sale.paymentMethod}</span>
            </div>
            {sale.paymentMethod === 'Dinheiro' && (
              <>
                <div className="flex justify-between text-xs">
                  <span>RECEBIDO</span>
                  <span>Kz {(sale.amountReceived || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span>TROCO</span>
                  <span>Kz {(sale.change || 0).toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="border-b border-dashed border-black pb-2"></div>
          </div>

          <div className="text-center mt-6 font-mono text-xs italic whitespace-pre-wrap">
            {settings?.receiptFooter ? (
              <p>{settings.receiptFooter}</p>
            ) : (
              <>
                <p>Obrigado pela preferência!</p>
                <p>Volte sempre.</p>
              </>
            )}
            <p className="mt-2 text-[8px] not-italic opacity-50">LUV Zecu soft ERP</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 no-print">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Fechar</Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer size={20} />
            Imprimir
          </Button>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            padding: 0;
            margin: 0;
          }
          .no-print, .no-print-overlay {
            display: none !important;
          }
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
