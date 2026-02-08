// ============================================
// PAYHERE PAYMENT INTEGRATION
// ============================================

// Initialize PayHere payment
function initiatePayment(plan) {
    const sub = appData.subscription;
    
    // Check if already on this plan
    if (sub.plan === plan && sub.status === 'active') {
        alert('ℹ️ You are already on this plan.');
        return;
    }
    
    // Get plan details
    const planDetails = SUBSCRIPTION_PRICES[plan];
    
    if (!planDetails) {
        alert('❌ Invalid plan selected');
        return;
    }
    
    // Confirm payment
     const confirmMsg = `💳 Proceed to Payment?\n\nPlan: ${plan === 'monthly' ? 'Monthly' : 'Annual'}\nAmount: Rs. ${planDetails.amount.toLocaleString()}\n\n✓ Unlimited students\n✓ All premium features\n✓ Priority support`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Generate unique order ID
    const orderId = generateOrderId(plan);
    
    // Prepare payment data
    const payment = {
        sandbox: PAYHERE_CONFIG.sandbox,
        merchant_id: PAYHERE_CONFIG.merchantId,
        return_url: PAYHERE_CONFIG.returnUrl,
        cancel_url: PAYHERE_CONFIG.cancelUrl,
        notify_url: PAYHERE_CONFIG.notifyUrl,
        order_id: orderId,
        items: planDetails.description,
        amount: planDetails.amount.toFixed(2),
        currency: planDetails.currency,
        first_name: getUserName(),
        last_name: '',
        email: getUserEmail(),
        phone: getUserPhone(),
        address: '',
        city: 'Colombo',
        country: 'Sri Lanka',
        // Custom fields to track subscription
        custom_1: plan,  // Plan type
        custom_2: new Date().toISOString()  // Purchase date
    };
            
    // Store pending payment
    storePendingPayment(orderId, plan, planDetails.amount);
            
    // Show PayHere payment window
    payhere.startPayment(payment);
}        
        
// Generate unique order ID
function generateOrderId(plan) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CM_${plan.toUpperCase()}_${timestamp}_${random}`;
}

// Get user details (you can customize these)
function getUserName() {
    // Try to get from stored data or prompt
    let userName = localStorage.getItem('userName');
    if (!userName) {
        userName = prompt('Enter your name:', 'Teacher') || 'Teacher';
        localStorage.setItem('userName', userName);
    }
    return userName;
}

function getUserEmail() {
    let userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        userEmail = prompt('Enter your email:', 'teacher@school.com') || 'teacher@school.com';
        localStorage.setItem('userEmail', userEmail);
    }
    return userEmail;
}

function getUserPhone() {
    let userPhone = localStorage.getItem('userPhone');
    if (!userPhone) {
        userPhone = prompt('Enter your phone number:', '0771234567') || '0771234567';
        localStorage.setItem('userPhone', userPhone);
    }
    return userPhone;
}

// Store pending payment
function storePendingPayment(orderId, plan, amount) {
    const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
    
    pendingPayments.push({
        orderId: orderId,
        plan: plan,
        amount: amount,
        timestamp: new Date().toISOString(),
        status: 'pending'
    });
    
    localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
}

// PayHere callback handlers
payhere.onCompleted = function onCompleted(orderId) {
    console.log('Payment completed. OrderID:', orderId);

    // Get payment details
    const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
    const payment = pendingPayments.find(p => p.orderId === orderId);
    
    if (payment) {
        // Activate subscription
        activateSubscription(payment.plan, orderId);
        
        // Update payment status
        payment.status = 'completed';
        payment.completedDate = new Date().toISOString();
        localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
        
        // Show success message
        alert(`✅ Payment Successful!\n\nOrder ID: ${orderId}\nPlan: ${payment.plan === 'monthly' ? 'Monthly' : 'Annual'}\n\nYour subscription is now active!`);
                
        // Refresh subscription display
        updateSubscriptionDisplay();
                
        // Store payment record
        storePaymentRecord(payment);
    } else {
        alert('✅ Payment Successful!\n\nYour subscription is now active!');
    }
};        

payhere.onDismissed = function onDismissed() {
    console.log('Payment dismissed');
    alert('❌ Payment Cancelled\n\nYou cancelled the payment process.');
};

payhere.onError = function onError(error) {
    console.log('Payment error:', error);
    alert(`❌ Payment Failed\n\nError: ${error}\n\nPlease try again or contact support.`);
};

// Activate subscription after successful payment
function activateSubscription(plan, orderId) {
    appData.subscription.plan = plan;
    appData.subscription.status = 'active';
    appData.subscription.startDate = new Date().toISOString();
    appData.subscription.orderId = orderId;
    appData.subscription.maxStudents = Infinity;
    
    // Set expiry date
    const endDate = new Date();
    if (plan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    }
    appData.subscription.endDate = endDate.toISOString();
            
    // Enable all features
    appData.subscription.features = {
        students: true,
        attendance: true,
        payments: true,
        reports: true,
        backup: true,
        export: true,
        priority_support: true
    };
            
    saveData();
}

// Store payment record for history
function storePaymentRecord(payment) {
    if (!appData.paymentHistory) {
        appData.paymentHistory = [];
    }
    
    appData.paymentHistory.push({
        orderId: payment.orderId,
        plan: payment.plan,
        amount: payment.amount,
        date: payment.completedDate || new Date().toISOString(),
        status: 'completed'
    });
    
    saveData();
}

// Display payment history
function displayPaymentHistory() {
    const tbody = document.getElementById('paymentHistoryTableBody');
    
    if (!tbody) return;
    
    const history = appData.paymentHistory || [];
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    No payment history yet
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.reverse().map(p => {
        const date = new Date(p.date).toLocaleDateString();
        const planName = p.plan === 'monthly' ? 'Monthly' : 'Annual';
        const statusBadge = p.status === 'completed' 
            ? '<span class="badge badge-green">Completed</span>'
            : '<span class="badge badge-amber">Pending</span>';
        
        return `
            <tr>
                <td>${date}</td>
                <td style="font-family: monospace; font-size: 12px;">${p.orderId}</td>
                <td>${planName}</td>
                <td>Rs. ${p.amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}
