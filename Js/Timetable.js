// TIMETABLE
function loadTimetable() {
    const tbody = document.getElementById('timetableTableBody');
    if (appData.timetable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #6B7280;">No classes</td></tr>';
        return;
    }
    tbody.innerHTML = appData.timetable.map(t => `
        <tr>
            <td>${t.day}</td>
            <td>${t.time}</td>
            <td><span class="badge badge-blue">Grade ${t.grade}</span></td>
            <td>${t.notes || '-'}</td>
            <td>
                <button class="icon-btn icon-btn-blue" onclick='editTimetable(${JSON.stringify(t)})'>✏️</button>
                <button class="icon-btn icon-btn-red" onclick="deleteTimetable('${t.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function showAddTimetable() {
    appData.editingTimetable = null;
    document.getElementById('timetableModalTitle').textContent = 'Add Class';
    document.getElementById('timetableDay').value = 'Monday';
    document.getElementById('timetableTime').value = '';
    document.getElementById('timetableGrade').value = appData.grades[0];
    document.getElementById('timetableNotes').value = '';
    document.getElementById('timetableModal').classList.add('active');
}

function editTimetable(entry) {
    appData.editingTimetable = entry;
    document.getElementById('timetableModalTitle').textContent = 'Edit Class';
    document.getElementById('timetableDay').value = entry.day;
    document.getElementById('timetableTime').value = entry.time;
    document.getElementById('timetableGrade').value = entry.grade;
    document.getElementById('timetableNotes').value = entry.notes || '';
    document.getElementById('timetableModal').classList.add('active');
}

function closeTimetableModal() {
    document.getElementById('timetableModal').classList.remove('active');
}

function saveTimetableEntry() {
    const day = document.getElementById('timetableDay').value;
    const time = document.getElementById('timetableTime').value;
    const grade = document.getElementById('timetableGrade').value;
    const notes = document.getElementById('timetableNotes').value;
            
    if (!time) {
        alert('Enter time');
        return;
    }
            
    if (appData.editingTimetable) {
        appData.timetable = appData.timetable.map(t => t.id === appData.editingTimetable.id ? { ...t, day, time, grade, notes } : t);
    } else {
        appData.timetable.push({ id: Date.now().toString(), day, time, grade, notes });
    }
            
    saveData();
    closeTimetableModal();
    loadTimetable();
    updateDashboard();
    alert('Saved!');
}

function deleteTimetable(id) {
    if (!confirm('Delete?')) return;
    appData.timetable = appData.timetable.filter(t => t.id !== id);
    saveData();
    loadTimetable();
    updateDashboard();
}
