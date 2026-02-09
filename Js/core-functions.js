// ============================================
// Core Application Functions - UPDATED WITH CLASS SUPPORT
// ============================================

// ============================================
// LOGOUT FUNCTION
// ============================================

function logout() {    
    if (!confirm('Are you sure you want to sign out?')) {        
        return;    
    }

    auth.signOut()        
        .then(() => {            
            console.log('✅ User logged out');            
            window.location.href = 'index.html';        
        })        
        .catch((error) => {            
            console.error('Logout error:', error);            
            alert('❌ Error signing out: ' + error.message);        
        });
}

// ============================================
// INITIALIZE APP
// ============================================

function initializeApp() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   APP INITIALIZATION                   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('User:', currentUser.email);
    console.log('UID:', currentUserId);

    // ✅ MERGED FUNCTIONALITY FROM init() function
    
    // Call migration
    if (typeof window.migrateLocalStorageToFirebase === 'function') {
        window.migrateLocalStorageToFirebase();
    }
    
    // Load data
    loadData();
    
    // Initialize subscription
    if (typeof initializeSubscription === 'function') {
        initializeSubscription();
    }
    
    // Enable real-time sync
    if (typeof enableRealtimeSync === 'function') {
        enableRealtimeSync();
    }

    // Show app immediately    
    const app = document.getElementById('app');    
    if (app) {        
        app.classList.add('active');        
        console.log('✅ App shown');    
    }

    // Update dashboard if function exists    
    if (typeof updateDashboard === 'function') {        
        updateDashboard();    
    }

    console.log('✅ App initialized');
}

// ============================================
// HELPER FUNCTION: Check if Unlimited
// ============================================

function isUnlimitedSubscription(user) {
    const subscription = user.data?.subscription || user.subscription;

    if (!subscription) return false;

    // Check for unlimited plan or very high maxStudents
    return subscription.plan === 'unlimited' || 
           subscription.maxStudents >= 999999 ||
           subscription.features?.unlimitedStudents === true;
}

// ============================================
// SYNC STATUS & UI FUNCTIONS
// ============================================

function updateSyncStatus(status) {
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    if (!syncIcon || !syncText) return;

    if (status === 'syncing') {
        syncIcon.textContent = '🔄';
        syncText.textContent = 'Syncing...';
    } else if (status === 'synced') {
        syncIcon.textContent = '☁️';
        syncText.textContent = 'Synced';
    } else if (status === 'error') {
        syncIcon.textContent = '⚠️';
        syncText.textContent = 'Offline';
    }
}

function updateLastSavedTime() {
    const lastSavedEl = document.getElementById('lastSavedTime');
    if (lastSavedEl && appData.lastSaved) {
        const savedDate = new Date(appData.lastSaved);
        lastSavedEl.textContent = savedDate.toLocaleString();
    }
}

function teacherIdDisplay() { 
    if (!currentUserId) {
        console.warn("Teacher ID not available yet");
        return; 
    }

    const el = document.getElementById("teacherIdDisplay"); 
    if (el) {  
        el.textContent = currentUserId;   
    }
}

function copyTeacherId() {   
    if (!currentUserId) return;

    navigator.clipboard.writeText(currentUserId)        
        .then(() => alert("✅ Teacher ID copied"))     
        .catch(() => alert("❌ Copy failed"));
}

function testLoadAdminUsers() {
    console.log('🔧 MANUAL TEST - Loading users...');
    console.log('Is Admin:', isAdmin);
    console.log('Admin Role:', adminRole);
    console.log('Permissions:', adminPermissions);
    console.log('Current User:', currentUser ? currentUser.email : 'Not logged in');

    loadAllUsers();
}

// ============================================
// NAVIGATION FUNCTIONS - UPDATED
// ============================================

function navigateTo(screenName) {
    console.log('🔄 Navigating to:', screenName);

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName).classList.add('active');

    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    const menuItem = document.querySelector(`.menu-item[data-screen="${screenName}"]`);

    if (menuItem) menuItem.classList.add('active');

    toggleSidebar();

    // ⭐ UPDATED: Call screen-specific functions with initialization
    if (screenName === 'students') {
        loadStudentsScreen();
    }
    
    if (screenName === 'timetable') {
        // ⭐ NEW: Initialize timetable screen first
        if (typeof initTimetableScreen === 'function') {
            initTimetableScreen();
        }
        loadTimetable();
    }
    
    if (screenName === 'attendance') {
        const dateInput = document.getElementById('attendanceDateSelect');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        // ⭐ NEW: Initialize attendance screen
        if (typeof initAttendanceScreen === 'function') {
            initAttendanceScreen();
        }
    }
    
    if (screenName === 'payments') loadPaymentHistory();
    
    if (screenName === 'settings') {
        loadSettings();
        // ⭐ NEW: Check for class assignment popup
        if (typeof checkClassAssignmentNeeded === 'function') {
            checkClassAssignmentNeeded();
        }
    }
    
    if (screenName === 'subscription') updateSubscriptionDisplay();

    // AUTO-LOAD users when opening admin panel
    if (screenName === 'admin-panel') {
        console.log('📊 Admin panel opened - auto-loading users...');
        setTimeout(() => {
            loadAllUsers();
        }, 200);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

// ============================================
// GRADE DROPDOWN POPULATION
// ============================================

function populateGradeDropdowns() {
    const html = appData.grades.map(g => `<option value="${g}">Grade ${g}</option>`).join('');

    // Only update elements that exist    
    const gradeFilter = document.getElementById('gradeFilter');

    if (gradeFilter) {
        gradeFilter.innerHTML = '<option value="all">All Grades</option>' + html;
    }

    const studentGradeFilter = document.getElementById('studentGradeFilter');
    if (studentGradeFilter) {
        studentGradeFilter.innerHTML = '<option value="all">All Grades</option>' + html;
    }

    const studentGradeInput = document.getElementById('studentGradeInput');
    if (studentGradeInput) {
        studentGradeInput.innerHTML = '<option value="">Select Grade</option>' + html;
    }

    const attendanceGrade = document.getElementById('attendanceGrade');
    if (attendanceGrade) {
        attendanceGrade.innerHTML = html;
    }

    const attendanceClassSelect = document.getElementById('attendanceClassSelect');
    if (attendanceClassSelect) {
        attendanceClassSelect.innerHTML = '<option value="">Choose a class</option>' + html;
    }

    const timetableGrade = document.getElementById('timetableGrade');
    if (timetableGrade) {
        timetableGrade.innerHTML = html;
    }

    const paymentGradeFilter = document.getElementById('paymentGradeFilter');
    if (paymentGradeFilter) {
        paymentGradeFilter.innerHTML = '<option value="all">All Grades</option>' + html;
    }

    const reportGrade = document.getElementById('reportGrade');
    if (reportGrade) {
        reportGrade.innerHTML = '<option value="all">All Grades</option>' + html;
    }
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

function updateDashboard() {
    const filter = document.getElementById('gradeFilter').value;
    const filtered = filter === 'all' ? appData.students : appData.students.filter(s => s.grade === filter);
    
    document.getElementById('totalStudents').textContent = filtered.length;
    
    const today = new Date().getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayClasses = appData.timetable.filter(t => t.day === days[today]);
    document.getElementById('todayClasses').textContent = todayClasses.length;
    
    const pending = getPendingPayments().length;
    document.getElementById('pendingPayments').textContent = pending;
    
    document.getElementById('attendanceRate').textContent = getTodayAttendanceRate();
    
    const list = document.getElementById('todayClassesList');
    if (todayClasses.length === 0) {
        list.innerHTML = '<p style="color: #6B7280; font-size: 14px;">No classes today</p>';
    } else {
        const classesEnabled = appData.classesEnabled || false; // ⭐ NEW
        
        list.innerHTML = todayClasses.map(c => {
            // ⭐ NEW: Show class info if available
            const classInfo = classesEnabled && c.class ? ` - Class ${c.class}` : '';
            
            return `
                <div style="padding: 12px; background: #EFF6FF; border-radius: 8px; margin-bottom: 8px;">
                    <div style="font-weight: 600;">Grade ${c.grade}${classInfo}</div>
                    <div style="font-size: 14px; color: #6B7280;">${c.time}</div>
                </div>
            `;
        }).join('');
    }
}

function getPendingPayments() {
    const current = new Date();
    return appData.students.filter(student => {
        const payments = appData.payments.filter(p => p.studentId === student.id);
        if (payments.length === 0 && current.getDate() > 14) return true;
        if (payments.length > 0) {
            const last = payments[payments.length - 1];
            const payDate = new Date(last.date);
            const months = (current.getFullYear() - payDate.getFullYear()) * 12 + (current.getMonth() - payDate.getMonth());
            return months > 0 && current.getDate() > 14;
        }
        return false;
    });
}

function getTodayAttendanceRate() {
    const today = new Date().toISOString().split('T')[0];
    const att = appData.attendance[today] || {};
    const total = Object.keys(att).length;
    if (total === 0) return '0%';
    const present = Object.values(att).filter(s => s === 'present').length;
    return Math.round((present / total) * 100) + '%';
}

console.log('✅ core-functions.js loaded (with class support)');
