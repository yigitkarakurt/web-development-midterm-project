// State management
const state = {
    courses: [],
    students: [],
    filters: {
        courseId: '',
        type: 'all'
    }
};

// Constants
const GRADE_POINTS = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
};

const GRADING_SCALES = {
    '10': [
        { min: 90, grade: 'A' },
        { min: 80, grade: 'B' },
        { min: 70, grade: 'C' },
        { min: 60, grade: 'D' }
    ],
    '7': [
        { min: 93, grade: 'A' },
        { min: 85, grade: 'B' },
        { min: 77, grade: 'C' },
        { min: 69, grade: 'D' }
    ]
};

// Helper functions
const calculateTotalScore = (midterm, final) => (midterm * 0.4) + (final * 0.6);

const calculateGrade = (midterm, final, course) => {
    const totalScore = calculateTotalScore(midterm, final);
    const scale = GRADING_SCALES[course.gradingSystem];
    
    for (const { min, grade } of scale) {
        if (totalScore >= min) return grade;
    }
    return 'F';
};

const calculateGPA = grades => {
    if (!grades.length) return '0.00';
    const total = grades.reduce((sum, grade) => sum + GRADE_POINTS[grade], 0);
    return (total / grades.length).toFixed(2);
};

// DOM helper functions
const getElement = id => document.getElementById(id);
const getCurrentGradingSystem = () => getElement('gradingSystem').checked ? "7" : "10";

const createElementWithHTML = (tag, className, html) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html) element.innerHTML = html;
    return element;
};

// UI update functions
const showSection = sectionId => {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    getElement(sectionId).classList.remove('hidden');
};

const updateCourseSelect = () => {
    const select = getElement('courseSelect');
    select.innerHTML = '<option value="">Select Course</option>' +
        state.courses.map(course => 
            `<option value="${course.id}">${course.name}</option>`
        ).join('');
};


const updateCourseFilter = () => {
    const courseFilter = getElement('courseFilter');
    if (courseFilter) {
        const selectedValue = courseFilter.value || state.filters.courseId;
        courseFilter.innerHTML = '<option value="">All Courses</option>' +
            state.courses.map(course => 
                `<option value="${course.id}">${course.name}</option>`
            ).join('');
        courseFilter.value = selectedValue;
    }
};

const displayCourseStatistics = (courseId) => {
    const course = state.courses.find(c => c.id === courseId);
    const courseStudents = state.students.filter(s => s.courseId === courseId);
    
    const existingStats = document.querySelector(`#stats-${courseId}`);
    if (existingStats) {
        existingStats.remove();
        return;
    }
    
    const stats = {
        total: courseStudents.length,
        passed: courseStudents.filter(s => s.grade !== 'F').length,
        failed: courseStudents.filter(s => s.grade === 'F').length,
        average: courseStudents.length ? 
            courseStudents.reduce((sum, s) => sum + calculateTotalScore(s.midterm, s.final), 0) / courseStudents.length : 0
    };

    const details = createElementWithHTML('div', 'stats', `
        <h3>${course.name} - Statistics</h3>
        <p>Total Students: ${stats.total}</p>
        <p>Passed Students: ${stats.passed}</p>
        <p>Failed Students: ${stats.failed}</p>
        <p>Class Average: ${stats.average.toFixed(2)}</p>
    `);
    details.id = `stats-${courseId}`;

    const courseCard = document.querySelector(`[onclick="showCourseDetails('${courseId}')"]`).closest('.student-card');
    courseCard.after(details);
};

const displayCourses = () => {
    const coursesList = getElement('coursesList');
    coursesList.innerHTML = '<h3>Courses</h3>' +
        state.courses.map(course => `
            <div class="student-card">
                <h3>${course.name}</h3>
                <p>Total Students: ${state.students.filter(s => s.courseId === course.id).length}</p>
                <button onclick="showCourseDetails('${course.id}')">View Details</button>
                <button onclick="deleteCourse('${course.id}')">Delete Course</button>
            </div>
        `).join('');

    updateCourseFilter();
};

const getFilteredStudents = () => {
    let filtered = state.students;
    
    if (state.filters.courseId) {
        filtered = filtered.filter(student => student.courseId === state.filters.courseId);
    }
    
    if (state.filters.type !== 'all') {
        const currentSystem = getCurrentGradingSystem();
        filtered = filtered.filter(student => {
            const isPassing = calculateGrade(student.midterm, student.final, 
                { gradingSystem: currentSystem }) !== 'F';
            return state.filters.type === 'passed' ? isPassing : !isPassing;
        });
    }
    
    return filtered;
};


const setupCourseFilter = () => {
    // Mevcut course filter'ı kontrol et
    let courseFilter = getElement('courseFilter');
    
    // Eğer yoksa oluştur
    if (!courseFilter) {
        courseFilter = createElementWithHTML('select', 'course-filter', 
            '<option value="">All Courses</option>' +
            state.courses.map(course => 
                `<option value="${course.id}">${course.name}</option>`
            ).join('')
        );
        courseFilter.id = 'courseFilter';
        
        // Course filter change event
        courseFilter.addEventListener('change', (e) => {
            state.filters.courseId = e.target.value;
            displayStudents();
        });
        
        // Filter bölümüne ekle
        const filtersSection = document.querySelector('.filters');
        filtersSection.insertBefore(courseFilter, filtersSection.firstChild);
    }
};

const displayStudents = () => {
    const studentsList = getElement('studentsList');
    const currentSystem = getCurrentGradingSystem();
    
    // Course filter'ı güncelle/oluştur
    setupCourseFilter();
    
    const filteredStudents = getFilteredStudents();
    
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
                ${filteredStudents.map(student => {
                    const course = state.courses.find(c => c.id === student.courseId);
                    const totalScore = calculateTotalScore(student.midterm, student.final);
                    const grade = calculateGrade(student.midterm, student.final, 
                        { gradingSystem: currentSystem });
                    
                    return `
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
                }).join('')}
            </tbody>
        </table>
    `;
    
    updateFilterButtons();
};

const updateFilterButtons = () => {
    document.querySelectorAll('.filters button').forEach(btn => {
        btn.classList.toggle('active', 
            btn.getAttribute('onclick')?.includes(`'${state.filters.type}'`));
    });
};

// Event handlers
const handleAddCourse = event => {
    event.preventDefault();
    
    const course = {
        id: Date.now().toString(),
        name: getElement('courseName').value,
        gradingSystem: getElement('gradingSystem').value
    };
    
    state.courses.push(course);
    updateCourseSelect();
    displayCourses();
    event.target.reset();
};

const handleAddStudent = event => {
    event.preventDefault();
    
    const formData = {
        courseId: getElement('courseSelect').value,
        midterm: Number(getElement('midtermScore').value),
        final: Number(getElement('finalScore').value)
    };
    
    const course = state.courses.find(c => c.id === formData.courseId);
    
    const student = {
        id: getElement('studentId').value,
        name: getElement('studentName').value,
        surname: getElement('studentSurname').value,
        ...formData,
        grade: calculateGrade(formData.midterm, formData.final, course)
    };
    
    state.students.push(student);
    displayStudents();
    event.target.reset();
};

const handleSearch = event => {
    const searchTerm = event.target.value.toLowerCase();
    const searchResults = getElement('searchResults');
    
    if (!searchTerm) {
        searchResults.innerHTML = '';
        return;
    }
    
    const matchingStudents = state.students.filter(student => 
        (student.name.toLowerCase().includes(searchTerm) ||
        student.surname.toLowerCase().includes(searchTerm) ||
        student.id.includes(searchTerm)) &&
        (!state.filters.courseId || student.courseId === state.filters.courseId)
    );
    
    searchResults.innerHTML = matchingStudents.map(student => {
        const course = state.courses.find(c => c.id === student.courseId);
        const totalScore = calculateTotalScore(student.midterm, student.final);
        const grade = calculateGrade(student.midterm, student.final, 
            { gradingSystem: getCurrentGradingSystem() });
        
        return `
            <div class="student-card">
                <h3>${student.name} ${student.surname}</h3>
                <p>Student ID: ${student.id}</p>
                <p>Course: ${course.name}</p>
                <p>Total Score: ${totalScore.toFixed(2)}</p>
                <p>Grade: ${grade}</p>
            </div>
        `;
    }).join('');
};

// CRUD operations
const deleteStudent = studentId => {
    state.students = state.students.filter(s => s.id !== studentId);
    displayStudents();
};

const deleteCourse = courseId => {
    state.courses = state.courses.filter(c => c.id !== courseId);
    state.students = state.students.filter(s => s.courseId !== courseId);
    updateCourseSelect();
    displayCourses();

    if (state.filters.courseId === courseId) {
        state.filters.courseId = '';
        const courseFilter = getElement('courseFilter');
        if (courseFilter) {
            courseFilter.value = '';
        }
        displayStudents();
    }
};

const editStudent = studentId => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;
    
    ['courseId', 'id', 'name', 'surname', 'midterm', 'final'].forEach(field => {
        const elementId = field === 'courseId' ? 'courseSelect' : 
            field.includes('Score') ? field : `student${field.charAt(0).toUpperCase() + field.slice(1)}`;
        getElement(elementId).value = student[field];
    });
    
    state.students = state.students.filter(s => s.id !== studentId);
};

// Initial data setup
const createInitialData = () => {
    const defaultCourses = [
        { name: "Mathematics 101", gradingSystem: "10" },
        { name: "Physics 101", gradingSystem: "7" },
        { name: "Computer Science 101", gradingSystem: "10" },
        { name: "Chemistry 101", gradingSystem: "7" },
        { name: "Biology 101", gradingSystem: "10" }
    ];

    const firstNames = ["Ali", "Ayşe", "Mehmet", "Zeynep", "Can", "Elif", "Ahmet", "Deniz", "Ece", "Burak"];
    const lastNames = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Öztürk", "Arslan", "Doğan", "Yıldız", "Aydın"];

    defaultCourses.forEach(course => {
        state.courses.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            ...course
        });
    });

    Array.from({ length: 20 }).forEach((_, i) => {
        const randomCourse = state.courses[Math.floor(Math.random() * state.courses.length)];
        const midterm = Math.floor(Math.random() * 101);
        const final = Math.floor(Math.random() * 101);

        state.students.push({
            id: "2023" + (i + 1).toString().padStart(3, '0'),
            name: firstNames[Math.floor(Math.random() * firstNames.length)],
            surname: lastNames[Math.floor(Math.random() * lastNames.length)],
            courseId: randomCourse.id,
            midterm,
            final,
            grade: calculateGrade(midterm, final, randomCourse)
        });
    });

    // Initialize UI
    updateCourseSelect();
    displayCourses();
    displayStudents(); // Bu artık course filter'ı da oluşturacak
    
    // Set up filter data attributes
    ['all', 'passed', 'failed'].forEach((filter, index) => {
        const button = document.querySelector(`.filters button:nth-child(${index + 1})`);
        if (button) button.dataset.filter = filter;
    });
};

// Event listeners
document.addEventListener('DOMContentLoaded', createInitialData);

getElement('gradingSystem').addEventListener('change', () => {
    displayStudents();
});

// Filter handling
const filterStudents = type => {
    state.filters.type = type;
    displayStudents();
};

const showCourseDetails = courseId => {
    displayCourseStatistics(courseId);
};