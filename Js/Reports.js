        // REPORTS
        function generateReport() {
            const type = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const grade = document.getElementById('reportGrade').value;
            
            if (!month) {
                alert('Select month');
                return;
            }
            
            let html = '';
            if (type === 'attendance') html = generateAttendanceReport(month, grade);
            else html = generatePaymentReport(month, grade);
            
            document.getElementById('reportContent').innerHTML = html;
            document.getElementById('reportPreview').style.display = 'block';
        }

        function generateAttendanceReport(month, grade) {
            const students = grade === 'all' ? appData.students : appData.students.filter(s => s.grade === grade);
            let html = `<h4 style="margin-bottom: 16px;">Attendance Report - ${month}</h4>`;
            html += '<table><thead><tr><th>ID</th><th>Name</th><th>Grade</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead><tbody>';
            
            students.forEach(s => {
                let present = 0, total = 0;
                Object.keys(appData.attendance).forEach(date => {
                    if (date.startsWith(month)) {
                        total++;
                        if (appData.attendance[date][s.id] === 'present') present++;
                    }
                });
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                html += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>Grade ${s.grade}</td>
                        <td>${present}</td>
                        <td>${total - present}</td>
                        <td><span class="badge ${rate >= 75 ? 'badge-green' : 'badge-red'}">${rate}%</span></td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            return html;
        }

        function generatePaymentReport(month, grade) {
            const students = grade === 'all' ? appData.students : appData.students.filter(s => s.grade === grade);
            let html = `<h4 style="margin-bottom: 16px;">Payment Report - ${month}</h4>`;
            html += '<table><thead><tr><th>ID</th><th>Name</th><th>Grade</th><th>Amount</th><th>Status</th></tr></thead><tbody>';
            
            let total = 0;
            students.forEach(s => {
                const monthPayments = appData.payments.filter(p => p.studentId === s.id && p.month === month);
                const amount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
                const status = monthPayments.length > 0 ? 'Paid' : 'Unpaid';
                if (amount > 0) total += amount;
                
                html += `
                    <tr>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>Grade ${s.grade}</td>
                        <td>Rs. ${amount.toFixed(2)}</td>
                        <td><span class="badge ${status === 'Paid' ? 'badge-green' : 'badge-red'}">${status}</span></td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            html += `<div style="margin-top: 20px; padding: 16px; background: #EFF6FF; border-radius: 8px;">
                <strong>Total Collected: Rs. ${total.toFixed(2)}</strong>
            </div>`;
            return html;
        }

        function exportToExcel() {
            alert('📥 Export to Excel\n\nIn a real app, this would download an Excel file.\n\nFor now, you can copy the table data above.');
        }
