// ============================================
// Firebase Configuration, Global Variables, Authentication
// ============================================

// ============================================
// DECLARE GLOBAL VARIABLES FIRST
// ============================================

var database;  // Global Firebase database reference
var auth;      // Global Firebase auth reference
var currentUser = null;
var currentUserId = null;
var lastSyncedTimestamp = null;
var isAdmin = false;
var adminRole = null;
var adminPermissions = {};
var allUsersData = [];
        
// ============================================        
// FIREBASE CONFIGURATION        
// ============================================

const firebaseConfig = {    
    apiKey: "AIzaSyD4z857J2ipSxqK8pN4tEWqU-jeK_mwA2I", 
    authDomain: "class-manager-383ad.firebaseapp.com",  
    databaseURL: "https://class-manager-383ad-default-rtdb.asia-southeast1.firebasedatabase.app",  
    projectId: "class-manager-383ad",   
    storageBucket: "class-manager-383ad.firebasestorage.app",   
    messagingSenderId: "1085651561679",  
    appId: "1:1085651561679:web:82ca82d59d6ff2ec671bba"         
};
      
// Initialize Firebase     
firebase.initializeApp(firebaseConfig);           
database = firebase.database();
auth = firebase.auth();

console.log('✅ Firebase initialized successfully');

// ============================================
// ADMIN DETECTION
// ============================================

async function checkIfAdmin(userId, userEmail) {
    try {
        console.log('🔍 Checking admin status for:', userEmail);

        // Check if email exists in /admins/
        const emailKey = userEmail.replace(/\./g, '_').replace(/@/g, '@');
        const adminCheck = await database.ref('admins/' + emailKey).once('value');

        if (adminCheck.val() === true) {
            console.log('✅ User is an admin!');
            isAdmin = true;
    
            // Get admin profile with permissions
            const adminProfile = await database.ref('admin-users/' + userId).once('value');
    
            if (adminProfile.exists()) {
                const profile = adminProfile.val();
                adminRole = profile.role || 'admin';
                adminPermissions = profile.permissions || {};
                console.log('👑 Admin Role:', adminRole);
                console.log('🔑 Permissions:', adminPermissions);
            } else {
                // Default permissions if no profile exists
                adminRole = 'super_admin';
                adminPermissions = {
                    canViewAllUsers: true,
                    canEditAllUsers: true,
                    canManageSubscriptions: true,
                    canViewAnalytics: true,
                    canAddAdmins: true,
                    canDeleteUsers: true
                };
                console.log('⚠️ No admin profile found, using default super_admin permissions');
            }
    
            // Update UI for admin
            updateUIForAdmin();
            return true;
        }

        console.log('ℹ️ User is not an admin');
        isAdmin = false;
        return false;

    } catch (error) {
        console.error('❌ Error checking admin status:', error);
        isAdmin = false;
        return false;
    }
}

function updateUIForAdmin() {
    // Show admin menu item
    const adminMenuItem = document.getElementById('adminMenuItem');
    if (adminMenuItem) {
        adminMenuItem.style.display = 'flex';
    }

    // Add admin badge to navbar
    const navbarBrand = document.querySelector('.navbar-brand');
    if (navbarBrand && !document.querySelector('.admin-badge')) {
        const badge = document.createElement('span');
        badge.className = 'admin-badge';
        badge.textContent = '👑 ADMIN';
        badge.style.cssText = 'background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-left: 12px; box-shadow: 0 2px 8px rgba(255,215,0,0.3);';
        navbarBrand.appendChild(badge);
    }

    console.log('✅ Admin UI updated');
}

// ============================================    
// PAYHERE & APP DATA   
// ============================================

// PayHere Configuration
const PAYHERE_CONFIG = {
    // SANDBOX CREDENTIALS (for testing)
    merchantId: '1221149',  // Replace with your Merchant ID
    sandbox: true,  // Set to false for production

    // Your website details
    returnUrl: window.location.href,
    cancelUrl: window.location.href,
    notifyUrl: 'https://yourwebsite.com/notify',  // Optional: for server-side notifications

    // Business details
    businessName: 'Class Manager',
    currency: 'LKR'
};

// Subscription prices in LKR
const SUBSCRIPTION_PRICES = {
    monthly: {
        amount: 1000.00,  // Rs. 2,999.00
        currency: 'LKR',
        description: 'Class Manager - Monthly Subscription'
    },
    annual: {
        amount: 9600.00,  // Rs. 28,799.00 (Save 20%)
        currency: 'LKR',
        description: 'Class Manager - Annual Subscription'
    }
};

let appData = {        
    students: [],
    grades: ['06', '07', '08', '09', '10', '11', '12'],
    classes: ['A', 'B', 'C', 'D', 'E'],  // ⭐ NEW - Default classes
    classesEnabled: false,  // ⭐ NEW - Feature toggle
    timetable: [],
    attendance: {},
    payments: [],
    subjectName: 'Mathematics',
    selectedStudent: null,
    editingTimetable: null,
    selectedPaymentStudent: null,
    // ADD SUBSCRIPTION DATA
    subscription: {
        plan: 'free_trial',  // 'free_trial', 'monthly', 'annual'
        status: 'active',     // 'active', 'expired', 'cancelled'
        startDate: new Date().toISOString(),
        endDate: null,
        maxStudents: 10,      // Free trial limit
        features: {
            students: true,
            attendance: true,
            payments: true,
            reports: true,
            backup: true
        }
    }
};

// ============================================
// AUTHENTICATION STATE LISTENER
// ============================================

auth.onAuthStateChanged(async (user) => {    
    if (user) {        
        currentUser = user;        
        currentUserId = user.uid;
               
        console.log('✅ User authenticated:', user.email);        
        console.log('User ID:', currentUserId);
        
        // ⭐ SAVE USER EMAIL TO FIREBASE PROFILE       
        try {           
            const profileRef = database.ref('users/' + currentUserId + '/profile');           
            const profileSnapshot = await profileRef.once('value');
                                  
            if (!profileSnapshot.exists()) {            
                // First time - create profile      
                await profileRef.set({                 
                    email: user.email,                  
                    displayName: user.displayName || '',                  
                    photoURL: user.photoURL || '',                  
                    createdAt: new Date().toISOString(),                  
                    lastLogin: new Date().toISOString()              
                });              
                console.log('✅ User profile created with email:', user.email);           
            } else {
        
                // Update existing profile               
                await profileRef.update({                  
                    email: user.email,                  
                    lastLogin: new Date().toISOString()               
                });               
                console.log('✅ User profile updated with email:', user.email);          
            }       
        } catch (error) {           
            console.error('❌ Error saving user profile:', error);       
        }
      
        // CHECK IF USER IS ADMIN      
        await checkIfAdmin(currentUserId, user.email);                
        
        // Hide loader       
        setTimeout(() => {                      
            const loader = document.getElementById('loader');                       
            if (loader) {                           
                loader.classList.add('hide-loader');                            
                setTimeout(() => {                                
                    loader.style.display = 'none';                            
                }, 600);                   
            }             
        }, 1000);        
        
        // Initialize app
        initializeApp();                 
    } else {                       
        console.log('❌ No user authenticated, redirecting...');          
        window.location.href = 'index.html';       
    }
});

console.log('✅ firebase-config.js loaded (with classes support)');
