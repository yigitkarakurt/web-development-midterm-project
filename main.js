// Data storage
let courses = [];
let students = [];

// Helper functions
function calculateGrade(midterm, final, course) {
    const totalScore = (midterm * 0.4) + (final * 0.6);
    
    if (course.gradingSystem === "10") {
        if (totalScore >= 90) return 'A';
        if (totalScore >= 80) return 'B';
        if (totalScore >= 70) return 'C';
        if (totalScore >= 60) return 'D';
        return 'F';
    } else { // 7'lik sistem
        if (totalScore >= 93) return 'A';
        if (totalScore >= 85) return 'B';
        if (totalScore >= 77) return 'C';
        if (totalScore >= 69) return 'D';
        return 'F';
    }
}

function calculateGPA(grades) {
    const gradePoints = {
        'A': 4.0,
        'B': 3.0,
        'C': 2.0,
        'D': 1.0,
        'F': 0.0
    };
    
    const total = grades.reduce((sum, grade) => sum + gradePoints[grade], 0);
    return (total / grades.length).toFixed(2);
}

// UI functions
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

function updateCourseSelect() {
    const select = document.getElementById('courseSelect');
    select.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
        select.innerHTML += `<option value="${course.id}">${course.name}</option>`;
    });
}

function displayCourses() {
    const coursesList = document.getElementById('coursesList');
    coursesList.innerHTML = '<h3>Courses</h3>';
    
    courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'student-card';
        courseElement.innerHTML = `
            <h3>${course.name}</h3>
            <p>Total Students: ${students.filter(s => s.courseId === course.id).length}</p>
            <button onclick="showCourseDetails('${course.id}')">View Details</button>
            <button onclick="deleteCourse('${course.id}')">Delete Course</button>
        `;
        coursesList.appendChild(courseElement);
    });
}

function showCourseDetails(courseId) {
    const course = courses.find(c => c.id === courseId);
    const courseStudents = students.filter(s => s.courseId === courseId);
    
    // Önce mevcut stats elementini kontrol et ve varsa kaldır
    const existingStats = document.querySelector(`#stats-${courseId}`);
    if (existingStats) {
        existingStats.remove();
        return; // Eğer stats zaten görünüyorsa, kaldır ve fonksiyondan çık
    }
    
    const passed = courseStudents.filter(s => s.grade !== 'F').length;
    const failed = courseStudents.filter(s => s.grade === 'F').length;
    const mean = courseStudents.length > 0 
        ? courseStudents.reduce((sum, s) => sum + ((s.midterm * 0.4) + (s.final * 0.6)), 0) / courseStudents.length 
        : 0;

    const details = document.createElement('div');
    details.className = 'stats';
    details.id = `stats-${courseId}`; // Benzersiz ID ekle
    details.innerHTML = `
        <h3>${course.name} - Statistics</h3>
        <p>Total Students: ${courseStudents.length}</p>
        <p>Passed Students: ${passed}</p>
        <p>Failed Students: ${failed}</p>
        <p>Class Average: ${mean.toFixed(2)}</p>
    `;

    // Stats'ı ilgili kursun kartının hemen altına ekle
    const courseCard = document.querySelector(`[onclick="showCourseDetails('${courseId}')"]`).closest('.student-card');
    courseCard.after(details);
}

// Event handlers
function handleAddCourse(event) {
    event.preventDefault();
    
    const course = {
        id: Date.now().toString(),
        name: document.getElementById('courseName').value,
        gradingSystem: document.getElementById('gradingSystem').value, // Yeni eklenen
    };
    
    courses.push(course);
    updateCourseSelect();
    displayCourses();
    event.target.reset();
}


function handleAddStudent(event) {
    event.preventDefault();
    
    const courseId = document.getElementById('courseSelect').value;
    const midterm = Number(document.getElementById('midtermScore').value);
    const final = Number(document.getElementById('finalScore').value);
    const course = courses.find(c => c.id === courseId);
    
    const student = {
        id: document.getElementById('studentId').value,
        name: document.getElementById('studentName').value,
        surname: document.getElementById('studentSurname').value,
        courseId: courseId,
        midterm: midterm,
        final: final,
        grade: calculateGrade(midterm, final, course)
    };
    
    students.push(student);
    displayStudents();
    event.target.reset();
}

function isPassingGrade(grade, totalScore, gradingSystem) {
    // Harf notuna göre kontrol yapalım, çünkü D de geçer not
    if (gradingSystem === "10") {
        return grade !== 'F';  // F dışındaki tüm notlar (A,B,C,D) geçer
    } else {
        return grade !== 'F';  // 7'lik sistemde de aynı mantık
    }
}

function displayStudents(filterType = 'all') {
    const studentsList = document.getElementById('studentsList');
    const currentSystem = document.getElementById('gradingSystem').checked ? "7" : "10";
    
    studentsList.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Midterm</th>
                    <th>Final</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    let filteredStudents = students;
    if (filterType === 'passed' || filterType === 'failed') {
        filteredStudents = students.filter(student => {
            const grade = calculateGrade(student.midterm, student.final, {gradingSystem: currentSystem});
            const isPassing = grade !== 'F';
            return filterType === 'passed' ? isPassing : !isPassing;
        });
    }
    
    filteredStudents.forEach(student => {
        const course = courses.find(c => c.id === student.courseId);
        const totalScore = (student.midterm * 0.4) + (student.final * 0.6);
        const grade = calculateGrade(student.midterm, student.final, {gradingSystem: currentSystem});
        
        studentsList.querySelector('tbody').innerHTML += `
            <tr>
                <td>${student.id}</td>
                <td>${student.name} ${student.surname}</td>
                <td>${course.name}</td>
                <td>${student.midterm}</td>
                <td>${student.final}</td>
                <td>${totalScore.toFixed(2)}</td>
                <td class="grade-cell" data-student-id="${student.id}">
                    <span class="grade-${grade}">${grade}</span>
                </td>
                <td>
                    <button onclick="deleteStudent('${student.id}')">Delete</button>
                    <button onclick="editStudent('${student.id}')">Edit</button>
                </td>
            </tr>
        `;
    });
    
    studentsList.innerHTML += '</tbody></table>';
}

function filterStudents(type) {
    // Aktif butonu güncelle
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filters button[onclick="filterStudents('${type}')"]`).classList.add('active');
    
    displayStudents(type);
}

function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const searchResults = document.getElementById('searchResults');
    
    if (!searchTerm) {
        searchResults.innerHTML = '';
        return;
    }
    
    const matchingStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.surname.toLowerCase().includes(searchTerm) ||
        student.id.includes(searchTerm)
    );
    
    searchResults.innerHTML = '';
    matchingStudents.forEach(student => {
        const totalScore = (student.midterm * 0.4) + (student.final * 0.6);
        const grade10 = calculateGrade(student.midterm, student.final, {gradingSystem: "10"});
        const grade7 = calculateGrade(student.midterm, student.final, {gradingSystem: "7"});
        
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name} ${student.surname}</h3>
            <p>Student ID: ${student.id}</p>
            <p>Total Score: ${totalScore.toFixed(2)}</p>
            <p>10-point Grade: ${grade10}</p>
            <p>7-point Grade: ${grade7}</p>
        `;
        
        searchResults.appendChild(card);
    });
}

function filterStudents(type) {
    // Aktif butonu güncelle
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filters button[onclick="filterStudents('${type}')"]`).classList.add('active');
    
    displayStudents(type);
}

function deleteStudent(studentId) {
    students = students.filter(s => s.id !== studentId);
    displayStudents();
}

function deleteCourse(courseId) {
    courses = courses.filter(c => c.id !== courseId);
    students = students.filter(s => s.courseId !== courseId);
    updateCourseSelect();
    displayCourses();
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    document.getElementById('courseSelect').value = student.courseId;
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentSurname').value = student.surname;
    document.getElementById('midtermScore').value = student.midterm;
    document.getElementById('finalScore').value = student.final;
    
    students = students.filter(s => s.id !== studentId);
}

// Grading system değişikliğini dinle
document.getElementById('gradingSystem').addEventListener('change', function() {
    displayStudents(document.querySelector('.filters button.active')?.dataset?.filter || 'all');
});
// Tüm notları güncelle
function updateAllGrades(system) {
    const gradeCells = document.querySelectorAll('.grade-cell');
    gradeCells.forEach(cell => {
        const student = students.find(s => s.id === cell.dataset.studentId);
        if (student) {
            const newGrade = calculateGrade(student.midterm, student.final, {gradingSystem: system});
            cell.innerHTML = `<span class="grade-${newGrade}">${newGrade}</span>`;
        }
    });
}

// Başlangıç verilerini oluşturacak fonksiyon
function createInitialData() {
    // Örnek dersler
    const defaultCourses = [
        { name: "Mathematics 101", gradingSystem: "10" },
        { name: "Physics 101", gradingSystem: "7" },
        { name: "Computer Science 101", gradingSystem: "10" },
        { name: "Chemistry 101", gradingSystem: "7" },
        { name: "Biology 101", gradingSystem: "10" }
    ];

    // Örnek isimler ve soyadları
    const firstNames = ["Ali", "Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Ahmet", "Deniz", "Ece", "Burak"];
    const lastNames = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Arslan", "Doğan", "Yıldız", "Aydın"];

    // Dersleri ekle
    defaultCourses.forEach(course => {
        courses.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: course.name,
            gradingSystem: course.gradingSystem
        });
    });

    // 20 öğrenci oluştur
    for(let i = 0; i < 20; i++) {
        // Rastgele isim ve soyisim seç
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        // Rastgele ders seç
        const randomCourse = courses[Math.floor(Math.random() * courses.length)];
        
        // Rastgele notlar oluştur
        const midterm = Math.floor(Math.random() * 101); // 0-100 arası
        const final = Math.floor(Math.random() * 101); // 0-100 arası

        // Öğrenciyi oluştur
        const student = {
            id: "2023" + (i + 1).toString().padStart(3, '0'), // 2023001, 2023002, ...
            name: firstName,
            surname: lastName,
            courseId: randomCourse.id,
            midterm: midterm,
            final: final,
            grade: calculateGrade(midterm, final, randomCourse)
        };

        students.push(student);
    }

    // Arayüzü güncelle
    updateCourseSelect();
    displayCourses();
    displayStudents();
}

// Sayfa yüklendiğinde başlangıç verilerini oluştur
document.addEventListener('DOMContentLoaded', function() {
    createInitialData();
});

