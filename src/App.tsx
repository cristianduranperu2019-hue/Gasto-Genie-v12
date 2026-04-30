import React, { useState, useRef, useMemo, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Sparkles,
  FileText, 
  Trash2, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ShoppingBag, 
  Loader2, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Store,
  Wallet,
  CheckCircle2,
  Plus,
  Users,
  TrendingUp,
  ChevronRight,
  Info,
  Save,
  X,
  Droplets,
  Moon,
  Sun,
  Settings,
  RefreshCcw,
  Grid,
  LayoutGrid,
  Download,
  Database
} from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { auth, db, signInWithGoogle } from "./lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  where,
  addDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  getDocs, 
  writeBatch,
  Timestamp
} from "firebase/firestore";
import { cn } from "./lib/utils";
import { ReceiptData, ReceiptItem, MainCategory, FoodSubcategory, FamilyContribution } from "./types";

// Safe access to API Key for external deployments (Vercel/Netlify)
const getGeminiKey = () => {
  // Prioritize manually entered key from localStorage
  if (typeof window !== 'undefined') {
    const manualKey = localStorage.getItem('gastro_genie_manual_api_key');
    if (manualKey && manualKey.trim() !== "") return manualKey;
  }
  // Fallback to the key defined in vite.config.ts via process.env
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

// Lazy AI initialization to prevent top-level crash if key is missing
let aiInstance: any = null;
const getAI = () => {
  if (!aiInstance) {
    const key = getGeminiKey();
    if (!key || key === "null" || key === "undefined" || key === "") {
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#64748b", "#06b6d4"];

const FAMILY_MEMBERS_FULL = ["Zulay", "Albert", "Miguel", "Gabriel", "Cristian"];
const FAMILY_MEMBERS_INITIAL = ["Zulay", "Albert", "Miguel", "Gabriel", "Cristian"];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = Array.from({ length: 27 }, (_, i) => 2024 + i);

interface WaterPurchase {
  id: string;
  fecha: string;
  comprador: string;
  cantidad: number;
  precioTotal: number;
}

// Budget/Asigned Money per month
const INITIAL_FAMILY_BUDGET: Record<string, number> = {};

const TurnSelector = ({ 
  current, 
  onSelect, 
  members,
  autoName,
  accentColor = "blue" 
}: { 
  current: string | null, 
  onSelect: (name: string | null) => void, 
  members: string[],
  autoName: string,
  accentColor?: "blue" | "emerald"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20"
  };

  const ringClasses = {
    blue: "focus:ring-blue-500/30",
    emerald: "focus:ring-emerald-500/30"
  };

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 pr-2 pl-3 py-1.5 rounded-2xl border border-border-color transition-all duration-300 group outline-none",
          isOpen 
            ? `ring-2 ${ringClasses[accentColor]} bg-bg-principal shadow-lg border-transparent` 
            : "bg-bg-principal/50 hover:bg-bg-principal hover:shadow-md"
        )}
      >
        <div className="flex flex-col items-start leading-none gap-0.5">
           <div className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">
              {current ? "Manual" : "Automático"}
           </div>
           <div className="text-xl font-black text-text-main tracking-tight">
              {current || autoName}
           </div>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
          current ? colorClasses[accentColor] : "bg-text-secondary/10 text-text-secondary"
        )}>
           <Settings size={14} className={cn("transition-transform duration-700", isOpen && "rotate-90")} />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            className="absolute z-50 top-full mt-3 left-0 w-[240px] p-2 bg-bg-principal/95 border border-border-color rounded-[24px] shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="px-3 py-2">
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3">Asignar Inicio</div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => { onSelect(null); setIsOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-[16px] text-left transition-all group border",
                    !current 
                      ? "bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/20" 
                      : "hover:bg-text-secondary/5 border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-[12px] flex items-center justify-center transition-all",
                    !current ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40" : "bg-text-secondary/10 text-text-secondary"
                  )}>
                    <RefreshCcw size={18} className={cn(!current && "animate-spin-slow")} />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="text-xs font-black text-text-main leading-tight">Automático</div>
                    <div className="text-[10px] text-text-secondary font-bold">Historial activo</div>
                  </div>
                  {!current && <CheckCircle2 size={16} className="ml-auto text-emerald-500" />}
                </button>

                <div className="h-px bg-border-color my-1 opacity-50" />

                {members.map((name) => (
                  <button
                    key={name}
                    onClick={() => { onSelect(name); setIsOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 w-full p-2.5 rounded-[16px] text-left transition-all group border",
                      current === name 
                        ? "bg-blue-500/10 border-blue-500/30 dark:bg-blue-500/20" 
                        : "hover:bg-text-secondary/5 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-[12px] flex items-center justify-center font-black text-sm transition-all",
                      current === name ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40" : "bg-text-secondary/10 text-text-secondary"
                    )}>
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex flex-col">
                       <div className="text-sm font-black text-text-main leading-tight">{name}</div>
                       <div className="text-[10px] text-text-secondary font-bold">Asignar turno</div>
                    </div>
                    {current === name && <CheckCircle2 size={16} className="ml-auto text-blue-500" />}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);


  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    
    // Set a timeout to detect if popup was blocked/forgotten
    const timeout = setTimeout(() => {
      if (isLoggingIn) {
        setLoginError("¿Ventana bloqueada? Revisa si tu navegador bloqueó el popup de Google.");
      }
    }, 5000);

    try {
      await signInWithGoogle();
      clearTimeout(timeout);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error("Login failed:", error);
      if (error.code === "auth/cancelled-popup-request") {
        setLoginError("Ya hay una ventana de inicio de sesión abierta.");
      } else if (error.code === "auth/popup-closed-by-user") {
        setLoginError("La ventana de inicio de sesión se cerró.");
      } else if (error.code === "auth/popup-blocked") {
        setLoginError("Popup bloqueado por el navegador. Por favor, permítelo.");
      } else {
        setLoginError("Error al iniciar sesión: " + (error.message || "Error desconocido"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [view, setView] = useState<"home" | "scan" | "budget" | "manual" | "water" | "shifts" | "inflation" | "categories" | "backup">("home");
  const [chartType, setChartType] = useState<"donut" | "bar" | "pie">("donut");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as "light" | "dark";
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

    // Category Management State - Recreated from scratch for maximum integrity
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gastro_genie_categories_v2');
      if (saved) return JSON.parse(saved);
    }
    return ["Alimentos", "Limpieza", "Productos personales", "Gas", "Decoración de la casa", "Feria/Frutas", "Agua mineral", "Otros"];
  });
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gastro_genie_subcategories_v2');
      if (saved) return JSON.parse(saved);
    }
    return {
      "Alimentos": ["Víveres esenciales", "Salados", "Charcutería", "Chucherías"],
      "Limpieza": ["Artículos de aseo", "Detergentes"],
      "Productos personales": ["Cuidado bucal", "Cuidado corporal"],
      "Gas": ["Carga normal"],
      "Decoración de la casa": ["Muebles", "Adornos"],
      "Feria/Frutas": ["Frutas", "Verduras"],
      "Agua mineral": ["Bidones", "Botellas"],
      "Otros": ["Sin clasificar"]
    };
  });
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>("Alimentos");

  // 1. STATE INITIALIZATION (Zero Absolute)
  const [expenses, setExpenses] = useState<ReceiptData[]>([]);
  const [contributions, setContributions] = useState<FamilyContribution[]>([]);
  const [waterRecords, setWaterRecords] = useState<WaterPurchase[]>([]);
  const [budgetData, setBudgetData] = useState<Record<string, Record<string, number>>>({});
  
  // Guard against "zombie" snapshots during deletion
  const [isClearing, setIsClearing] = useState(false);
  const isClearingRef = useRef(false);

  useEffect(() => {
    isClearingRef.current = isClearing;
  }, [isClearing]);

  // Load from LocalStorage if NOT logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      console.log("Loading offline data...");
      try {
        const savedExpenses = localStorage.getItem('gastro_genie_expenses_v2');
        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        
        const savedContribs = localStorage.getItem('gastro_genie_contributions_v2');
        if (savedContribs) setContributions(JSON.parse(savedContribs));

        const savedBudgets = localStorage.getItem('gastro_genie_budgets_v2');
        if (savedBudgets) setBudgetData(JSON.parse(savedBudgets));

        const savedWater = localStorage.getItem('gastro_genie_water_v2');
        if (savedWater) setWaterRecords(JSON.parse(savedWater));
      } catch (err) {
        console.error("Local storage load error:", err);
      }
    }
  }, [user]);

  // Global Persistence to LocalStorage (for offline mode)
  useEffect(() => {
    if (!user && !isClearingRef.current) {
      localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify(expenses));
      localStorage.setItem('gastro_genie_contributions_v2', JSON.stringify(contributions));
      localStorage.setItem('gastro_genie_budgets_v2', JSON.stringify(budgetData));
      localStorage.setItem('gastro_genie_water_v2', JSON.stringify(waterRecords));
    }
  }, [expenses, contributions, budgetData, waterRecords, user]);

  
  // Budget view filters
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const currentPeriodKey = `${selectedYear}-${selectedMonth}`;

  // Derived state for all members ever added to any budget month
  const allFamilyMembers = useMemo(() => {
    const membersList = new Set<string>(FAMILY_MEMBERS_INITIAL);
    Object.values(budgetData).forEach(monthData => {
      Object.keys(monthData).forEach(name => membersList.add(name));
    });
    return Array.from(membersList);
  }, [budgetData]);

  // Ensures currentMonthBudgets always contains all known members, default to 0
  const currentMonthBudgets = useMemo(() => {
    const base = budgetData[currentPeriodKey] || {};
    const result: Record<string, number> = {};
    allFamilyMembers.forEach(member => {
      result[member] = base[member] || 0;
    });
    return result;
  }, [currentPeriodKey, budgetData, allFamilyMembers]);

  const [newWaterQty, setNewWaterQty] = useState("1");
  const [newWaterPrice, setNewWaterPrice] = useState("3000");

  const [userApiKey, setUserApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gastro_genie_manual_api_key') || "";
    }
    return "";
  });

  // 2. NUCLEAR CLEAR LOGIC (Delete from Source of Truth)
  const clearAllData = async () => {
    const ok = window.confirm("🚨 ¿BORRADO TOTAL? Esta acción eliminará ABSOLUTAMENTE TODO de este dispositivo y de la NUBE. No hay marcha atrás.");
    if (!ok) return;
    
    setIsClearing(true);
    
    try {
      // Step A: Local Wipe (Nuke everything)
      setExpenses([]);
      setWaterRecords([]);
      setBudgetData({});
      setContributions([]);
      
      const defaultCats = ["Alimentos", "Limpieza", "Productos personales", "Gas", "Decoración de la casa", "Feria/Frutas", "Otros"];
      setCategories(defaultCats);
      setSubcategoryMappings({
        "Alimentos": ["Víveres esenciales", "Salados", "Charcutería", "Chucherías"],
        "Limpieza": ["Artículos de aseo", "Detergentes"],
        "Productos personales": ["Cuidado bucal", "Cuidado corporal"],
        "Gas": ["Carga normal"],
        "Decoración de la casa": ["Muebles", "Adornos"],
        "Feria/Frutas": ["Frutas", "Verduras"],
        "Otros": ["Sin clasificar"]
      });
      
      // Step B: Storage Wipe
      localStorage.clear(); 
      
      // Step C: Cloud Wipe
      if (user) {
        const collectionsToClear = ["expenses", "waterRecords", "budgets", "contributions", "config"];
        for (const colName of collectionsToClear) {
          const q = query(collection(db, "users", user.uid, colName));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
        await deleteDoc(doc(db, "users", user.uid));
      }
      
      alert("✅ ÉXITO: Todos los datos han sido eliminados permanentemente.");
      window.location.reload(); 
    } catch (err: any) {
      console.error("Nuclear clear error:", err);
      alert("Error al borrar algunos datos en la nube.");
    } finally {
      setTimeout(() => setIsClearing(false), 3000);
    }
  };

  const clearCategoryExpenses = async (categoryName: string) => {
    const ok = window.confirm(`¿Quieres borrar TODO el historial de "${categoryName}"?`);
    if (!ok) return;

    setIsClearing(true);
    try {
      // 1. Identify which ones to delete
      const toDelete = expenses.filter(exp => exp.productos.some(p => p.categoria === categoryName));
      const removedTotal = toDelete.reduce((sum, e) => sum + e.transaccion.total_final, 0);

      // 2. Local Filter
      setExpenses(prev => prev.filter(exp => !exp.productos.some(p => p.categoria === categoryName)));
      
      // 3. Cloud Delete
      if (user) {
        const q = query(collection(db, "users", user.uid, "expenses"));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        let count = 0;
        snap.docs.forEach(d => {
          const data = d.data() as ReceiptData;
          if (data.productos.some(p => p.categoria === categoryName)) {
            batch.delete(d.ref);
            count++;
          }
        });
        if (count > 0) await batch.commit();
      }

      alert(`✅ Se borraron ${toDelete.length} registros de "${categoryName}".`);
    } catch (err) {
      console.error("Clear category error:", err);
    } finally {
      setTimeout(() => setIsClearing(false), 1500);
    }
  };

  const clearAllCategories = async () => {
    if (!window.confirm("¿Restablecer categorías y subcategorías?")) return;
    const defaultCats = ["Alimentos", "Limpieza", "Productos personales", "Gas", "Decoración de la casa", "Feria/Frutas", "Otros"];
    const defaultSubs = {
      "Alimentos": ["Víveres esenciales", "Salados", "Charcutería", "Chucherías"],
      "Limpieza": ["Artículos de aseo", "Detergentes"],
      "Productos personales": ["Cuidado bucal", "Cuidado corporal"],
      "Gas": ["Carga normal"],
      "Decoración de la casa": ["Muebles", "Adornos"],
      "Feria/Frutas": ["Frutas", "Verduras"],
      "Otros": ["Sin clasificar"]
    };
    setCategories(defaultCats);
    setSubcategoryMappings(defaultSubs);
    if (user) {
      await updateDoc(doc(db, "users", user.uid), {
        categories: defaultCats,
        subcategoryMappings: defaultSubs,
        updatedAt: serverTimestamp()
      });
    }
  };

  const clearAllWater = async () => {
    if (!window.confirm("¿Eliminar TODOS los registros de agua?")) return;
    setWaterRecords([]);
    if (user) {
      const q = query(collection(db, "users", user.uid, "waterRecords"));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    alert("Registros de agua eliminados.");
  };

  const saveApiKey = async (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('gastro_genie_manual_api_key', key);
    // Force recreate AI instance on next use
    aiInstance = null;

    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        manualApiKey: key,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  };

  // Persistence logic - Sync state to localStorage on every change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoadingApp(false);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Real-time Sync & Migration
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    // 1. Sync User Config
    const unsubConfig = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.categories) setCategories(data.categories);
        if (data.subcategoryMappings) setSubcategoryMappings(data.subcategoryMappings);
        if (data.manualApiKey) setUserApiKey(data.manualApiKey);
        setLoadingApp(false);
      } else {
        console.log("No config in cloud, maintaining local.");
        setLoadingApp(false);
      }
    }, (error) => {
      console.error("Config sync error:", error);
      setLoadingApp(false);
    });

    // 2. Sync Expenses
    const qExpenses = query(collection(db, "users", user.uid, "expenses"));
    const unsubExpenses = onSnapshot(qExpenses, (snapshot) => {
      if (isClearingRef.current) return;
      const cloudExpenses = snapshot.docs.map(d => ({ 
        ...d.data(), 
        firestoreId: d.id 
      } as any));
      setExpenses(cloudExpenses);
      console.log(`Synced ${cloudExpenses.length} expenses from cloud.`);
    }, (error) => {
      console.error("Expenses sync error:", error);
    });

    // 3. Sync Budgets
    const qBudgets = query(collection(db, "users", user.uid, "budgets"));
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      if (isClearingRef.current) return;
      const budgets: Record<string, any> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        budgets[data.periodKey] = data.allocations;
      });
      setBudgetData(budgets);
    }, (error) => {
      console.error("Budgets sync error:", error);
    });

    // 4. Sync Water Records
    const qWater = query(collection(db, "users", user.uid, "waterRecords"));
    const unsubWater = onSnapshot(qWater, (snapshot) => {
      if (isClearingRef.current) return;
      const records = snapshot.docs.map(d => ({ 
        ...d.data(), 
        firestoreId: d.id 
      } as any));
      setWaterRecords(records);
    }, (error) => {
      console.error("Water records sync error:", error);
    });

    // 5. Sync Contributions
    const qContribs = query(collection(db, "users", user.uid, "contributions"));
    const unsubContribs = onSnapshot(qContribs, (snapshot) => {
      if (isClearingRef.current) return;
      const cloudContribs = snapshot.docs.map(d => ({ 
        ...d.data(), 
        firestoreId: d.id 
      } as any));
      setContributions(cloudContribs);
    }, (error) => {
      console.error("Contributions sync error:", error);
    });

    return () => {
      unsubConfig();
      unsubExpenses();
      unsubBudgets();
      unsubWater();
      unsubContribs();
    };
  }, [user]);

  // Persistence logic - Sync state to localStorage on every change
  useEffect(() => {
    localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('gastro_genie_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('gastro_genie_subcategories_v2', JSON.stringify(subcategoryMappings));
  }, [subcategoryMappings]);

  useEffect(() => {
    localStorage.setItem('gastro_genie_budgets_v2', JSON.stringify(budgetData));
  }, [budgetData]);

  useEffect(() => {
    localStorage.setItem('gastro_genie_water_v2', JSON.stringify(waterRecords));
  }, [waterRecords]);

  useEffect(() => {
    localStorage.setItem('gastro_genie_contributions_v2', JSON.stringify(contributions));
  }, [contributions]);

  // Scanning state
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [pendingResults, setPendingResults] = useState<{data: ReceiptData, fileIndex: number, comprador: string, pagador: string}[]>([]);
  const [selectedPurchaser, setSelectedPurchaser] = useState<string>(""); // Global default
  const [selectedShopper, setSelectedShopper] = useState<string>(""); // Global default
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<MainCategory | null>(null);
  const [selectedSubcategoryDetails, setSelectedSubcategoryDetails] = useState<FoodSubcategory | null>(null);
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<ReceiptData | null>(null);
  const [selectedFamilyMemberDetails, setSelectedFamilyMemberDetails] = useState<string | null>(null);
  
  const activeTransaction = useMemo(() => {
    if (!selectedTransactionDetails) return null;
    return expenses.find(exp => 
      exp.transaccion.comprador === selectedTransactionDetails.transaccion.comprador && 
      exp.transaccion.lugar === selectedTransactionDetails.transaccion.lugar && 
      exp.transaccion.fecha === selectedTransactionDetails.transaccion.fecha
    );
  }, [selectedTransactionDetails, expenses]);

  // Turn overrides
  const [manualShoppingTurn, setManualShoppingTurn] = useState<string | null>(null);
  const [manualWaterTurn, setManualWaterTurn] = useState<string | null>(null);
  
  const normalizeCategory = (cat: string): MainCategory => {
    // Standardize to the exact string "Alimentos" defined in state
    const ALIMENTOS_LITERAL = "Alimentos";
    const cleaned = (cat || "").trim();
    if (!cleaned) return "Otros";

    // Direct match check (even case-insensitive)
    const exactMatch = categories.find(c => c.toLowerCase() === cleaned.toLowerCase());
    if (exactMatch) return exactMatch as MainCategory;
    
    const low = cleaned.toLowerCase();
    
    // Falla 2: Rule for "Agua" -> "Agua mineral"
    if (low.includes("agua")) return "Agua mineral";
    
    // Hard overrides for "Alimentos"
    if (
      low.includes("alimento") || 
      low.includes("comida") || 
      low.includes("comestible") || 
      low.includes("supermercado") || 
      low.includes("mercado") || 
      low.includes("viveres") || 
      low.includes("víveres") ||
      low.includes("bebida") ||
      low.includes("gasto")
    ) {
      return ALIMENTOS_LITERAL;
    }
    
    if (low.includes("limp")) return "Limpieza";
    if (low.includes("pers") || low.includes("aseo")) return "Productos personales";
    if (low.includes("gas")) return "Gas";
    if (low.includes("hogar") || low.includes("muebl") || low.includes("decor")) return "Decoración de la casa";
    if (low.includes("frut") || low.includes("verd") || low.includes("feria")) return "Feria/Frutas";
    
    return "Otros";
  };

  const sanitizePrice = (val: any): number => {
    if (typeof val === "number") return Math.round(val);
    if (!val) return 0;
    // For CLP (Chilean Peso), we remove all non-digit characters to get the integer value
    const cleaned = val.toString().replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  const robustDateParse = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // DD-MM-YYYY or DD/MM/YYYY or variations
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
      } else {
        // DD-MM-YYYY
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
        if (year < 100) year += 2000;
      }
      const testDate = new Date(year, month, day);
      if (!isNaN(testDate.getTime())) return testDate;
    }
    return null;
  };

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Manual entry state
  const [manualExpense, setManualExpense] = useState<{
    lugar: string, 
    fecha: string, 
    comprador: string, // Shopper
    pagador: string,   // Payer
    items: { nombre: string, precio: string, cantidad: string, precioUnitario: string, categoria: MainCategory, subcategoria: FoodSubcategory | null }[]
  }>({
    lugar: "",
    fecha: getLocalDateString(),
    comprador: "Cristian",
    pagador: "Cristian",
    items: [{ nombre: "", precio: "", cantidad: "1", precioUnitario: "", categoria: "Otros", subcategoria: null }]
  });

  // Budget management state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberBudget, setNewMemberBudget] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const d = robustDateParse(exp.transaccion.fecha);
      if (!d) return false;
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const getEffectiveTotal = (exp: ReceiptData) => {
    const total = sanitizePrice(exp.transaccion.total_final);
    const itemsTotal = exp.productos.reduce((sum, p) => sum + sanitizePrice(p.precio), 0);
    return itemsTotal > 0 ? itemsTotal : total;
  };

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    // Pre-initialize sectors to ensure zero-value categories show up
    categories.forEach(c => stats[normalizeCategory(c)] = 0);

    filteredExpenses.forEach(exp => {
      exp.productos.forEach(item => {
        const catName = normalizeCategory(item.categoria || "Otros");
        const price = sanitizePrice(item.precio);
        stats[catName] = (stats[catName] || 0) + price;
      });
    });
    return Object.entries(stats).map(([name, value]) => ({ name: name.trim(), value }));
  }, [filteredExpenses, categories]);

  const totalSpent = useMemo(() => {
    return categoryStats.reduce((sum, cat) => sum + cat.value, 0);
  }, [categoryStats]);

  const monthlyContributions = useMemo(() => {
    const memberNames = Object.keys(currentMonthBudgets).length > 0 
      ? Object.keys(currentMonthBudgets) 
      : FAMILY_MEMBERS_INITIAL;
    
    const stats: Record<string, number> = {};
    memberNames.forEach(m => stats[m] = 0);
    
    filteredExpenses.forEach(exp => {
      const pag = exp.transaccion.pagador || exp.transaccion.comprador;
      const amount = getEffectiveTotal(exp);
      if (stats[pag] !== undefined) {
        stats[pag] += amount;
      } else {
        // Fallback for members not in current month budget but having expenses
        stats[pag] = (stats[pag] || 0) + amount;
      }
    });

    const categoriesWithExpenses = Array.from(new Set([...memberNames, ...Object.keys(stats)]));

    return categoriesWithExpenses.map((name, i) => ({
      name,
      amount: stats[name] || 0,
      color: COLORS[i % COLORS.length]
    }));
  }, [filteredExpenses, currentMonthBudgets]);

  const inflationStats = useMemo(() => {
    // Group all products by name to track price history
    const productHistory: Record<string, { price: number, date: string, place: string }[]> = {};
    
    expenses.forEach(exp => {
      exp.productos.forEach(prod => {
        if (!productHistory[prod.nombre]) productHistory[prod.nombre] = [];
        
        // AS PER SENIOR ARCHITECT INSTRUCTION: All logic must use Unit Price (Total / Quantity)
        const unitPrice = prod.precioUnitario || (prod.cantidad > 0 ? (prod.precio / prod.cantidad) : prod.precio);
        
        productHistory[prod.nombre].push({
          price: unitPrice,
          date: exp.transaccion.fecha,
          place: exp.transaccion.lugar
        });
      });
    });

    // Sort by date for each product
    Object.keys(productHistory).forEach(name => {
      productHistory[name].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    const comparisons: { 
      product: string, 
      prevPrice: number, 
      currPrice: number, 
      prevPlace: string, 
      currPlace: string,
      status: "IPC" | "MAS_CARO" | "SIN_CAMBIO" | "MAS_BARATO"
    }[] = [];

    Object.entries(productHistory).forEach(([name, history]) => {
      if (history.length < 2) return;

      // Compare last two purchases
      const prev = history[history.length - 2];
      const current = history[history.length - 1];

      if (current.price > prev.price) {
        if (current.place === prev.place) {
          comparisons.push({ product: name, prevPrice: prev.price, currPrice: current.price, prevPlace: prev.place, currPlace: current.place, status: "IPC" });
        } else {
          comparisons.push({ product: name, prevPrice: prev.price, currPrice: current.price, prevPlace: prev.place, currPlace: current.place, status: "MAS_CARO" });
        }
      } else if (current.price < prev.price) {
        comparisons.push({ product: name, prevPrice: prev.price, currPrice: current.price, prevPlace: prev.place, currPlace: current.place, status: "MAS_BARATO" });
      } else {
        comparisons.push({ product: name, prevPrice: prev.price, currPrice: current.price, prevPlace: prev.place, currPlace: current.place, status: "SIN_CAMBIO" });
      }
    });

    return comparisons;
  }, [expenses]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      const newPreviews: string[] = [];
      
      selectedFiles.forEach((f, idx) => {
        if (f.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
             newPreviews[idx] = reader.result as string;
             setPreviews([...newPreviews]);
          };
          reader.readAsDataURL(f);
        } else if (f.type === "application/pdf") {
          newPreviews[idx] = "pdf-preview";
          setPreviews([...newPreviews]);
        } else if (f.type === "text/plain" || f.name.endsWith(".txt")) {
          newPreviews[idx] = "txt-preview";
          setPreviews([...newPreviews]);
        }
      });
      setError(null);
    }
  };

  const analyzeReceipt = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setError(null);
    setPendingResults([]);

    try {
      const ai = getAI();
      if (!ai) {
        setLoginError("Clave de API no configurada. Obtenla gratis en https://aistudio.google.com/app/apikey y configúra en Vercel como GEMINI_API_KEY.");
        throw new Error("API Key missing");
      }

      const results: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const idx = i;
        let fileData: string = "";
        let isText = false;

        if (f.type === "text/plain" || f.name.endsWith(".txt")) {
          fileData = await f.text();
          isText = true;
        } else {
          fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(f);
          });
        }

        const prompt = `Rol: Motor de extracción de datos de "GastoGenie".
Convierte documentos (boletas, facturas, TXT, PDF) en el JSON especificado.

Instrucciones:
1. Extrae: lugar, fecha (AAAA-MM-DD), comprador y total.
2. Comprador: Si encuentras un nombre de persona que parezca ser el titular, úsalo. De lo contrario usa "${user?.displayName || 'Usuario'}".
3. Productos: Extrae nombre exacto, precio total de la línea, cantidad y precio unitario.
4. Clasifica CADA producto estrictamente en una de estas categorías: ${categories.join(", ")}.
5. Si encuentras algún producto que parezca ser agua mineral, bidón de agua o similar, asígna la categoría "Agua mineral" (aunque no esté en la lista oficial).
6. Si no estás seguro de la categoría, usa "Otros".

Estructura JSON requerida:
{
  "transaccion": { "lugar": string, "fecha": string, "comprador": string, "total_final": number },
  "productos": [
    { "nombre": string, "precio": number, "cantidad": number, "precioUnitario": number, "categoria": string, "subcategoria": string | null }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: prompt },
              isText 
                ? { text: `Contenido del archivo:\n${fileData}` }
                : { inlineData: { data: fileData, mimeType: f.type || "image/jpeg" } }
            ]
          },
          config: {
            responseMimeType: "application/json"
          }
        });
        
        const responseText = response.text;
        if (!responseText) throw new Error("La IA no devolvió ninguna respuesta.");
        
        let data: ReceiptData;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
          } else {
            throw parseErr;
          }
        }
        
        // Post-process
        if (data.productos) {
          data.productos = data.productos.map(p => {
             let cat = normalizeCategory(p.categoria);
             // FALLA 2: Automación de agua
             if (p.nombre.toLowerCase().includes("agua")) {
                cat = "Agua mineral" as any;
             }
             return {
                ...p,
                precio: sanitizePrice(p.precio),
                precioUnitario: sanitizePrice(p.precioUnitario),
                categoria: cat
             };
          });
          data.transaccion.total_final = data.productos.reduce((sum, p) => sum + p.precio, 0);
        }
        
        results.push({ data, fileIndex: idx, comprador: selectedShopper || data.transaccion.comprador, pagador: selectedPurchaser || selectedShopper });
      }
      
      setPendingResults(results);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Error desconocido";
      setError(`Error al procesar: ${msg}.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveManualExpense = () => {
    const sanitizedItems = manualExpense.items.map(item => {
      const priceVal = sanitizePrice(item.precio);
      const qtyVal = parseFloat(item.cantidad) || 1;
      // If no unit price, calculate it. If no price, calculate it from unit price.
      const uPriceVal = item.precioUnitario ? sanitizePrice(item.precioUnitario) : (qtyVal > 0 ? priceVal / qtyVal : priceVal);
      const finalPrice = item.precio ? priceVal : (uPriceVal * qtyVal);
      
      return {
        nombre: item.nombre || "Item manual",
        precio: finalPrice,
        cantidad: qtyVal,
        precioUnitario: uPriceVal,
        categoria: normalizeCategory(item.categoria),
        subcategoria: item.subcategoria ? item.subcategoria.trim() : null
      };
    });

    const total = sanitizedItems.reduce((sum, item) => sum + item.precio, 0);
    if (total === 0) {
      alert("Por favor, ingresa al menos un precio mayor a 0.");
      return;
    }

    const newExpense: ReceiptData = {
      id: crypto.randomUUID(),
      transaccion: {
        lugar: manualExpense.lugar || "Tienda Local",
        fecha: manualExpense.fecha,
        comprador: manualExpense.comprador,
        pagador: manualExpense.pagador,
        total_final: total
      },
      productos: sanitizedItems
    };
    
    // The state will be updated via Firestore Snapshot, but we update locally for speed
    setExpenses(prev => [newExpense, ...prev]);

    if (user) {
      addDoc(collection(db, "users", user.uid, "expenses"), { 
        ...newExpense, 
        userId: user.uid, 
        createdAt: serverTimestamp() 
      }).catch(err => {
        console.error("Error saving to cloud:", err);
        alert("Error al guardar en la nube.");
      });
    }

    setManualShoppingTurn(null);
    setManualWaterTurn(null);
    setView("home");
    setManualExpense({
      ...manualExpense,
      fecha: getLocalDateString(),
      items: [{ nombre: "", precio: "", cantidad: "1", precioUnitario: "", categoria: "Alimentos", subcategoria: null }]
    });
  };

  const updateProductCategory = async (comprador: string, lugar: string, fecha: string, prodNombre: string, newCat: string) => {
    // 1. Find the target expense
    const target = expenses.find(exp => exp.transaccion.comprador === comprador && exp.transaccion.lugar === lugar && exp.transaccion.fecha === fecha);
    if (!target) return;

    // 2. Local Update
    const newExpenses = expenses.map(exp => {
      if (exp === target) {
        return {
          ...exp,
          productos: exp.productos.map(p => p.nombre === prodNombre ? { ...p, categoria: newCat } : p)
        };
      }
      return exp;
    });
    setExpenses(newExpenses);

    // 3. Cloud Sync
    if (user && target.firestoreId) {
      try {
        const updatedProds = target.productos.map(p => p.nombre === prodNombre ? { ...p, categoria: newCat } : p);
        await updateDoc(doc(db, "users", user.uid, "expenses", target.firestoreId), {
          productos: updatedProds,
          updatedAt: serverTimestamp()
        });
        console.log("Cloud synced category update.");
      } catch (err) {
        console.error("Error syncing category:", err);
      }
    }
    
    // Also update pending results if any match
    setPendingResults(prev => prev.map(res => {
      if (res.data.transaccion.comprador === comprador && res.data.transaccion.lugar === lugar && res.data.transaccion.fecha === fecha) {
        return {
          ...res,
          data: {
            ...res.data,
            productos: res.data.productos.map(p => p.nombre === prodNombre ? { ...p, categoria: newCat } : p)
          }
        };
      }
      return res;
    }));
  };

  const updateProductSubcategory = async (comprador: string, lugar: string, fecha: string, prodNombre: string, newSub: string | null) => {
    // 1. Find the target expense
    const target = expenses.find(exp => exp.transaccion.comprador === comprador && exp.transaccion.lugar === lugar && exp.transaccion.fecha === fecha);
    if (!target) return;

    // 2. Local Update
    const newExpenses = expenses.map(exp => {
      if (exp === target) {
        return {
          ...exp,
          productos: exp.productos.map(p => p.nombre === prodNombre ? { ...p, subcategoria: newSub } : p)
        };
      }
      return exp;
    });
    setExpenses(newExpenses);

    // 3. Cloud Sync
    if (user && target.firestoreId) {
      try {
        const updatedProds = target.productos.map(p => p.nombre === prodNombre ? { ...p, subcategoria: newSub } : p);
        await updateDoc(doc(db, "users", user.uid, "expenses", target.firestoreId), {
          productos: updatedProds,
          updatedAt: serverTimestamp()
        });
        console.log("Cloud synced subcategory update.");
      } catch (err) {
        console.error("Error syncing subcategory:", err);
      }
    }

    // Also update pending results if any match
    setPendingResults(prev => prev.map(res => {
      if (res.data.transaccion.comprador === comprador && res.data.transaccion.lugar === lugar && res.data.transaccion.fecha === fecha) {
        return {
          ...res,
          data: {
            ...res.data,
            productos: res.data.productos.map(p => p.nombre === prodNombre ? { ...p, subcategoria: newSub } : p)
          }
        };
      }
      return res;
    }));
  };


  const renameCategory = async (oldName: string, newName: string) => {
    const newCategories = categories.map(c => c === oldName ? newName : c);
    const newMappings = { ...subcategoryMappings };
    if (newMappings[oldName]) {
      newMappings[newName] = newMappings[oldName];
      delete newMappings[oldName];
    }

    setCategories(newCategories);
    setSubcategoryMappings(newMappings);

    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        categories: newCategories,
        subcategoryMappings: newMappings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    if (selectedCategoryForSub === oldName) setSelectedCategoryForSub(newName);
    setExpenses(prev => prev.map(exp => ({
      ...exp,
      productos: exp.productos.map(p => p.categoria === oldName ? { ...p, categoria: newName } : p)
    })));
  };

  const addCategory = async (name: string) => {
    if (name && !categories.includes(name.trim())) {
      const trimmedName = name.trim();
      const newCategories = [...categories, trimmedName];
      const newMappings = { ...subcategoryMappings, [trimmedName]: [] };
      
      setCategories(newCategories);
      setSubcategoryMappings(newMappings);

      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          categories: newCategories,
          subcategoryMappings: newMappings,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  };

  const renameSubcategory = (category: string, oldName: string, newName: string) => {
    setSubcategoryMappings(prev => {
      const copy = { ...prev };
      if (copy[category]) {
        copy[category] = copy[category].map(s => s === oldName ? newName : s);
      }
      return copy;
    });
    setExpenses(prev => prev.map(exp => ({
      ...exp,
      productos: exp.productos.map(p => (p.categoria === category && p.subcategoria === oldName) ? { ...p, subcategoria: newName } : p)
    })));
  };

  const addSubcategory = async (category: string, name: string) => {
    if (name && category && subcategoryMappings[category] && !subcategoryMappings[category].includes(name)) {
      const newMappings = {
        ...subcategoryMappings,
        [category]: [...subcategoryMappings[category], name]
      };
      setSubcategoryMappings(newMappings);

      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          subcategoryMappings: newMappings,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    }
  };

  // 3. MASTER DELETION LOGIC (Atomic & Persistent)
  const deleteExpense = async (id: string | undefined) => {
    if (!id) {
       console.error("[Senior Dev] Attempted to delete without ID.");
       return;
    }
    
    const ok = window.confirm("¿Seguro que quieres eliminar este registro permanentemente?");
    if (!ok) return;

    console.log(`[Senior Dev] Atomic Delete Init: ${id}`);
    
    setIsClearing(true); 
    
    try {
      // 1. Locate target for contribution adjustment BEFORE filtering
      const target = expenses.find(exp => exp.firestoreId === id || exp.id === id);
      if (target) {
        setContributions(prev => prev.map(c => 
          c.name === target.transaccion.comprador ? { ...c, amount: Math.max(0, c.amount - target.transaccion.total_final) } : c
        ));
      }

      // 2. Local State Wipe (Immediate Feedback)
      setExpenses(prev => prev.filter(exp => exp.firestoreId !== id && exp.id !== id));

      // 3. Persistent Storage Purge
      if (typeof window !== 'undefined') {
        const current = JSON.parse(localStorage.getItem('gastro_genie_expenses_v2') || '[]');
        const updated = current.filter((exp: any) => exp.firestoreId !== id && exp.id !== id);
        localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify(updated));
      }

      // 4. Cloud Sync
      if (user) {
        await deleteDoc(doc(db, "users", user.uid, "expenses", id));
      }
      
      console.log("[Senior Dev] Atomic Delete Success.");
    } catch (err) {
      console.error("[Senior Dev] Critical Persistence Error:", err);
      alert("Error al eliminar los datos. Por favor, reintenta.");
    } finally {
      setTimeout(() => setIsClearing(false), 500);
    }
  };

  const deleteProduct = async (expenseId: string | undefined, productName: string, productPrice: number) => {
    if (!expenseId) return;
    
    console.log(`[Senior Dev] Product Removal from ${expenseId}: ${productName}`);
    
    const target = expenses.find(exp => exp.firestoreId === expenseId || exp.id === expenseId);
    if (!target) return;

    const newProds = target.productos.filter(p => !(p.nombre === productName && Math.abs(p.precio - productPrice) < 1));
    
    if (newProds.length === 0) {
      // Purge parents if empty
      await deleteExpense(expenseId);
      return;
    }

    const newTotal = newProds.reduce((sum, p) => sum + p.precio, 0);

    const updatedExpense = { ...target, productos: newProds, transaccion: { ...target.transaccion, total_final: newTotal } };

    // Update Local State
    setExpenses(prev => prev.map(exp => {
      if (exp.firestoreId === expenseId || exp.id === expenseId) {
        return updatedExpense;
      }
      return exp;
    }));

    // Update Local Storage (Nuclear Persistence Fix)
    if (typeof window !== 'undefined') {
       const current = JSON.parse(localStorage.getItem('gastro_genie_expenses_v2') || '[]');
       const updated = current.map((exp: any) => {
         if (exp.firestoreId === expenseId || exp.id === expenseId) {
           return updatedExpense;
         }
         return exp;
       });
       localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify(updated));
    }

    // Update Contributions
    setContributions(prev => prev.map(c => 
      c.name === target.transaccion.comprador ? { ...c, amount: Math.max(0, c.amount - productPrice) } : c
    ));

    // Persist
    if (user && target.firestoreId) {
      try {
        await updateDoc(doc(db, "users", user.uid, "expenses", target.firestoreId), {
          productos: newProds,
          "transaccion.total_final": newTotal,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Cloud product sync error:", err);
      }
    }
  };

  const deleteWaterRecord = async (id: string) => {
    const record = waterRecords.find(r => (r as any).firestoreId === id || r.id === id);
    if (!record) return;

    // 1. Optimistic Local Update
    setWaterRecords(prev => prev.filter(r => (r as any).firestoreId !== id && r.id !== id));
    
    // 2. Also remove corresponding expense from dashboard if it exists
    const matchingExpense = expenses.find(exp => 
      exp.transaccion.lugar === "Agua Mineral" && 
      exp.transaccion.fecha === record.fecha && 
      exp.transaccion.total_final === record.precioTotal &&
      exp.transaccion.comprador === record.comprador
    );
    
    if (matchingExpense) {
      deleteExpense(matchingExpense.firestoreId || matchingExpense.id);
    }

    if (user) {
      try {
        if ((record as any).firestoreId) {
          await deleteDoc(doc(db, "users", user.uid, "waterRecords", (record as any).firestoreId));
        } else {
          const q = query(collection(db, "users", user.uid, "waterRecords"), where("id", "==", id));
          const snap = await getDocs(q);
          const batch = writeBatch(db);
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      } catch (err) {
        console.error("Delete water record error:", err);
      }
    }

    setContributions(prev => prev.map(c => 
      c.name === record.comprador ? { ...c, amount: Math.max(0, c.amount - record.precioTotal) } : c
    ));
  };

  const addManualItem = () => {
    setManualExpense({
      ...manualExpense,
      items: [...manualExpense.items, { nombre: "", precio: "", cantidad: "1", precioUnitario: "", categoria: "Otros", subcategoria: null }]
    });
  };

  const addBudgetMember = async () => {
    if (!newMemberName || !newMemberBudget) return;
    const amount = parseFloat(newMemberBudget);
    
    const newAllocations = {
      ...(budgetData[currentPeriodKey] || {}),
      [newMemberName]: amount
    };

    setBudgetData(prev => ({
      ...prev,
      [currentPeriodKey]: newAllocations
    }));

    if (user) {
      await setDoc(doc(db, "users", user.uid, "budgets", currentPeriodKey), {
        periodKey: currentPeriodKey,
        allocations: newAllocations,
        userId: user.uid
      });
    }

    if (!contributions.find(c => c.name === newMemberName)) {
      setContributions([...contributions, { name: newMemberName, amount: 0, color: COLORS[contributions.length % COLORS.length] }]);
    }
    setNewMemberName("");
    setNewMemberBudget("");
  };

  const removeBudgetMember = async (name: string) => {
    const newAllocations = { ...(budgetData[currentPeriodKey] || {}) };
    delete newAllocations[name];

    setBudgetData(prev => ({
      ...prev,
      [currentPeriodKey]: newAllocations
    }));

    if (user) {
      await setDoc(doc(db, "users", user.uid, "budgets", currentPeriodKey), {
        periodKey: currentPeriodKey,
        allocations: newAllocations,
        userId: user.uid
      });
    }
  };

  const addWaterPurchase = () => {
    const members = Object.keys(currentMonthBudgets).length > 0 
      ? Object.keys(currentMonthBudgets) 
      : FAMILY_MEMBERS_INITIAL;
    if (members.length === 0) return;
    
    // Determine whose turn it is
    let nextComprador = "";
    if (manualWaterTurn) {
       nextComprador = manualWaterTurn;
    } else {
       const lastPurchase = waterRecords[0];
       let nextIndex = 0;
       if (lastPurchase) {
          const lastIndex = members.indexOf(lastPurchase.comprador);
          nextIndex = (lastIndex + 1) % members.length;
       }
       nextComprador = members[nextIndex];
    }

    const newPurchase: WaterPurchase = {
      id: Date.now().toString(),
      fecha: new Date().toISOString().split('T')[0],
      comprador: nextComprador,
      cantidad: parseInt(newWaterQty) || 1,
      precioTotal: parseInt(newWaterPrice) || 3000
    };

    setWaterRecords([newPurchase, ...waterRecords]);
    if (user) {
      addDoc(collection(db, "users", user.uid, "waterRecords"), { ...newPurchase, userId: user.uid });
    }
    setManualWaterTurn(null);
  };

  const syncWaterRecordToDashboard = async (record: WaterPurchase) => {
    const waterExpense: ReceiptData = {
      transaccion: {
        lugar: "Agua Mineral",
        fecha: record.fecha,
        comprador: record.comprador,
        pagador: record.comprador,
        total_final: record.precioTotal
      },
      productos: [{
        nombre: `Botellón de Agua x${record.cantidad}`,
        precio: record.precioTotal,
        cantidad: record.cantidad,
        precioUnitario: record.precioTotal / record.cantidad,
        categoria: "Otros",
        subcategoria: "Agua"
      }]
    };

    setExpenses([waterExpense, ...expenses]);
    if (user) {
      await addDoc(collection(db, "users", user.uid, "expenses"), { ...waterExpense, userId: user.uid, createdAt: serverTimestamp() });
    }
    alert("Gasto de agua sincronizado al Dashboard.");
  };

  const waterTurnInfo = useMemo(() => {
    const members = Object.keys(currentMonthBudgets).length > 0 
      ? Object.keys(currentMonthBudgets) 
      : FAMILY_MEMBERS_INITIAL;
    
    if (members.length === 0) return { last: "Nadie", next: "Nadie" };

    if (manualWaterTurn) {
      return { last: "Manual", next: manualWaterTurn };
    }

    const lastPurchase = waterRecords[0];
    if (!lastPurchase) return { last: "Nadie", next: members[0] };
    
    const lastIndex = members.indexOf(lastPurchase.comprador);
    const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % members.length;
    return {
      last: lastPurchase.comprador,
      next: members[nextIndex]
    };
  }, [waterRecords, currentMonthBudgets]);

  const saveExpense = (index: number) => {
    const result = pendingResults[index];
    if (!result) return;
    
    const sanitizedProds = result.data.productos.map(p => ({
      ...p,
      precio: sanitizePrice(p.precio),
      precioUnitario: sanitizePrice(p.precioUnitario),
      categoria: normalizeCategory(p.categoria)
    }));
    const itemsSum = sanitizedProds.reduce((sum, p) => sum + p.precio, 0);
    const finalResult: ReceiptData = {
      id: crypto.randomUUID(),
      ...result.data,
      transaccion: {
        ...result.data.transaccion,
        comprador: result.comprador, 
        pagador: result.pagador,
        total_final: itemsSum
      },
      productos: sanitizedProds
    };

    setExpenses(prev => [finalResult, ...prev]);
    if (user) {
      addDoc(collection(db, "users", user.uid, "expenses"), { ...finalResult, userId: user.uid, createdAt: serverTimestamp() });
    }

    // [Senior Persistence] Update local storage explicitly
    if (typeof window !== 'undefined') {
      const currentLocal = JSON.parse(localStorage.getItem('gastro_genie_expenses_v2') || '[]');
      localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify([finalResult, ...currentLocal]));
    }

    const d = robustDateParse(finalResult.transaccion.fecha);
    if (d) {
      setSelectedMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
    }

    // Update Contributions
    setContributions(prev => {
      const foundIdx = prev.findIndex(c => c.name === result.pagador);
      if (foundIdx !== -1) {
        return prev.map((c, i) => i === foundIdx ? { ...c, amount: c.amount + itemsSum } : c);
      } else {
        return [...prev, { name: result.pagador, amount: itemsSum, color: COLORS[prev.length % COLORS.length] }];
      }
    });

    // Remove from pending
    const remainingResults = pendingResults.filter((_, i) => i !== index);
    setPendingResults(remainingResults);
    
    if (remainingResults.length === 0) {
       setFiles([]);
       setPreviews([]);
       setView("home");
       alert("✅ Gasto guardado exitosamente");
    }
  };

  const saveAllExpenses = () => {
    const total = pendingResults.length;
    if (total === 0) return;

    const newExpenses = pendingResults.map(res => {
       const sanitizedProds = res.data.productos.map(p => ({
        ...p,
        precio: sanitizePrice(p.precio),
        precioUnitario: sanitizePrice(p.precioUnitario),
        categoria: normalizeCategory(p.categoria)
      }));
      const itemsSum = sanitizedProds.reduce((sum, p) => sum + p.precio, 0);
      return {
        id: crypto.randomUUID(),
        ...res.data,
        transaccion: {
          ...res.data.transaccion,
          comprador: res.comprador, 
          pagador: res.pagador,
          total_final: itemsSum
        },
        productos: sanitizedProds,
        itemsSum
      };
    });

    setExpenses(prev => [...newExpenses.map(({itemsSum, ...rest}) => rest as ReceiptData), ...prev]);
    
    if (user) {
      const batch = writeBatch(db);
      newExpenses.forEach(exp => {
        const {itemsSum, ...rest} = exp;
        const ref = doc(collection(db, "users", user.uid, "expenses"));
        batch.set(ref, { ...rest, userId: user.uid, createdAt: serverTimestamp() });
      });
      batch.commit().catch(e => console.error("Batch save error:", e));
    }

    if (typeof window !== 'undefined') {
      const currentLocal = JSON.parse(localStorage.getItem('gastro_genie_expenses_v2') || '[]');
      localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify([...newExpenses.map(({itemsSum, ...rest}) => rest), ...currentLocal]));
    }

    setContributions(prev => {
      let nextContribs = [...prev];
      newExpenses.forEach(exp => {
        const foundIdx = nextContribs.findIndex(c => c.name === exp.transaccion.pagador);
        if (foundIdx !== -1) {
          nextContribs[foundIdx] = { ...nextContribs[foundIdx], amount: nextContribs[foundIdx].amount + exp.itemsSum };
        } else {
          nextContribs.push({ name: exp.transaccion.pagador, amount: exp.itemsSum, color: COLORS[nextContribs.length % COLORS.length] });
        }
      });
      return nextContribs;
    });

    setPendingResults([]);
    setFiles([]);
    setPreviews([]);
    setView("home");
    alert(`✅ ${total} gastos guardados exitosamente`);
  };

  const formatDateLabel = (date: string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    } catch {
      return date;
    }
  };

  const exportDataToExcel = () => {
    // 1. Gastos Sheet
    const flattenedExpenses = expenses.flatMap(exp => 
      exp.productos.map(p => ({
        Fecha: exp.transaccion.fecha,
        Lugar: exp.transaccion.lugar,
        Comprador: exp.transaccion.comprador,
        Pagador: exp.transaccion.pagador || exp.transaccion.comprador,
        Producto: p.nombre,
        Cantidad: p.cantidad,
        'Unitario': p.precioUnitario,
        'Total': p.precio,
        'Categoría': p.categoria,
        'Subcategoría': p.subcategoria || ''
      }))
    );
    const wsExpenses = XLSX.utils.json_to_sheet(flattenedExpenses);

    // 2. Presupuestos Sheet
    const flatBudget: any[] = [];
    Object.entries(budgetData).forEach(([period, members]) => {
      Object.entries(members).forEach(([name, budget]) => {
        flatBudget.push({ Periodo: period, Nombre: name, Presupuesto: budget });
      });
    });
    const wsBudget = XLSX.utils.json_to_sheet(flatBudget);

    // 3. Agua Sheet
    const wsWater = XLSX.utils.json_to_sheet(waterRecords);

    // 4. Configuración
    const flatConfig: any[] = [];
    Object.entries(subcategoryMappings).forEach(([cat, subs]) => {
      flatConfig.push({ Categoria: cat, Subcategorias: subs.join(', ') });
    });
    const wsConfig = XLSX.utils.json_to_sheet(flatConfig);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsExpenses, "Gastos");
    XLSX.utils.book_append_sheet(wb, wsBudget, "Presupuestos");
    XLSX.utils.book_append_sheet(wb, wsWater, "Agua");
    XLSX.utils.book_append_sheet(wb, wsConfig, "Configuracion");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `GastoGenie_Respaldo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const importDataFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });

      // Import Gastos
      const wsExpenses = wb.Sheets["Gastos"];
      if (wsExpenses) {
        const data: any[] = XLSX.utils.sheet_to_json(wsExpenses);
        if (Array.isArray(data)) {
          const grouped: Record<string, ReceiptData> = {};
          data.forEach(row => {
            if (!row || !row.Fecha || !row.Lugar) return; 
            const key = `${row.Fecha}_${row.Lugar}_${row.Comprador || 'U'}_${row.Pagador || 'P'}`;
            if (!grouped[key]) {
              grouped[key] = {
                id: crypto.randomUUID(),
                transaccion: {
                  fecha: String(row.Fecha),
                  lugar: String(row.Lugar),
                  comprador: String(row.Comprador || row.comprador || "Usuario"),
                  pagador: String(row.Pagador || row.pagador || row.Comprador || "Usuario"),
                  total_final: 0
                },
                productos: []
              };
            }
            const totalRow = parseFloat(row.Total || row.total || row.Precio || 0) || 0;
            grouped[key].productos.push({
              nombre: String(row.Producto || row.producto || row.Nombre || "Sin nombre"),
              cantidad: parseFloat(row.Cantidad || row.cantidad) || 1,
              precioUnitario: parseFloat(row.Unitario || row.unitario || 0) || 0,
              precio: totalRow,
              categoria: normalizeCategory(String(row.Categoría || row.categoria || "Otros")),
              subcategoria: (row.Subcategoría || row.subcategoria) ? String(row.Subcategoría || row.subcategoria).trim() : null
            });
            grouped[key].transaccion.total_final += totalRow;
          });
          
          setExpenses(prev => {
            const existing = Array.isArray(prev) ? prev : [];
            const existingKeys = new Set(existing.map(exp => 
              `${exp.transaccion.fecha}_${exp.transaccion.lugar}_${exp.transaccion.comprador}_${exp.transaccion.total_final}`
            ));
            const newOnes = Object.values(grouped).filter(exp => 
              !existingKeys.has(`${exp.transaccion.fecha}_${exp.transaccion.lugar}_${exp.transaccion.comprador}_${exp.transaccion.total_final}`)
            );
            const finalExpenses = [...newOnes, ...existing];
            localStorage.setItem('gastro_genie_expenses_v2', JSON.stringify(finalExpenses));
            return finalExpenses;
          });
        }
      }

      // Import Presupuestos
      const wsBudget = wb.Sheets["Presupuestos"];
      if (wsBudget) {
        const data: any[] = XLSX.utils.sheet_to_json(wsBudget);
        setBudgetData(prev => {
          const merged = { ...prev };
          data.forEach(row => {
            if (!merged[row.Periodo]) merged[row.Periodo] = {};
            // Prefer current budget if it exists, but user wants to "recover" info
            // If the user imports, we merge the members into the periods
            merged[row.Periodo][row.Nombre] = row.Presupuesto;
          });
          return merged;
        });
      }

      // Import Agua
      const wsWater = wb.Sheets["Agua"];
      if (wsWater) {
        const data: any[] = XLSX.utils.sheet_to_json(wsWater);
        setWaterRecords(prev => {
          const existingKeys = new Set(prev.map(r => `${r.fecha}_${r.comprador}_${r.cantidad}_${r.precioTotal}`));
          const newOnes = data.filter(r => !existingKeys.has(`${r.fecha}_${r.comprador}_${r.cantidad}_${r.precioTotal}`));
          return [...newOnes, ...prev];
        });
      }
      
      alert("✅ Datos combinados exitosamente");
      setView("home");
    };
    reader.readAsBinaryString(file);
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-bg-principal flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 relative">
             <ShoppingBag size={32} className="animate-bounce" />
             <div className="absolute inset-x-0 -bottom-8 flex justify-center">
                <Loader2 size={16} className="text-emerald-500 animate-spin" />
             </div>
          </div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] mt-8 animate-pulse text-center leading-relaxed">
            Sincronizando tu Inteligencia Financiera<br/>
            <span className="opacity-50">Por favor, espera...</span>
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center p-6 bg-bg-principal transition-colors duration-500", theme === "dark" && "dark")}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full card-bento p-10 text-center space-y-8 bg-bg-card shadow-2xl border-2 border-primary-theme/20"
        >
           <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 mx-auto transform -rotate-6">
              <ShoppingBag size={40} />
           </div>
           
           <div>
             <h1 className="text-4xl font-black text-text-main tracking-tighter">GastoGenie</h1>
             <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">Tu Asistente de Compras Inteligente</p>
           </div>

           <div className="space-y-4">
             <p className="text-sm text-text-secondary font-medium leading-relaxed">
               Para sincronizar tus gastos entre tu <span className="text-emerald-500 font-bold italic">iPhone</span> y tu <span className="text-emerald-500 font-bold italic">Laptop</span>, inicia sesión con tu cuenta de Google.
             </p>
             
             <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
               <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest leading-normal">
                 ✅ Sincronización en la Nube<br/>
                 ✅ Seguridad de Datos<br/>
                 ✅ Acceso Multi-dispositivo
               </p>
             </div>

             {loginError && (
               <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-tight">
                 {loginError}
               </div>
             )}
           </div>

           <button 
             onClick={handleGoogleLogin}
             disabled={isLoggingIn}
             className="w-full py-5 bg-text-main text-bg-principal rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoggingIn ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               <>
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                 </svg>
                 Ingresar con Google
               </>
             )}
           </button>

           <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tight opacity-50">
             Protegido por Seguridad de Nivel Bancario
           </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen", theme === "dark" ? "dark" : "")}>
      <div className="min-h-screen bg-bg-principal text-text-main font-sans transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-card border-b border-border-color w-full h-24 flex items-center px-4 md:px-8 justify-between gap-4 shadow-sm">
        <div className="flex flex-col items-center group relative cursor-help flex-shrink-0 min-w-[80px]">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all duration-300">
            <ShoppingBag size={22} />
          </div>
          <h1 className="text-[10px] font-black tracking-widest text-text-main mt-1 leading-none uppercase">GASTOGENIE</h1>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-max bg-slate-900 text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 border border-slate-700 shadow-2xl text-center">
            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Intelligence Layer</div>
            <div className="text-[10px] font-bold text-slate-100">Developed by Cristian Duran</div>
            <div className="mt-1 text-[8px] text-slate-400 font-medium">Data Extraction Intelligence</div>
          </div>
        </div>

        <nav className="flex flex-1 justify-center items-center gap-0.5 md:gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: "home", label: "Dashboard" },
            { id: "budget", label: "Presupuesto" },
            { id: "water", label: "Agua" },
            { id: "shifts", label: "Turnos" },
            { id: "inflation", label: "Inflación" },
            { id: "categories", label: "Categorías" },
            { id: "backup", label: "Respaldo" }
          ].map((nav) => (
            <button 
              key={nav.id}
              onClick={() => setView(nav.id as any)} 
              className={cn(
                "px-2.5 md:px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative group flex-shrink-0",
                view === nav.id ? "text-primary-theme bg-primary-theme/10" : "text-text-secondary hover:text-text-main hover:bg-bg-principal"
              )}
            >
              {nav.label}
              {view === nav.id && (
                <motion.div layoutId="nav-pill" className="absolute inset-0 border-2 border-primary-theme/20 bg-primary-theme/5 rounded-xl -z-10" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-10 h-10 rounded-xl bg-bg-principal border border-border-color flex items-center justify-center text-text-secondary hover:text-primary-theme hover:border-primary-theme transition-all"
            title="Cambiar Tema"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="h-8 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
          <div className="flex items-center gap-3 pl-1 group relative">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] font-black text-text-main leading-tight truncate max-w-[120px]">{user?.displayName || selectedPurchaser}</span>
              <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60">Sincronizado</span>
            </div>
            <button 
              onClick={() => { if(confirm("¿Cerrar sesión?")) signOut(auth); }}
              className="w-10 h-10 rounded-xl bg-bg-principal border border-border-color flex items-center justify-center text-text-secondary hover:text-red-500 hover:border-red-500/20 transition-all relative group/logout"
              title="Cerrar Sesión"
            >
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-7 h-7 rounded-lg group-hover:opacity-20 transition-opacity" />
               ) : (
                 <LayoutGrid size={18} className="group-hover:opacity-20 transition-opacity" />
               )}
               <X size={14} className="absolute opacity-0 group-hover/logout:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        {view === "home" ? (
          <div className="space-y-6">
            {/* Top Period Selector */}
            <div className="flex justify-between items-center bg-bg-card p-4 rounded-2xl border border-border-color shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="text-xs font-black text-text-secondary uppercase tracking-widest px-2">Análisis de Período</div>
                  <button 
                    onClick={clearAllData}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase"
                  >
                    <Trash2 size={14} /> Eliminar Todo
                  </button>
               </div>
               <div className="flex gap-2">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-bg-principal border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors"
                  >
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select 
                     value={selectedYear} 
                     onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                     className="bg-bg-principal border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            {/* Top Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
                <div className="md:col-span-1 border-r border-border-color pr-4">
                  <div className="card-label-bento">Gasto Total ({MONTHS[selectedMonth]})</div>
                  <div className="mt-auto">
                    <div className="text-3xl font-black text-text-main">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(totalSpent)}</div>
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold mt-1">
                      <TrendingUp size={12} />
                      <span>Calculado por IA</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pl-4">
                  <div className="card-label-bento">Aportes Familiares ({MONTHS[selectedMonth]})</div>
                  <div className="mt-auto space-y-4">
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-bg-principal">
                      {monthlyContributions.map((c, i) => (
                        <div key={i} className="h-full transition-all duration-1000" style={{ width: `${(c.amount / (totalSpent || 1)) * 100}%`, backgroundColor: c.color }} />
                      ))}
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {monthlyContributions.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-[10px] font-black uppercase text-text-secondary">{c.name}: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Category Pie */}
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="card-bento lg:col-span-4 h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="card-label-bento mb-0">Gasto por Categoría</div>
                  <div className="flex bg-bg-principal rounded-lg p-1 gap-1">
                    <button 
                      onClick={() => setChartType("donut")} 
                      className={cn("p-1 rounded transition-all", chartType === "donut" ? "bg-bg-card shadow-sm text-primary-theme" : "text-text-secondary")}
                    >
                      <PieChartIcon size={12} />
                    </button>
                    <button 
                      onClick={() => setChartType("pie")} 
                      className={cn("p-1 rounded transition-all", chartType === "pie" ? "bg-bg-card shadow-sm text-primary-theme" : "text-text-secondary")}
                    >
                      <Droplets size={12} />
                    </button>
                    <button 
                      onClick={() => setChartType("bar")} 
                      className={cn("p-1 rounded transition-all", chartType === "bar" ? "bg-bg-card shadow-sm text-primary-theme" : "text-text-secondary")}
                    >
                      <BarChart3 size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[300px] relative overflow-hidden" style={{ height: '300px' }}>
                  <div className="absolute inset-0 w-full h-full">
                    <ResponsiveContainer width="99%" height={280} minWidth={100} minHeight={200}>
                    {chartType === "bar" ? (
                      <BarChart data={categoryStats} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Tooltip formatter={(val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP'}).format(val)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryStats.map((entry, index) => {
                             const colorIndex = categories.indexOf(entry.name as MainCategory);
                             const fill = colorIndex >= 0 ? COLORS[colorIndex % COLORS.length] : "#94a3b8";
                             return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie 
                          data={categoryStats} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={chartType === "donut" ? 50 : 0} 
                          outerRadius={70} 
                          paddingAngle={2} 
                          dataKey="value"
                        >
                          {categoryStats.map((entry, index) => {
                            const colorIndex = categories.indexOf(entry.name as MainCategory);
                            const fill = colorIndex >= 0 ? COLORS[colorIndex % COLORS.length] : "#94a3b8";
                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                        </Pie>
                        <Tooltip formatter={(val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP'}).format(val)} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

              {/* Recent Table */}
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="card-bento lg:col-span-8 px-0 py-0 overflow-hidden">
                  <div className="p-5 border-b border-border-color shadow-sm transition-colors">
                  <div className="card-label-bento mb-0 text-text-main">Transacciones Extraídas</div>
                  <button className="text-[10px] font-bold text-primary-theme hover:underline px-3 py-1 bg-primary-theme/10 rounded-lg">Ver Historial</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-bg-principal">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Lugar & Comprador</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Fecha</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-right">Total</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 dark:divide-slate-800">
                      {expenses.map((exp, i) => (
                        <tr 
                          key={i} 
                          onClick={() => setSelectedTransactionDetails(exp)}
                          className="hover:bg-bg-principal transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3">
                            <div className="font-bold text-sm text-text-main truncate max-w-[150px]">{exp.transaccion.lugar}</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 rounded-full bg-primary-theme/10 flex items-center justify-center text-[8px] font-black text-primary-theme border border-primary-theme/20">
                                {exp.transaccion.comprador[0]}
                              </div>
                              <span className="text-[10px] text-text-secondary font-bold uppercase tracking-tight">{exp.transaccion.comprador}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-semibold text-text-main tabular-nums">{exp.transaccion.fecha}</td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-sm text-text-main">
                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(exp.transaccion.total_final)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <ChevronRight size={14} className="text-text-secondary group-hover:text-primary-theme transition-colors" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* Detailed Category Cards (Alimentos Breakdown) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat, idx) => {
                      const trimmedCat = cat.trim();
                      const catValue = categoryStats.find(s => s.name === trimmedCat)?.value || 0;
                      if (catValue === 0) return null;
                      return (
                        <motion.div 
                          key={cat} 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: 0.1 * idx }} 
                          className="card-bento cursor-pointer hover:ring-2 hover:ring-emerald-500/20 transition-all"
                          onClick={() => setSelectedCategoryDetails(cat)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="card-label-bento mb-0" style={{ color: COLORS[idx % COLORS.length] }}>{cat}</div>
                            <div className="flex flex-col items-end gap-1">
                               <div className="text-lg font-black text-text-main">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(catValue)}</div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); clearCategoryExpenses(cat); }}
                                 className="text-[8px] font-black uppercase text-red-500 hover:underline flex items-center gap-1"
                               >
                                 <Trash2 size={10} /> Borrar Historial
                               </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                             {(subcategoryMappings[cat] || []).map(sub => {
                               const trimmedCat = cat.trim();
                               const trimmedSub = sub.trim();
                                const subTotal = filteredExpenses.reduce((acc, exp) => {
                                 const itemSum = exp.productos
                                   .filter(p => {
                                      const pCat = normalizeCategory(p.categoria || "Otros");
                                      const pSub = (p.subcategoria || "").trim();
                                      
                                      // If calculating for "Sin clasificar" or miscellaneous, we catch-all the items with no subcat
                                      if (trimmedSub === "Sin subcat." || trimmedSub === "Sin clasificar") {
                                        return pCat === trimmedCat && !pSub;
                                      }
                                      
                                      return pCat === trimmedCat && pSub === trimmedSub;
                                   })
                                   .reduce((ps, p) => ps + (parseFloat(p.precio as any) || 0), 0);
                                 return acc + itemSum;
                               }, 0);
                               if (subTotal === 0) return null;
                               return (
                                 <div 
                                   key={sub} 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setSelectedSubcategoryDetails(sub);
                                   }}
                                   className="flex justify-between items-center text-[10px] font-bold py-1 border-t border-border-color hover:bg-bg-principal transition-colors"
                                 >
                                   <span className="text-text-secondary uppercase">{sub}</span>
                                   <div className="flex items-center gap-1">
                                     <span className="text-text-main">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(subTotal)}</span>
                                     <ChevronRight size={10} className="text-text-secondary" />
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                          
                          <div className="mt-4 h-1 w-full bg-bg-principal rounded-full overflow-hidden">
                            <div className="h-full" style={{ backgroundColor: COLORS[idx % COLORS.length], width: `${(catValue / (totalSpent || 1)) * 100}%` }} />
                          </div>
                          <div className="mt-2 text-[8px] font-black uppercase text-text-secondary tracking-tighter flex items-center gap-1">
                            Click para ver detalles <ChevronRight size={10} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

          </div>
        ) : view === "budget" ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-emerald-600 uppercase tracking-tight mb-2">
                  <ArrowLeft size={16} /> Dashboard
                </button>
                <h2 className="text-2xl font-black text-text-main">Presupuesto Mensual</h2>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-bg-card border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors shadow-sm"
                >
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                   className="bg-bg-card border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors shadow-sm"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-bento bg-primary-theme/10 border-primary-theme/20 shadow-none">
               <div className="flex flex-col md:flex-row items-center gap-4">
                     <div className="flex-1 w-full">
                       <input 
                         type="text" 
                         placeholder="Nombre del integrante" 
                         value={newMemberName}
                         onChange={(e) => setNewMemberName(e.target.value)}
                         className="w-full bg-bg-principal border border-border-color rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-theme text-text-main placeholder:text-text-secondary/60"
                       />
                     </div>
                     <div className="flex-1 w-full">
                       <input 
                         type="number" 
                         placeholder="Monto Mensual (CLP)" 
                         value={newMemberBudget}
                         onChange={(e) => setNewMemberBudget(e.target.value)}
                         className="w-full bg-bg-principal border border-border-color rounded-xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-theme text-text-main placeholder:text-text-secondary/60"
                       />
                     </div>
                  <button 
                    onClick={addBudgetMember}
                    className="w-full md:w-auto px-8 py-3 bg-primary-theme text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Añadir Integrante
                  </button>
               </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(currentMonthBudgets).map(([member, assigned], i) => {
                // Calculate spent ONLY for the selected month/year
                const spentInMonth = expenses
                  .filter(exp => {
                    const d = new Date(exp.transaccion.fecha);
                    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && exp.transaccion.comprador === member;
                  })
                  .reduce((sum, exp) => sum + exp.transaccion.total_final, 0);

                const percentage = (spentInMonth / assigned) * 100;
                const remaining = assigned - spentInMonth;

                return (
                  <motion.div 
                    key={member}
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="card-bento bg-bg-card relative group cursor-pointer hover:border-primary-theme/50 transition-all"
                    onClick={() => setSelectedFamilyMemberDetails(member)}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBudgetMember(member);
                      }}
                      className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>

                <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {member[0]}
                        </div>
                        <div>
                          <div className="text-sm font-black text-text-main">{member}</div>
                          <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Asignado {MONTHS[selectedMonth]} {selectedYear}</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mt-auto">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                           <div className="text-2xl font-black text-primary-theme">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(assigned)}</div>
                           <div className="text-[10px] font-bold text-text-secondary">{percentage.toFixed(1)}% Usado</div>
                        </div>
                        <div className="h-2 w-full bg-bg-principal rounded-full overflow-hidden border border-border-color/50">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(percentage, 100)}%` }} 
                            className={cn("h-full", percentage > 90 ? "bg-danger-theme" : "bg-primary-theme")} 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-bg-principal p-3 rounded-2xl transition-colors border border-border-color/30">
                          <div className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1">Gastado</div>
                          <div className="text-xs font-black text-text-main">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(spentInMonth)}</div>
                        </div>
                        <div className="bg-bg-principal p-3 rounded-2xl transition-colors border border-border-color/30">
                          <div className="text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1">Restante</div>
                          <div className="text-xs font-black text-primary-theme">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(remaining)}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: 0.5 }}
                className="card-bento bg-bg-card border-border-color"
              >
                  <div className="card-label-bento text-primary-theme">Resumen del Mes</div>
                  <div className="mt-4 space-y-6">
                    <div>
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Presupuesto Total Casa ({MONTHS[selectedMonth]})</div>
                      <div className="text-3xl font-black text-text-main">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Object.values(currentMonthBudgets).reduce((a, b) => a + b, 0))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Gastado Real Mes</div>
                      <div className="text-xl font-black text-primary-theme">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                          filteredExpenses.reduce((sum, exp) => sum + exp.transaccion.total_final, 0)
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-bg-principal rounded-full overflow-hidden border border-border-color/30">
                       <div 
                         className="h-full bg-primary-theme" 
                         style={{ 
                           width: `${Math.min((filteredExpenses.reduce((s, e) => s + e.transaccion.total_final, 0) / (Object.values(currentMonthBudgets).reduce((a, b) => a + b, 0) || 1)) * 100, 100)}%` 
                         }} 
                       />
                    </div>
                  </div>
              </motion.div>
            </div>

            {/* Category Management Removed and moved to dedicated tab */}
          </div>
        ) : view === "categories" ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-text-main tracking-tight">Categorías & Productos</h2>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-text-secondary font-medium tracking-tight uppercase text-[10px] font-black">Gestiona la clasificación y revisa los gastos acumulados</p>
                  <button 
                    onClick={clearAllCategories}
                    className="text-red-500 hover:underline text-[9px] font-black uppercase flex items-center gap-1"
                  >
                    <RefreshCcw size={10} /> Restablecer Categorías
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-2">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-bg-card border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors shadow-sm"
                  >
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select 
                     value={selectedYear} 
                     onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                     className="bg-bg-card border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-secondary outline-none hover:border-primary-theme transition-colors shadow-sm"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nueva categoría..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-bg-card border border-border-color rounded-2xl px-5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-theme text-text-main transition-all min-w-[200px]"
                  />
                  <button 
                    onClick={() => { addCategory(newCategoryName); setNewCategoryName(""); }}
                    className="px-6 py-2.5 bg-primary-theme text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Añadir
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => {
                const trimmedCat = cat.trim();
                const catValue = categoryStats.find(s => s.name === trimmedCat)?.value || 0;
                return (
                  <motion.div 
                    key={cat}
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className="card-bento p-6 flex flex-col group hover:border-primary-theme/40 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedCategoryDetails(cat)}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-3 bg-bg-principal rounded-2xl flex items-center justify-center text-primary-theme group-hover:bg-primary-theme group-hover:text-white transition-colors duration-500">
                          <Grid size={22} />
                        </div>
                        <input 
                          type="text" 
                          value={cat}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => renameCategory(cat, e.target.value)}
                          className="bg-transparent border-none font-black text-xl text-text-main outline-none focus:bg-bg-principal rounded-xl px-2 py-1 w-full transition-all"
                        />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); clearCategoryExpenses(cat); }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Borrar todos los gastos de esta categoría"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-auto">
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1 opacity-60">Gasto Total</div>
                      <div className="text-2xl font-black text-primary-theme">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(catValue)}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-color/50 flex items-center justify-between">
                       <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Revisar Detalle</span>
                       <div className="w-8 h-8 rounded-full bg-bg-principal flex items-center justify-center text-text-secondary group-hover:bg-primary-theme group-hover:text-white transition-all transform group-hover:translate-x-1">
                          <ChevronRight size={16} />
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-16 bg-bg-card border border-border-color rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main">Gestión de Subcategorías</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Para la categoría:</span>
                      <select 
                        value={selectedCategoryForSub}
                        onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                        className="bg-bg-principal border border-border-color rounded-lg px-2 py-0.5 text-[10px] font-black text-emerald-600 uppercase tracking-tight outline-none"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nueva subcategoría..." 
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    className="bg-bg-principal border border-border-color rounded-xl px-5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-text-main transition-all min-w-[180px]"
                  />
                  <button 
                    onClick={() => { addSubcategory(selectedCategoryForSub, newSubcategoryName); setNewSubcategoryName(""); }}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Añadir
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(subcategoryMappings[selectedCategoryForSub] || []).map((sub, i) => (
                  <motion.div 
                    key={sub}
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-bg-principal border border-border-color/50 px-5 py-4 rounded-2xl group hover:border-emerald-500 transition-all cursor-pointer flex justify-between items-center"
                    onClick={() => setSelectedSubcategoryDetails(sub)}
                  >
                    <input 
                      type="text" 
                      value={sub}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => renameSubcategory(selectedCategoryForSub, sub, e.target.value)}
                      className="bg-transparent border-none focus:ring-0 focus:outline-none focus:border-none font-bold text-sm text-text-main outline-none w-full"
                    />
                    <ChevronRight size={14} className="text-text-secondary group-hover:text-emerald-500 transition-colors" />
                  </motion.div>
                ))}
                {(subcategoryMappings[selectedCategoryForSub] || []).length === 0 && (
                  <div className="col-span-full py-12 text-center border-2 border-dashed border-border-color rounded-3xl">
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">No hay subcategorías definidas para {selectedCategoryForSub}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : view === "manual" ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-primary-theme uppercase tracking-tight">
              <ArrowLeft size={16} /> Volver
            </button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-bento space-y-8">
              <div className="pb-6 border-b border-border-color flex items-center gap-4">
                <div className="p-3 bg-primary-theme/10 text-primary-theme rounded-2xl">
                  <Wallet size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-text-main">Añadir Gasto Manual</h2>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-tight">Ventas locales, ferias o tiendas sin boleta</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Nombre de la Tienda / Lugar</label>
                    <input 
                       type="text" 
                       placeholder="Ej: Feria Libre, Panadería..."
                       className="w-full bg-bg-principal border border-border-color rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-theme text-text-main"
                       value={manualExpense.lugar}
                       onChange={(e) => setManualExpense({...manualExpense, lugar: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Fecha</label>
                    <input 
                       type="date" 
                       className="w-full bg-bg-principal border border-border-color rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-theme text-text-main"
                       value={manualExpense.fecha}
                       onChange={(e) => setManualExpense({...manualExpense, fecha: e.target.value})}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">¿Quién realizó la compra?</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(currentMonthBudgets).length > 0 ? Object.keys(currentMonthBudgets) : FAMILY_MEMBERS_INITIAL).map(member => (
                      <button 
                        key={member}
                        onClick={() => setManualExpense({...manualExpense, comprador: member})}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2",
                          manualExpense.comprador === member 
                            ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" 
                            : "bg-bg-card border-border-color text-text-secondary hover:border-blue-500/50"
                        )}
                      >
                        {member}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">¿Quién puso el dinero?</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(currentMonthBudgets).length > 0 ? Object.keys(currentMonthBudgets) : FAMILY_MEMBERS_INITIAL).map(member => (
                      <button 
                        key={member}
                        onClick={() => setManualExpense({...manualExpense, pagador: member})}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2",
                          manualExpense.pagador === member 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                            : "bg-bg-card border-border-color text-text-secondary hover:border-emerald-500/50"
                        )}
                      >
                        {member}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Productos o Items</label>
                    <button onClick={addManualItem} className="text-[10px] font-black text-primary-theme uppercase flex items-center gap-1 hover:underline">
                      <Plus size={14} /> Añadir Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {manualExpense.items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-bg-principal p-4 rounded-3xl relative border border-border-color transition-colors shadow-sm">
                        <div className="md:col-span-4">
                           <input 
                              type="text" 
                              placeholder="Producto" 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm text-text-main placeholder:text-text-secondary/40"
                              value={item.nombre}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].nombre = e.target.value;
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           />
                        </div>
                        <div className="md:col-span-1">
                           <input 
                              type="number" 
                              placeholder="Cant" 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-2 py-2.5 text-xs font-bold shadow-sm text-text-main text-center placeholder:text-text-secondary/40"
                              value={item.cantidad}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].cantidad = e.target.value;
                                if (newItems[idx].precioUnitario) {
                                  newItems[idx].precio = (parseFloat(e.target.value) * parseFloat(newItems[idx].precioUnitario)).toString();
                                }
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           />
                        </div>
                        <div className="md:col-span-2">
                           <input 
                              type="number" 
                              placeholder="Unitario" 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-3 py-2.5 text-xs font-bold shadow-sm text-text-main placeholder:text-text-secondary/40"
                              value={item.precioUnitario}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].precioUnitario = e.target.value;
                                if (newItems[idx].cantidad) {
                                  newItems[idx].precio = (parseFloat(newItems[idx].cantidad) * parseFloat(e.target.value)).toString();
                                }
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           />
                        </div>
                        <div className="md:col-span-2">
                           <input 
                              type="number" 
                              placeholder="Total" 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm text-primary-theme placeholder:text-text-secondary/40"
                              value={item.precio}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].precio = e.target.value;
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           />
                        </div>
                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                           <select 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-tighter shadow-sm text-text-secondary"
                              value={item.categoria}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].categoria = e.target.value as MainCategory;
                                // Reset subcategory if not available in new category
                                const availableSubs = subcategoryMappings[e.target.value] || [];
                                newItems[idx].subcategoria = availableSubs.length > 0 ? availableSubs[0] : null;
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           >
                              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                           </select>

                           <select 
                              className="w-full bg-bg-card border border-border-color rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-tighter shadow-sm text-primary-theme"
                              value={item.subcategoria || ""}
                              onChange={(e) => {
                                const newItems = [...manualExpense.items];
                                newItems[idx].subcategoria = e.target.value || null;
                                setManualExpense({...manualExpense, items: newItems});
                              }}
                           >
                              <option value="">Sin subcategoría</option>
                              {(subcategoryMappings[item.categoria] || []).map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                           </select>
                        </div>
                        {manualExpense.items.length > 1 && (
                          <button 
                            onClick={() => {
                              const newItems = manualExpense.items.filter((_, i) => i !== idx);
                              setManualExpense({...manualExpense, items: newItems});
                            }}
                            className="absolute -top-2 -right-2 p-1.5 bg-bg-card border border-border-color text-red-500 rounded-full shadow-md hover:bg-danger-theme/10 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-neutral-100">
                 <button 
                   onClick={saveManualExpense}
                   className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={24} /> Guardar Gasto
                 </button>
              </div>
            </motion.div>
          </div>
        ) : view === "shifts" ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-emerald-600 uppercase tracking-tight mb-2">
                  <ArrowLeft size={16} /> Dashboard
                </button>
                <h2 className="text-2xl font-black text-text-main leading-none">Turno de Compras</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-1 space-y-6">
                  {/* Shopping Turn Info */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-bento p-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                           <ShoppingBag size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Próxima Salida</div>
                           <div className="text-2xl font-black leading-none text-text-main flex items-center gap-2">
                              {(() => {
                                const autoName = (() => {
                                  const members = Object.keys(currentMonthBudgets).length > 0 
                                    ? Object.keys(currentMonthBudgets) 
                                    : FAMILY_MEMBERS_INITIAL;
                                  if (members.length === 0) return "Nadie";
                                  // Filtrar agua mineral de los turnos de compras
                                  const relevantExpenses = expenses.filter(exp => exp.transaccion.lugar !== "Agua Mineral");
                                  const lastExp = relevantExpenses[0];
                                  if (!lastExp) return members[0];
                                  const lastIndex = members.indexOf(lastExp.transaccion.comprador);
                                  return lastIndex === -1 ? members[0] : members[(lastIndex + 1) % members.length];
                                })();

                                return (
                                  <TurnSelector 
                                    current={manualShoppingTurn}
                                    onSelect={setManualShoppingTurn}
                                    members={Object.keys(currentMonthBudgets).length > 0 ? Object.keys(currentMonthBudgets) : FAMILY_MEMBERS_INITIAL}
                                    autoName={autoName}
                                    accentColor="blue"
                                  />
                                );
                              })()}
                           </div>
                        </div>
                     </div>
                      <div className="p-4 bg-bg-principal border border-border-color rounded-2xl">
                         <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Total de Salidas</div>
                         <div className="text-3xl font-black leading-none text-text-main">{expenses.length}</div>
                      </div>
                  </motion.div>

                  <div className="card-bento">
                    <div className="card-label-bento">¿Cómo funciona?</div>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      El sistema asigna turnos rotativos basados en la última compra registrada en el sistema, ya sea manual o mediante escaneo de boleta.
                    </p>
                  </div>
               </div>

               <div className="lg:col-span-2">
                  <div className="card-bento h-full px-0 py-0 overflow-hidden">
                     <div className="p-6 border-b border-border-color">
                        <div className="card-label-bento mb-1">Historial de Salidas</div>
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Registro de personas y lugares visitados</div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-bg-principal">
                              <tr>
                                 <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-center">Persona</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-left">Lugar Visitado</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-left">Fecha</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-center">Acción</th>
                              </tr>
                           </thead>
                           <tbody 
                             className="divide-y divide-neutral-50 dark:divide-slate-800"
                             onClick={(e) => {
                               const btn = (e.target as HTMLElement).closest('button[data-delete-expense-id]');
                               if (btn) {
                                 e.stopPropagation();
                                 const id = btn.getAttribute('data-delete-expense-id');
                                 if (id) deleteExpense(id);
                               }
                             }}
                           >
                              {expenses.filter(exp => exp.transaccion.lugar !== "Agua Mineral").map((exp) => (
                                 <tr key={exp.firestoreId || (exp as any).id || Math.random()} className="hover:bg-bg-principal transition-colors">
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col items-center">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shadow-sm mb-1">
                                             {exp.transaccion.comprador[0]}
                                          </div>
                                          <span className="text-[10px] font-bold text-text-secondary truncate max-w-[80px]">{exp.transaccion.comprador.split(' ')[0]}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                          <div className="p-2 bg-bg-principal rounded-lg">
                                             <Store size={14} className="text-text-secondary" />
                                          </div>
                                          <span className="text-sm font-bold text-text-main">{exp.transaccion.lugar}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-text-secondary tabular-nums">{formatDateLabel(exp.transaccion.fecha)}</td>
                                     <td className="px-6 py-4 text-center">
                                        <button 
                                          data-delete-expense-id={exp.firestoreId || (exp as any).id}
                                          className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                          title="Eliminar gasto"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                     </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : view === "inflation" ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-emerald-600 uppercase tracking-tight mb-2">
                  <ArrowLeft size={16} /> Dashboard
                </button>
                <h2 className="text-2xl font-black text-text-main leading-none">Análisis de Inflación / IPC</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-bento">
                  <div className="card-label-bento">Casos de IPC Directo</div>
                  <div className="mt-auto">
                    <div className="text-3xl font-black text-amber-600">{inflationStats.filter(s => s.status === "IPC").length}</div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Mismo lugar, mayor precio</p>
                  </div>
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-bento">
                  <div className="card-label-bento">Variación por Comercio</div>
                  <div className="mt-auto">
                    <div className="text-3xl font-black text-red-600">{inflationStats.filter(s => s.status === "MAS_CARO").length}</div>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Sitio más caro que el anterior</p>
                  </div>
               </motion.div>
            </div>

            <div className="card-bento px-0 py-0 overflow-hidden">
               <div className="p-6 border-b border-border-color">
                  <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Comparativa de Precios Histórica</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-bg-principal">
                        <tr>
                           <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-left">Producto</th>
                           <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-right">Anterior</th>
                           <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-right">Actual</th>
                           <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-center">Estado / Alerta</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-50 dark:divide-slate-800">
                        {inflationStats.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest italic">
                               Se necesitan al menos 2 compras del mismo producto para analizar
                            </td>
                          </tr>
                        ) : (
                          inflationStats.map((item, i) => (
                             <tr key={i} className="hover:bg-bg-principal transition-colors">
                                <td className="px-6 py-4">
                                   <div className="text-sm font-black text-text-main">{item.product}</div>
                                   <div className="text-[9px] text-text-secondary font-bold uppercase mt-1">Comercio actual: {item.currPlace}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="text-xs font-bold text-text-secondary line-through">
                                      {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.prevPrice)}
                                   </div>
                                   <div className="text-[8px] text-text-secondary font-bold uppercase mt-0.5">{item.prevPlace}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="text-sm font-black text-text-main">
                                      {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.currPrice)}
                                   </div>
                                   <div className="text-[9px] text-green-500 font-black">
                                      {(((item.currPrice - item.prevPrice) / item.prevPrice) * 100).toFixed(1)}%
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   {item.status === "IPC" ? (
                                      <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase rounded-full ring-1 ring-amber-600/20">Inflación / IPC</span>
                                   ) : item.status === "MAS_CARO" ? (
                                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase rounded-full ring-1 ring-red-600/20">Se compró en un sitio más caro</span>
                                   ) : item.status === "MAS_BARATO" ? (
                                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[9px] font-black uppercase rounded-full ring-1 ring-green-600/20">Ahorro / Oferta</span>
                                   ) : (
                                      <span className="px-3 py-1 bg-neutral-100 dark:bg-slate-700 text-neutral-400 dark:text-slate-400 text-[9px] font-black uppercase rounded-full">Sin Cambio</span>
                                   )}
                                </td>
                             </tr>
                          ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        ) : view === "water" ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-emerald-600 uppercase tracking-tight mb-2">
                  <ArrowLeft size={16} /> Dashboard
                </button>
                <h2 className="text-2xl font-black text-text-main leading-none">Control del Agua</h2>
              </div>
              <button 
                onClick={clearAllWater}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-200/50"
              >
                <Trash2 size={14} /> Eliminar Todos los Turnos
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-1 space-y-6">
                  {/* Turn Status Card */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-bento p-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                           <Droplets size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Próximo Turno</div>
                           <div className="text-2xl font-black leading-none text-text-main flex items-center gap-2">
                              <TurnSelector 
                                current={manualWaterTurn}
                                onSelect={setManualWaterTurn}
                                members={Object.keys(currentMonthBudgets).length > 0 ? Object.keys(currentMonthBudgets) : FAMILY_MEMBERS_INITIAL}
                                autoName={waterTurnInfo.next}
                                accentColor="emerald"
                              />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-800/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex justify-between items-center transition-colors">
                           <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Último Comprador</div>
                           <div className="text-xs font-black text-text-main">{waterTurnInfo.last}</div>
                        </div>
                        <div className="p-4 bg-bg-principal border border-border-color rounded-2xl text-text-main">
                           <div className="text-[10px] font-black text-text-secondary uppercase mb-2">Histórico Botellones</div>
                           <div className="text-3xl font-black leading-none">{waterRecords.reduce((a, b) => a + b.cantidad, 0)}</div>
                        </div>
                     </div>
                  </motion.div>

                  {/* Add Water Purchase */}
                  <div className="card-bento space-y-4">
                     <div className="card-label-bento">Nueva Compra de Agua</div>
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="text-[10px] font-black text-text-secondary uppercase px-1 mb-1 block">Cantidad</label>
                             <input 
                                type="number" 
                                value={newWaterQty}
                                onChange={(e) => setNewWaterQty(e.target.value)}
                                className="w-full bg-bg-principal border border-border-color rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-text-main" 
                             />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-text-secondary uppercase px-1 mb-1 block">Peso (CLP)</label>
                             <input 
                                type="number" 
                                value={newWaterPrice}
                                onChange={(e) => setNewWaterPrice(e.target.value)}
                                className="w-full bg-bg-principal border border-border-color rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-text-main" 
                             />
                          </div>
                        </div>
                        <button 
                           onClick={addWaterPurchase}
                           className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                           <Save size={18} /> Registrar y Pasar Turno
                        </button>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2">
                  <div className="card-bento h-full">
                     <div className="card-label-bento">Historial de Compras</div>
                     <div className="overflow-x-auto mt-4 scrollbar-thin scrollbar-thumb-border-color">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="border-b border-border-color">
                                 <th className="py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Fecha</th>
                                 <th className="py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Comprador</th>
                                 <th className="py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Cant.</th>
                                 <th className="py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Costo</th>
                                 <th className="py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Acción</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-neutral-50 dark:divide-slate-800">
                              {waterRecords.map((rec) => (
                                 <tr key={rec.id} className="hover:bg-bg-principal transition-colors">
                                    <td className="py-4 text-sm font-bold text-text-main">{formatDateLabel(rec.fecha)}</td>
                                    <td className="py-4">
                                       <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-black">
                                             {rec.comprador[0]}
                                          </div>
                                          <span className="text-xs font-bold text-text-secondary">{rec.comprador}</span>
                                       </div>
                                    </td>
                                    <td className="py-4 text-center text-xs font-black text-text-main">x{rec.cantidad}</td>
                                    <td className="py-4 text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                       {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(rec.precioTotal)}
                                    </td>
                                    <td className="py-4 text-center">
                                       <div className="flex items-center justify-center gap-1">
                                          <button 
                                            onClick={() => syncWaterRecordToDashboard(rec)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                            title="Sincronizar a Dashboard"
                                          >
                                            <TrendingUp size={16} />
                                          </button>
                                          <button 
                                            onClick={() => deleteWaterRecord((rec as any).firestoreId || rec.id)}
                                            className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                          >
                                            <Trash2 size={16} />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : view === "backup" ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-text-main tracking-tight">Respaldo de Datos</h2>
                <p className="text-sm text-text-secondary font-medium tracking-tight mt-1 uppercase text-[10px] font-black">Exporta e importa tu información en formato Excel e Imágenes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className="card-bento p-8 bg-gradient-to-br from-bg-card to-emerald-500/5 border-emerald-500/20"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                  <Download size={32} />
                </div>
                <h3 className="text-2xl font-black text-text-main mb-2">Exportar Excel</h3>
                <p className="text-sm text-text-secondary mb-8 font-medium leading-relaxed">
                  Descarga todos tus gastos, presupuestos, registros de agua y configuraciones en un solo archivo .xlsx.
                </p>
                <button 
                  onClick={exportDataToExcel}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"
                >
                  <Download size={18} /> Descargar Reporte
                </button>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="card-bento p-8 bg-gradient-to-br from-bg-card to-blue-500/5 border-blue-500/20"
              >
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/20">
                  <Database size={32} />
                </div>
                <h3 className="text-2xl font-black text-text-main mb-2">Recuperar Datos</h3>
                <p className="text-sm text-text-secondary mb-8 font-medium leading-relaxed">
                  Sube un archivo de respaldo (.xlsx) para recuperar tu información. El sistema combinará los datos.
                </p>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={importDataFromExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <button 
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                  >
                    <Upload size={18} /> Cargar Archivo
                  </button>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="card-bento p-8 bg-gradient-to-br from-bg-card to-purple-500/5 border-purple-500/20"
              >
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-purple-500/20">
                  <Database size={32} />
                </div>
                <h3 className="text-2xl font-black text-text-main mb-2">Configuración IA</h3>
                <p className="text-sm text-text-secondary mb-8 font-medium leading-relaxed">
                  Pega tu clave de Gemini API aquí para habilitar el escaneo inteligente. Se guardará solo en tu navegador.
                </p>
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="password"
                      value={userApiKey}
                      onChange={(e) => saveApiKey(e.target.value)}
                      placeholder="Pega tu API Key..."
                      className="w-full pl-4 pr-12 py-4 bg-bg-principal border-2 border-border-color rounded-2xl text-sm font-bold focus:border-purple-500 outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-500">
                      <Settings size={18} />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-secondary font-bold text-center uppercase tracking-wider">
                    {userApiKey ? "✅ Clave Guardada" : "⚠️ Sin configurar"}
                  </p>
                </div>
              </motion.div>

            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => setView("home")} className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-blue-600 uppercase tracking-tight">
              <ArrowLeft size={16} /> Volver al Dashboard
            </button>

            {pendingResults.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" multiple className="hidden" />
                <input type="file" ref={txtInputRef} onChange={handleFileChange} accept=".txt,text/plain" multiple className="hidden" />

                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="card-bento items-center py-16 text-center border-dashed border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-500/5 cursor-pointer hover:bg-emerald-50/20 dark:hover:bg-emerald-500/10 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="text-lg font-black text-text-main dark:text-slate-100 mt-6">Extracción de Boleta</h3>
                  <p className="text-xs text-text-secondary dark:text-slate-400 max-w-[200px] mx-auto mt-2">Sube imágenes (JPG, PNG) o PDFs. ¡Ahora puedes seleccionar varios!</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="card-bento items-center py-16 text-center border-dashed border-2 border-blue-200 dark:border-blue-900/50 bg-blue-50/10 dark:bg-blue-500/5 cursor-pointer hover:bg-blue-50/20 dark:hover:bg-blue-500/10 transition-all group"
                  onClick={() => txtInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                    <FileText size={28} />
                  </div>
                  <h3 className="text-lg font-black text-text-main dark:text-slate-100 mt-6">Extraer de Texto (TXT)</h3>
                  <p className="text-xs text-text-secondary dark:text-slate-400 max-w-[200px] mx-auto mt-2">Importa copias de texto. ¡Soporta selección múltiple!</p>
                </motion.div>
                
                {files.length > 0 && (
                  <div className="col-span-full mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bento divide-y divide-border-color p-0 overflow-hidden bg-bg-card border-2 border-emerald-500/20"
      >
        <div className="p-8 flex flex-col items-center bg-bg-principal/10">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {files.map((file, idx) => (
              <div key={idx} className="relative group">
                <div className="w-24 h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-md flex items-center justify-center ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all">
                  {file.type.startsWith("image/") ? (
                    <img src={previews[idx]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <FileText className="text-slate-400" size={32} />
                       <span className="text-[8px] font-bold text-slate-500 uppercase px-1 text-center truncate w-16">{file.name}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setFiles(prev => prev.filter((_, i) => i !== idx));
                    setPreviews(prev => prev.filter((_, i) => i !== idx));
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all z-10"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="px-4 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/30">
              {files.length} Archivos Listos
            </div>
            <p className="text-xs text-text-secondary dark:text-slate-400 mt-2 font-medium">Haz clic en el botón de abajo para iniciar el análisis con IA</p>
          </div>
        </div>

        <div className="p-8 bg-bg-card flex justify-center">
          <button 
            onClick={analyzeReceipt} 
            disabled={analyzing} 
            className="w-full max-w-xs py-4 bg-emerald-600 dark:bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            {analyzing ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Analizando {files.length} Boletas...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /> 
                <span>Procesar en Lote</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
                  </div>
                )}

                {error && (
                  <div className="col-span-full mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex justify-between items-center bg-bg-card p-6 rounded-3xl border border-border-color shadow-xl">
                   <div>
                      <h2 className="text-xl font-black text-text-main">Resultados del Análisis</h2>
                      <p className="text-xs text-text-secondary font-bold uppercase tracking-tight">{pendingResults.length} Boletas extraídas exitosamente</p>
                   </div>
                   <button onClick={saveAllExpenses} className="px-6 py-3 bg-primary-theme text-white rounded-2xl font-black text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2">
                     <Save size={18} /> Guardar Todo ({pendingResults.length})
                   </button>
                </div>

                {pendingResults.map((result, resIdx) => (
                  <motion.div 
                    key={resIdx}
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: resIdx * 0.1 }}
                    className="card-bento px-0 py-0 overflow-hidden ring-4 ring-primary-theme/5 hover:ring-primary-theme/20 transition-all border-none"
                  >
                    <div className="p-6 border-b border-border-color bg-bg-principal/50 backdrop-blur-md">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-16 bg-bg-principal border border-border-color rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
                              {files[result.fileIndex]?.type.startsWith("image/") ? (
                                <img src={previews[result.fileIndex]} className="w-full h-full object-cover" />
                              ) : <FileText className="text-slate-400" />}
                           </div>
                           <div className="flex flex-col gap-1">
                            <input 
                              className="text-lg font-black leading-none text-text-main bg-transparent border-b border-transparent focus:border-emerald-500 outline-none" 
                              value={result.data.transaccion.lugar}
                              onChange={(e) => {
                                const newResults = [...pendingResults];
                                newResults[resIdx].data.transaccion.lugar = e.target.value;
                                setPendingResults(newResults);
                              }}
                            />
                            <input 
                              type="date"
                              className="text-[10px] font-bold text-text-secondary dark:text-emerald-400 uppercase bg-transparent outline-none cursor-pointer" 
                              value={result.data.transaccion.fecha}
                              onChange={(e) => {
                                const newResults = [...pendingResults];
                                newResults[resIdx].data.transaccion.fecha = e.target.value;
                                setPendingResults(newResults);
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(result.data.transaccion.total_final)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-main uppercase tracking-widest">¿Quién realizó esta compra?</label>
                          <div className="flex flex-wrap gap-2">
                            {FAMILY_MEMBERS_FULL.map(member => (
                              <button 
                                key={member}
                                onClick={() => {
                                  const newRes = [...pendingResults];
                                  newRes[resIdx].comprador = member;
                                  setPendingResults(newRes);
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                                  result.comprador === member 
                                    ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" 
                                    : "bg-bg-principal border-border-color text-text-secondary hover:border-blue-500 transition-colors"
                                )}
                              >
                                {member}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-text-main uppercase tracking-widest">¿Quién puso el dinero?</label>
                          <div className="flex flex-wrap gap-2">
                            {FAMILY_MEMBERS_FULL.map(member => (
                              <button 
                                key={member}
                                onClick={() => {
                                  const newRes = [...pendingResults];
                                  newRes[resIdx].pagador = member;
                                  setPendingResults(newRes);
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-[10px] font-black transition-all border-2",
                                  result.pagador === member 
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                                    : "bg-bg-principal border-border-color text-text-secondary hover:border-emerald-500 transition-colors"
                                )}
                              >
                                {member}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left bg-bg-card">
                        <thead className="bg-bg-principal">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest">Producto</th>
                            <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-center">Clasificación</th>
                            <th className="px-6 py-4 text-[10px] font-black text-text-main uppercase tracking-widest text-right">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                          {result.data.productos.map((item, i) => (
                            <tr key={i} className="hover:bg-bg-principal transition-colors">
                              <td className="px-6 py-4">
                                <input 
                                  className="text-sm font-bold text-text-main bg-transparent border-b border-transparent focus:border-primary-theme outline-none w-full placeholder:text-text-secondary/30" 
                                  value={item.nombre}
                                  onChange={(e) => {
                                    const newResults = [...pendingResults];
                                    newResults[resIdx].data.productos[i].nombre = e.target.value;
                                    setPendingResults(newResults);
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                  <select 
                                    value={normalizeCategory(item.categoria)}
                                    onChange={(e) => {
                                      const newResults = [...pendingResults];
                                      newResults[resIdx].data.productos[i].categoria = normalizeCategory(e.target.value);
                                      setPendingResults(newResults);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-primary-theme/10 text-primary-theme text-[10px] font-black uppercase tracking-widest outline-none border border-border-color dark:border-primary-theme/20 cursor-pointer focus:ring-2 focus:ring-primary-theme/50 appearance-none"
                                  >
                                    {categories.map(cat => <option key={cat} value={cat} className="bg-bg-card text-text-main">{cat}</option>)}
                                  </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <input 
                                    type="number"
                                    className="w-24 px-2 py-1 bg-transparent border-b border-transparent focus:border-primary-theme font-mono text-sm font-black text-text-main text-right outline-none"
                                    value={item.precio}
                                    onChange={(e) => {
                                      const newResults = [...pendingResults];
                                      const newP = parseFloat(e.target.value) || 0;
                                      newResults[resIdx].data.productos[i].precio = newP;
                                      newResults[resIdx].data.transaccion.total_final = newResults[resIdx].data.productos.reduce((sum, p) => sum + p.precio, 0);
                                      setPendingResults(newResults);
                                    }}
                                  />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-6 bg-bg-principal border-t border-border-color flex gap-4">
                      <button 
                        onClick={() => setPendingResults(prev => prev.filter((_, i) => i !== resIdx))}
                        className="flex-1 py-4 bg-bg-card rounded-2xl font-black text-danger-theme border border-border-color hover:bg-danger-theme/5 transition-all uppercase tracking-widest text-[10px]"
                      >
                        Descartar
                      </button>
                      <button 
                        onClick={() => saveExpense(resIdx)}
                        className="flex-1 py-4 bg-primary-theme text-white rounded-2xl font-black shadow-xl shadow-primary-theme/20 hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                      >
                        <Save size={16} /> Guardar Este
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Detail moved outside of conditionals */}
        <AnimatePresence>
          {(selectedCategoryDetails || selectedSubcategoryDetails || selectedTransactionDetails || selectedFamilyMemberDetails) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => { 
                  setSelectedCategoryDetails(null); 
                  setSelectedSubcategoryDetails(null); 
                  setSelectedTransactionDetails(null); 
                  setSelectedFamilyMemberDetails(null);
                }} 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative w-full max-w-2xl bg-bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-border-color transition-colors"
              >
                <div className="p-6 border-b border-border-color flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-black text-primary-theme uppercase tracking-widest mb-1">
                      {activeTransaction ? "Detalle de Transacción" : selectedFamilyMemberDetails ? "Gastos por Integrante" : "Desglose de Gastos"}
                    </div>
                    <h3 className="text-xl font-black text-text-main">
                      {activeTransaction ? activeTransaction.transaccion.lugar : selectedFamilyMemberDetails || (selectedCategoryDetails || selectedSubcategoryDetails)}
                    </h3>
                    {activeTransaction && (
                      <div className="text-[10px] text-text-secondary font-bold uppercase mt-1">
                        {formatDateLabel(activeTransaction.transaccion.fecha)} • {activeTransaction.transaccion.comprador}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { 
                    setSelectedCategoryDetails(null); 
                    setSelectedSubcategoryDetails(null); 
                    setSelectedTransactionDetails(null); 
                    setSelectedFamilyMemberDetails(null);
                  }} className="p-2 hover:bg-bg-principal rounded-xl transition-colors">
                    <X size={20} className="text-text-secondary" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-slate-700">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-bg-principal z-10 transition-colors">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Producto</th>
                        <th className="px-6 py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Cant / Unit</th>
                        <th className="px-6 py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Categoría</th>
                        <th className="px-6 py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Precio</th>
                        <th className="px-6 py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color px-6">
                        {(activeTransaction ? activeTransaction.productos.map(p => ({ ...p, transaccion: activeTransaction.transaccion })) : 
                         filteredExpenses.flatMap(exp => 
                           exp.productos
                             .filter(p => {
                               const normalizedItemCat = normalizeCategory(p.categoria);
                               if (selectedFamilyMemberDetails) return exp.transaccion.comprador === selectedFamilyMemberDetails;
                               if (selectedCategoryDetails) return normalizedItemCat === selectedCategoryDetails;
                               if (selectedSubcategoryDetails) return p.subcategoria === selectedSubcategoryDetails;
                               return false;
                             })
                             .map((p) => ({ ...p, transaccion: exp.transaccion }))
                         )
                       ).map((item: any, i) => (
                         <tr key={i} className="hover:bg-bg-principal transition-colors">
                           <td className="px-6 py-4">
                              <div className="text-sm font-bold text-text-main truncate max-w-[200px]">{item.nombre}</div>
                              {(!selectedTransactionDetails || selectedFamilyMemberDetails) && (
                                <div className="text-[10px] text-text-secondary font-bold flex items-center gap-1 mt-1">
                                  <Store size={10} /> {item.transaccion.lugar} <span className="mx-1 opacity-30">|</span> <Calendar size={10} /> {formatDateLabel(item.transaccion.fecha)} {selectedFamilyMemberDetails ? "" : `| ${item.transaccion.comprador}`}
                                </div>
                              )}
                           </td>
                           <td className="px-6 py-4 text-center">
                             <div className="flex flex-col items-center gap-0.5">
                                <span className="text-xs font-black text-text-main">x{item.cantidad || 1}</span>
                                {item.precioUnitario && (
                                  <span className="text-[10px] font-bold text-text-secondary">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.precioUnitario)}</span>
                                )}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <div className="flex flex-col items-center gap-1">
                                <select 
                                  value={item.categoria}
                                  onChange={(e) => updateProductCategory(item.transaccion.comprador, item.transaccion.lugar, item.transaccion.fecha, item.nombre, e.target.value)}
                                  className="appearance-none px-1.5 py-0.5 rounded bg-bg-principal text-text-secondary text-[8px] font-black uppercase tracking-widest border-none cursor-pointer hover:bg-bg-card transition-colors text-center"
                                >
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <select 
                                  value={item.subcategoria || ""}
                                  onChange={(e) => updateProductSubcategory(item.transaccion.comprador, item.transaccion.lugar, item.transaccion.fecha, item.nombre, e.target.value || null)}
                                  className="appearance-none px-1.5 py-0.5 rounded bg-primary-theme/10 text-primary-theme text-[7px] font-bold uppercase tracking-widest border-none cursor-pointer hover:bg-primary-theme/20 transition-colors text-center"
                                >
                                  <option value="">Sin subcat.</option>
                                  {(subcategoryMappings[normalizeCategory(item.categoria)] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                             <div className="font-mono font-black text-sm text-text-main">
                               {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.precio)}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 deleteProduct(activeTransaction?.firestoreId || (activeTransaction as any)?.id || (item as any).expenseId, item.nombre, item.precio);
                               }}
                               className="p-2 text-danger-theme hover:bg-danger-theme/10 rounded-lg transition-colors"
                               title="Eliminar producto"
                             >
                               <Trash2 size={14} />
                             </button>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-6 bg-bg-principal border-t border-border-color flex justify-between items-center">
                  <div className="text-xs font-bold text-text-secondary uppercase text-left">Total en esta selección</div>
                  <div className="text-xl font-black text-primary-theme">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
                      (activeTransaction ? activeTransaction.productos : 
                        filteredExpenses.flatMap(exp => 
                           exp.productos.filter(p => {
                             if (selectedFamilyMemberDetails) return exp.transaccion.comprador === selectedFamilyMemberDetails;
                             if (selectedCategoryDetails) return normalizeCategory(p.categoria) === selectedCategoryDetails;
                             if (selectedSubcategoryDetails) return p.subcategoria === selectedSubcategoryDetails;
                             return false;
                           })
                        )
                      ).reduce((sum: number, p: any) => sum + sanitizePrice(p.precio), 0)
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* Floating Action Button */}
      {view === "home" && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 items-end">
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("manual")}
            className="w-12 h-12 bg-bg-card text-emerald-600 rounded-full shadow-xl flex items-center justify-center ring-2 ring-emerald-500/20"
          >
            <Wallet size={20} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView("scan")}
            className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center ring-4 ring-bg-card"
          >
            <Plus size={32} />
          </motion.button>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card border-t border-border-color flex items-center justify-around px-6 z-40 backdrop-blur-md transition-all">
        <button onClick={() => setView("home")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "home" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <BarChart3 size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Inicio</span>
        </button>
        <button onClick={() => setView("budget")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "budget" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <Users size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Presupuesto</span>
        </button>
        <button onClick={() => setView("water")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "water" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <Droplets size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Agua</span>
        </button>
        <button onClick={() => setView("shifts")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "shifts" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <Calendar size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Turnos</span>
        </button>
        <button onClick={() => setView("inflation")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "inflation" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <TrendingUp size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">IPC</span>
        </button>
        <button onClick={() => setView("backup")} className={cn("flex flex-col items-center gap-1 transition-colors", view === "backup" ? "text-emerald-600 dark:text-emerald-400" : "text-text-secondary")}>
          <Database size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Respaldo</span>
        </button>
      </nav>
    </div>
  </div>
  );
}
