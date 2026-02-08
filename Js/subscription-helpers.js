// ============================================
// SUBSCRIPTION HELPER FUNCTIONS
// ============================================

function getSubscriptionDisplay(user) {
    const subscription = user.data?.subscription || user.subscription;

    if (!subscription) {
        return {
            plan: 'Free',
            maxStudents: '5',
            color: '#6b7280'
        };
    }

    // Check if unlimited
    if (isUnlimitedSubscription(user)) {
        return {
            plan: 'Unlimited',
            maxStudents: '∞',  // Display infinity symbol
            color: '#8b5cf6'
        };
    }

    // Regular plans
    if (subscription.plan === 'pro') {
        return {
            plan: 'Pro',
            maxStudents: subscription.maxStudents.toString(),
            color: '#3b82f6'
        };
    }

    return {
        plan: 'Free',
        maxStudents: subscription.maxStudents.toString(),
        color: '#6b7280'
    };
}

function displayUserSubscription(user) {
    const subInfo = getSubscriptionDisplay(user);

    return `
        <span style="color: ${subInfo.color}; font-weight: 600;">
            ${subInfo.plan}
        </span>
        <br>
        <small style="color: rgba(0,0,0,0.6);">
            Max: ${subInfo.maxStudents} students
        </small>
    `;
}

function checkStudentLimit(user) {
    const subscription = user.data?.subscription || user.subscription || {};
    const studentCount = user.data?.students?.length || 0;

    // Check if unlimited
    if (isUnlimitedSubscription(user)) {
        return {
            allowed: true,
            unlimited: true,
            current: studentCount,
            max: 'unlimited'
        };
    }

    const maxStudents = subscription.maxStudents || 5;

    return {
        allowed: studentCount < maxStudents,
        unlimited: false,
        current: studentCount,
        max: maxStudents
    };
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.updateAdminAnalyticsTab = updateAdminAnalyticsTab;
window.updateAdminStatsCards = updateAdminStatsCards;
window.updateUserActivityMetrics = updateUserActivityMetrics;
window.updateUserRetention = updateUserRetention;
window.updateActivityAndRetention = updateActivityAndRetention;
window.updateUserLastActivity = updateUserLastActivity;
window.trackUserActivity = trackUserActivity;
window.createAdminUserGrowthChart = createAdminUserGrowthChart;

console.log('✅ Admin analytics stats functions loaded');
console.log('✅ Admin user growth chart functions loaded');
console.log('✅ User activity & retention functions loaded');
console.log('✅ Fixed subscription functions loaded (no Infinity)');

console.log('✅ subscription-helpers.js loaded');
