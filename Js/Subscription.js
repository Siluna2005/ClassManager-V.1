// ============================================
// SUBSCRIPTIONS TAB FUNCTIONS
// ============================================
        
function loadSubscriptionsTab() {
    if (!isAdmin || !adminPermissions.canManageSubscriptions) {
        document.getElementById('adminSubscriptionsList').innerHTML = '<p style="color: #ef4444;">❌ You do not have permission to manage subscriptions.</p>';
        return;
    }
    
    console.log('💳 Loading subscriptions...');
    
    const container = document.getElementById('adminSubscriptionsList');
    
    if (!allUsersData || allUsersData.length === 0) {
        container.innerHTML = '<p style="color: #6b7280;">Please load users first from the "All Users" tab.</p>';
        return;
    }
    
    // Group users by subscription status
    const activeSubscriptions = allUsersData.filter(u => u.subscription.status === 'active');
    const expiredSubscriptions = allUsersData.filter(u => u.subscription.status === 'expired');
    const cancelledSubscriptions = allUsersData.filter(u => u.subscription.status === 'cancelled');
    
    container.innerHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Active</h4>
                <p style="font-size: 28px; font-weight: 700; margin: 0; color: #10b981;">${activeSubscriptions.length}</p>
            </div>
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Expired</h4>
                <p style="font-size: 28px; font-weight: 700; margin: 0; color: #f59e0b;">${expiredSubscriptions.length}</p>
            </div>
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Cancelled</h4>
                <p style="font-size: 28px; font-weight: 700; margin: 0; color: #ef4444;">${cancelledSubscriptions.length}</p>
            </div>
        </div>
        
        <div class="card">
            <h3 style="margin-top: 0;">All Subscriptions</h3>
            
            <div style="margin-bottom: 15px;">
                <input type="text" id="subscriptionSearch" placeholder="🔍 Search by email..." onkeyup="filterSubscriptions()" style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; width: 100%; max-width: 400px;">
            </div>
            
            <div style="overflow-x: auto;">
                <table class="data-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Students</th>
                            <th>Start Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="subscriptionsTableBody">
                        ${allUsersData.map(user => `
                            <tr>
                                <td>${user.email}</td>
                                <td><span class="badge badge-${user.subscription.plan}">${user.subscription.plan}</span></td>
                                <td><span class="${user.subscription.status === 'active' ? 'status-active' : 'status-inactive'}">${user.subscription.status}</span></td>
                                <td>${user.studentsCount} / ${user.subscription.maxStudents === Infinity ? '∞' : user.subscription.maxStudents}</td>
                                <td>${user.subscription.startDate ? new Date(user.subscription.startDate).toLocaleDateString() : 'N/A'}</td>
                                <td>
                                    <button class="btn-small btn-primary" onclick="quickUpgrade('${user.userId}')">⬆️ Upgrade</button>
                                    <button class="btn-small btn-success" onclick="manageUserSubscription('${user.userId}')">⚙️ Manage</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function filterSubscriptions() {
    const searchTerm = document.getElementById('subscriptionSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#subscriptionsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function quickUpgrade(userId) {
    if (!confirm('Grant unlimited lifetime access to this user?')) {
        return;
    }
    
    grantUnlimitedAccess(userId);
}

// ============================================
// SUBSCRIPTION SYSTEM
// ============================================

// Initialize subscription on load
function initializeSubscription() {
    // Check if subscription exists in appData
    if (!appData.subscription) {
        appData.subscription = {
            plan: 'free_trial',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: null,
            maxStudents: 10,
            features: {
                students: true,
                attendance: true,
                payments: true,
                reports: true,
                backup: true
            }
        };
        saveData();
    }
    
    // Check subscription status
    checkSubscriptionStatus();
}

// Check if subscription is valid
function checkSubscriptionStatus() {
    // ✅ ADMIN BYPASS - Admins always have active status
    if (isAdmin) {
        return true;
    }
    
    // Regular user - check subscription
    const sub = appData.subscription;

    if (sub.endDate) {        
        const endDate = new Date(sub.endDate);        
        const now = new Date();
        
        if (now > endDate) {            
            sub.status = 'expired';            
            sub.plan = 'free_trial';            
            sub.maxStudents = 10;            
            saveData();        
        }    
    }

    if (sub.plan === 'free_trial' && appData.students.length >= sub.maxStudents) {        
        return false;    
    }    

    return sub.status === 'active';
}

// Update subscription display
function updateSubscriptionDisplay() {
    // Show admin status instead of subscription for admins
    if (isAdmin) {
        const currentPlanEl = document.getElementById('currentPlanName');
        if (currentPlanEl) {
            currentPlanEl.textContent = '👑 Admin Account';
        }
        
        const statusEl = document.getElementById('subscriptionStatus');
        if (statusEl) {
            statusEl.textContent = 'Unlimited Access';
        }
        
        const maxStudentsEl = document.getElementById('maxStudents');
        if (maxStudentsEl) {
            maxStudentsEl.textContent = '∞';
        }
        
        const currentStudentsEl = document.getElementById('currentStudents');
        if (currentStudentsEl) {
            currentStudentsEl.textContent = appData.students.length;
        }
        
        const warningEl = document.getElementById('subscriptionWarning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }
        
        return; // Don't show regular subscription info
    }
    
    // Regular user subscription display continues below...
    const sub = appData.subscription;
    
    // Update current plan name
    const planNames = {
        'free_trial': 'Free Trial',
        'monthly': 'Monthly Plan',
        'annual': 'Annual Plan'
    };
    
    const currentPlanEl = document.getElementById('currentPlanName');
    if (currentPlanEl) {
        currentPlanEl.textContent = planNames[sub.plan] || 'Free Trial';
    }
    
    // Update status
    const statusEl = document.getElementById('subscriptionStatus');
    if (statusEl) {
        statusEl.textContent = sub.status.charAt(0).toUpperCase() + sub.status.slice(1);
        statusEl.style.color = sub.status === 'active' ? '#D1FAE5' : '#FEE2E2';
    }
    
    // Update student count
    const currentStudentsEl = document.getElementById('currentStudents');
    const maxStudentsEl = document.getElementById('maxStudents');
    if (currentStudentsEl) currentStudentsEl.textContent = appData.students.length;
    if (maxStudentsEl) {
        maxStudentsEl.textContent = sub.plan === 'free_trial' ? sub.maxStudents : '∞';
    }
    
    // Update end date
    const endDateEl = document.getElementById('subscriptionEndDate');
    if (endDateEl) {
        if (sub.endDate) {
            const date = new Date(sub.endDate);
            endDateEl.textContent = date.toLocaleDateString();
        } else {
            endDateEl.textContent = sub.plan === 'free_trial' ? 'No expiry' : '-';
        }
    }
    
    // Show warning if needed
    const warningEl = document.getElementById('subscriptionWarning');
    const warningMsgEl = document.getElementById('warningMessage');
    
    if (sub.plan === 'free_trial' && appData.students.length >= sub.maxStudents - 2) {
        warningEl.style.display = 'block';
        warningMsgEl.textContent = `You're using ${appData.students.length} of ${sub.maxStudents} free students. Upgrade to add unlimited students!`;
    } else if (sub.status === 'expired') {
        warningEl.style.display = 'block';
        warningMsgEl.textContent = 'Your subscription has expired. Please renew to continue using premium features.';
    } else {
        warningEl.style.display = 'none';
    }
    
    // Update button states
    updateSubscriptionButtons();
    displayPaymentHistory();
}

// Update subscription buttons
function updateSubscriptionButtons() {
    const sub = appData.subscription;
    
    const btnFreeTrial = document.getElementById('btnFreeTrial');
    const btnMonthly = document.getElementById('btnMonthly');
    const btnAnnual = document.getElementById('btnAnnual');
    
    // Reset all buttons
    if (btnFreeTrial) {
        btnFreeTrial.className = 'btn btn-secondary';
        btnFreeTrial.textContent = 'Select Plan';
    }
    if (btnMonthly) {
        btnMonthly.className = 'btn btn-success';
        btnMonthly.textContent = 'Subscribe Monthly';
    }
    if (btnAnnual) {
        btnAnnual.className = 'btn btn-primary';
        btnAnnual.textContent = 'Subscribe Annual';
    }
    
    // Highlight current plan
    if (sub.plan === 'free_trial' && btnFreeTrial) {
        btnFreeTrial.className = 'btn btn-secondary';
        btnFreeTrial.textContent = 'Current Plan';
        btnFreeTrial.disabled = true;
        btnFreeTrial.style.opacity = '0.6';
    } else if (sub.plan === 'monthly' && btnMonthly) {
        btnMonthly.className = 'btn btn-success';
        btnMonthly.textContent = 'Current Plan';
        btnMonthly.disabled = true;
        btnMonthly.style.opacity = '0.6';
    } else if (sub.plan === 'annual' && btnAnnual) {
        btnAnnual.className = 'btn btn-primary';
        btnAnnual.textContent = 'Current Plan';
        btnAnnual.disabled = true;
        btnAnnual.style.opacity = '0.6';
    }
}
        
// Select a subscription plan (updated for PayHere)
function selectPlan(plan) {
    if (plan === 'free_trial') {
        // Downgrade to free
        if (!confirm('⬇️ Downgrade to Free Trial?\n\n⚠️ You will be limited to 10 students\n⚠️ Some premium features will be disabled')) {
            return;
        }
        
        appData.subscription.plan = 'free_trial';
        appData.subscription.status = 'active';
        appData.subscription.maxStudents = 10;
        appData.subscription.endDate = null;
        
        saveData();
        updateSubscriptionDisplay();
        
        alert('✅ Downgraded to Free Trial\n\nYou can now add up to 10 students.');
    } else {
        // Redirect to payment
        initiatePayment(plan);
    }
}

// Check before adding student
function canAddStudent() {
    // ADMIN BYPASS - Admins have unlimited access
    if (isAdmin) {
        console.log('👑 Admin bypass: Unlimited students allowed');
        return true;
    }
    
    // Regular user - check subscription limits
    const sub = appData.subscription;

    if (sub.plan === 'free_trial' && appData.students.length >= sub.maxStudents) {        
        if (confirm(`⚠️ Student Limit Reached!\n\nYou've reached the limit of ${sub.maxStudents} students on the Free Trial.\n\nWould you like to upgrade to add unlimited students?`)) {            
            navigateTo('subscription');        
        }        
        return false;   
    }    

    return true;
}
