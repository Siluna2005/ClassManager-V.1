// ============================================
// ANALYTICS TAB FUNCTIONS
// ============================================

function loadAdminAnalytics() {
    if (!isAdmin || !adminPermissions.canViewAnalytics) {
        document.getElementById('adminAnalytics').innerHTML = '<p style="color: #ef4444;">❌ You do not have permission to view analytics.</p>';
        return;
    }

    console.log('📊 Loading analytics...');

    const analyticsContainer = document.getElementById('adminAnalytics');

    if (!allUsersData || allUsersData.length === 0) {
        analyticsContainer.innerHTML = '<p style="color: #6b7280;">Please load users first from the "All Users" tab.</p>';
        return;
    }

    // Calculate analytics
    const analytics = calculateAnalytics();

    // Display analytics
    analyticsContainer.innerHTML = `
        <div class="analytics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Total Users</h4>
                <p style="font-size: 36px; font-weight: 800; margin: 0; color: #2dd4bf; font-family: 'Sora', sans-serif; letter-spacing: -1px;">${analytics.totalUsers}</p>
            </div>
    
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Free Trial Users</h4>
                <p style="font-size: 36px; font-weight: 800; margin: 0; color: #94a3b8; font-family: 'Sora', sans-serif; letter-spacing: -1px;">${analytics.freeTrialUsers}</p>
            </div>
    
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Paid Users</h4>
                <p style="font-size: 36px; font-weight: 800; margin: 0; color: #10b981; font-family: 'Sora', sans-serif; letter-spacing: -1px;">${analytics.paidUsers}</p>
            </div>
    
            <div class="stat-card">
                <h4 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Total Students</h4>
                <p style="font-size: 36px; font-weight: 800; margin: 0; color: #a78bfa; font-family: 'Sora', sans-serif; letter-spacing: -1px;">${analytics.totalStudents}</p>
            </div>
        </div>

        <div class="card" style="margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #f1f5f9;">User Growth</h3>
            <div id="userGrowthChart" style="height: 300px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.08);">
                <p style="color: #64748b;">Chart visualization coming soon...</p>
            </div>
        </div>

        <div class="card">
            <h3 style="margin-top: 0; color: #f1f5f9;">Subscription Breakdown</h3>
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Plan</th>
                        <th>Users</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Free Trial</td>
                        <td>${analytics.freeTrialUsers}</td>
                        <td>${analytics.freeTrialPercentage}%</td>
                    </tr>
                    <tr>
                        <td>Monthly</td>
                        <td>${analytics.monthlyUsers}</td>
                        <td>${analytics.monthlyPercentage}%</td>
                    </tr>
                    <tr>
                        <td>Annual</td>
                        <td>${analytics.annualUsers}</td>
                        <td>${analytics.annualPercentage}%</td>
                    </tr>
                    <tr>
                        <td>Lifetime</td>
                        <td>${analytics.lifetimeUsers}</td>
                        <td>${analytics.lifetimePercentage}%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">Top Users by Students</h3>
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Students</th>
                        <th>Plan</th>
                    </tr>
                </thead>
                <tbody>
                    ${analytics.topUsers.map(user => `
                        <tr>
                            <td>${user.email}</td>
                            <td>${user.studentsCount}</td>
                            <td><span class="badge badge-${user.subscription.plan}">${user.subscription.plan}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function calculateAnalytics() {
    const totalUsers = allUsersData.length;

    const freeTrialUsers = allUsersData.filter(u => u.subscription.plan === 'free_trial').length;
    const monthlyUsers = allUsersData.filter(u => u.subscription.plan === 'monthly').length;
    const annualUsers = allUsersData.filter(u => u.subscription.plan === 'annual').length;
    const lifetimeUsers = allUsersData.filter(u => u.subscription.plan === 'lifetime').length;
    const paidUsers = monthlyUsers + annualUsers + lifetimeUsers;

    const totalStudents = allUsersData.reduce((sum, user) => sum + user.studentsCount, 0);

    const topUsers = [...allUsersData]
        .sort((a, b) => b.studentsCount - a.studentsCount)
        .slice(0, 10);

    return {
        totalUsers,
        freeTrialUsers,
        monthlyUsers,
        annualUsers,
        lifetimeUsers,
        paidUsers,
        totalStudents,
        freeTrialPercentage: totalUsers ? Math.round((freeTrialUsers / totalUsers) * 100) : 0,
        monthlyPercentage: totalUsers ? Math.round((monthlyUsers / totalUsers) * 100) : 0,
        annualPercentage: totalUsers ? Math.round((annualUsers / totalUsers) * 100) : 0,
        lifetimePercentage: totalUsers ? Math.round((lifetimeUsers / totalUsers) * 100) : 0,
        topUsers
    };
}

// ============================================
// UPDATE ADMIN STATS CARDS (KEEP FIRST INSTANCE ONLY)
// ============================================

async function updateAdminStatsCards() {
    console.log('📊 Updating admin statistics cards...');

    try {
        // Fetch all users
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (!usersData) {
            console.log('⚠️ No users found');
    
            const totalUsersEl = document.getElementById('adminTotalUsers');
            const newUsersEl = document.getElementById('adminNewUsers');
            const activeUsersEl = document.getElementById('adminActiveUsers');
    
            if (totalUsersEl) totalUsersEl.textContent = '0';
            if (newUsersEl) newUsersEl.textContent = '0';
            if (activeUsersEl) activeUsersEl.textContent = '0';
    
            return;
        }

        // Convert to array
        const usersArray = Object.keys(usersData).map(userId => ({
            userId: userId,
            email: usersData[userId].profile?.email || 'Unknown',
            createdAt: usersData[userId].profile?.createdAt || 
                      usersData[userId].createdAt || 
                      new Date().toISOString(),
            lastActivity: usersData[userId].profile?.lastActivity ||
                         usersData[userId].profile?.lastSaved ||
                         usersData[userId].data?.lastSaved ||
                         usersData[userId].createdAt
        }));

        // Total users
        const totalUsers = usersArray.length;

        // Get current month start
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const oneMonthAgo = new Date(now.getTime() - 30*24*60*60*1000);

        // New users this month
        const newUsersThisMonth = usersArray.filter(user => {
            const createdDate = new Date(user.createdAt);
            return createdDate >= startOfMonth;
        }).length;

        // Active users this month (users with activity in last 30 days)
        const activeUsersThisMonth = usersArray.filter(user => {
            if (!user.lastActivity) return false;
            const activityDate = new Date(user.lastActivity);
            return activityDate >= oneMonthAgo;
        }).length;

        // Update UI
        const totalUsersEl = document.getElementById('adminTotalUsers');
        const newUsersEl = document.getElementById('adminNewUsers');
        const activeUsersEl = document.getElementById('adminActiveUsers');

        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (newUsersEl) newUsersEl.textContent = newUsersThisMonth;
        if (activeUsersEl) activeUsersEl.textContent = activeUsersThisMonth;

        console.log('✅ Admin stats updated:', {
            totalUsers,
            newUsersThisMonth,
            activeUsersThisMonth
        });

        return {
            totalUsers,
            newUsersThisMonth,
            activeUsersThisMonth
        };

    } catch (error) {
        console.error('❌ Error updating admin stats:', error);
        return null;
    }
}

// ============================================
// USER ACTIVITY METRICS (DAU, WAU, MAU) - KEEP FIRST INSTANCE ONLY
// ============================================

async function updateUserActivityMetrics() {
    console.log('📊 Calculating user activity metrics...');

    try {
        // Show loading state
        const dauEl = document.getElementById('adminDAU');
        const wauEl = document.getElementById('adminWAU');
        const mauEl = document.getElementById('adminMAU');

        if (dauEl) dauEl.textContent = '...';
        if (wauEl) wauEl.textContent = '...';
        if (mauEl) mauEl.textContent = '...';

        // Fetch all users with their last activity
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (!usersData) {
            console.log('⚠️ No users found');
            if (dauEl) dauEl.textContent = '0';
            if (wauEl) wauEl.textContent = '0';
            if (mauEl) mauEl.textContent = '0';
            return;
        }

        // Calculate time thresholds
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24*60*60*1000);
        const oneWeekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        const oneMonthAgo = new Date(now.getTime() - 30*24*60*60*1000);

        let dailyActive = 0;
        let weeklyActive = 0;
        let monthlyActive = 0;

        // Process each user
        Object.keys(usersData).forEach(userId => {
            const user = usersData[userId];
    
            // Try to get last activity from multiple sources
            const lastActivity = 
                user.profile?.lastActivity || 
                user.profile?.lastSaved ||
                user.data?.lastSaved || 
                user.lastActivity ||
                user.createdAt ||
                null;
    
            if (lastActivity) {
                const activityDate = new Date(lastActivity);
        
                // Count for each period
                if (activityDate >= oneDayAgo) {
                    dailyActive++;
                }
                if (activityDate >= oneWeekAgo) {
                    weeklyActive++;
                }
                if (activityDate >= oneMonthAgo) {
                    monthlyActive++;
                }
            }
        });

        // Update UI
        if (dauEl) dauEl.textContent = dailyActive;
        if (wauEl) wauEl.textContent = weeklyActive;
        if (mauEl) mauEl.textContent = monthlyActive;

        console.log('✅ Activity metrics updated:', {
            dailyActive,
            weeklyActive,
            monthlyActive,
            totalUsers: Object.keys(usersData).length
        });

        return {
            dailyActive,
            weeklyActive,
            monthlyActive
        };

    } catch (error) {
        console.error('❌ Error calculating activity metrics:', error);

        // Show error state
        const dauEl = document.getElementById('adminDAU');
        const wauEl = document.getElementById('adminWAU');
        const mauEl = document.getElementById('adminMAU');

        if (dauEl) dauEl.textContent = 'Error';
        if (wauEl) wauEl.textContent = 'Error';
        if (mauEl) mauEl.textContent = 'Error';

        return null;
    }
}

// ============================================
// USER RETENTION METRICS - KEEP FIRST INSTANCE ONLY
// ============================================

async function updateUserRetention() {
    console.log('📊 Calculating user retention...');

    try {
        // Show loading state
        const r7El = document.getElementById('admin7DayRetention');
        const r30El = document.getElementById('admin30DayRetention');
        const r90El = document.getElementById('admin90DayRetention');

        if (r7El) r7El.textContent = '...';
        if (r30El) r30El.textContent = '...';
        if (r90El) r90El.textContent = '...';

        // Fetch all users
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (!usersData) {
            console.log('⚠️ No users found');
            if (r7El) r7El.textContent = '0%';
            if (r30El) r30El.textContent = '0%';
            if (r90El) r90El.textContent = '0%';
            return;
        }

        // Calculate time thresholds
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7*24*60*60*1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30*24*60*60*1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90*24*60*60*1000);

        // Counters for cohorts
        let users7DaysOld = 0;
        let users7DaysActive = 0;
        let users30DaysOld = 0;
        let users30DaysActive = 0;
        let users90DaysOld = 0;
        let users90DaysActive = 0;

        // Process each user
        Object.keys(usersData).forEach(userId => {
            const user = usersData[userId];
    
            // Get creation date
            const createdAt = new Date(
                user.profile?.createdAt || 
                user.createdAt || 
                now
            );
    
            // Get last activity
            const lastActivity = new Date(
                user.profile?.lastActivity || 
                user.profile?.lastSaved ||
                user.data?.lastSaved || 
                user.lastActivity ||
                createdAt
            );
    
            // 7-day retention
            if (createdAt <= sevenDaysAgo) {
                users7DaysOld++;
                // User is retained if they were active in the last 7 days
                if (lastActivity >= sevenDaysAgo) {
                    users7DaysActive++;
                }
            }
    
            // 30-day retention
            if (createdAt <= thirtyDaysAgo) {
                users30DaysOld++;
                // User is retained if they were active in the last 30 days
                if (lastActivity >= thirtyDaysAgo) {
                    users30DaysActive++;
                }
            }
    
            // 90-day retention
            if (createdAt <= ninetyDaysAgo) {
                users90DaysOld++;
                // User is retained if they were active in the last 90 days
                if (lastActivity >= ninetyDaysAgo) {
                    users90DaysActive++;
                }
            }
        });

        // Calculate percentages
        const retention7Day = users7DaysOld > 0 
            ? ((users7DaysActive / users7DaysOld) * 100).toFixed(1) 
            : 0;
    
        const retention30Day = users30DaysOld > 0 
            ? ((users30DaysActive / users30DaysOld) * 100).toFixed(1) 
            : 0;
    
        const retention90Day = users90DaysOld > 0 
            ? ((users90DaysActive / users90DaysOld) * 100).toFixed(1) 
            : 0;

        // Update UI with color coding
        if (r7El) {
            r7El.textContent = retention7Day + '%';
            r7El.style.color = getRetentionColor(retention7Day);
        }

        if (r30El) {
            r30El.textContent = retention30Day + '%';
            r30El.style.color = getRetentionColor(retention30Day);
        }

        if (r90El) {
            r90El.textContent = retention90Day + '%';
            r90El.style.color = getRetentionColor(retention90Day);
        }

        console.log('✅ Retention metrics updated:', {
            '7-day': {
                cohort: users7DaysOld,
                retained: users7DaysActive,
                percentage: retention7Day + '%'
            },
            '30-day': {
                cohort: users30DaysOld,
                retained: users30DaysActive,
                percentage: retention30Day + '%'
            },
            '90-day': {
                cohort: users90DaysOld,
                retained: users90DaysActive,
                percentage: retention90Day + '%'
            }
        });

        return {
            retention7Day,
            retention30Day,
            retention90Day
        };

    } catch (error) {
        console.error('❌ Error calculating retention:', error);

        // Show error state
        const r7El = document.getElementById('admin7DayRetention');
        const r30El = document.getElementById('admin30DayRetention');
        const r90El = document.getElementById('admin90DayRetention');

        if (r7El) r7El.textContent = 'Error';
        if (r30El) r30El.textContent = 'Error';
        if (r90El) r90El.textContent = 'Error';

        return null;
    }
}

// ============================================
// GET COLOR BASED ON RETENTION PERCENTAGE
// ============================================

function getRetentionColor(percentage) {
    const value = parseFloat(percentage);

    if (value >= 70) {
        return '#10b981'; // Green - Excellent
    } else if (value >= 50) {
        return '#f59e0b'; // Orange - Good
    } else if (value >= 30) {
        return '#ef4444'; // Red - Needs improvement
    } else {
        return '#6b7280'; // Gray - Poor
    }
}

// ============================================
// UPDATE LAST ACTIVITY TIMESTAMP
// ============================================

function updateUserLastActivity(userId) {
    if (!userId) return;

    const now = new Date().toISOString();

    // Update in Firebase
    database.ref('users/' + userId + '/profile/lastActivity').set(now)
        .then(() => {
            console.log('✅ Last activity updated for user:', userId);
        })
        .catch((error) => {
            console.error('❌ Error updating last activity:', error);
        });
}

// ============================================
// CALL ON USER LOGIN
// ============================================

function onUserAuthenticated(user) {
    const userId = user.uid;

    // Update last activity
    updateUserLastActivity(userId);

    // Also update in profile if it doesn't exist
    database.ref('users/' + userId + '/profile').once('value')
        .then((snapshot) => {
            const profile = snapshot.val();
    
            if (!profile) {
                // First time user - create profile
                database.ref('users/' + userId + '/profile').set({
                    email: user.email,
                    createdAt: new Date().toISOString(),
                    lastActivity: new Date().toISOString()
                });
            } else if (!profile.createdAt) {
                // Existing user without createdAt - add it
                database.ref('users/' + userId + '/profile/createdAt')
                    .set(new Date().toISOString());
            }
        });
}

// ============================================
// TRACK USER ACTIVITY (CALL ON ACTIONS)
// ============================================

function trackUserActivity() {
    if (currentUserId) {
        updateUserLastActivity(currentUserId);
    }
}

// ============================================
// COMBINED UPDATE FUNCTION
// ============================================

async function updateActivityAndRetention() {
    console.log('📊 Updating activity and retention metrics...');

    try {
        // Update both in parallel
        const [activity, retention] = await Promise.all([
            updateUserActivityMetrics(),
            updateUserRetention()
        ]);

        console.log('✅ All metrics updated successfully');

        return { activity, retention };

    } catch (error) {
        console.error('❌ Error updating metrics:', error);
        return null;
    }
}

// ============================================
// UPDATE ADMIN ANALYTICS TAB - KEEP FIRST INSTANCE ONLY
// ============================================

async function updateAdminAnalyticsTab() {
    console.log('📊 Updating admin analytics tab...');

    // Show loading state on stats cards
    const totalUsersEl = document.getElementById('adminTotalUsers');
    if (totalUsersEl) totalUsersEl.textContent = '...';

    try {
        // ⭐ UPDATE ALL METRICS IN PARALLEL
        await Promise.all([
            updateAdminStatsCards(),
            updateUserActivityMetrics(),
            updateUserRetention(),
            createAdminUserGrowthChart()
        ]);

        console.log('✅ Admin analytics tab updated successfully');

    } catch (error) {
        console.error('❌ Error updating admin analytics:', error);

        // Show error state
        if (totalUsersEl) totalUsersEl.textContent = 'Error';
    }
}

// ============================================
// FETCH ALL USERS FOR GROWTH
// ============================================

async function fetchAllUsersForGrowth() {
    console.log('📥 Fetching all users from Firebase...');

    try {
        // Query all users
        const usersSnapshot = await database.ref('users').once('value');
        const usersData = usersSnapshot.val();

        if (!usersData) {
            console.log('⚠️ No users found in database');
            return [];
        }

        // Convert to array with createdAt dates
        const usersArray = [];

        Object.keys(usersData).forEach(userId => {
            const userData = usersData[userId];
            const profile = userData.profile || {};
            const data = userData.data || {};
    
            // Try to get creation date from multiple sources
            const createdAt = profile.createdAt || 
                            userData.createdAt || 
                            data.createdAt || 
                            new Date().toISOString();
    
            usersArray.push({
                userId: userId,
                email: profile.email || 'Unknown',
                createdAt: createdAt
            });
        });

        console.log(`✅ Fetched ${usersArray.length} users`);
        return usersArray;

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        return [];
    }
}

// ============================================
// FORMAT DATE FOR ADMIN CHART
// ============================================

function formatDateForAdminChart(dateString) {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ============================================
// CREATE ADMIN USER GROWTH CHART
// ============================================

async function createAdminUserGrowthChart() {
    console.log('📈 Creating admin user growth chart...');

    // Get canvas element
    const canvas = document.getElementById('adminUserGrowthChart');
    if (!canvas) {
        console.error('❌ Canvas element not found: adminUserGrowthChart');
        return;
    }

    // Show loading state
    const container = canvas.parentElement;
    const originalContent = container.innerHTML;
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 300px;">
            <div style="text-align: center;">
                <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
                <p style="color: rgba(255,255,255,0.7);">Loading user growth data...</p>
            </div>
        </div>
    `;

    // Fetch all users
    const usersArray = await fetchAllUsersForGrowth();

    // Restore canvas
    container.innerHTML = originalContent;
    const newCanvas = document.getElementById('adminUserGrowthChart');

    if (usersArray.length === 0) {
        // Show "No data" message
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📊</div>
                <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 8px;">No User Data Yet</h3>
                <p style="color: rgba(255,255,255,0.6); font-size: 14px;">User growth will appear here once users sign up</p>
            </div>
        `;
        return;
    }

    // Process user growth data
    const growthMap = new Map();

    usersArray.forEach(user => {
        const dateAdded = new Date(user.createdAt);
        const dateKey = dateAdded.toISOString().split('T')[0];

        if (!growthMap.has(dateKey)) {
            growthMap.set(dateKey, 0);
        }
        growthMap.set(dateKey, growthMap.get(dateKey) + 1);
    });

    // Sort and calculate cumulative
    const sortedDates = Array.from(growthMap.keys()).sort();
    let cumulative = 0;
    const labels = [];
    const data = [];

    sortedDates.forEach(date => {
        cumulative += growthMap.get(date);
        labels.push(formatDateForAdminChart(date));
        data.push(cumulative);
    });

    // Destroy existing chart if it exists
    if (window.adminUserGrowthChartInstance) {
        window.adminUserGrowthChartInstance.destroy();
    }

    // Get canvas context
    const ctx = newCanvas.getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

    // Create chart
    window.adminUserGrowthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Users',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointHoverBackgroundColor: '#8b5cf6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {  
            responsive: true,   
            maintainAspectRatio: false,  
            plugins: {       
                legend: {           
                    display: true,          
                    labels: {                                                 
                        color: '#94a3b8',
                        font: {                    
                            size: 13,                    
                            weight: '600'               
                        },               
                        padding: 15          
                    }       
                },

                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Total Users: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });

    console.log('✅ Admin user growth chart created');
}

console.log('✅ admin-analytics.js loaded');
