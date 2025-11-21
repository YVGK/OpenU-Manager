import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Plus,
  Trash2,
  Upload,
  Search,
  Book,
  Bell,
  AlertTriangle,
  X,
  Edit2,
  Save,
  CheckSquare,
  ListChecks,
  BadgeCheck,
  BookMarked,
  GraduationCap,
  Wrench,
  Smartphone,
  Cloud,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  getDoc,
  persistentLocalCache,
} from "firebase/firestore";

// --- Firebase Configuration ---
// For local development, you can use environment variables or provide default values
// הערה: בסביבת הפיתוח המקומית שלך, הערכים האלו יגיעו מקובץ .env
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== "undefined") {
    return JSON.parse(__firebase_config);
  }

  // Try to get from environment variables (Vite uses import.meta.env)
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  // Default empty config for local development (will use anonymous auth)
  return {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };
};

const firebaseConfig = getFirebaseConfig();

// Only initialize Firebase if we have a valid config AND we're not in local development
let app, auth, db;
const hasValidFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.projectId;
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "");

// Check if Firebase is explicitly configured via environment variables (not just default empty config)
const hasExplicitFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Only initialize Firebase if we have valid config AND we're not on localhost (unless explicitly configured via env vars)
// This prevents Firebase errors when running locally without proper Firebase setup
const shouldInitializeFirebase =
  hasValidFirebaseConfig && (!isLocalhost || hasExplicitFirebaseConfig || typeof __firebase_config !== "undefined");

if (shouldInitializeFirebase) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Initialize Firestore with persistent cache (new API)
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache(),
      });
    } catch (e) {
      // Fallback to regular Firestore if persistence fails
      console.warn("Firestore persistence initialization failed, using default:", e);
      db = getFirestore(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Set to null so we know Firebase is not available
    app = null;
    auth = null;
    db = null;
  }
} else {
  if (isLocalhost && !hasValidFirebaseConfig) {
    console.info("Running in local development mode. Data will be stored in browser localStorage.");
  }
  app = null;
  auth = null;
  db = null;
}

const appId = typeof __app_id !== "undefined" ? __app_id.replace(/[\/.]/g, "_") : "local-dev";

// --- Full Manual Catalog Data ---
const INITIAL_CATALOG = [
  { code: "20476", name: "מתמטיקה בדידה: תורת הקבוצות, קומבינטוריקה ותורת הגרפים", nz: 4, category: "required_math" },
  { code: "20109", name: "אלגברה לינארית 1", nz: 7, category: "required_math" },
  { code: "20229", name: "אלגברה לינארית 2", nz: 5, category: "required_math" },
  { code: "20474", name: "חשבון אינפיניטסימלי 1", nz: 7, category: "required_math" },
  { code: "20475", name: "חשבון אינפיניטסימלי 2", nz: 7, category: "required_math" },
  { code: "20425", name: "הסתברות ומבוא לסטטיסטיקה למדעי המחשב", nz: 5, category: "required_math" },
  { code: "20441", name: "מבוא למדעי המחשב ושפת Java", nz: 6, category: "required_cs" },
  { code: "20407", name: "מבני נתונים ומבוא לאלגוריתמים", nz: 6, category: "required_cs" },
  { code: "20417", name: "אלגוריתמים", nz: 5, category: "required_cs" },
  { code: "20465", name: "מעבדה בתכנות מערכות", nz: 4, category: "required_cs" },
  { code: "20440", name: "אוטומטים ושפות פורמליות", nz: 4, category: "required_cs" },
  { code: "20585", name: "מבוא לתורת החישוביות והסיבוכיות", nz: 5, category: "required_cs" },
  { code: "20604", name: "מודלים חישוביים", nz: 5, category: "required_cs" },
  { code: "20471", name: "ארגון המחשב", nz: 4, category: "required_cs" },
  { code: "20466", name: "לוגיקה למדעי המחשב", nz: 4, category: "required_cs" },
  { code: "20594", name: "מערכות הפעלה", nz: 4, category: "required_cs" },
  { code: "20905", name: "שפות תכנות", nz: 4, category: "required_cs" },
  { code: "20277", name: "מערכות בסיסי-נתונים", nz: 4, category: "elective" },
  { code: "20436", name: "עקרונות פיתוח מערכות מידע", nz: 4, category: "elective" },
  { code: "20296", name: "תורת הקודים", nz: 4, category: "elective" },
  { code: "20462", name: "אנליזה נומרית 1", nz: 4, category: "elective" },
  { code: "20606", name: "תכנות וניתוח נתונים בשפת פייתון", nz: 6, category: "elective" },
  { code: "20551", name: "מבוא לבינה מלאכותית", nz: 4, category: "elective" },
  { code: "20554", name: "תכנות מתקדם בשפת Java", nz: 4, category: "elective" },
  { code: "20948", name: "רשתות תקשורת מחשבים", nz: 4, category: "elective" },
  { code: "20937", name: "תכנות מערכות דפנסיבי", nz: 4, category: "elective" },
  { code: "20562", name: "גרפיקה ממוחשבת", nz: 4, category: "elective" },
  { code: "20580", name: "מבוא לקריפטוגרפיה", nz: 4, category: "elective" },
  { code: "20364", name: "קומפילציה", nz: 4, category: "elective" },
  { code: "20906", name: "תכנות מונחה עצמים", nz: 4, category: "elective" },
  { code: "20574", name: "מערכות נתונים - טכנולוגיות ואלגוריתמים", nz: 4, category: "elective" },
  { code: "20581", name: "חישוביות ביולוגית", nz: 4, category: "elective" },
  { code: "20595", name: "כריית מידע", nz: 4, category: "elective" },
  { code: "20900", name: "אנליזה נומרית 2", nz: 4, category: "elective" },
  { code: "20942", name: "מבוא ללמידה חישובית", nz: 4, category: "elective" },
  { code: "20944", name: "רובוטיקה אלגוריתמית", nz: 4, category: "elective" },
  { code: "20940", name: "מבוא לאבטחת המרחב המקוון", nz: 4, category: "elective" },
  { code: "20946", name: "מבוא לבדיקות תוכנה (אנגלית)", nz: 4, category: "elective" },
  { code: "20399", name: "גיאומטריה חישובית", nz: 4, category: "elective" },
  { code: "20945", name: "אשנב למחקר במדעי המחשב למצטיינים", nz: 4, category: "elective" },
  { code: "20963", name: "הרצאות אורח-נושא מיוחד במדעי המחשב", nz: 4, category: "elective" },
  { code: "22913", name: "פרויקט במדעי המחשב", nz: 6, category: "elective" },
  { code: "20368", name: "סמינר בהנדסת תוכנה", nz: 3, category: "seminar" },
  { code: "20369", name: "סמינר באנליזה נומרית", nz: 3, category: "seminar" },
  { code: "20370", name: "סמינר בחישוביות", nz: 3, category: "seminar" },
  { code: "20371", name: "סמינר במערכות בסיסי-נתונים", nz: 3, category: "seminar" },
  { code: "20372", name: "סמינר בבינה מלאכותית", nz: 3, category: "seminar" },
  { code: "20374", name: "סמינר בקריפטוגרפיה", nz: 3, category: "seminar" },
  { code: "20375", name: "סמינר בנושא מיוחד במדעי המחשב", nz: 3, category: "seminar" },
  { code: "20388", name: "סמינר בתקשורת/אלגוריתמים מבוזרים", nz: 3, category: "seminar" },
  { code: "20389", name: "סמינר במערכות הפעלה", nz: 3, category: "seminar" },
  { code: "20390", name: "סמינר באלגוריתמים", nz: 3, category: "seminar" },
  { code: "20552", name: "סמינר בביו-אינפורמטיקה", nz: 3, category: "seminar" },
  { code: "20560", name: "סמינר: ממדעי המחשב להוראתם", nz: 3, category: "seminar" },
  { code: "20583", name: "סמינר במערכות מקביליות", nz: 3, category: "seminar" },
  { code: "20921", name: "סמינר מצטיינים במדעי המחשב וקוגניציה", nz: 3, category: "seminar" },
  { code: "20373", name: "סמינר במערכות מידע", nz: 3, category: "seminar" },
  { code: "20927", name: "סמינר באבטחת המרחב המקוון", nz: 3, category: "seminar" },
  { code: "20922", name: "סמינר בבינה חישובית", nz: 3, category: "seminar" },
  { code: "20954", name: "סמינר במדעי המחשב (אנגלית)", nz: 3, category: "seminar" },
  { code: "20586", name: "סדנה בתכנות מונחה עצמים", nz: 3, category: "workshop" },
  { code: "20503", name: "סדנה בתכנות מתקדם בשפת Java", nz: 3, category: "workshop" },
  { code: "20563", name: "סדנה בבסיסי-נתונים", nz: 3, category: "workshop" },
  { code: "20587", name: "סדנה במערכות הפעלה", nz: 3, category: "workshop" },
  { code: "20588", name: "סדנה בתקשורת מחשבים", nz: 3, category: "workshop" },
  { code: "20936", name: "סדנה במדעי הנתונים", nz: 3, category: "workshop" },
  { code: "20931", name: "סדנה באבטחת מידע", nz: 3, category: "workshop" },
  { code: "20973", name: "סדנה בסימולציה של מערכות אוטונומיות (אנגלית)", nz: 3, category: "workshop" },
  { code: "20995", name: "סדנה בטכנולוגיות לפיתוח אפליקציות לענן ולרשת", nz: 3, category: "workshop" },
  { code: "20975", name: "הרצאות אורח- סדנה בנושא מיוחד במדעי המחשב", nz: 3, category: "workshop" },
  { code: "20964", name: "הרצאות אורח-סדנה בנושא מיוחד במדעי המחשב (אנגלית)", nz: 3, category: "workshop" },
];

const STATUS_CONFIG = {
  planned: { label: "בתכנון", color: "bg-gray-100 text-gray-600", border: "border-gray-300" },
  registered: { label: "נרשמתי", color: "bg-blue-50 text-blue-600", border: "border-blue-300" },
  active: { label: "בלמידה פעילה", color: "bg-orange-50 text-orange-600", border: "border-orange-300" },
  finished: { label: "סיימתי", color: "bg-green-50 text-green-600", border: "border-green-300" },
};

const CATEGORY_LABELS = {
  required_math: { label: "חובה מתמטיקה", icon: BadgeCheck, color: "text-purple-700 bg-purple-50 border-purple-100" },
  required_cs: { label: "חובה מדמ״ח", icon: BadgeCheck, color: "text-red-600 bg-red-50 border-red-100" },
  elective: { label: "בחירה", icon: BookMarked, color: "text-blue-600 bg-blue-50 border-blue-100" },
  seminar: { label: "סמינריון", icon: GraduationCap, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  workshop: { label: "סדנה", icon: Wrench, color: "text-orange-600 bg-orange-50 border-orange-100" },
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myCourses, setMyCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingPersonalTaskId, setEditingPersonalTaskId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("all"); // For filtering courses by semester
  const [selectedYear, setSelectedYear] = useState("all"); // For filtering courses by year
  const [courseToAdd, setCourseToAdd] = useState(null); // Course pending semester/year selection
  const [readNotifications, setReadNotifications] = useState(new Set()); // Track read notifications
  const [showNewCourseModal, setShowNewCourseModal] = useState(false); // Show/hide new course modal
  const [catalog, setCatalog] = useState(INITIAL_CATALOG); // Course catalog (can be updated)
  const [courseToDelete, setCourseToDelete] = useState(null); // Course pending deletion confirmation

  // Track if Firebase is actually working (not just initialized)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null); // Track Firebase connection errors

  // Load read notifications from localStorage/Firebase
  useEffect(() => {
    const isLocalUser = user?.isLocal || !firebaseAvailable || !db || !user;

    if (isLocalUser) {
      // Load from localStorage
      try {
        const localReadNotifications = localStorage.getItem("openu-read-notifications");
        if (localReadNotifications) {
          const parsed = JSON.parse(localReadNotifications);
          setReadNotifications(new Set(parsed));
        }
      } catch (e) {
        console.error("Error loading read notifications from localStorage:", e);
      }
    } else {
      // Load from Firebase
      try {
        const readNotificationsRef = doc(db, "artifacts", appId, "users", user.uid, "data", "readNotifications");
        const unsubscribe = onSnapshot(
          readNotificationsRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setReadNotifications(new Set(data.taskIds || []));
            }
          },
          (error) => {
            console.error("Error loading read notifications from Firestore:", error);
            // Fallback to localStorage
            try {
              const localReadNotifications = localStorage.getItem("openu-read-notifications");
              if (localReadNotifications) {
                const parsed = JSON.parse(localReadNotifications);
                setReadNotifications(new Set(parsed));
              }
            } catch (e) {
              console.error("Error loading read notifications from localStorage:", e);
            }
          }
        );
        return () => unsubscribe();
      } catch (error) {
        console.error("Error setting up read notifications listener:", error);
      }
    }
  }, [user, firebaseAvailable, db]);

  // Save read notifications to localStorage/Firebase
  const saveReadNotifications = async (newReadNotifications) => {
    const isLocalUser = user?.isLocal || !firebaseAvailable || !db || !user;

    if (isLocalUser) {
      // Save to localStorage
      try {
        localStorage.setItem("openu-read-notifications", JSON.stringify(Array.from(newReadNotifications)));
      } catch (e) {
        console.error("Error saving read notifications to localStorage:", e);
      }
    } else {
      // Save to Firebase
      try {
        await setDoc(
          doc(db, "artifacts", appId, "users", user.uid, "data", "readNotifications"),
          { taskIds: Array.from(newReadNotifications) },
          { merge: true }
        );
        // Also save to localStorage as backup
        try {
          localStorage.setItem("openu-read-notifications", JSON.stringify(Array.from(newReadNotifications)));
        } catch (e) {
          console.error("Error saving read notifications to localStorage:", e);
        }
      } catch (error) {
        console.error("Error saving read notifications to Firestore:", error);
        // Fallback to localStorage
        try {
          localStorage.setItem("openu-read-notifications", JSON.stringify(Array.from(newReadNotifications)));
        } catch (e) {
          console.error("Error saving read notifications to localStorage:", e);
        }
      }
    }
  };

  // Close notifications when clicking outside and prevent body scroll on mobile
  useEffect(() => {
    if (!showNotifications) {
      document.body.style.overflow = "";
      return;
    }

    // Prevent body scroll on mobile when notification is open
    if (window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    }

    const handleClickOutside = (event) => {
      const target = event.target;
      // Check if click is outside the notification popup and bell button
      if (!target.closest('[aria-label="התראות"]') && !target.closest(".notification-popup")) {
        setShowNotifications(false);
      }
    };

    // Add listener after a short delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [showNotifications]);

  // --- Auth & Sync ---
  useEffect(() => {
    // Check if Firebase is properly configured before attempting auth
    if (!auth || !db || !shouldInitializeFirebase) {
      // If Firebase is not initialized or config is invalid, set a mock user for local development
      setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
      setFirebaseAvailable(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
          setFirebaseAvailable(true);
        } else {
          // Check if user is already signed in (e.g., from previous session)
          // If not, user will need to click the login button
          // Don't auto-sign-in with anonymous auth - use Google Sign-in instead
          const currentUser = auth.currentUser;
          if (currentUser) {
            setFirebaseAvailable(true);
          } else {
            // User not signed in - they'll need to click login button
            // Don't set a mock user, let them sign in with Google
            setFirebaseAvailable(false);
          }
        }
      } catch (error) {
        // Only log if it's not an expected auth error
        const isExpectedError =
          error.code === "auth/admin-restricted-operation" ||
          error.code === "auth/operation-not-allowed" ||
          error.code === "auth/unauthorized-domain";

        if (!isExpectedError) {
          console.warn("Auth initialization failed:", error.message);
        }
        setFirebaseAvailable(false);
      }
    };
    // Run auth initialization for both local and production environments
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setFirebaseAvailable(true);
      } else {
        // User signed out or auth failed
        setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
        setFirebaseAvailable(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!auth) {
      console.warn("Firebase auth is not initialized. Please configure Firebase to enable login.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope("profile");
      provider.addScope("email");
      await signInWithPopup(auth, provider);
      setFirebaseAvailable(true);
    } catch (error) {
      console.error("Google Sign-in error:", error);
      // Don't fallback to anonymous - let user try again or fix the issue
      if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup - this is fine, don't show error
        return;
      }
      alert("Sign-in failed. Please check your Firebase configuration and make sure Google Sign-in is enabled.");
    }
  };

  useEffect(() => {
    // Only use Firebase if we have a real authenticated user (not local mock) and db is available
    const isLocalUser = user?.isLocal || !firebaseAvailable || !db || !user;

    if (isLocalUser) {
      // If Firebase is not available, load from localStorage for local development
      try {
        const localCourses = localStorage.getItem("openu-courses");
        const localTasks = localStorage.getItem("openu-tasks");
        const localPersonalTasks = localStorage.getItem("openu-personal-tasks");
        const localReadNotifications = localStorage.getItem("openu-read-notifications");
        const localCatalog = localStorage.getItem("openu-catalog");

        if (localCourses) setMyCourses(JSON.parse(localCourses));
        if (localTasks) setTasks(JSON.parse(localTasks));
        if (localPersonalTasks) setPersonalTasks(JSON.parse(localPersonalTasks));
        if (localReadNotifications) {
          const parsed = JSON.parse(localReadNotifications);
          setReadNotifications(new Set(parsed));
        }
        if (localCatalog) {
          setCatalog(JSON.parse(localCatalog));
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
      return;
    }

    // Only set up Firestore listeners if we have a real authenticated user
    setIsSyncing(true);
    let unsubscribeCourses, unsubscribeTasks, unsubscribeNotes;

    try {
      unsubscribeCourses = onSnapshot(
        query(collection(db, "artifacts", appId, "users", user.uid, "courses")),
        (snapshot) => {
          setMyCourses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setIsSyncing(false);
        },
        (error) => {
          console.error("Firestore courses error:", error);
          setIsSyncing(false);
          // Show error popup on connection failure
          setFirebaseError("חיבור ל-Firebase נכשל. הנתונים יישמרו במצב מקומי.");
          // Fall back to localStorage on error
          setFirebaseAvailable(false);
          setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
        }
      );

      unsubscribeTasks = onSnapshot(
        query(collection(db, "artifacts", appId, "users", user.uid, "tasks")),
        (snapshot) => {
          setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setIsSyncing(false);
        },
        (error) => {
          console.error("Firestore tasks error:", error);
          setIsSyncing(false);
          // Show error popup on connection failure
          setFirebaseError("חיבור ל-Firebase נכשל. הנתונים יישמרו במצב מקומי.");
          setFirebaseAvailable(false);
          setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
        }
      );

      const notesRef = doc(db, "artifacts", appId, "users", user.uid, "data", "notes");
      unsubscribeNotes = onSnapshot(
        notesRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setPersonalTasks(data.items || []);
          }
          setIsSyncing(false);
        },
        (error) => {
          console.error("Firestore notes error:", error);
          setIsSyncing(false);
          // Show error popup on connection failure
          setFirebaseError("חיבור ל-Firebase נכשל. הנתונים יישמרו במצב מקומי.");
          setFirebaseAvailable(false);
          setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
        }
      );
    } catch (error) {
      console.error("Error setting up Firestore listeners:", error);
      setIsSyncing(false);
      // Show error popup on connection failure
      setFirebaseError("חיבור ל-Firebase נכשל. הנתונים יישמרו במצב מקומי.");
      setFirebaseAvailable(false);
      setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
    }

    // Load catalog from Firebase or localStorage
    const loadCatalog = async () => {
      const isLocalUser = user?.isLocal || !firebaseAvailable || !db || !user;
      if (isLocalUser) {
        try {
          const localCatalog = localStorage.getItem("openu-catalog");
          if (localCatalog) {
            setCatalog(JSON.parse(localCatalog));
          }
        } catch (e) {
          console.error("Error loading catalog from localStorage:", e);
        }
      } else {
        try {
          const catalogRef = doc(db, "artifacts", appId, "users", user.uid, "data", "catalog");
          const catalogSnap = await getDoc(catalogRef);
          if (catalogSnap.exists()) {
            setCatalog(catalogSnap.data().courses || INITIAL_CATALOG);
          } else {
            // If catalog doesn't exist, use INITIAL_CATALOG and save it
            setCatalog(INITIAL_CATALOG);
            await setDoc(catalogRef, { courses: INITIAL_CATALOG }, { merge: true });
          }
        } catch (e) {
          console.error("Error loading catalog from Firestore:", e);
          // Fallback to localStorage on error
          try {
            const localCatalog = localStorage.getItem("openu-catalog");
            if (localCatalog) {
              setCatalog(JSON.parse(localCatalog));
            }
          } catch (localError) {
            console.error("Error loading catalog from localStorage:", localError);
          }
        }
      }
    };

    if (user) {
      loadCatalog();
    }

    return () => {
      if (unsubscribeCourses) unsubscribeCourses();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeNotes) unsubscribeNotes();
    };
  }, [user, firebaseAvailable]);

  const setSyncingTemporarily = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const updatePersonalTasksInDb = async (newTasks) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Save to localStorage if Firebase is not available
      localStorage.setItem("openu-personal-tasks", JSON.stringify(newTasks));
      setPersonalTasks(newTasks);
      return;
    }

    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "data", "notes"),
        { items: newTasks },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving personal tasks to Firestore:", error);
      // Fallback to localStorage
      localStorage.setItem("openu-personal-tasks", JSON.stringify(newTasks));
      setPersonalTasks(newTasks);
    }
  };

  const addPersonalTask = (text) => {
    if (!text.trim()) return;
    updatePersonalTasksInDb([...personalTasks, { id: Date.now(), text, done: false }]);
  };

  const togglePersonalTask = (id) => {
    updatePersonalTasksInDb(personalTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deletePersonalTask = (id) => {
    updatePersonalTasksInDb(personalTasks.filter((t) => t.id !== id));
  };

  const saveEditedPersonalTask = (id, newText) => {
    updatePersonalTasksInDb(personalTasks.map((t) => (t.id === id ? { ...t, text: newText } : t)));
    setEditingPersonalTaskId(null);
  };

  const saveCatalogToDb = async (newCatalog) => {
    setSyncingTemporarily();
    const isLocalUser = user?.isLocal || !firebaseAvailable || !db || !user;
    if (isLocalUser) {
      // Save to localStorage if Firebase is not available
      localStorage.setItem("openu-catalog", JSON.stringify(newCatalog));
      setCatalog(newCatalog);
      return;
    }

    try {
      await setDoc(
        doc(db, "artifacts", appId, "users", user.uid, "data", "catalog"),
        { courses: newCatalog },
        { merge: true }
      );
      setCatalog(newCatalog);
    } catch (error) {
      console.error("Error saving catalog to Firestore:", error);
      // Fallback to localStorage
      localStorage.setItem("openu-catalog", JSON.stringify(newCatalog));
      setCatalog(newCatalog);
    }
  };

  const addCourseToCatalog = async (course) => {
    // Check if course code already exists in catalog
    if (catalog.find((c) => c.code === course.code.trim())) {
      return false; // Course already exists
    }

    const newCatalog = [...catalog, course];
    await saveCatalogToDb(newCatalog);
    return true;
  };

  const deleteCourseFromCatalog = async (courseCode) => {
    const newCatalog = catalog.filter((c) => c.code !== courseCode);
    await saveCatalogToDb(newCatalog);
  };

  const addCourseToPlan = async (course, semester = null, year = null) => {
    if (!user || myCourses.find((c) => c.code === course.code)) return;

    // If semester or year not provided, show selection modal
    if (!semester || !year) {
      setCourseToAdd(course);
      return;
    }

    setSyncingTemporarily();
    const { id, ...courseData } = { ...course, status: "planned", grade: null, semester, year, comments: "" };

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Save to localStorage if Firebase is not available
      const newCourse = { id: Date.now().toString(), ...courseData };
      const updatedCourses = [...myCourses, newCourse];
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      setMyCourses(updatedCourses);
      return;
    }

    try {
      await addDoc(collection(db, "artifacts", appId, "users", user.uid, "courses"), courseData);
    } catch (error) {
      console.error("Error saving course to Firestore:", error);
      // Fallback to localStorage
      const newCourse = { id: Date.now().toString(), ...courseData };
      const updatedCourses = [...myCourses, newCourse];
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      setMyCourses(updatedCourses);
    }
  };

  const updateCourseStatus = async (docId, newStatus) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Update in localStorage if Firebase is not available
      const updatedCourses = myCourses.map((c) => (c.id === docId ? { ...c, status: newStatus } : c));
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      setMyCourses(updatedCourses);
      return;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "users", user.uid, "courses", docId), { status: newStatus });
    } catch (error) {
      console.error("Error updating course in Firestore:", error);
      // Fallback to localStorage
      const updatedCourses = myCourses.map((c) => (c.id === docId ? { ...c, status: newStatus } : c));
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      setMyCourses(updatedCourses);
    }
  };

  const removeCourse = async (docId, courseCode) => {
    if (!user || !window.confirm("להסיר קורס זה?")) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Remove from localStorage if Firebase is not available
      const updatedCourses = myCourses.filter((c) => c.id !== docId);
      const updatedTasks = tasks.filter((t) => t.courseId !== courseCode);
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setMyCourses(updatedCourses);
      setTasks(updatedTasks);
      if (selectedCourseForDetails?.code === courseCode) setSelectedCourseForDetails(null);
      return;
    }

    try {
      await deleteDoc(doc(db, "artifacts", appId, "users", user.uid, "courses", docId));
      const courseTasks = tasks.filter((t) => t.courseId === courseCode);
      await Promise.all(
        courseTasks.map((t) => deleteDoc(doc(db, "artifacts", appId, "users", user.uid, "tasks", t.id)))
      );
      if (selectedCourseForDetails?.code === courseCode) setSelectedCourseForDetails(null);
    } catch (error) {
      console.error("Error removing course from Firestore:", error);
      // Fallback to localStorage
      const updatedCourses = myCourses.filter((c) => c.id !== docId);
      const updatedTasks = tasks.filter((t) => t.courseId !== courseCode);
      localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setMyCourses(updatedCourses);
      setTasks(updatedTasks);
      if (selectedCourseForDetails?.code === courseCode) setSelectedCourseForDetails(null);
    }
  };

  const addTask = async (courseId, taskData) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Save to localStorage if Firebase is not available
      const newTask = { id: Date.now().toString(), courseId, ...taskData, done: false, fileName: null };
      const updatedTasks = [...tasks, newTask];
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    try {
      await addDoc(collection(db, "artifacts", appId, "users", user.uid, "tasks"), {
        courseId,
        ...taskData,
        done: false,
        fileName: null,
      });
    } catch (error) {
      console.error("Error saving task to Firestore:", error);
      // Fallback to localStorage
      const newTask = { id: Date.now().toString(), courseId, ...taskData, done: false, fileName: null };
      const updatedTasks = [...tasks, newTask];
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const updateTask = async (taskId, data) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Update in localStorage if Firebase is not available
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      setEditingTaskId(null);
      return;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "users", user.uid, "tasks", taskId), data);
      setEditingTaskId(null);
    } catch (error) {
      console.error("Error updating task in Firestore:", error);
      // Fallback to localStorage
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      setEditingTaskId(null);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Update in localStorage if Firebase is not available
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, done: !currentStatus } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "users", user.uid, "tasks", taskId), { done: !currentStatus });
    } catch (error) {
      console.error("Error toggling task in Firestore:", error);
      // Fallback to localStorage
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, done: !currentStatus } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const removeTask = async (taskId) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Remove from localStorage if Firebase is not available
      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    try {
      await deleteDoc(doc(db, "artifacts", appId, "users", user.uid, "tasks", taskId));
    } catch (error) {
      console.error("Error removing task from Firestore:", error);
      // Fallback to localStorage
      const updatedTasks = tasks.filter((t) => t.id !== taskId);
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const handleFileUpload = async (taskId, fileName) => {
    if (!user) return;
    setSyncingTemporarily();

    const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
    if (isLocalUser) {
      // Update in localStorage if Firebase is not available
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, fileName } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      return;
    }

    try {
      await updateDoc(doc(db, "artifacts", appId, "users", user.uid, "tasks", taskId), { fileName });
    } catch (error) {
      console.error("Error saving file name to Firestore:", error);
      // Fallback to localStorage
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, fileName } : t));
      localStorage.setItem("openu-tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
  };

  const openCourseFromTask = async (courseId, taskId = null) => {
    const course = myCourses.find((c) => c.code === courseId);
    if (course) setSelectedCourseForDetails(course);
    setShowNotifications(false);
    // Mark notification as read
    if (taskId) {
      const newReadNotifications = new Set([...readNotifications, taskId]);
      setReadNotifications(newReadNotifications);
      await saveReadNotifications(newReadNotifications);
    }
  };

  const totalNZ = useMemo(
    () => myCourses.filter((c) => c.status === "finished").reduce((sum, c) => sum + (c.nz || 0), 0),
    [myCourses]
  );
  const activeNZ = useMemo(
    () => myCourses.filter((c) => c.status === "active").reduce((sum, c) => sum + (c.nz || 0), 0),
    [myCourses]
  );

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return tasks.filter((t) => !t.done && new Date(t.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tasks]);

  const urgentTasks = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    return tasks
      .filter((t) => {
        if (t.done) return false;
        const taskDate = new Date(t.date);
        return taskDate >= now && taskDate <= threeDaysFromNow;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [tasks]);

  // Get unread urgent tasks
  const unreadUrgentTasks = useMemo(() => {
    return urgentTasks.filter((t) => !readNotifications.has(t.id));
  }, [urgentTasks, readNotifications]);

  // Semester and Year Selection Modal Component
  const SemesterYearSelectionModal = ({ course, onSelect, onClose }) => {
    const [tempSemester, setTempSemester] = useState(null);
    const [tempYear, setTempYear] = useState(null);

    const handleSemesterClick = (sem) => {
      setTempSemester(sem);
    };

    const handleYearClick = (year) => {
      setTempYear(year);
      if (tempSemester) {
        onSelect(tempSemester, year);
      }
    };

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">בחר סמסטר ושנה</h3>
              <p className="text-sm text-gray-600 mt-1">{course.name}</p>
              <p className="text-xs text-gray-500 mt-1">קוד: {course.code}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">בחר סמסטר:</label>
              <div className="grid grid-cols-2 gap-2">
                {["סמסטר א'", "סמסטר ב'", "סמסטר קיץ", "לא רלוונטי"].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => handleSemesterClick(sem)}
                    className={`p-3 rounded-lg font-medium transition-colors border ${
                      tempSemester === sem
                        ? "bg-blue-600 text-white border-blue-700"
                        : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300"
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>
            {tempSemester && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">בחר שנה:</label>
                <div className="grid grid-cols-3 gap-2">
                  {["2026", "2027", "2028", "2029", "2030"].map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearClick(year)}
                      className={`p-3 rounded-lg font-medium transition-colors border ${
                        tempYear === year
                          ? "bg-green-600 text-white border-green-700"
                          : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full mt-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].border}`}
    >
      {STATUS_CONFIG[status].label}
    </span>
  );

  const PersonalTaskItem = ({ task }) => {
    const isEditing = editingPersonalTaskId === task.id;
    if (isEditing) {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEditedPersonalTask(task.id, e.target.elements.text.value);
          }}
          className="flex items-center gap-2 p-2 bg-yellow-100 rounded-lg border border-yellow-200"
        >
          <input
            name="text"
            defaultValue={task.text}
            className="bg-white border rounded px-2 py-1 text-sm flex-1 outline-none focus:border-yellow-500"
            autoFocus
          />
          <button type="submit" className="p-1 bg-green-600 text-white rounded hover:bg-green-700">
            <Save size={14} />
          </button>
          <button
            type="button"
            onClick={() => setEditingPersonalTaskId(null)}
            className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            <X size={14} />
          </button>
        </form>
      );
    }
    return (
      <div className="flex items-center justify-between p-2 hover:bg-yellow-100/50 rounded transition-colors group">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={() => togglePersonalTask(task.id)}
            className={task.done ? "text-yellow-600/60" : "text-yellow-600"}
          >
            {task.done ? <CheckCircle size={16} /> : <Circle size={16} />}
          </button>
          <span className={`text-sm truncate ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.text}
          </span>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingPersonalTaskId(task.id)} className="p-1 text-gray-400 hover:text-blue-600">
            <Edit2 size={14} />
          </button>
          <button onClick={() => deletePersonalTask(task.id)} className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const TaskItem = ({ task, showCourseName = false, allowEdit = true }) => {
    const course = myCourses.find((c) => c.code === task.courseId);
    const isEditing = editingTaskId === task.id;
    if (isEditing) {
      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            updateTask(task.id, { title: fd.get("title"), date: fd.get("date") });
          }}
          className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <input name="title" defaultValue={task.title} className="border rounded px-2 py-1 text-sm flex-1" autoFocus />
          <input name="date" type="date" defaultValue={task.date} className="border rounded px-2 py-1 text-sm w-32" />
          <button type="submit" className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
            <Save size={16} />
          </button>
          <button
            type="button"
            onClick={() => setEditingTaskId(null)}
            className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            <X size={16} />
          </button>
        </form>
      );
    }
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
          task.done ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button
            onClick={() => toggleTask(task.id, task.done)}
            className={`shrink-0 ${task.done ? "text-green-500" : "text-gray-300 hover:text-blue-500"}`}
          >
            {task.done ? <CheckCircle size={20} /> : <Circle size={20} />}
          </button>
          <div className={`flex-1 min-w-0 ${task.done ? "opacity-50" : ""}`}>
            <p className={`font-medium text-gray-800 text-sm truncate ${task.done ? "line-through" : ""}`}>
              {task.title}
            </p>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 shrink-0">
                <Calendar size={10} /> {new Date(task.date).toLocaleDateString("he-IL")}
              </span>
              {task.type === "exam" && (
                <span className="text-red-500 font-bold bg-red-50 px-1 rounded shrink-0">מבחן</span>
              )}
              {showCourseName && course && (
                <button
                  onClick={() => openCourseFromTask(course.code)}
                  className="text-blue-600 hover:underline hover:bg-blue-50 px-1 rounded transition-colors truncate"
                >
                  {course.name}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {allowEdit && !task.done && (
            <button
              onClick={() => setEditingTaskId(task.id)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
            >
              <Edit2 size={14} />
            </button>
          )}
          <label className="cursor-pointer p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 relative group">
            <input
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(task.id, e.target.files[0]?.name)}
            />
            {task.fileName ? <FileText size={14} className="text-blue-600" /> : <Upload size={14} />}
          </label>
          <button
            onClick={() => removeTask(task.id)}
            className="p-1.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 font-medium text-sm">נ"ז שנצברו</span>
            <div className="bg-green-50 p-1.5 rounded-full">
              <CheckCircle className="text-green-500 w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{totalNZ}</span>
            <span className="text-sm text-gray-400 font-normal">/ 120</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 font-medium text-sm">בלימודים כעת</span>
            <div className="bg-orange-50 p-1.5 rounded-full">
              <BookOpen className="text-orange-500 w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{activeNZ}</span>
            <span className="text-sm text-gray-400 font-normal">נ"ז</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 font-medium text-sm">מטלות לביצוע</span>
            <div className="bg-blue-50 p-1.5 rounded-full">
              <Clock className="text-blue-500 w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{tasks.filter((t) => !t.done).length}</span>
            <span className="text-sm text-gray-400 font-normal">פתוחות</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 order-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full min-h-[400px] flex flex-col">
            <div className="p-4 bg-blue-50/50 border-b border-gray-100 font-bold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar className="w-5 h-5" /> השבוע הקרוב והלאה
              </div>
              <button
                onClick={() => setActiveTab("tasks")}
                className="text-xs text-blue-600 hover:bg-white hover:shadow-sm px-2 py-1 rounded transition-all"
              >
                לכל המשימות
              </button>
            </div>

            {urgentTasks.length > 0 && (
              <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h3 className="font-bold text-orange-800 text-sm">שים לב: מועדים קרובים</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {urgentTasks.map((t) => {
                      const isRead = readNotifications.has(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => openCourseFromTask(t.courseId, t.id)}
                          className={`text-xs bg-white border px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                            isRead
                              ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                              : "border-orange-200 text-orange-700 hover:bg-orange-100"
                          }`}
                        >
                          {isRead ? (
                            <CheckCircle size={12} className="text-green-500" />
                          ) : (
                            <AlertTriangle size={12} className="text-orange-500" />
                          )}
                          <span>
                            {t.title} ({new Date(t.date).toLocaleDateString("he-IL")})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {upcomingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <CheckCircle size={48} className="mb-2 opacity-20" />
                  <p>הכל פנוי! אין משימות דחופות 🎉</p>
                </div>
              ) : (
                upcomingTasks.slice(0, 10).map((task) => <TaskItem key={task.id} task={task} showCourseName={true} />)
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 order-2">
          <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 flex flex-col h-[400px]">
            <div className="p-4 border-b border-yellow-100 flex items-center gap-2 text-yellow-800 font-bold">
              <ListChecks size={18} /> משימות אישיות
            </div>

            <div className="p-3 border-b border-yellow-100 bg-yellow-50/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addPersonalTask(e.target.elements.newTask.value);
                  e.target.reset();
                }}
                className="flex gap-2"
              >
                <input
                  name="newTask"
                  placeholder="הוסף משימה..."
                  className="flex-1 rounded px-2 py-1.5 text-sm border border-yellow-200 bg-white outline-none focus:border-yellow-500"
                />
                <button type="submit" className="bg-yellow-500 text-white px-2 rounded hover:bg-yellow-600">
                  <Plus size={18} />
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {personalTasks.length === 0 ? (
                <div className="text-center text-yellow-800/40 text-xs mt-10">אין משימות אישיות</div>
              ) : (
                personalTasks.map((pt) => <PersonalTaskItem key={pt.id} task={pt} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TasksView = () => {
    const [filter, setFilter] = useState("all");
    const filteredTasks = tasks
      .filter((t) => {
        if (filter === "active") return !t.done;
        if (filter === "done") return t.done;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <CheckSquare className="text-blue-600" /> ניהול משימות
          </h2>
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                filter === "all" ? "bg-white shadow text-gray-800 font-medium" : "text-gray-500"
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                filter === "active" ? "bg-white shadow text-gray-800 font-medium" : "text-gray-500"
              }`}
            >
              לביצוע
            </button>
            <button
              onClick={() => setFilter("done")}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                filter === "done" ? "bg-white shadow text-gray-800 font-medium" : "text-gray-500"
              }`}
            >
              הושלם
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {filteredTasks.length === 0 && (
            <div className="text-center text-gray-400 py-10">לא נמצאו משימות בסינון זה</div>
          )}
          {filteredTasks.map((task) => (
            <TaskItem key={task.id} task={task} showCourseName={true} />
          ))}
        </div>
      </div>
    );
  };

  // Sortable Course Card Component
  const SortableCourseCard = ({ course, isDragging }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: course.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 -mr-1 -ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={16} />
            </div>
            <span className="bg-gray-100 text-gray-600 text-[10px] font-mono px-1.5 py-0.5 rounded">{course.code}</span>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCourseForDetails(course);
              }}
              className="text-blue-500 hover:bg-blue-50 p-1 rounded"
            >
              <FileText size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeCourse(course.id, course.code);
              }}
              className="text-red-400 hover:bg-red-50 p-1 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <h3
          className="font-bold text-gray-800 mb-1 truncate cursor-pointer hover:text-blue-600"
          onClick={() => setSelectedCourseForDetails(course)}
          title={course.name}
        >
          {course.name}
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-500">{course.nz} נ"ז</p>
            {course.semester && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                {course.semester}
              </span>
            )}
            {course.year && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">{course.year}</span>
            )}
          </div>
          {course.category && CATEGORY_LABELS[course.category] && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_LABELS[course.category].color}`}>
              {CATEGORY_LABELS[course.category].label}
            </span>
          )}
        </div>
        <select
          className="w-full text-sm border-gray-200 rounded-md bg-gray-50 p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          value={course.status}
          onChange={(e) => updateCourseStatus(course.id, e.target.value)}
        >
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Droppable Status Container Component
  const DroppableStatusContainer = ({ statusKey, courses, label }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `status-${statusKey}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`space-y-3 ${isOver ? "bg-blue-50 rounded-lg p-2 border-2 border-blue-300 border-dashed" : ""}`}
      >
        <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          {label}
          <span className="text-sm font-normal text-gray-400">({courses.length})</span>
        </h2>
        {courses.length === 0 && (
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm text-center min-h-[100px] flex items-center justify-center">
            אין קורסים בסטטוס זה
          </div>
        )}
        <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <SortableCourseCard key={course.id} course={course} />
            ))}
          </div>
        </SortableContext>
      </div>
    );
  };

  const AddNewCourseModal = () => {
    const [formData, setFormData] = useState({
      code: "",
      name: "",
      nz: "",
      category: "",
    });
    const [errors, setErrors] = useState({});

    // Prevent body scroll when modal is open on mobile
    useEffect(() => {
      if (showNewCourseModal) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [showNewCourseModal]);

    const validateForm = () => {
      const newErrors = {};
      if (!formData.code.trim()) {
        newErrors.code = "מספר קורס הוא שדה חובה";
      } else if (!/^\d+$/.test(formData.code.trim())) {
        newErrors.code = "מספר קורס חייב להכיל רק ספרות";
      }
      if (!formData.name.trim()) {
        newErrors.name = "שם קורס הוא שדה חובה";
      }
      const nzValue = Number(formData.nz);
      if (!formData.nz || isNaN(nzValue) || nzValue < 0 || nzValue > 20) {
        newErrors.nz = "נ\"ז הוא שדה חובה (חייב להיות בין 0 ל-20)";
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      // Check if course code already exists in catalog
      if (catalog.find((c) => c.code === formData.code.trim())) {
        setErrors({ code: "קורס עם מספר זה כבר קיים בקטלוג" });
        return;
      }

      // Create course object
      const newCourse = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        nz: Number(formData.nz),
        ...(formData.category && { category: formData.category }),
      };

      // Add course to catalog
      const success = await addCourseToCatalog(newCourse);
      if (!success) {
        setErrors({ code: "שגיאה בהוספת הקורס לקטלוג" });
        return;
      }

      // Close modal and reset form
      setShowNewCourseModal(false);
      setFormData({ code: "", name: "", nz: "", category: "" });
      setErrors({});
    };

    if (!showNewCourseModal) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowNewCourseModal(false);
            setFormData({ code: "", name: "", nz: "", category: "" });
            setErrors({});
          }
        }}
      >
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-3 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">הוסף קורס חדש</h2>
            <button
              onClick={() => {
                setShowNewCourseModal(false);
                setFormData({ code: "", name: "", nz: "", category: "" });
                setErrors({});
              }}
              className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 flex-shrink-0"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" dir="rtl">
              {/* Course Code */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  מספר קורס <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.code}
                  onChange={(e) => {
                    // Only allow numeric input
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, code: value });
                    if (errors.code) setErrors({ ...errors, code: "" });
                  }}
                  placeholder="למשל: 20476"
                  className={`w-full text-sm sm:text-base border rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.code ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.code && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.code}</p>}
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  שם קורס <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  placeholder="שם הקורס"
                  className={`w-full text-sm sm:text-base border rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name}</p>}
              </div>

              {/* נ"ז Credits */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  נ"ז <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.nz}
                  onChange={(e) => {
                    setFormData({ ...formData, nz: e.target.value });
                    if (errors.nz) setErrors({ ...errors, nz: "" });
                  }}
                  placeholder="מספר נקודות זכות"
                  className={`w-full text-sm sm:text-base border rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 outline-none ${
                    errors.nz ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.nz && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.nz}</p>}
              </div>

              {/* Category (Optional) */}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">
                  קטגוריה (אופציונלי)
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-sm sm:text-base border border-gray-200 rounded-md p-2 sm:p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">לא נבחר</option>
                  <option value="required_math">חובה מתמטיקה</option>
                  <option value="required_cs">חובה מדמ״ח</option>
                  <option value="elective">בחירה</option>
                  <option value="seminar">סמינריון</option>
                  <option value="workshop">סדנה</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCourseModal(false);
                    setFormData({ code: "", name: "", nz: "", category: "" });
                    setErrors({});
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-2 sm:p-3 text-sm sm:text-base font-medium transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 sm:p-3 text-sm sm:text-base font-medium transition-colors"
                >
                  הוסף קורס
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const MyStudiesView = () => {
    const [activeId, setActiveId] = useState(null);
    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    // Filter courses by semester if selected
    const filteredCourses = useMemo(() => {
      if (selectedSemester === "all") return myCourses;
      return myCourses.filter((c) => c.semester === selectedSemester);
    }, [myCourses, selectedSemester]);

    const groupedCourses = {
      active: filteredCourses.filter((c) => c.status === "active"),
      registered: filteredCourses.filter((c) => c.status === "registered"),
      planned: filteredCourses.filter((c) => c.status === "planned"),
      finished: filteredCourses.filter((c) => c.status === "finished"),
    };

    // Get unique semesters from courses
    const availableSemesters = useMemo(() => {
      const semesters = new Set(myCourses.map((c) => c.semester).filter(Boolean));
      return Array.from(semesters).sort();
    }, [myCourses]);

    // Get unique years from courses
    const availableYears = useMemo(() => {
      const years = new Set(myCourses.map((c) => c.year).filter(Boolean));
      return Array.from(years).sort();
    }, [myCourses]);

    const handleDragEnd = (event) => {
      const { active, over } = event;

      if (!over) {
        setActiveId(null);
        return;
      }

      const activeId = active.id;
      const overId = over.id;

      // Find the course being dragged
      const draggedCourse = myCourses.find((c) => c.id === activeId);
      if (!draggedCourse) {
        setActiveId(null);
        return;
      }

      // Check if dropped on a status container
      if (overId.toString().startsWith("status-")) {
        const newStatus = overId.toString().replace("status-", "");
        if (newStatus !== draggedCourse.status) {
          updateCourseStatus(activeId, newStatus);
        }
      }

      setActiveId(null);
    };

    const draggedCourse = activeId ? myCourses.find((c) => c.id === activeId) : null;

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {/* Add New Course Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewCourseModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              הוסף קורס חדש
            </button>
          </div>

          {/* Semester and Year Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={16} /> סינון לפי סמסטר ושנה
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedSemester("all")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    selectedSemester === "all"
                      ? "bg-blue-600 text-white shadow-sm font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  כל הסמסטרים
                </button>
                {availableSemesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      selectedSemester === sem
                        ? "bg-blue-600 text-white shadow-sm font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Calendar size={16} /> שנה
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedYear("all")}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                    selectedYear === "all"
                      ? "bg-green-600 text-white shadow-sm font-medium"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  כל השנים
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      selectedYear === year
                        ? "bg-green-600 text-white shadow-sm font-medium"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {["active", "registered", "planned", "finished"].map((statusKey) => (
            <DroppableStatusContainer
              key={statusKey}
              statusKey={statusKey}
              courses={groupedCourses[statusKey]}
              label={STATUS_CONFIG[statusKey].label}
            />
          ))}
        </div>
        <DragOverlay>
          {draggedCourse ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-400 opacity-90 rotate-2">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-100 text-gray-600 text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {draggedCourse.code}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-1 truncate">{draggedCourse.name}</h3>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  const CatalogView = () => {
    const filteredCatalog = useMemo(() => {
      return catalog.filter((c) => c.name.includes(searchTerm) || c.code.includes(searchTerm));
    }, [searchTerm, catalog]);

    const categorizedCatalog = useMemo(() => {
      const grouped = { required_math: [], required_cs: [], elective: [], seminar: [], workshop: [] };
      filteredCatalog.forEach((c) => {
        if (grouped[c.category]) grouped[c.category].push(c);
        else grouped["elective"].push(c);
      });
      return grouped;
    }, [filteredCatalog]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        {/* Search and Add Button */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-gray-800 hidden md:block">קטלוג קורסים</h2>
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש קורס לפי שם או קוד..."
              className="w-full pr-10 pl-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowNewCourseModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            הוסף קורס חדש
          </button>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 custom-scrollbar min-h-[400px]">
          {Object.entries(categorizedCatalog).map(([catKey, courses]) => {
            if (courses.length === 0) return null;
            const CatIcon = CATEGORY_LABELS[catKey]?.icon || Circle;
            return (
              <div key={catKey} className="mb-6">
                <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-gray-200 pb-1">
                  <CatIcon size={14} /> {CATEGORY_LABELS[catKey]?.label} ({courses.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((course) => {
                    const isAdded = myCourses.some((c) => c.code === course.code);
                    // Check if course exists in myCourses to get full details
                    const existingCourse = myCourses.find((c) => c.code === course.code);
                    const courseToShow = existingCourse || course;
                    return (
                      <div
                        key={course.code}
                        className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedCourseForDetails(courseToShow)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-sm hover:text-blue-600 transition-colors">
                              {course.name}
                            </span>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded font-mono">
                              {course.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{course.nz} נ"ז</span>
                            {course.category && CATEGORY_LABELS[course.category] && (
                              <span
                                className={`text-[9px] px-1 rounded border ${CATEGORY_LABELS[course.category].color}`}
                              >
                                {CATEGORY_LABELS[course.category].label}
                              </span>
                            )}
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                          {isAdded ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded">
                              <CheckCircle size={14} /> קיים
                            </span>
                          ) : (
                            <button
                              onClick={() => addCourseToPlan(course)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                            >
                              <Plus size={14} /> הוסף
                            </button>
                          )}
                          <button
                            onClick={() => setCourseToDelete(course)}
                            className="text-red-400 hover:bg-red-50 hover:text-red-600 p-1.5 rounded transition-colors"
                            title="מחק קורס"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Modal
  const CourseDetailModal = () => {
    if (!selectedCourseForDetails) return null;
    const courseTasks = tasks.filter((t) => t.courseId === selectedCourseForDetails.code);

    // Prevent body scroll when modal is open on mobile
    useEffect(() => {
      if (selectedCourseForDetails) {
        document.body.style.overflow = "hidden";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [selectedCourseForDetails]);

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedCourseForDetails(null);
          }
        }}
      >
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-3 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 break-words">
                {selectedCourseForDetails.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-gray-500 font-mono">{selectedCourseForDetails.code}</span>
                {selectedCourseForDetails.status && <StatusBadge status={selectedCourseForDetails.status} />}
                {selectedCourseForDetails.semester && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                    {selectedCourseForDetails.semester}
                  </span>
                )}
                {selectedCourseForDetails.category && CATEGORY_LABELS[selectedCourseForDetails.category] && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      CATEGORY_LABELS[selectedCourseForDetails.category].color
                    }`}
                  >
                    {CATEGORY_LABELS[selectedCourseForDetails.category].label}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedCourseForDetails(null)}
              className="p-1.5 sm:p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 flex-shrink-0"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-8 flex-1 overflow-y-auto">
            {/* Only show Add Task section if course is in My Study Plan (has an id) */}
            {selectedCourseForDetails.id && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
                  <Plus size={14} className="sm:w-4 sm:h-4" /> הוספת מטלה
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    addTask(selectedCourseForDetails.code, {
                      title: fd.get("title"),
                      date: fd.get("date"),
                      type: fd.get("type"),
                    });
                    e.target.reset();
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
                >
                  <input
                    required
                    name="title"
                    placeholder="שם (למשל: ממ״ן 11)"
                    className="border rounded p-2 text-xs sm:text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    required
                    name="date"
                    type="date"
                    className="border rounded p-2 text-xs sm:text-sm outline-none focus:border-blue-500"
                  />
                  <select
                    name="type"
                    className="border rounded p-2 text-xs sm:text-sm outline-none focus:border-blue-500"
                  >
                    <option value="maman">מטלה (ממ"ן)</option>
                    <option value="exam">מבחן</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white rounded p-2 text-xs sm:text-sm hover:bg-blue-700 font-medium sm:col-span-2 lg:col-span-1"
                  >
                    הוסף
                  </button>
                </form>
              </div>
            )}
            {/* Show info message for catalog courses */}
            {!selectedCourseForDetails.id && (
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                <p className="text-xs sm:text-sm text-blue-800 mb-2 sm:mb-3">
                  כדי להוסיף מטלות ולערוך פרטים, יש להוסיף את הקורס ל"התכנית שלי" תחילה.
                </p>
                <button
                  onClick={() => {
                    const courseToAdd = { ...selectedCourseForDetails };
                    setSelectedCourseForDetails(null);
                    addCourseToPlan(courseToAdd);
                  }}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                >
                  הוסף לתכנית שלי
                </button>
              </div>
            )}
            {/* Only show course details editing if course is in My Study Plan (has an id) */}
            {selectedCourseForDetails.id && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Calendar size={14} className="sm:w-4 sm:h-4" /> פרטי קורס
                </h3>
                <div className="mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">סטטוס:</label>
                    <select
                      value={selectedCourseForDetails.status || "planned"}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await updateCourseStatus(selectedCourseForDetails.id, newStatus);
                        setSelectedCourseForDetails({ ...selectedCourseForDetails, status: newStatus });
                      }}
                      className="w-full text-xs sm:text-sm border-gray-200 rounded-md bg-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">סמסטר:</label>
                    <select
                      value={selectedCourseForDetails.semester || ""}
                      onChange={async (e) => {
                        const newSemester = e.target.value;
                        const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
                        if (isLocalUser) {
                          const updatedCourses = myCourses.map((c) =>
                            c.id === selectedCourseForDetails.id ? { ...c, semester: newSemester } : c
                          );
                          localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
                          setMyCourses(updatedCourses);
                          setSelectedCourseForDetails({ ...selectedCourseForDetails, semester: newSemester });
                        } else {
                          try {
                            await updateDoc(
                              doc(db, "artifacts", appId, "users", user.uid, "courses", selectedCourseForDetails.id),
                              { semester: newSemester }
                            );
                            setSelectedCourseForDetails({ ...selectedCourseForDetails, semester: newSemester });
                          } catch (error) {
                            console.error("Error updating semester:", error);
                          }
                        }
                      }}
                      className="w-full text-xs sm:text-sm border-gray-200 rounded-md bg-white p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">לא נבחר</option>
                      <option value="סמסטר א'">סמסטר א'</option>
                      <option value="סמסטר ב'">סמסטר ב'</option>
                      <option value="סמסטר קיץ">סמסטר קיץ</option>
                      <option value="לא רלוונטי">לא רלוונטי</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">שנה:</label>
                    <select
                      value={selectedCourseForDetails.year || ""}
                      onChange={async (e) => {
                        const newYear = e.target.value;
                        const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
                        if (isLocalUser) {
                          const updatedCourses = myCourses.map((c) =>
                            c.id === selectedCourseForDetails.id ? { ...c, year: newYear } : c
                          );
                          localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
                          setMyCourses(updatedCourses);
                          setSelectedCourseForDetails({ ...selectedCourseForDetails, year: newYear });
                        } else {
                          try {
                            await updateDoc(
                              doc(db, "artifacts", appId, "users", user.uid, "courses", selectedCourseForDetails.id),
                              { year: newYear }
                            );
                            setSelectedCourseForDetails({ ...selectedCourseForDetails, year: newYear });
                          } catch (error) {
                            console.error("Error updating year:", error);
                          }
                        }
                      }}
                      className="w-full text-xs sm:text-sm border-gray-200 rounded-md bg-white p-2 focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="">לא נבחר</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                      <option value="2030">2030</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">הערות:</label>
                    <textarea
                      value={selectedCourseForDetails.comments || ""}
                      onChange={async (e) => {
                        const newComments = e.target.value;
                        const isLocalUser = user?.isLocal || !firebaseAvailable || !db;
                        if (isLocalUser) {
                          const updatedCourses = myCourses.map((c) =>
                            c.id === selectedCourseForDetails.id ? { ...c, comments: newComments } : c
                          );
                          localStorage.setItem("openu-courses", JSON.stringify(updatedCourses));
                          setMyCourses(updatedCourses);
                          setSelectedCourseForDetails({ ...selectedCourseForDetails, comments: newComments });
                        } else {
                          try {
                            await updateDoc(
                              doc(db, "artifacts", appId, "users", user.uid, "courses", selectedCourseForDetails.id),
                              { comments: newComments }
                            );
                            setSelectedCourseForDetails({ ...selectedCourseForDetails, comments: newComments });
                          } catch (error) {
                            console.error("Error updating comments:", error);
                          }
                        }
                      }}
                      placeholder="הוסף הערות על הקורס..."
                      className="w-full text-xs sm:text-sm border-gray-200 rounded-md bg-white p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-y min-h-[60px] sm:min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Only show tasks section if course is in My Study Plan (has an id) */}
            {selectedCourseForDetails.id && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base flex items-center gap-2">
                  <Calendar size={14} className="sm:w-4 sm:h-4" /> לוח משימות קורס
                </h3>
                <div className="space-y-2">
                  {courseTasks.length === 0 && (
                    <p className="text-gray-400 text-xs sm:text-sm italic">אין מטלות מוגדרות.</p>
                  )}
                  {courseTasks
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden" dir="rtl">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm" dir="rtl">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <div
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0"
                onClick={() => setActiveTab("dashboard")}
              >
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-1 sm:p-1.5 rounded-lg shadow-sm">
                  <Book size={18} className="sm:w-5 sm:h-5" />
                </div>
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-800 whitespace-nowrap">
                  OpenU<span className="text-blue-600">Manager</span>
                </span>
              </div>
              <div className="hidden md:flex gap-1 bg-gray-100/50 p-1 rounded-xl flex-shrink-0">
                {[
                  { id: "dashboard", label: "ראשי" },
                  { id: "studies", label: "התכנית שלי" },
                  { id: "tasks", label: "משימות" },
                  { id: "catalog", label: "קטלוג" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 sm:px-3 md:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                  }}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 relative text-gray-600 transition-colors"
                  aria-label="התראות"
                >
                  <Bell size={18} className="sm:w-5 sm:h-5" />
                  {unreadUrgentTasks.length > 0 && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40 md:hidden bg-black/20"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div
                      className="notification-popup fixed md:absolute top-16 md:top-auto right-2 md:right-0 mt-0 md:mt-2 w-[calc(100vw-1rem)] md:w-72 lg:w-80 max-w-sm bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
                      dir="rtl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 text-sm">התראות</h3>
                        <button onClick={() => setShowNotifications(false)} aria-label="סגור">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {urgentTasks.length === 0 ? (
                          <div className="text-center text-gray-400 text-xs py-4">אין התראות חדשות</div>
                        ) : (
                          urgentTasks.map((t) => {
                            const isRead = readNotifications.has(t.id);
                            return (
                              <div
                                key={t.id}
                                className="p-2 hover:bg-gray-50 rounded flex items-start gap-2 cursor-pointer"
                                onClick={() => openCourseFromTask(t.courseId, t.id)}
                              >
                                {isRead ? (
                                  <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-xs font-bold truncate ${
                                      isRead ? "text-gray-500" : "text-gray-800"
                                    }`}
                                  >
                                    {t.title}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {new Date(t.date).toLocaleDateString("he-IL")}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Login Button - Show when user is not signed in */}
              {!user || user?.isLocal ? (
                <button
                  onClick={() => handleLogin()}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">התחבר עם Google</span>
                  <span className="sm:hidden">התחבר</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 flex-shrink-0 min-w-0">
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {user.email || user.displayName || "מחובר"}
                  </span>
                  <button
                    onClick={async () => {
                      if (auth) {
                        await auth.signOut();
                        setUser({ uid: "local-user", isAnonymous: true, isLocal: true });
                        setFirebaseAvailable(false);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-xs underline whitespace-nowrap"
                  >
                    התנתק
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 pb-20 md:pb-8 overflow-x-hidden">
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "studies" && <MyStudiesView />}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "catalog" && <CatalogView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40 flex justify-around shadow-lg">
        {[
          { id: "dashboard", label: "ראשי", icon: Book },
          { id: "studies", label: "התכנית שלי", icon: GraduationCap },
          { id: "tasks", label: "משימות", icon: CheckSquare },
          { id: "catalog", label: "קטלוג", icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium w-16 transition-colors ${
                activeTab === tab.id ? "text-blue-600 bg-blue-50" : "text-gray-500"
              }`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {selectedCourseForDetails && <CourseDetailModal />}

      <AddNewCourseModal />

      {/* Semester and Year Selection Modal */}
      {courseToAdd && (
        <SemesterYearSelectionModal
          course={courseToAdd}
          onSelect={(semester, year) => {
            addCourseToPlan(courseToAdd, semester, year);
            setCourseToAdd(null);
          }}
          onClose={() => setCourseToAdd(null)}
        />
      )}

      {/* Delete Course Confirmation Modal */}
      {courseToDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCourseToDelete(null);
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">מחיקת קורס</h3>
                <p className="text-sm text-gray-600 mb-4">
                  האם אתה בטוח שברצונך למחוק את הקורס "{courseToDelete.name}" ({courseToDelete.code}) מהקטלוג?
                  {myCourses.some((c) => c.code === courseToDelete.code) && (
                    <span className="block mt-2 text-red-600 font-medium">
                      שים לב: הקורס קיים בתכנית הלימודים שלך ולא יימחק משם.
                    </span>
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCourseToDelete(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 transition-colors text-sm font-medium"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={async () => {
                      await deleteCourseFromCatalog(courseToDelete.code);
                      setCourseToDelete(null);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 transition-colors text-sm font-medium"
                  >
                    מחק
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCourseToDelete(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Error Popup */}
      {firebaseError && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFirebaseError(null);
            }
          }}
        >
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-red-50 p-2 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-2">שגיאת חיבור</h3>
                <p className="text-sm text-gray-600 mb-4">{firebaseError}</p>
                <button
                  onClick={() => setFirebaseError(null)}
                  className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  הבנתי
                </button>
              </div>
              <button
                onClick={() => setFirebaseError(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
