// ============================================
// Admin Panel - User Management Functions
// ============================================

// ============================================
// LOAD ALL USERS
// ============================================

async function loadAllUsers() {
    console.log('📊 Starting loadAllUsers()...');

    // Check admin permissions
    if (!isAdmin) {
        console.error('❌ User is not an admin');
        alert('Access denied: You are not an admin!');
        return;
    }

    if (!adminPermissions.canViewAllUsers) {
        console.error('❌ No permission to view all users');
        alert('Access denied: You do not have permission to view all users!');
        return;
    }

    console.log('✅ Admin permissions verified');
    console.log('👤 Current User:', currentUser.email);
    console.log('🔑 Admin Role:', adminRole);

    try {
        console.log('🔍 Fetching users from Firebase...');
        const usersSnapshot = await database.ref('users').once('value');

        if (!usersSnapshot.exists()) {
            console.warn('⚠️ No users found in database');
            alert('No users found in the database.');
            return;
        }

        console.log('✅ Users data retrieved from Firebase');

        allUsersData = [];
        let userCount = 0;

        usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const userData = userSnapshot.val();
    
            userCount++;
            console.log(`Processing user ${userCount}:`, userId);
    
            if (userData) {
                // Try to find email in multiple possible locations
                let email = 'No email found';
        
                if (userData.profile && userData.profile.email) {
                    email = userData.profile.email;
                } else if (userData.email) {
                    email = userData.email;
                } else if (userData.data && userData.data.email) {
                    email = userData.data.email;
                }
        
                console.log('  📧 Email:', email);
                console.log('  📊 Students:', (userData.data?.students || []).length);
        
                const userInfo = {
                    userId: userId,
                    email: email,
                    createdAt: userData.profile?.createdAt || null,
                    studentsCount: (userData.data?.students || []).length,
                    paymentsCount: (userData.data?.payments || []).length,
                    subscription: userData.data?.subscription || {
                        plan: 'free_trial',
                        status: 'active'
                    },                           
                    lastSaved: userData.data?.lastSaved || null
                };
        
                allUsersData.push(userInfo);
            }
        });

        console.log('✅ Processed', allUsersData.length, 'users');
        console.log('📊 All users data:', allUsersData);

        // Update stats
        updateAdminStats();

        // Display users in table
        displayUsersTable();

        return allUsersData;

    } catch (error) {
        console.error('❌ Error loading users:', error);
        console.error('Error details:', error.message, error.stack);
        alert('Failed to load users: ' + error.message);
    }
}

// ============================================
// UPDATE ADMIN STATS
// ============================================

function updateAdminStats() {
    // Total users
    const totalUsers = document.getElementById('adminTotalUsers');
    if (totalUsers) {
        totalUsers.textContent = allUsersData.length;
    }

    // Active subscriptions
    const activeSubscriptions = allUsersData.filter(u => 
        u.subscription.status === 'active' && 
        u.subscription.plan !== 'free_trial'
    ).length;

    const activeSubs = document.getElementById('adminActiveSubscriptions');
    if (activeSubs) {
        activeSubs.textContent = activeSubscriptions;
    }

    // Total students
    const totalStudents = allUsersData.reduce((sum, user) => sum + user.studentsCount, 0);
    const totalStudentsEl = document.getElementById('adminTotalStudents');
    if (totalStudentsEl) {
        totalStudentsEl.textContent = totalStudents;
    }

    // Total revenue (example - you'd calculate from actual payment data)
    const totalRevenue = activeSubscriptions * 1000; // Simplified
    const totalRevenueEl = document.getElementById('adminTotalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = 'LKR ' + totalRevenue.toLocaleString();
    }
}

// ============================================
// DISPLAY USERS TABLE
// ============================================

function displayUsersTable() {
    console.log('📋 Displaying users table...');

    const tbody = document.getElementById('adminUsersTableBody');

    if (!tbody) {
        console.error('❌ Table body not found: adminUsersTableBody');
        return;
    }

    if (!allUsersData || allUsersData.length === 0) {
        console.warn('⚠️ No users to display');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                    No users found in database
                </td>
            </tr>
        `;
        return;
    }

    console.log('✅ Displaying', allUsersData.length, 'users');

    tbody.innerHTML = '';

    allUsersData.forEach((user, index) => {
        console.log(`Adding user ${index + 1} to table:`, user.email);

        const row = document.createElement('tr');

        const statusClass = user.subscription.status === 'active' ? 'status-active' : 'status-inactive';
        const statusText = user.subscription.status === 'active' ? '✅ Active' : '❌ Inactive';

        row.innerHTML = `
            <td><strong>${user.email}</strong></td>
            <td><code style="font-size: 11px;">${user.userId.substring(0, 20)}...</code></td>
            <td><strong>${user.studentsCount}</strong></td>
            <td><span class="badge badge-${user.subscription.plan}">${user.subscription.plan}</span></td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-small btn-primary" onclick="viewUserDetails('${user.userId}')">👁️ View</button>
                ${adminPermissions.canManageSubscriptions ? `
                <button class="btn-small btn-success" onclick="manageUserSubscription('${user.userId}')">💳 Manage</button>
                ` : ''}
                ${adminPermissions.canDeleteUsers ? `
                <button class="btn-small btn-danger" onclick="deleteUser('${user.userId}')">🗑️ Delete</button>
                ` : ''}
            </td>
        `;

        tbody.appendChild(row);
    });

    console.log('✅ Table displayed successfully');
}

// ============================================
// VIEW USER DETAILS
// ============================================

async function viewUserDetails(userId) {
    if (!isAdmin || !adminPermissions.canViewAllUsers) {
        alert('Access denied!');
        return;
    }

    try {
        const userSnapshot = await database.ref('users/' + userId).once('value');
        const userData = userSnapshot.val();

        if (!userData) {
            alert('User not found!');
            return;
        }

        // Show modal with user details
        showUserDetailsModal(userId, userData);

    } catch (error) {
        console.error('Error loading user details:', error);
        alert('Failed to load user details');
    }
}

function showUserDetailsModal(userId, userData) {
    const modal = `
        <div class="modal-overlay" id="userDetailsModal" onclick="closeModal('userDetailsModal')">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="modal-close" onclick="closeModal('userDetailsModal')">×</button>
                </div>
                <div class="modal-body">
                    <h3>Profile Information</h3>
                    <p><strong>Email:</strong> ${userData.profile?.email || 'N/A'}</p>
                    <p><strong>User ID:</strong> <code>${userId}</code></p>
                    <p><strong>Created:</strong> ${userData.profile?.createdAt ? new Date(userData.profile.createdAt).toLocaleString() : 'N/A'}</p>
            
                    <h3>Subscription</h3>
                    <p><strong>Plan:</strong> ${userData.data?.subscription?.plan || 'free_trial'}</p>
                    <p><strong>Status:</strong> ${userData.data?.subscription?.status || 'active'}</p>
                    <p><strong>Max Students:</strong> ${userData.data?.subscription?.maxStudents || 10}</p>
            
                    <h3>Data Statistics</h3>
                    <p><strong>Students:</strong> ${(userData.data?.students || []).length}</p>
                    <p><strong>Timetable Entries:</strong> ${(userData.data?.timetable || []).length}</p>
                    <p><strong>Payments:</strong> ${(userData.data?.payments || []).length}</p>
                    <p><strong>Last Saved:</strong> ${userData.data?.lastSaved ? new Date(userData.data.lastSaved).toLocaleString() : 'Never'}</p>
            
                    ${adminPermissions.canEditAllUsers ? `
                    <h3>Actions</h3>
                    <button class="btn btn-primary" onclick="exportUserData('${userId}')">📥 Export Data</button>
                    <button class="btn btn-success" onclick="grantUnlimitedAccess('${userId}')">⭐ Grant Unlimited</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ============================================
// MANAGE USER SUBSCRIPTION
// ============================================

async function manageUserSubscription(userId) {
    if (!isAdmin || !adminPermissions.canManageSubscriptions) {
        alert('Access denied!');
        return;
    }

    const user = allUsersData.find(u => u.userId === userId);
    if (!user) return;

    const modal = `
        <div class="modal-overlay" id="subscriptionModal" onclick="closeModal('subscriptionModal')">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Manage Subscription</h2>
                    <button class="modal-close" onclick="closeModal('subscriptionModal')">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>User:</strong> ${user.email}</p>
                    <p><strong>Current Plan:</strong> ${user.subscription.plan}</p>
            
                    <div class="form-group">
                        <label>New Plan:</label>
                        <select id="newSubscriptionPlan">
                            <option value="free_trial">Free Trial (10 students)</option>
                            <option value="monthly">Monthly (Unlimited)</option>
                            <option value="annual">Annual (Unlimited)</option>
                            <option value="lifetime">Lifetime (Unlimited)</option>
                        </select>
                    </div>
            
                    <div class="form-group">
                        <label>Status:</label>
                        <select id="newSubscriptionStatus">
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
            
                    <button class="btn btn-primary" onclick="updateSubscription('${userId}')">💾 Update Subscription</button>
                    <button class="btn btn-success" onclick="grantUnlimitedAccess('${userId}')">⭐ Grant Unlimited</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

// ============================================
// UPDATE SUBSCRIPTION
// ============================================

function updateSubscription(userId, plan) {
    console.log('💳 Updating subscription for user:', userId, 'Plan:', plan);

    let subscription;

    if (plan === 'free') {
        subscription = {
            plan: 'free',
            status: 'active',
            maxStudents: 10,
            startDate: new Date().toISOString(),
            endDate: null,
            features: {
                unlimitedStudents: false,
                unlimitedClasses: false,
                unlimitedPayments: false,
                analytics: false,
                exportData: false,
                priority: false
            }
        };
    } else if (plan === 'pro') {
        subscription = {
            plan: 'pro',
            status: 'active',
            maxStudents: 50,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(), // 1 year
            features: {
                unlimitedStudents: false,
                unlimitedClasses: true,
                unlimitedPayments: true,
                analytics: true,
                exportData: true,
                priority: true
            }
        };
    } else if (plan === 'unlimited') {
        subscription = {
            plan: 'unlimited',
            status: 'active',
            maxStudents: 999999,  // ⭐ Changed from Infinity
            startDate: new Date().toISOString(),
            endDate: null,
            features: {
                unlimitedStudents: true,
                unlimitedClasses: true,
                unlimitedPayments: true,
                analytics: true,
                exportData: true,
                priority: true
            }
        };
    }

    database.ref('users/' + userId + '/data/subscription').set(subscription)
        .then(() => {
            console.log('✅ Subscription updated successfully');
            alert('✅ Subscription updated to ' + plan + '!');
            
            // Log admin action
            logAdminAction('update_subscription', {
                targetUser: userId,
                newPlan: plan,
                updatedBy: currentUserId
            });
    
            // Reload users list
            loadAllUsers();
        })
        .catch((error) => {
            console.error('❌ Error updating subscription:', error);
            alert('❌ Failed to update subscription: ' + error.message);
        });
}

// ============================================
// GRANT UNLIMITED ACCESS
// ============================================

function grantUnlimitedAccess(userId) {
    console.log('🚀 Granting unlimited access to user:', userId);

    const unlimitedSubscription = {
        plan: 'unlimited',
        status: 'active',
        maxStudents: 999999,  // ⭐ Changed from Infinity
        startDate: new Date().toISOString(),
        endDate: null,  // null = never expires
        features: {
            unlimitedStudents: true,
            unlimitedClasses: true,
            unlimitedPayments: true,
            analytics: true,
            exportData: true,
            priority: true
        },
        grantedBy: currentUserId,
        grantedAt: new Date().toISOString()
    };

    database.ref('users/' + userId + '/data/subscription').set(unlimitedSubscription)
        .then(() => {
            console.log('✅ Unlimited access granted successfully');
            alert('✅ Unlimited access granted!\n\nUser now has unlimited students and all features.');
    
            // Log admin action
            logAdminAction('grant_unlimited_access', {
                targetUser: userId,
                grantedBy: currentUserId
            });
    
            // Reload users list
            loadAllUsers();
        })
        .catch((error) => {
            console.error('❌ Error granting access:', error);
            alert('❌ Failed to grant access: ' + error.message);
        });
}

// ============================================
// LOG ADMIN ACTION
// ============================================

async function logAdminAction(action, targetUserId, details) {
    try {
        const logEntry = {
            adminId: currentUserId,
            adminEmail: currentUser.email,
            action: action,
            targetUserId: targetUserId,
            details: details,
            timestamp: new Date().toISOString()
        };

        await database.ref('admin-logs').push(logEntry);
        console.log('📝 Admin action logged:', action);

    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

// ============================================
// FILTER ADMIN USERS
// ============================================

function filterAdminUsers() {
    const searchTerm = document.getElementById('adminUserSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#adminUsersTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ============================================
// SHOW ADMIN TAB
// ============================================

function showAdminTab(tabName) {  
    console.log('🔄 Switching to admin tab:', tabName);

    // Hide all tab contents    
    document.querySelectorAll('.admin-tab-content').forEach(tab => {        
        tab.classList.remove('active');       
        tab.style.display = 'none';    
    });

    // Remove active styling from all buttons   
    document.querySelectorAll('.admin-tab').forEach(btn => {                
        btn.classList.remove('active');        
        btn.style.background = '#f3f4f6';        
        btn.style.color = '#374151';    
    });

    // Show the selected tab    
    const selectedTab = document.getElementById('admin-' + tabName + '-tab');   
    if (selectedTab) {       
        selectedTab.classList.add('active');        
        selectedTab.style.display = 'block';       
        console.log('✅ Tab displayed:', tabName);    
    } else {        
        console.error('❌ Tab not found:', 'admin-' + tabName + '-tab');    
    }

    // Update button styling    
    if (event && event.target) {        
        event.target.classList.add('active');        
        event.target.style.background = '#2563EB';        
        event.target.style.color = 'white';   
    }

    // AUTO-LOAD DATA FOR EACH TAB    
    console.log('📊 Loading data for tab:', tabName);

    if (tabName === 'users') {        
        // Load users automatically       
        setTimeout(() => {            
            console.log('⏳ Calling loadAllUsers()...');            
            loadAllUsers();                        
        }, 100);
   
    } else if (tabName === 'subscriptions') {        
        setTimeout(() => loadSubscriptionsTab(), 100);
    
    } else if (tabName === 'analytics') {
        console.log('📊 Loading analytics...');       
        updateAdminAnalyticsTab();            
    } else if (tabName === 'settings') {        
        setTimeout(() => loadAdminSettingsTab(), 100); 
    }        
}

console.log('✅ admin-users.js loaded');
