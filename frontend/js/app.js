// Configuration
const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    updateNavigation();
    initMobileNav();

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('href');
            if (target && target.startsWith('#')) {
                e.preventDefault();
                navigateTo(target);
                closeMobileNav();
            }
        });
    });

    navigateTo('#home');
});

function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open);
    });
}

function closeMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.remove('is-open');
    if (toggle) {
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    }
}

function setActiveNav(section) {
    const key = section.replace('#', '');
    document.querySelectorAll('.nav-link[data-nav]').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-nav') === key);
    });
}

// Navigation
function navigateTo(section) {
    document.querySelectorAll('.section').forEach(s => { s.hidden = true; });

    const targetSection = document.querySelector(section);
    if (targetSection) {
        targetSection.hidden = false;
        setActiveNav(section);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (section === '#home') loadHomeStats();
        else if (section === '#questions') loadQuestions();
        else if (section === '#shop') loadShop();
        else if (section === '#leaderboard') loadLeaderboard();
        else if (section === '#profile') loadProfile();
    }
}

function goBackToQuestions() {
    document.getElementById('questionDetail').hidden = true;
    document.getElementById('questions').hidden = false;
    setActiveNav('#questions');
    loadQuestions();
}

function goBackHome() {
    navigateTo('#home');
}

// Modals
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.hidden = false;
        document.body.classList.add('modal-open');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.hidden = true;
        document.body.classList.remove('modal-open');
    }
}

function showAuthModal() {
    switchToLogin();
    openModal('authModal');
}

function closeAuthModal() {
    closeModal('authModal');
}

document.getElementById('loginBtn')?.addEventListener('click', showAuthModal);
document.getElementById('signupBtn')?.addEventListener('click', () => {
    showAuthModal();
    switchToSignup();
});

function switchToLogin() {
    document.getElementById('loginForm').hidden = false;
    document.getElementById('signupForm').hidden = true;
}

function switchToSignup() {
    document.getElementById('loginForm').hidden = true;
    document.getElementById('signupForm').hidden = false;
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token && data.user) {
            authToken = data.token;
            currentUser = data.user;
            // Ensure points is always set
            if (currentUser.points === undefined) {
                currentUser.points = 0;
            }
            saveUserToStorage();
            closeAuthModal();
            updateNavigation();
            showNotification('Login successful!', 'success');
            navigateTo('#questions');
            resetLoginForm();
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Connection error', 'error');
    });
}

function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const semester = document.getElementById('signupSemester').value;

    fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, semester: parseInt(semester) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.token && data.user) {
            authToken = data.token;
            currentUser = data.user;
            // Ensure points is always set
            if (currentUser.points === undefined) {
                currentUser.points = 0;
            }
            saveUserToStorage();
            closeAuthModal();
            updateNavigation();
            showNotification('Account created successfully!', 'success');
            navigateTo('#questions');
            resetSignupForm();
        } else {
            showNotification(data.message || 'Signup failed', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Connection error', 'error');
    });
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateNavigation();
    navigateTo('#home');
    showNotification('Logged out successfully', 'success');
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);

// Questions
function loadQuestions() {
    const semester = document.getElementById('semesterFilter')?.value || '';
    let url = `${API_URL}/questions`;
    if (semester) {
        url += `?semester=${semester}`;
    }

    fetch(url, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
    .then(res => res.json())
    .then(questions => {
        const list = document.getElementById('questionsList');
        list.innerHTML = '';
        
        if (questions.length === 0) {
            list.innerHTML = emptyState('No questions yet', 'Be the first to ask a question for your semester.');
            return;
        }

        questions.forEach(q => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.innerHTML = `
                <div class="question-header">
                    <h3 class="question-title">${escapeHtml(q.title)}</h3>
                </div>
                <div class="question-meta">
                    <span class="badge semester-badge">Sem ${q.semester}</span>
                    ${q.subject ? `<span class="badge badge-subject">${escapeHtml(q.subject)}</span>` : ''}
                    <span class="badge badge-outline">${escapeHtml(q.username)}</span>
                    <span>${new Date(q.created_at).toLocaleDateString()}</span>
                </div>
            `;
            card.addEventListener('click', () => viewQuestion(q.id));
            list.appendChild(card);
        });
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading questions', 'error');
    });
}

function viewQuestion(id) {
    fetch(`${API_URL}/questions/${id}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
    .then(res => res.json())
    .then(question => {
        displayQuestionDetail(question);
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading question', 'error');
    });
}

function displayQuestionDetail(question) {
    document.getElementById('questions').hidden = true;
    document.getElementById('questionDetail').hidden = false;
    
    const content = document.getElementById('questionDetailContent');
    content.innerHTML = `
        <div class="question-full">
            <h1>${escapeHtml(question.title)}</h1>
            <div class="question-meta">
                <span class="badge semester-badge">Semester ${question.semester}</span>
                ${question.subject ? `<span class="badge badge-subject">${escapeHtml(question.subject)}</span>` : ''}
                <span class="badge badge-outline">${escapeHtml(question.username)}</span>
                <span>${new Date(question.created_at).toLocaleDateString()}</span>
            </div>
            <div class="question-content">${escapeHtml(question.description)}</div>
        </div>

        <div class="answers-section">
            <div class="answers-toolbar">
                <h2>Answers (${question.answers?.length || 0})</h2>
                ${currentUser
                    ? `<button type="button" class="btn btn-primary btn-sm" onclick="showAnswerModal(${question.id})">Post answer</button>`
                    : '<p class="login-prompt">Log in to post an answer</p>'}
            </div>
            <div class="answers-list">
                ${(question.answers && question.answers.length > 0) ? 
                    question.answers.map(a => `
                        <div class="answer-item ${a.is_correct ? 'correct' : ''}">
                            ${a.is_correct ? '<div class="correct-badge">✓ Correct Answer</div>' : ''}
                            <div class="answer-header">
                                <div>
                                    <div class="answer-author">${escapeHtml(a.username)}</div>
                                    <div class="answer-date">${new Date(a.created_at).toLocaleDateString()}</div>
                                </div>
                                ${currentUser?.id === question.user_id && !a.is_correct ? 
                                    `<button class="btn btn-secondary btn-sm" onclick="markCorrect(${a.id}, ${question.id})">Mark Correct</button>` : ''
                                }
                            </div>
                            <div class="answer-content">${escapeHtml(a.content)}</div>
                            ${a.is_correct ? `<div class="points-awarded">+${a.points_awarded || 50} points awarded</div>` : ''}
                            ${currentUser?.id === a.user_id ? 
                                `<button class="btn btn-danger btn-sm" onclick="deleteAnswer(${a.id})">Delete</button>` : ''
                            }
                        </div>
                    `).join('')
                : emptyState('No answers yet', 'Be the first to help with a detailed explanation.')
                }
            </div>
        </div>
    `;
}

function filterQuestions() {
    loadQuestions();
}

function showNewQuestionModal() {
    if (!currentUser) {
        showNotification('Please log in to ask questions', 'error');
        return;
    }
    openModal('newQuestionModal');
}

function closeNewQuestionModal() {
    closeModal('newQuestionModal');
    resetQuestionForm();
}

function handleNewQuestion(event) {
    event.preventDefault();
    const title = document.getElementById('questionTitle').value;
    const description = document.getElementById('questionDescription').value;
    const semester = document.getElementById('questionSemester').value;
    const subject = document.getElementById('questionSubject').value;

    fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ title, description, semester: parseInt(semester), subject })
    })
    .then(res => res.json())
    .then(data => {
        if (data.question) {
            showNotification('Question posted successfully!', 'success');
            closeNewQuestionModal();
            loadQuestions();
        } else {
            showNotification(data.message || 'Error posting question', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error posting question', 'error');
    });
}

function showAnswerModal(questionId) {
    if (!currentUser) {
        showNotification('Please log in to answer', 'error');
        return;
    }
    window.currentQuestionId = questionId;
    openModal('answerModal');
}

function closeAnswerModal() {
    closeModal('answerModal');
    document.getElementById('answerContent').value = '';
}

function handlePostAnswer(event) {
    event.preventDefault();
    const content = document.getElementById('answerContent').value;
    const question_id = window.currentQuestionId;

    fetch(`${API_URL}/answers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ question_id, content })
    })
    .then(res => res.json())
    .then(data => {
        if (data.answer) {
            showNotification('Answer posted successfully!', 'success');
            closeAnswerModal();
            viewQuestion(question_id);
        } else {
            showNotification(data.message || 'Error posting answer', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error posting answer', 'error');
    });
}

function markCorrect(answerId, questionId) {
    if (!confirm('Mark this answer as correct and award 50 points?')) return;

    fetch(`${API_URL}/answers/${answerId}/mark-correct`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ points: 50 })
    })
    .then(res => res.json())
    .then(data => {
        showNotification(data.message || 'Answer marked as correct!', 'success');
        viewQuestion(questionId);
    })
    .catch(err => {
        console.error(err);
        showNotification('Error marking answer', 'error');
    });
}

function deleteAnswer(answerId) {
    if (!confirm('Delete this answer?')) return;

    fetch(`${API_URL}/answers/${answerId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Answer deleted', 'success');
        window.history.back();
    })
    .catch(err => {
        console.error(err);
        showNotification('Error deleting answer', 'error');
    });
}

// Shop
function updatePointsDisplay(points) {
    const pill = document.getElementById('pointsDisplay');
    const navPts = document.getElementById('navPoints');
    const pts = points || 0;
    if (pill) {
        pill.hidden = !currentUser;
        document.getElementById('userPoints').textContent = pts;
    }
    if (navPts) {
        navPts.hidden = !currentUser;
        navPts.textContent = `${pts} pts`;
    }
}

function getShopIcon(category) {
    const icons = { Academic: '📚', Dining: '🍽️', Sports: '⚽', Utilities: '📶' };
    return icons[category] || '🎁';
}

function loadShop() {
    if (!currentUser) {
        document.getElementById('pointsDisplay').hidden = true;
        const navPts = document.getElementById('navPoints');
        if (navPts) navPts.hidden = true;
        loadShopItems();
        return;
    }

    // Fetch current user data to get latest points
    fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    })
    .then(user => {
        console.log('Fetched user data:', user);
        
        // Update currentUser with latest points
        if (user.points !== undefined) {
            currentUser.points = user.points;
            saveUserToStorage();
        }
        
        updatePointsDisplay(currentUser.points);
        loadShopItems();
        loadPurchaseHistory();
    })
    .catch(err => {
        console.error('Error loading user points:', err);
        updatePointsDisplay(currentUser.points);
        loadShopItems();
        loadPurchaseHistory();
    });
}

function loadShopItems() {
    fetch(`${API_URL}/shop/items`)
    .then(res => res.json())
    .then(items => {
        const grid = document.getElementById('shopItems');
        grid.innerHTML = '';
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-card';
            card.innerHTML = `
                <div class="shop-card-header">
                    <div class="shop-card-icon">${getShopIcon(item.category)}</div>
                    <div class="shop-card-name">${escapeHtml(item.name)}</div>
                </div>
                <div class="shop-card-body">
                    <p class="shop-card-description">${escapeHtml(item.description)}</p>
                    ${item.category ? `<span class="shop-card-category">${item.category}</span>` : ''}
                    <div class="shop-card-points">${item.points_required} pts</div>
                    ${currentUser ? 
                        `<button class="btn btn-primary shop-card-button" onclick="redeemItem(${item.id}, ${item.points_required})" 
                         ${currentUser.points < item.points_required ? 'disabled' : ''}>
                         Redeem Now
                         </button>` 
                    : '<button class="btn btn-secondary shop-card-button" disabled>Log in to redeem</button>'
                    }
                </div>
            `;
            grid.appendChild(card);
        });
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading shop items', 'error');
    });
}

function redeemItem(itemId, pointsRequired) {
    if (!currentUser) {
        showNotification('Please log in to redeem items', 'error');
        return;
    }

    if (currentUser.points < pointsRequired) {
        showNotification('Insufficient points to redeem this item', 'error');
        return;
    }

    if (!confirm('Redeem this item?')) return;

    fetch(`${API_URL}/shop/redeem`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ item_id: itemId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message.includes('Successfully')) {
            currentUser.points = data.remainingPoints;
            saveUserToStorage();
            updatePointsDisplay(currentUser.points);
            showNotification(data.message, 'success');
            loadShop();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error redeeming item', 'error');
    });
}

function loadPurchaseHistory() {
    fetch(`${API_URL}/shop/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(purchases => {
        if (purchases.length > 0) {
            document.getElementById('purchaseHistory').hidden = false;
            const list = document.getElementById('historyList');
            list.innerHTML = purchases.map(p => `
                <div class="history-item">
                    <div class="history-item-info">
                        <h4>${escapeHtml(p.name)}</h4>
                        <div class="history-item-date">${new Date(p.redeemed_at).toLocaleDateString()}</div>
                    </div>
                    <div class="history-item-points">-${p.points_spent} pts</div>
                </div>
            `).join('');
        }
    })
    .catch(err => console.error(err));
}

// Leaderboard
function loadLeaderboard() {
    fetch(`${API_URL}/users/leaderboard?limit=50`)
    .then(res => res.json())
    .then(users => {
        const table = document.getElementById('leaderboardTable');
        table.innerHTML = `
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Semester</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((user, index) => {
                        let rankClass = '';
                        if (index === 0) rankClass = 'top1';
                        else if (index === 1) rankClass = 'top2';
                        else if (index === 2) rankClass = 'top3';
                        
                        return `
                            <tr>
                                <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
                                <td><span class="leaderboard-user">${escapeHtml(user.username)}</span></td>
                                <td>Sem ${user.semester}</td>
                                <td><span class="leaderboard-points">${user.points}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading leaderboard', 'error');
    });
}

// Profile
function loadProfile() {
    if (!currentUser) {
        navigateTo('#home');
        return;
    }

    fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(user => {
        displayProfile(user);
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading profile', 'error');
    });
}

function displayProfile(user) {
    const content = document.getElementById('profileContent');
    const initial = (user.username || '?').charAt(0).toUpperCase();
    content.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${initial}</div>
            <h1 class="profile-username">${escapeHtml(user.username)}</h1>
            <p class="profile-meta"><span>${escapeHtml(user.email)}</span><span>Semester ${user.semester}</span></p>
        </div>

        <div class="profile-stats">
            <div class="stat-card">
                <div class="stat-number">${user.points}</div>
                <div class="stat-label">Total Points</div>
            </div>
            <div class="stat-card" id="questionsCount">
                <div class="stat-number">-</div>
                <div class="stat-label">Questions Asked</div>
            </div>
            <div class="stat-card" id="answersCount">
                <div class="stat-number">-</div>
                <div class="stat-label">Answers Given</div>
            </div>
        </div>

        <div class="profile-tabs">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="switchTab('questions-tab')">My Questions</button>
                <button class="tab-button" onclick="switchTab('answers-tab')">My Answers</button>
            </div>
            
            <div id="questions-tab" class="tab-content active">
                <div id="myQuestions"></div>
            </div>
            
            <div id="answers-tab" class="tab-content">
                <div id="myAnswers"></div>
            </div>
        </div>
    `;

    // Load questions and answers
    Promise.all([
        fetch(`${API_URL}/users/questions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(res => res.json()),
        fetch(`${API_URL}/users/answers`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(res => res.json())
    ])
    .then(([questions, answers]) => {
        document.getElementById('questionsCount').innerHTML = `<div class="stat-number">${questions.length}</div><div class="stat-label">Questions Asked</div>`;
        document.getElementById('answersCount').innerHTML = `<div class="stat-number">${answers.length}</div><div class="stat-label">Answers Given</div>`;

        const questionsDiv = document.getElementById('myQuestions');
        questionsDiv.innerHTML = questions.length > 0 ? 
            questions.map(q => `
                <div class="question-card" onclick="viewQuestion(${q.id})">
                    <h4>${escapeHtml(q.title)}</h4>
                    <p>${q.subject} - Semester ${q.semester}</p>
                    <small>${new Date(q.created_at).toLocaleDateString()}</small>
                </div>
            `).join('')
        : emptyState('No questions yet', 'Questions you post will appear here.');

        const answersDiv = document.getElementById('myAnswers');
        answersDiv.innerHTML = answers.length > 0 ?
            answers.map(a => `
                <div class="answer-item">
                    <h4>${a.question_title}</h4>
                    <p>${escapeHtml(a.content)}</p>
                    ${a.is_correct ? `<span class="correct-badge">✓ Correct (${a.points_awarded} pts)</span>` : ''}
                    <small>${new Date(a.created_at).toLocaleDateString()}</small>
                </div>
            `).join('')
        : emptyState('No answers yet', 'Answers you share will appear here.');
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading profile data', 'error');
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Utilities
function updateNavigation() {
    const userMenu = document.getElementById('userMenu');
    const authMenu = document.getElementById('authMenu');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const newQuestionBtn = document.getElementById('newQuestionBtn');
    const loggedIn = !!currentUser;

    if (userMenu) userMenu.hidden = !loggedIn;
    if (authMenu) authMenu.hidden = loggedIn;
    if (loginBtn) loginBtn.hidden = loggedIn;
    if (signupBtn) signupBtn.hidden = loggedIn;
    if (logoutBtn) logoutBtn.hidden = !loggedIn;

    if (newQuestionBtn) newQuestionBtn.hidden = !loggedIn;

    if (loggedIn) {
        updatePointsDisplay(currentUser.points);
    } else {
        const navPts = document.getElementById('navPoints');
        if (navPts) navPts.hidden = true;
        const pointsDisplay = document.getElementById('pointsDisplay');
        if (pointsDisplay) pointsDisplay.hidden = true;
    }
}

function emptyState(title, message) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}


function saveUserToStorage() {
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function loadUserFromStorage() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('toastContainer') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(12px)';
        toast.style.transition = 'opacity 0.2s, transform 0.2s';
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function resetLoginForm() {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function resetSignupForm() {
    document.getElementById('signupUsername').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupSemester').value = '';
}

function resetQuestionForm() {
    document.getElementById('questionTitle').value = '';
    document.getElementById('questionDescription').value = '';
    document.getElementById('questionSemester').value = '';
    document.getElementById('questionSubject').value = '';
}

// Load home page statistics
function loadHomeStats() {
    // Load questions count
    fetch(`${API_URL}/questions`)
    .then(res => res.json())
    .then(questions => {
        const totalQuestions = Array.isArray(questions) ? questions.length : 0;
        animateCounter('totalQuestions', totalQuestions);
    })
    .catch(err => console.error(err));

    // Load answers count
    fetch(`${API_URL}/answers`)
    .then(res => res.json())
    .then(answers => {
        const totalAnswers = Array.isArray(answers) ? answers.length : 0;
        animateCounter('totalAnswers', totalAnswers);
    })
    .catch(err => console.error(err));

    // Load users count (estimate based on leaderboard)
    fetch(`${API_URL}/leaderboard`)
    .then(res => res.json())
    .then(users => {
        const totalUsers = Array.isArray(users) ? users.length : 0;
        animateCounter('totalUsers', totalUsers);
    })
    .catch(err => console.error(err));
}

// Animate counter increment
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const increment = Math.ceil(targetValue / 30);
    
    const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(interval);
        }
        element.textContent = currentValue;
    }, 50);
}

