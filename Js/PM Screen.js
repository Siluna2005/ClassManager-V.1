        // ============================================
        // PAYMENT MANAGEMENT FUNCTIONS
        // ============================================

        // Auto-fill class when student ID is entered
        document.addEventListener('DOMContentLoaded', function() {
            const studentIdInput = document.getElementById('paymentStudentId');
            if (studentIdInput) {
                studentIdInput.addEventListener('input', function() {
                    const studentId = this.value.trim();
                    const student = appData.students.find(s => s.id === studentId);
                    
                    if (student) {
                        document.getElementById('paymentClass').value = 'Grade ' + student.grade;
                    } else {
                        document.getElementById('paymentClass').value = '';
                    }
                });
            }
        });

        function scanQRForPayment() {
            const studentId = prompt('📷 QR Scanner\n\nIn real app, camera would open.\nFor now, enter Student ID:');
            if (studentId) {
                document.getElementById('paymentStudentId').value = studentId;
                
                const student = appData.students.find(s => s.id === studentId);
                if (student) {
                    document.getElementById('paymentClass').value = 'Grade ' + student.grade;
                } else {
                    alert('Student not found!');
                }
            }
        }

        function recordPayment() {
            const studentId = document.getElementById('paymentStudentId').value.trim();
            const month = document.getElementById('paymentMonthDropdown').value;
            const amount = document.getElementById('paymentAmountInput').value.trim();
            const status = document.getElementById('paymentStatusDropdown').value;

            // Validation
            if (!studentId) {
                alert('Please enter Student ID');
                return;
            }

            const student = appData.students.find(s => s.id === studentId);
            if (!student) {
                alert('Student ID not found!');
                return;
            }

            if (!month) {
                alert('Please select Month');
                return;
            }

            if (!amount && status !== 'Free Card') {
                alert('Please enter Amount');
                return;
            }

            // Create payment record
            const payment = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                studentId: studentId,
                studentName: student.name,
                class: 'Grade ' + student.grade,
                month: month,
                amount: status === 'Free Card' ? 0 : parseFloat(amount),
                status: status
            };
    
            // Add to payments array
            if (!appData.payments) appData.payments = [];
            appData.payments.push(payment);
            
            saveData();
            loadPaymentHistory();

            // Clear form
            document.getElementById('paymentStudentId').value = '';
            document.getElementById('paymentClass').value = '';
            document.getElementById('paymentMonthDropdown').value = '';
            document.getElementById('paymentAmountInput').value = '';
            document.getElementById('paymentStatusDropdown').value = 'Paid';

            alert('✅ Payment recorded successfully!');
        }

        function loadPaymentHistory() {
            const tbody = document.getElementById('paymentHistoryTable');
            
            if (!appData.payments || appData.payments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #6B7280;">No payment records yet</td></tr>';
                return;
            }

            // Sort by date (newest first)
            const sorted = [...appData.payments].sort((a, b) => new Date(b.date) - new Date(a.date));

            tbody.innerHTML = sorted.map(p => {
                let statusBadge = '';
                if (p.status === 'Paid') {
                    statusBadge = '<span class="badge badge-green">Paid</span>';
                } else if (p.status === 'Unpaid') {
                    statusBadge = '<span class="badge badge-red">Unpaid</span>';
                } else if (p.status === 'Free Card') {
                    statusBadge = '<span class="badge badge-blue">Free Card</span>';
                }

                return `
                    <tr>
                        <td>${p.date}</td>
                        <td>${p.studentId}</td>
                        <td>${p.studentName}</td>
                        <td>${p.class}</td>
                        <td>${p.month}</td>
                        <td>Rs. ${p.amount.toFixed(2)}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }).join('');
        }