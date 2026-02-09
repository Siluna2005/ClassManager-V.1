// ============================================
// Admin Panel - User Management Functions
// COMPLETE VERSION: deleteUser + exportUserData included
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
                    lastSaved: userData.data?.lastSaved || null,
                    data: userData.data || {}  // Store full data for export
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
                <button class="btn-small" style="background: #8b5cf6; color: white;" onclick="exportUserData('${user.userId}')">📥 Export</button>
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
                    <p><strong>Created:</strong> ${userData.profile?.createdAt ? new Date(userData.profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                    
                    <h3 style="margin-top: 20px;">Data Statistics</h3>
                    <p><strong>Students:</strong> ${userData.data?.students?.length || 0}</p>
                    <p><strong>Payments:</strong> ${userData.data?.payments?.length || 0}</p>
                    <p><strong>Timetable Entries:</strong> ${userData.data?.timetable?.length || 0}</p>
                    
                    <h3 style="margin-top: 20px;">Subscription</h3>
                    <p><strong>Plan:</strong> ${userData.data?.subscription?.plan || 'free_trial'}</p>
                    <p><strong>Status:</strong> ${userData.data?.subscription?.status || 'active'}</p>
                    <p><strong>Max Students:</strong> ${userData.data?.subscription?.maxStudents || 10}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('userDetailsModal')">Close</button>
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
// ⭐ NEW: EXPORT USER DATA
// ============================================

async function exportUserData(userId) {
    console.log('📥 Exporting user data:', userId);
    
    if (!isAdmin || !adminPermissions.canViewAllUsers) {
        alert('❌ Access Denied!\n\nYou do not have permission to export user data.');
        return;
    }
    
    try {
        // Fetch user data from Firebase
        const userSnapshot = await database.ref('users/' + userId).once('value');
        const userData = userSnapshot.val();
        
        if (!userData) {
            alert('❌ User not found!');
            return;
        }
        
        const userEmail = userData.profile?.email || 'unknown';
        
        console.log('📊 Preparing export for:', userEmail);
        
        // Create export data
        const exportData = {
            exportInfo: {
                exportedAt: new Date().toISOString(),
                exportedBy: currentUser.email,
                userId: userId,
                userEmail: userEmail
            },
            profile: userData.profile || {},
            data: userData.data || {},
            subscription: userData.data?.subscription || {}
        };
        
        // Convert to JSON
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create blob
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
        link.download = `user_export_${sanitizedEmail}_${date}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        // Log action
        await logAdminAction('export_user_data', userId, {
            exportedEmail: userEmail,
            exportedBy: currentUserId
        });
        
        console.log('✅ User data exported successfully');
        alert(`✅ User Data Exported!\n\nUser: ${userEmail}\n\nFile downloaded successfully.`);
        
    } catch (error) {
        console.error('❌ Error exporting user data:', error);
        alert(`❌ Failed to export user data!\n\nError: ${error.message}`);
    }
}

// ============================================
// MANAGE USER SUBSCRIPTION
// ============================================

async function manageUserSubscription(userId) {
    if (!isAdmin || !adminPermissions.canManageSubscriptions) {
        alert('Access denied: You do not have permission to manage subscriptions!');
        return;
    }

    try {
        const userSnapshot = await database.ref('users/' + userId).once('value');
        const userData = userSnapshot.val();

        if (!userData) {
            alert('User not found!');
            return;
        }

        const currentSub = userData.data?.subscription || {};

        const modal = `
            <div class="modal-overlay" id="subscriptionModal" onclick="closeModal('subscriptionModal')">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2>Manage Subscription</h2>
                        <button class="modal-close" onclick="closeModal('subscriptionModal')">×</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>User:</strong> ${userData.profile?.email || 'Unknown'}</p>
                        <p><strong>Current Plan:</strong> ${currentSub.plan || 'free_trial'}</p>
                
                        <div class="form-group" style="margin-top: 20px;">
                            <label>Select New Plan:</label>
                            <select id="newPlanSelect" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                                <option value="free_trial">Free Trial (10 students)</option>
                                <option value="monthly">Monthly Plan (Unlimited)</option>
                                <option value="annual">Annual Plan (Unlimited)</option>
                                <option value="unlimited">Unlimited (Lifetime)</option>
                            </select>
                        </div>
                
                        <div class="form-group" style="margin-top: 16px;">
                            <label>Status:</label>
                            <select id="statusSelect" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                
                        <button class="btn btn-primary" onclick="updateSubscription('${userId}')" style="margin-top: 20px; width: 100%;">💾 Update Subscription</button>
                        <button class="btn btn-success" onclick="grantUnlimitedAccess('${userId}')" style="margin-top: 10px; width: 100%;">⭐ Grant Unlimited Access</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modal);

    } catch (error) {
        console.error('Error loading subscription:', error);
        alert('Failed to load subscription details');
    }
}

// ============================================
// UPDATE SUBSCRIPTION
// ============================================

async function updateSubscription(userId) {
    console.log('💳 Updating subscription for user:', userId);

    const planSelect = document.getElementById('newPlanSelect');
    const statusSelect = document.getElementById('statusSelect');
    
    if (!planSelect || !statusSelect) {
        alert('Error: Form elements not found');
        return;
    }

    const plan = planSelect.value;
    const status = statusSelect.value;

    let subscription;

    if (plan === 'free_trial') {
        subscription = {
            plan: 'free_trial',
            status: status,
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
    } else if (plan === 'monthly') {
        subscription = {
            plan: 'monthly',
            status: status,
            maxStudents: 999999,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // 30 days
            features: {
                unlimitedStudents: true,
                unlimitedClasses: true,
                unlimitedPayments: true,
                analytics: true,
                exportData: true,
                priority: true
            }
        };
    } else if (plan === 'annual') {
        subscription = {
            plan: 'annual',
            status: status,
            maxStudents: 999999,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(), // 1 year
            features: {
                unlimitedStudents: true,
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
            status: status,
            maxStudents: 999999,
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

    try {
        await database.ref('users/' + userId + '/data/subscription').set(subscription);
        console.log('✅ Subscription updated successfully');
        alert(`✅ Subscription updated to ${plan}!`);
        
        // Log admin action
        await logAdminAction('update_subscription', userId, {
            newPlan: plan,
            newStatus: status,
            updatedBy: currentUserId
        });

        // Close modal
        closeModal('subscriptionModal');
        
        // Reload users list
        loadAllUsers();
        
    } catch (error) {
        console.error('❌ Error updating subscription:', error);
        alert('❌ Failed to update subscription: ' + error.message);
    }
}

// ============================================
// GRANT UNLIMITED ACCESS
// ============================================

async function grantUnlimitedAccess(userId) {
    console.log('🚀 Granting unlimited access to user:', userId);

    if (!confirm('Grant unlimited lifetime access to this user?\n\nThis will:\n- Set plan to Unlimited\n- Remove student limit\n- Enable all features\n- Never expire\n\nContinue?')) {
        return;
    }

    const unlimitedSubscription = {
        plan: 'unlimited',
        status: 'active',
        maxStudents: 999999,
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

    try {
        await database.ref('users/' + userId + '/data/subscription').set(unlimitedSubscription);
        console.log('✅ Unlimited access granted successfully');
        alert('✅ Unlimited access granted!\n\nUser now has unlimited students and all features.');

        // Log admin action
        await logAdminAction('grant_unlimited_access', userId, {
            grantedBy: currentUserId
        });

        // Close modal
        closeModal('subscriptionModal');
        
        // Reload users list
        loadAllUsers();
        
    } catch (error) {
        console.error('❌ Error granting access:', error);
        alert('❌ Failed to grant access: ' + error.message);
    }
}

// ============================================
// DELETE USER FUNCTION
// ============================================

async function deleteUser(userId) {
    console.log('🗑️ Delete user requested:', userId);
    
    // Check permissions
    if (!isAdmin || !adminPermissions.canDeleteUsers) {
        alert('❌ Access Denied!\n\nYou do not have permission to delete users.');
        return;
    }
    
    try {
        // Get user data first
        const userSnapshot = await database.ref('users/' + userId).once('value');
        const userData = userSnapshot.val();
        
        if (!userData) {
            alert('❌ User not found!');
            return;
        }
        
        const userEmail = userData.profile?.email || 'Unknown';
        const studentsCount = userData.data?.students?.length || 0;
        
        // Confirm deletion
        const confirm1 = confirm(
            `⚠️ DELETE USER?\n\n` +
            `Email: ${userEmail}\n` +
            `User ID: ${userId.substring(0, 20)}...\n` +
            `Students: ${studentsCount}\n\n` +
            `This will permanently delete:\n` +
            `- User account\n` +
            `- All student data\n` +
            `- All payment records\n` +
            `- All attendance data\n` +
            `- All timetable entries\n\n` +
            `THIS CANNOT BE UNDONE!\n\n` +
            `Continue?`
        );
        
        if (!confirm1) {
            console.log('User cancelled deletion');
            return;
        }
        
        // Second confirmation
        const confirm2 = confirm(
            `⚠️ FINAL CONFIRMATION\n\n` +
            `Are you ABSOLUTELY SURE you want to delete this user?\n\n` +
            `Email: ${userEmail}\n\n` +
            `This is your last chance to cancel!`
        );
        
        if (!confirm2) {
            console.log('User cancelled deletion (final confirmation)');
            return;
        }
        
        console.log('🔥 Deleting user data...');
        
        // Delete user data from Firebase
        await database.ref('users/' + userId).remove();
        
        console.log('✅ User deleted successfully');
        
        // Log admin action
        await logAdminAction('delete_user', userId, {
            deletedEmail: userEmail,
            studentsCount: studentsCount,
            deletedBy: currentUserId
        });
        
        alert(`✅ User Deleted Successfully!\n\nUser: ${userEmail}\n\nAll data has been permanently removed.`);
        
        // Reload users list
        loadAllUsers();
        
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        alert(`❌ Failed to delete user!\n\nError: ${error.message}\n\nPlease try again or contact support.`);
    }
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

console.log('✅ admin-users.js loaded (COMPLETE: deleteUser + exportUserData)');
