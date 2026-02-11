// ============================================
// ADMIN SETTINGS TAB FUNCTIONS
// ============================================

function loadAdminSettingsTab() {
    if (adminRole !== 'super_admin') {
        document.getElementById('adminsList').innerHTML = '<p style="color: #ef4444;">❌ Only super admins can manage admin settings.</p>';
        return;
    }

    console.log('⚙️ Loading admin settings...');

    loadAdminList();
}

async function loadAdminList() {
    if (adminRole !== 'super_admin') {
        return;
    }

    const adminsList = document.getElementById('adminsList');

    if (!adminsList) {
        console.error('adminsList element not found');
        return;
    }

    try {
        // Load admin list from /admins/
        const adminsSnapshot = await database.ref('admins').once('value');
        const adminsData = adminsSnapshot.val();

        if (!adminsData) {
            adminsList.innerHTML = `
                <h3>Current Admins</h3>
                <p style="color: #6b7280;">No admins found in database.</p>
            `;
            return;
        }

        // Convert to array
        const adminsArray = Object.keys(adminsData).map(key => ({
            emailKey: key,
            email: key.replace(/_/g, '.'),
            isActive: adminsData[key]
        }));

        // Load admin details
        const adminDetailsSnapshot = await database.ref('admin-users').once('value');
        const adminDetails = adminDetailsSnapshot.val() || {};

        adminsList.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #f1f5f9; font-family: Sora, sans-serif; font-size: 18px; font-weight: 700;">Current Admins (${adminsArray.length})</h3>
            <div style="display: grid; gap: 15px;">
                ${adminsArray.map(admin => {
                    // Find admin details
                    let adminInfo = null;
                    let adminId = null;
            
                    Object.keys(adminDetails).forEach(uid => {
                        if (adminDetails[uid].email === admin.email) {
                            adminInfo = adminDetails[uid];
                            adminId = uid;
                        }
                    });
            
                    const isCurrentUser = admin.email === currentUser.email;
            
                    return `
                        <div class="admin-card" style="background: ${isCurrentUser ? 'rgba(20,184,166,0.06)' : '#1e293b'}; border: 1px solid ${isCurrentUser ? 'rgba(45,212,191,0.25)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div class="admin-info" style="display: flex; gap: 12px; align-items: center; flex: 1;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;">
                                    ${admin.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: #f1f5f9; font-size: 14px;">
                                        ${admin.email}
                                        ${isCurrentUser ? '<span style="color: #2dd4bf; font-size: 11px; font-weight: 700; margin-left: 8px; background: rgba(45,212,191,0.12); border: 1px solid rgba(45,212,191,0.2); padding: 2px 8px; border-radius: 99px;">(You)</span>' : ''}
                                    </div>
                                    <div style="font-size: 12px; color: #64748b; margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                                        ${adminInfo ? `
                                            <span class="badge badge-${adminInfo.role}">${adminInfo.role}</span>
                                            <span style="color: #64748b;">Added: ${new Date(adminInfo.createdAt).toLocaleDateString()}</span>
                                        ` : '<span style="color: #f59e0b;">⚠️ No profile data</span>'}
                                    </div>
                                </div>
                            </div>
                            <div class="admin-actions">
                                ${!isCurrentUser ? `
                                    <button class="btn btn-small btn-danger" onclick="removeAdmin('${adminId || 'unknown'}', '${admin.email}', '${admin.emailKey}')">
                                        🗑️ Remove
                                    </button>
                                ` : `
                                    <span style="color: #64748b; font-size: 12px; font-weight: 500;">Current user</span>
                                `}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading admin list:', error);
        adminsList.innerHTML = `
            <h3>Current Admins</h3>
            <p style="color: #ef4444;">Error loading admins: ${error.message}</p>
        `;
    }
}

async function addNewAdmin() {
    if (adminRole !== 'super_admin') {
        alert('❌ Only super admins can add new admins');
        return;
    }

    const email = document.getElementById('newAdminEmail').value.trim();
    const role = document.getElementById('newAdminRole').value;

    if (!email) {
        alert('⚠️ Please enter an email address');
        return;
    }

    if (!email.includes('@')) {
        alert('⚠️ Please enter a valid email address');
        return;
    }

    // Show loading state
    const addButton = event.target;
    const originalText = addButton.textContent;
    addButton.disabled = true;
    addButton.textContent = '⏳ Adding...';

    try {
        // Step 1: Find user ID from email by checking all users
        console.log('🔍 Looking for user with email:', email);

        let targetUserId = null;

        // Load all users to find the matching email
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (usersData) {
            Object.keys(usersData).forEach(userId => {
                const userData = usersData[userId];
                if (userData.profile && userData.profile.email === email) {
                    targetUserId = userId;
                }
            });
        }

        if (!targetUserId) {
            alert('⚠️ User Not Found!\n\nThe email "' + email + '" must create an account first before being made an admin.\n\nAsk them to:\n1. Go to the login page\n2. Sign up with this email\n3. Then you can add them as admin');
            addButton.disabled = false;
            addButton.textContent = originalText;
            return;
        }

        console.log('✅ Found user ID:', targetUserId);

        // Step 2: Add to admins list
        const emailKey = email.replace(/\./g, '_').replace(/@/g, '@');
        await database.ref('admins/' + emailKey).set(true);
        console.log('✅ Added to /admins/');

        // Step 3: Create admin profile
        const permissions = getPermissionsForRole(role);

        await database.ref('admin-users/' + targetUserId).set({
            email: email,
            role: role,
            permissions: permissions,
            createdAt: new Date().toISOString(),
            createdBy: currentUserId,
            createdByEmail: currentUser.email
        });
        console.log('✅ Created admin profile');

        // Step 4: Log the action
        await logAdminAction('add_admin', targetUserId, { 
            email: email, 
            role: role,
            permissions: permissions 
        });

        alert('✅ Admin Added Successfully!\n\n' + email + ' now has ' + role + ' access.\n\nThey will see admin features on their next login.');

        // Clear input
        document.getElementById('newAdminEmail').value = '';
        document.getElementById('newAdminRole').value = 'super_admin';

        // Reload admin list
        await loadAdminList();

    } catch (error) {
        console.error('❌ Error adding admin:', error);
        alert('❌ Failed to add admin!\n\nError: ' + error.message + '\n\nPlease try again or check the console for details.');
    } finally {
        addButton.disabled = false;
        addButton.textContent = originalText;
    }
}

// ============================================
// GET PERMISSIONS FOR ROLE - KEEP FIRST INSTANCE ONLY
// ============================================

function getPermissionsForRole(role) {
    const permissionSets = {
        super_admin: {
            canViewAllUsers: true,
            canEditAllUsers: true,
            canManageSubscriptions: true,
            canViewAnalytics: true,
            canAddAdmins: true,
            canDeleteUsers: true
        },
        support_admin: {
            canViewAllUsers: true,
            canEditAllUsers: false,
            canManageSubscriptions: true,
            canViewAnalytics: false,
            canAddAdmins: false,
            canDeleteUsers: false
        },
        analytics_admin: {
            canViewAllUsers: true,
            canEditAllUsers: false,
            canManageSubscriptions: false,
            canViewAnalytics: true,
            canAddAdmins: false,
            canDeleteUsers: false
        }
    };

    return permissionSets[role] || permissionSets.support_admin;
}

async function removeAdmin(adminId, adminEmail, emailKey) {
    if (adminRole !== 'super_admin') {
        alert('❌ Only super admins can remove admins');
        return;
    }

    if (adminEmail === currentUser.email) {
        alert('⚠️ You cannot remove yourself as an admin!');
        return;
    }

    if (!confirm('🗑️ Remove Admin Access?\n\nRemove admin access for:\n' + adminEmail + '\n\nThey will lose all admin privileges immediately.\n\nContinue?')) {
        return;
    }

    try {
        // Remove from admins list
        await database.ref('admins/' + emailKey).remove();
        console.log('✅ Removed from /admins/');

        // Remove admin profile (if exists)
        if (adminId && adminId !== 'unknown') {
            await database.ref('admin-users/' + adminId).remove();
            console.log('✅ Removed admin profile');
        }

        // Log the action
        await logAdminAction('remove_admin', adminId || 'unknown', { 
            email: adminEmail,
            emailKey: emailKey
        });

        alert('✅ Admin Removed!\n\n' + adminEmail + ' no longer has admin access.');

        // Reload admin list
        await loadAdminList();

    } catch (error) {
        console.error('❌ Error removing admin:', error);
        alert('❌ Failed to remove admin!\n\nError: ' + error.message);
    }
}

console.log('✅ admin-management.js loaded');
