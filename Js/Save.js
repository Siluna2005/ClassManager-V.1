// ============================================
// UPDATED saveData() FUNCTION
// ============================================

function saveData() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.error('❌ No user authenticated');
        return Promise.reject('No user authenticated');
    }

    try {
        const dataToSave = {
            ...appData,
            lastSaved: new Date().toISOString()
        };
        
        console.log('💾 Saving data to Firebase (cloud only)...');
        updateSyncStatus('syncing');
        
        // ✅ SAVE TO FIREBASE ONLY (Single Source of Truth)
        return database.ref('users/' + currentUserId + '/data').set(dataToSave)
            .then(() => {
                console.log('✅ Data saved to Firebase successfully');
                
                // Update user last activity
                if (currentUserId) {
                    updateUserLastActivity(currentUserId);
                }
                
                // Optional: Keep temporary session cache for offline viewing
                const cacheData = {
                    data: dataToSave,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
                updateLastSavedTime();
                updateSyncStatus('synced');
                
                return true;
            })
            .catch((error) => {
                console.error('❌ Firebase save error:', error);
                updateSyncStatus('error');
                
                // Show user-friendly error message
                alert('⚠️ Failed to save data to cloud\n\nError: ' + error.message + '\n\nPlease check your internet connection and try again.');
                
                return false;
            });
        
    } catch (error) {
        console.error('❌ Error saving data:', error);
        updateSyncStatus('error');
        return Promise.reject(error);
    }
    
    // ❌ REMOVED THE STRAY .then() BLOCK THAT WAS HERE
    // This was causing the syntax error at line 57
}

// ============================================
// CORRECTED loadData() FUNCTION
// ============================================

function loadData() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.error('❌ No user authenticated');
        return;
    }

    console.log('📥 Loading data from Firebase (cloud only)...');
    updateSyncStatus('syncing');
   
    // ✅ LOAD FROM FIREBASE ONLY (Single Source of Truth)
    database.ref('users/' + currentUserId + '/data').once('value')
        .then((snapshot) => {
            const firebaseData = snapshot.val();
        
            if (firebaseData) {
                // ✅ Data exists in Firebase - Load it
                console.log('✅ Data loaded from Firebase successfully');
                
                appData = {
                    ...appData,
                    ...firebaseData,
                    students: firebaseData.students || [],
                    timetable: firebaseData.timetable || [],
                    payments: firebaseData.payments || [],
                    attendance: firebaseData.attendance || {},
                    grades: firebaseData.grades || ['06', '07', '08', '09', '10', '11', '12'],
                    subscription: firebaseData.subscription || appData.subscription
                };
                
                // Update session cache for offline viewing
                const cacheData = {
                    data: firebaseData,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
            } else {
                // ℹ️ No Firebase data - New user
                console.log('ℹ️ No Firebase data found - First time user');
                console.log('📤 Saving default data to Firebase...');
                
                // Save default data to Firebase
                saveData();
            }
        
            // Update the UI
            populateGradeDropdowns();
            updateDashboard();
            updateSyncStatus('synced');
            teacherIdDisplay();
        })
        .catch((error) => {
            // ❌ Firebase error - Try offline cache
            console.error('❌ Firebase load error:', error);
            updateSyncStatus('error');
            
            // Try to load from session cache (offline mode)
            const cache = sessionStorage.getItem('tempCache_' + currentUserId);
            
            if (cache) {
                try {
                    const cached = JSON.parse(cache);
                    const cacheExpiry = new Date(cached.expiresAt);
                    
                    if (new Date() < cacheExpiry) {
                        console.log('📦 Loading from temporary cache (offline mode)');
                        
                        appData = {
                            ...appData,
                            ...cached.data,
                            students: cached.data.students || [],
                            timetable: cached.data.timetable || [],
                            payments: cached.data.payments || [],
                            attendance: cached.data.attendance || {},
                            grades: cached.data.grades || ['06', '07', '08', '09', '10', '11', '12']
                        };
                        
                        populateGradeDropdowns();
                        updateDashboard();
                        
                        // Show offline warning
                        alert('⚠️ OFFLINE MODE\n\nShowing cached data from your last session.\n\n❌ Changes cannot be saved until you reconnect to the internet.\n\nPlease check your connection and refresh the page.');
                        
                    } else {
                        // Cache expired
                        console.log('❌ Cache expired');
                        alert('❌ Cannot Load Data\n\nNo internet connection and cached data has expired (older than 24 hours).\n\nPlease connect to the internet and try again.');
                    }
                    
                } catch (cacheError) {
                    console.error('❌ Cache parse error:', cacheError);
                    alert('❌ Cannot Load Data\n\nNo internet connection and cache is corrupted.\n\nPlease connect to the internet and try again.');
                }
            } else {
                // No cache available
                console.log('❌ No cache available');
                alert('❌ Cannot Load Data\n\nNo internet connection and no cached data available.\n\nPlease connect to the internet and try again.');
            }
        });
}

// ============================================
// enableRealtimeSync() FUNCTION
// ============================================

function enableRealtimeSync() {
    // Check if user is authenticated
    if (!currentUserId) {
        console.warn('⚠️ Cannot enable sync: No user authenticated');
        return;
    }

    console.log('🔄 Real-time sync enabled (Firebase only)');

    // ✅ LISTEN FOR FIREBASE CHANGES ONLY
    database.ref('users/' + currentUserId + '/data').on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (data && data.lastSaved) {
            // Only update if the remote data is newer than what we have
            if (!lastSyncedTimestamp || data.lastSaved > lastSyncedTimestamp) {
                lastSyncedTimestamp = data.lastSaved;
                
                console.log('🔄 Data updated from cloud');
                
                // Update local appData
                appData = {
                    ...appData,
                    ...data,
                    students: data.students || [],
                    timetable: data.timetable || [],
                    payments: data.payments || [],
                    attendance: data.attendance || {},
                    grades: data.grades || ['06', '07', '08', '09', '10', '11', '12'],
                    subscription: data.subscription || appData.subscription
                };
                
                // Update session cache
                const cacheData = {
                    data: data,
                    cachedAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                };
                sessionStorage.setItem('tempCache_' + currentUserId, JSON.stringify(cacheData));
                
                // Refresh current screen
                const activeScreen = document.querySelector('.screen.active');
                if (activeScreen) {
                    const screenId = activeScreen.id;
                    
                    console.log('🔄 Refreshing screen:', screenId);
                    
                    if (screenId === 'students') {
                        loadStudentsScreen();
                    } else if (screenId === 'timetable') {
                        loadTimetable();
                    } else if (screenId === 'payments') {
                        loadPaymentHistory();
                    } else if (screenId === 'dashboard') {
                        updateDashboard();
                    } else if (screenId === 'settings') {
                        loadSettings();
                    } else if (screenId === 'subscription') {
                        updateSubscriptionDisplay();
                    }
                }
                
                // Show subtle notification
                console.log('✅ Data synced from cloud');
            }
        }
    }, (error) => {
        console.error('❌ Real-time sync error:', error);
        updateSyncStatus('error');
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Update user last activity (if function exists)
function updateUserLastActivity(userId) {
    if (!userId) return;
    
    const now = new Date().toISOString();
    
    database.ref('users/' + userId + '/profile/lastActivity').set(now)
        .then(() => {
            console.log('✅ Last activity updated');
        })
        .catch((error) => {
            console.error('❌ Error updating last activity:', error);
        });
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ADD THIS AT THE VERY END OF Save.js
// ============================================

// Make functions globally available
if (typeof saveData === 'function') {
    window.saveData = saveData;
    console.log('✅ saveData made globally available');
} else {
    console.error('❌ saveData function not found');
}

if (typeof loadData === 'function') {
    window.loadData = loadData;
    console.log('✅ loadData made globally available');
} else {
    console.error('❌ loadData function not found');
}

if (typeof enableRealtimeSync === 'function') {
    window.enableRealtimeSync = enableRealtimeSync;
    console.log('✅ enableRealtimeSync made globally available');
}

// Migration function
window.migrateLocalStorageToFirebase = async function() {
    if (!currentUserId) {
        console.log('⚠️ Cannot migrate: No user authenticated');
        return;
    }
    
    console.log('🔄 Checking for local data migration...');
    
    try {
        const oldLocalDataKey = 'classManagerData_' + currentUserId;
        const oldLocalData = localStorage.getItem(oldLocalDataKey);
        
        if (oldLocalData) {
            console.log('📦 Found old localStorage data');
            const parsedData = JSON.parse(oldLocalData);
            
            const snapshot = await database.ref('users/' + currentUserId + '/data').once('value');
            
            if (!snapshot.exists()) {
                console.log('📤 Migrating localStorage data to Firebase...');
                
                await database.ref('users/' + currentUserId + '/data').set({
                    ...parsedData,
                    lastSaved: new Date().toISOString(),
                    migratedAt: new Date().toISOString()
                });
                
                console.log('✅ Migration complete');
                localStorage.removeItem(oldLocalDataKey);
            } else {
                console.log('ℹ️ Firebase data exists - removing old localStorage');
                localStorage.removeItem(oldLocalDataKey);
            }
        } else {
            console.log('✅ No old localStorage data found');
        }
    } catch (error) {
        console.error('❌ Migration error:', error);
    }
};

console.log('✅ migrateLocalStorageToFirebase made globally available');

// Final confirmation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Save.js loaded successfully');
console.log('✅ All functions available globally');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        


// ============================================
// SYNC BUTTON DIAGNOSTIC
// Run this in browser console to diagnose the issue
// ============================================

function diagnoseSyncButton() {
    console.log('🔍 DIAGNOSING SYNC BUTTON...');
    console.log('================================');
    
    // Check if button exists
    const syncBtn = document.getElementById('syncNowBtn');
    console.log('1. Sync button element:', syncBtn ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (syncBtn) {
        console.log('   - onclick:', syncBtn.getAttribute('onclick'));
        console.log('   - disabled:', syncBtn.disabled);
        console.log('   - display:', window.getComputedStyle(syncBtn).display);
    }
    
    // Check if function exists
    console.log('2. syncNowManual function:', typeof syncNowManual !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    
    if (typeof syncNowManual === 'undefined') {
        console.error('❌ ERROR: syncNowManual() function is not defined!');
        console.log('   Solution: Add the sync functions to your code');
    }
    
    // Check supporting functions
    console.log('3. updateSyncStats function:', typeof updateSyncStats !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    console.log('4. updateLastSyncTimeDisplay function:', typeof updateLastSyncTimeDisplay !== 'undefined' ? '✅ EXISTS' : '❌ NOT FOUND');
    
    // Check UI elements
    const syncStatus = document.getElementById('syncStatusMessage');
    const syncText = document.getElementById('syncStatusText');
    const lastSyncTime = document.getElementById('lastSyncTime');
    const syncIndicator = document.getElementById('syncIndicator');
    
    console.log('5. UI Elements:');
    console.log('   - syncStatusMessage:', syncStatus ? '✅' : '❌');
    console.log('   - syncStatusText:', syncText ? '✅' : '❌');
    console.log('   - lastSyncTime:', lastSyncTime ? '✅' : '❌');
    console.log('   - syncIndicator:', syncIndicator ? '✅' : '❌');
    
    // Check Firebase
    console.log('6. Firebase:');
    console.log('   - database:', typeof database !== 'undefined' ? '✅' : '❌');
    console.log('   - currentUserId:', typeof currentUserId !== 'undefined' && currentUserId ? '✅ ' + currentUserId : '❌');
    
    // Check saveData and loadData
    console.log('7. Core Functions:');
    console.log('   - saveData:', typeof saveData !== 'undefined' ? '✅' : '❌');
    console.log('   - loadData:', typeof loadData !== 'undefined' ? '✅' : '❌');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (typeof syncNowManual === 'undefined') {
        console.log('❌ CRITICAL: syncNowManual() function missing!');
        console.log('   → Add SYNC_FUNCTIONS_COMPLETE.js to your code');
    }
    
    if (typeof updateSyncStats === 'undefined') {
        console.log('❌ updateSyncStats() function missing!');
        console.log('   → Add from SYNC_FUNCTIONS_COMPLETE.js');
    }
    
    if (typeof updateLastSyncTimeDisplay === 'undefined') {
        console.log('❌ updateLastSyncTimeDisplay() function missing!');
        console.log('   → Add from SYNC_FUNCTIONS_COMPLETE.js');
    }
    
    if (!syncBtn) {
        console.log('❌ Sync button HTML missing!');
        console.log('   → Add sync button HTML to Settings screen');
    }
    
    console.log('\n================================');
    console.log('✅ DIAGNOSTIC COMPLETE');
    
    // Try to manually trigger sync
    if (typeof syncNowManual !== 'undefined') {
        console.log('\n🧪 TESTING: Attempting manual sync...');
        try {
            syncNowManual();
            console.log('✅ Sync function executed');
        } catch (error) {
            console.error('❌ Sync function error:', error);
        }
    }
}

// Run diagnostic
diagnoseSyncButton();

// ============================================
// ADD THIS TO THE VERY END OF Save.js
// This makes all functions globally available
// ============================================

// Check if functions exist before making them global
if (typeof saveData === 'function') {
    window.saveData = saveData;
    console.log('✅ saveData made globally available');
} else {
    console.error('❌ saveData function not found in Save.js');
}

if (typeof loadData === 'function') {
    window.loadData = loadData;
    console.log('✅ loadData made globally available');
} else {
    console.error('❌ loadData function not found in Save.js');
}

if (typeof enableRealtimeSync === 'function') {
    window.enableRealtimeSync = enableRealtimeSync;
    console.log('✅ enableRealtimeSync made globally available');
}

// Migration function
window.migrateLocalStorageToFirebase = async function() {
    if (!currentUserId) {
        console.log('⚠️ Cannot migrate: No user authenticated');
        return;
    }
    
    console.log('🔄 Checking for local data migration...');
    
    try {
        // Check for old localStorage data
        const oldLocalDataKey = 'classManagerData_' + currentUserId;
        const oldLocalData = localStorage.getItem(oldLocalDataKey);
        
        if (oldLocalData) {
            console.log('📦 Found old localStorage data');
            const parsedData = JSON.parse(oldLocalData);
            
            // Check if Firebase already has data
            const snapshot = await database.ref('users/' + currentUserId + '/data').once('value');
            
            if (!snapshot.exists()) {
                // Firebase is empty - migrate localStorage data
                console.log('📤 Migrating localStorage data to Firebase...');
                
                await database.ref('users/' + currentUserId + '/data').set({
                    ...parsedData,
                    lastSaved: new Date().toISOString(),
                    migratedAt: new Date().toISOString()
                });
                
                console.log('✅ Migration complete - removing old localStorage data');
                localStorage.removeItem(oldLocalDataKey);
                
            } else {
                // Firebase already has data - just remove old localStorage
                console.log('ℹ️ Firebase data exists - removing redundant localStorage');
                localStorage.removeItem(oldLocalDataKey);
            }
            
        } else {
            console.log('✅ No old localStorage data found - migration not needed');
        }
    } catch (error) {
        console.error('❌ Migration error:', error);
    }
};

console.log('✅ migrateLocalStorageToFirebase made globally available');

// Final confirmation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Save.js loaded successfully');
console.log('✅ All functions available globally');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

