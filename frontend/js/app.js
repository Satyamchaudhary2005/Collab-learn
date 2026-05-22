// Configuration
const API_URL = 'http://localhost:5000/api';
let currentUser = null;
let authToken = null;
let currentPage = 1;
let currentLeaderboardPage = 1;

// ── Sound Manager (Web Audio API) ──────────────────────────────────────────

const SoundManager = {
    _ctx: null,
    _enabled: localStorage.getItem('soundEnabled') !== 'false',

    _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
        return this._ctx;
    },

    _play(freq, duration, type, gainVal) {
        if (!this._enabled) return;
        try {
            const ctx = this._getCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(gainVal || 0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* Silently fail */ }
    },

    _playMulti(notes, type) {
        if (!this._enabled) return;
        notes.forEach(([freq, time, dur]) => {
            setTimeout(() => this._play(freq, dur || 0.15, type, 0.12), time * 1000);
        });
    },

    click()       { this._play(800, 0.06, 'square', 0.04); },
    success()     { this._playMulti([[523, 0, 0.12], [659, 0.08, 0.12], [784, 0.16, 0.2]], 'sine'); },
    error()       { this._playMulti([[300, 0, 0.15], [250, 0.12, 0.25]], 'sawtooth'); },
    badge()       { this._playMulti([[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.1], [1047, 0.24, 0.35]], 'sine'); },
    points()      { this._playMulti([[880, 0, 0.08], [1108, 0.06, 0.15]], 'sine'); },
    vote()        { this._play(660, 0.1, 'triangle', 0.06); },
    bookmark()    { this._play(1047, 0.18, 'sine', 0.08); },
    login()       { this._playMulti([[440, 0, 0.08], [554, 0.06, 0.08], [659, 0.12, 0.2]], 'sine'); },
    question()    { this._playMulti([[392, 0, 0.1], [523, 0.1, 0.25]], 'triangle'); },
    answer()      { this._playMulti([[587, 0, 0.08], [440, 0.08, 0.2]], 'sine'); },
    toggle()      { this._playMulti([[600, 0, 0.05], [800, 0.04, 0.08]], 'sine'); },

    toggleSound() {
        this._enabled = !this._enabled;
        localStorage.setItem('soundEnabled', this._enabled);
        if (this._enabled) {
            this.success();
        }
        const btn = document.getElementById('soundToggle');
        if (btn) btn.textContent = this._enabled ? '🔊' : '🔇';
        return this._enabled;
    },

    isEnabled() {
        return this._enabled;
    },

    initButton() {
        const btn = document.getElementById('soundToggle');
        if (btn) {
            btn.textContent = this._enabled ? '🔊' : '🔇';
            btn.addEventListener('click', () => this.toggleSound());
        }
        // Unlock audio on first user interaction
        const unlock = () => {
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume();
            }
            document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock);
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserFromStorage();
    updateNavigation();
    initMobileNav();
    initDarkMode();

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
        else if (section === '#questions') { currentPage = 1; loadQuestions(); }
        else if (section === '#shop') loadShop();
        else if (section === '#leaderboard') { currentLeaderboardPage = 1; loadLeaderboard(); }
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
    document.getElementById('forgotPasswordForm').hidden = true;
}

function switchToSignup() {
    document.getElementById('loginForm').hidden = true;
    document.getElementById('signupForm').hidden = false;
    document.getElementById('forgotPasswordForm').hidden = true;
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
            if (currentUser.points === undefined) currentUser.points = 0;
            saveUserToStorage();
            closeAuthModal();
            updateNavigation();
            showNotification('Login successful!', 'success');
            SoundManager.login();
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
            if (currentUser.points === undefined) currentUser.points = 0;
            saveUserToStorage();
            closeAuthModal();
            updateNavigation();
            showNotification('Account created successfully!', 'success');
            SoundManager.login();
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

// ── Dark Mode ──────────────────────────────────────────────────────────────

function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const toggle = document.getElementById('darkModeToggle');
    if (!toggle) return;

    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        toggle.textContent = '☀️';
    }

    toggle.addEventListener('click', toggleDarkMode);
}

function toggleDarkMode() {
    SoundManager.click();
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.textContent = isDark ? '☀️' : '🌙';
}

// ── Search (debounced) ──────────────────────────────────────────────────────

let searchTimeout = null;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadQuestions();
    }, 300);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').hidden = true;
    currentPage = 1;
    loadQuestions();
}

// ── Questions ───────────────────────────────────────────────────────────────

function loadQuestions() {
    const semester = document.getElementById('semesterFilter')?.value || '';
    const search = document.getElementById('searchInput')?.value || '';
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.hidden = !search;

    let url = `${API_URL}/questions?page=${currentPage}&limit=10`;
    if (semester) url += `&semester=${semester}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetch(url, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
    .then(res => res.json())
    .then(data => {
        const questions = data.questions || data;
        const pagination = data.pagination;
        const list = document.getElementById('questionsList');
        list.innerHTML = '';

        if (!questions || questions.length === 0) {
            list.innerHTML = emptyState('No questions found', search ? 'Try a different search term.' : 'Be the first to ask a question for your semester.');
            document.getElementById('questionsPagination').hidden = true;
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

        // Render pagination
        if (pagination && pagination.totalPages > 1) {
            renderPagination('questionsPagination', pagination, (page) => {
                currentPage = page;
                loadQuestions();
            });
        } else {
            document.getElementById('questionsPagination').hidden = true;
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading questions', 'error');
    });
}

function viewQuestion(id) {
    // Store the current question ID for voteAnswer to use
    window.currentViewingQuestionId = id;
    fetch(`${API_URL}/questions/${id}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    })
    .then(res => res.json())
    .then(question => {
        displayQuestionDetail(question);
        if (currentUser && authToken) {
            // Check bookmark status
            fetch(`${API_URL}/questions/${id}/bookmark/check`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            .then(res => res.json())
            .then(data => {
                const btn = document.getElementById('bookmarkBtn');
                if (btn) {
                    btn.dataset.bookmarked = data.bookmarked;
                    btn.innerHTML = data.bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark';
                    btn.classList.toggle('bookmarked', data.bookmarked);
                }
            })
            .catch(() => {});
        }
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
            <div class="question-full-header">
                <h1>${escapeHtml(question.title)}</h1>
                <div class="question-header-actions">
                    ${currentUser ? `<button type="button" id="bookmarkBtn" class="btn btn-ghost btn-sm bookmark-btn" data-bookmarked="false" onclick="toggleBookmark(${question.id})">🔖 Bookmark</button>` : ''}
                    ${currentUser?.id === question.user_id ? `<button type="button" class="btn btn-danger btn-sm" onclick="deleteQuestion(${question.id})">Delete question</button>` : ''}
                </div>
            </div>
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
                                <div class="answer-header-actions">
                                    ${currentUser && currentUser.id !== a.user_id ? `
                                        <div class="vote-buttons">
                                            <button class="vote-btn vote-up ${a.userVote === 'up' ? 'voted' : ''}" onclick="voteAnswer(${a.id}, 'up')" title="Upvote">▲</button>
                                            <span class="vote-count">${(a.upvotes || 0) - (a.downvotes || 0)}</span>
                                            <button class="vote-btn vote-down ${a.userVote === 'down' ? 'voted' : ''}" onclick="voteAnswer(${a.id}, 'down')" title="Downvote">▼</button>
                                        </div>
                                    ` : ''}
                                    ${currentUser?.id === question.user_id && !a.is_correct ?
                                        `<button class="btn btn-secondary btn-sm" onclick="markCorrect(${a.id}, ${question.id})">Mark Correct</button>` : ''
                                    }
                                </div>
                            </div>
                            <div class="answer-content">${escapeHtml(a.content)}</div>
                            ${a.is_correct ? `<div class="points-awarded">+${a.points_awarded || 50} points awarded</div>` : ''}
                            <div class="answer-actions">
                                ${currentUser?.id === a.user_id ?
                                    `<button class="btn btn-danger btn-sm" onclick="deleteAnswer(${a.id})">Delete</button>` : ''
                                }
                            </div>
                        </div>
                    `).join('')
                : emptyState('No answers yet', 'Be the first to help with a detailed explanation.')
                }
            </div>
        </div>
    `;
}

function filterQuestions() {
    currentPage = 1;
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
            showBadgeNotification(data.awardedBadges);
            closeNewQuestionModal();
            SoundManager.question();
            loadQuestions();
        } else {
            showNotification(data.message || 'Error posting question', 'error');
            SoundManager.error();
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error posting question', 'error');
        SoundManager.error();
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
            showBadgeNotification(data.awardedBadges);
            closeAnswerModal();
            SoundManager.answer();
            viewQuestion(question_id);
        } else {
            showNotification(data.message || 'Error posting answer', 'error');
            SoundManager.error();
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error posting answer', 'error');
        SoundManager.error();
    });
}

function markCorrect(answerId, questionId) {
    if (!confirm('Mark this answer as correct and award 50 points?')) return;
    SoundManager.click();

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
        showBadgeNotification(data.awardedBadges);
        SoundManager.points();
        viewQuestion(questionId);
    })
    .catch(err => {
        console.error(err);
        showNotification('Error marking answer', 'error');
    });
}

function deleteQuestion(questionId) {
    if (!confirm('Delete this question permanently? This will also remove all answers, votes, and bookmarks.')) return;
    SoundManager.click();

    fetch(`${API_URL}/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message, 'success');
            goBackToQuestions();
        } else {
            showNotification(data.message || 'Error deleting question', 'error');
            SoundManager.error();
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error deleting question', 'error');
        SoundManager.error();
    });
}

function deleteAnswer(answerId) {
    if (!confirm('Delete this answer?')) return;
    SoundManager.click();

    fetch(`${API_URL}/answers/${answerId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Answer deleted', 'success');
        goBackToQuestions();
    })
    .catch(err => {
        console.error(err);
        showNotification('Error deleting answer', 'error');
    });
}

// ── Voting ──────────────────────────────────────────────────────────────────

function voteAnswer(answerId, voteType) {
    if (!currentUser) {
        showNotification('Please log in to vote', 'error');
        return;
    }

    fetch(`${API_URL}/answers/${answerId}/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ vote_type: voteType })
    })
    .then(res => res.json())
    .then(data => {
        // Reload the question detail view to reflect vote changes
        const questionId = window.currentViewingQuestionId;
        if (data.vote_type === null) {
            // Vote was removed (toggle off) - still show success
        }
        showNotification(data.message, 'success');
        SoundManager.vote();
        if (questionId) viewQuestion(questionId);
    })
    .catch(err => {
        console.error(err);
        showNotification('Error voting', 'error');
        SoundManager.error();
    });
}

// ── Bookmarks ───────────────────────────────────────────────────────────────

function toggleBookmark(questionId) {
    if (!currentUser) {
        showNotification('Please log in to bookmark', 'error');
        return;
    }

    const btn = document.getElementById('bookmarkBtn');
    const isBookmarked = btn?.dataset.bookmarked === 'true';

    const method = isBookmarked ? 'DELETE' : 'POST';
    const url = isBookmarked
        ? `${API_URL}/questions/${questionId}/bookmark`
        : `${API_URL}/questions/${questionId}/bookmark`;

    fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (btn) {
            btn.dataset.bookmarked = data.bookmarked;
            btn.innerHTML = data.bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark';
            btn.classList.toggle('bookmarked', data.bookmarked);
        }
        SoundManager.bookmark();
        showNotification(data.message, 'success');
    })
    .catch(err => {
        console.error(err);
        showNotification('Error toggling bookmark', 'error');
        SoundManager.error();
    });
}

// ── Pagination ──────────────────────────────────────────────────────────────

function renderPagination(containerId, pagination, onPageClick) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.hidden = false;

    // Generate a unique namespace for this paginator
    const ns = 'page_' + containerId + '_' + Date.now();
    window[ns] = onPageClick;

    const { page, totalPages } = pagination;
    let html = '';

    // Previous button
    html += `<button class="btn btn-ghost btn-sm pagination-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}" data-ns="${ns}">← Prev</button>`;

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
        html += `<button class="btn btn-ghost btn-sm pagination-btn" data-page="1" data-ns="${ns}">1</button>`;
        if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn btn-ghost btn-sm pagination-btn ${i === page ? 'pagination-active' : ''}" data-page="${i}" data-ns="${ns}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
        html += `<button class="btn btn-ghost btn-sm pagination-btn" data-page="${totalPages}" data-ns="${ns}">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="btn btn-ghost btn-sm pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}" data-ns="${ns}">Next →</button>`;

    container.innerHTML = html;

    // Attach click listeners
    container.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
            const pageNum = parseInt(btn.dataset.page);
            const ns = btn.dataset.ns;
            if (window[ns] && pageNum) window[ns](pageNum);
        });
    });
}

// ── Shop ────────────────────────────────────────────────────────────────────

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

    fetch(`${API_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    })
    .then(user => {
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
    SoundManager.click();

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
            SoundManager.points();
            loadShop();
        } else {
            showNotification(data.message, 'error');
            SoundManager.error();
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

// ── Leaderboard (with pagination) ───────────────────────────────────────────

function loadLeaderboard() {
    fetch(`${API_URL}/users/leaderboard?limit=10&page=${currentLeaderboardPage}`)
    .then(res => res.json())
    .then(data => {
        const users = data.users || data;
        const pagination = data.pagination;
        const container = document.getElementById('leaderboardTable');
        container.innerHTML = `
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
                    ${(users && users.length > 0) ? users.map((user, index) => {
                        const rank = (currentLeaderboardPage - 1) * 10 + index + 1;
                        let rankClass = '';
                        if (rank === 1) rankClass = 'top1';
                        else if (rank === 2) rankClass = 'top2';
                        else if (rank === 3) rankClass = 'top3';

                        return `
                            <tr>
                                <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                                <td><span class="leaderboard-user">${escapeHtml(user.username)}</span></td>
                                <td>Sem ${user.semester}</td>
                                <td><span class="leaderboard-points">${user.points}</span></td>
                            </tr>
                        `;
                    }).join('') : `<tr><td colspan="4" style="text-align:center;padding:2rem;">No users yet</td></tr>`}
                </tbody>
            </table>
        `;

        if (pagination && pagination.totalPages > 1) {
            renderPagination('leaderboardPagination', pagination, (page) => {
                currentLeaderboardPage = page;
                loadLeaderboard();
            });
        } else {
            document.getElementById('leaderboardPagination').hidden = true;
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading leaderboard', 'error');
    });
}

// ── Profile ─────────────────────────────────────────────────────────────────

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

        <!-- Badges Section -->
        <div id="badgesSection" class="profile-badges">
            <h3 class="section-subtitle badges-title">🏅 Badges Earned</h3>
            <div id="badgesList" class="badges-grid">
                <div class="empty-state" style="border:none;padding:1rem;">
                    <p>Loading badges...</p>
                </div>
            </div>
        </div>

        <div class="profile-tabs">
            <div class="tab-buttons">
                <button class="tab-button active" onclick="switchTab('questions-tab')">My Questions</button>
                <button class="tab-button" onclick="switchTab('answers-tab')">My Answers</button>
                <button class="tab-button" onclick="switchTab('bookmarks-tab')">Bookmarks</button>
            </div>

            <div id="questions-tab" class="tab-content active">
                <div id="myQuestions"></div>
            </div>

            <div id="answers-tab" class="tab-content">
                <div id="myAnswers"></div>
            </div>

            <div id="bookmarks-tab" class="tab-content">
                <div id="myBookmarks"></div>
            </div>
        </div>
    `;

    // Load badges
    loadBadges();

    // Load questions and answers and bookmarks
    Promise.all([
        fetch(`${API_URL}/users/questions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(res => res.json()),
        fetch(`${API_URL}/users/answers`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(res => res.json()),
        fetch(`${API_URL}/users/bookmarks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        }).then(res => res.json())
    ])
    .then(([questions, answers, bookmarks]) => {
        document.getElementById('questionsCount').innerHTML = `<div class="stat-number">${questions.length}</div><div class="stat-label">Questions Asked</div>`;
        document.getElementById('answersCount').innerHTML = `<div class="stat-number">${answers.length}</div><div class="stat-label">Answers Given</div>`;

        const questionsDiv = document.getElementById('myQuestions');
        questionsDiv.innerHTML = questions.length > 0 ?
            questions.map(q => `
                <div class="question-card" onclick="viewQuestion(${q.id})">
                    <h4>${escapeHtml(q.title)}</h4>
                    <p>${q.subject || 'General'} - Semester ${q.semester}</p>
                    <small>${new Date(q.created_at).toLocaleDateString()}</small>
                </div>
            `).join('')
        : emptyState('No questions yet', 'Questions you post will appear here.');

        const answersDiv = document.getElementById('myAnswers');
        answersDiv.innerHTML = answers.length > 0 ?
            answers.map(a => `
                <div class="answer-item">
                    <h4>${escapeHtml(a.question_title)}</h4>
                    <p>${escapeHtml(a.content)}</p>
                    ${a.is_correct ? `<span class="correct-badge">✓ Correct (${a.points_awarded} pts)</span>` : ''}
                    <small>${new Date(a.created_at).toLocaleDateString()}</small>
                </div>
            `).join('')
        : emptyState('No answers yet', 'Answers you share will appear here.');

        const bookmarksDiv = document.getElementById('myBookmarks');
        bookmarksDiv.innerHTML = bookmarks.length > 0 ?
            bookmarks.map(q => `
                <div class="question-card" onclick="viewQuestion(${q.id})">
                    <h4>${escapeHtml(q.title)}</h4>
                    <p>${q.subject || 'General'} - Semester ${q.semester} - ${escapeHtml(q.username)}</p>
                    <small>Bookmarked ${new Date(q.bookmarked_at).toLocaleDateString()}</small>
                </div>
            `).join('')
        : emptyState('No bookmarks yet', 'Bookmark questions you want to revisit later.');
    })
    .catch(err => {
        console.error(err);
        showNotification('Error loading profile data', 'error');
    });
}

function loadBadges() {
    fetch(`${API_URL}/users/badges`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(res => res.json())
    .then(badges => {
        const list = document.getElementById('badgesList');
        if (!list) return;
        if (badges.length > 0) {
            list.innerHTML = badges.map(b => `
                <div class="badge-card" title="${escapeHtml(b.description)}">
                    <div class="badge-card-icon">${b.icon || '🏅'}</div>
                    <div class="badge-card-name">${escapeHtml(b.badge_name)}</div>
                    <div class="badge-card-date">${new Date(b.awarded_at).toLocaleDateString()}</div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="empty-state" style="border:none;padding:1.5rem;"><p>No badges yet. Keep contributing to earn badges!</p></div>';
        }
    })
    .catch(err => {
        console.error(err);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    // Find the clicked button
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName.split('-')[0])) {
            btn.classList.add('active');
        }
    });
}

// ── Forgot Password ─────────────────────────────────────────────────────────

function showForgotPassword() {
    document.getElementById('loginForm').hidden = true;
    document.getElementById('signupForm').hidden = true;
    document.getElementById('forgotPasswordForm').hidden = false;
    document.getElementById('forgotSuccess').hidden = true;
}

function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value;

    fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('forgotPasswordForm').querySelector('form').hidden = true;
        document.getElementById('forgotSuccess').hidden = false;

        // If in development, show the reset token
        if (data.resetToken) {
            document.getElementById('forgotSuccess').innerHTML = `
                <div class="success-message">
                    <p>${data.message}</p>
                    <div class="form-group" style="margin-top:1rem;">
                        <label>Reset Token (dev mode)</label>
                        <input type="text" value="${data.resetToken}" readonly onclick="this.select()" style="font-family:monospace;font-size:0.8rem;">
                    </div>
                    <div class="form-group">
                        <label for="resetNewPassword">New Password</label>
                        <input type="password" id="resetNewPassword" placeholder="Min. 6 characters">
                    </div>
                    <button type="button" class="btn btn-primary btn-block" onclick="handleResetPassword('${data.resetToken}')">Reset Password</button>
                    <button type="button" class="btn btn-ghost btn-block" onclick="switchToLogin()" style="margin-top:0.5rem;">Back to sign in</button>
                </div>
            `;
        }
        SoundManager.success();
    })
    .catch(err => {
        console.error(err);
        showNotification('Error requesting password reset', 'error');
        SoundManager.error();
    });
}

function handleResetPassword(token) {
    const newPassword = document.getElementById('resetNewPassword').value;
    if (!newPassword || newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            showNotification(data.message, 'success');
            SoundManager.success();
            switchToLogin();
        } else {
            showNotification(data.message || 'Error resetting password', 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showNotification('Error resetting password', 'error');
    });
}

// ── Utilities ───────────────────────────────────────────────────────────────

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

function showBadgeNotification(badges) {
    if (!badges || badges.length === 0) return;

    SoundManager.badge();
    badges.forEach(badge => {
        const container = document.getElementById('toastContainer') || document.body;
        const toast = document.createElement('div');
        toast.className = 'toast toast-badge';
        toast.innerHTML = `
            <div class="badge-toast-icon">${badge.icon || '🏅'}</div>
            <div class="badge-toast-content">
                <div class="badge-toast-title">🏆 Badge Earned!</div>
                <div class="badge-toast-name">${escapeHtml(badge.name)}</div>
                <div class="badge-toast-desc">${escapeHtml(badge.description || '')}</div>
            </div>
        `;
        container.appendChild(toast);

        // Add sparkle animation via CSS keyframes
        setTimeout(() => {
            toast.classList.add('badge-toast-show');
        }, 50);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'scale(0.85) translateY(20px)';
            toast.style.transition = 'opacity 0.4s, transform 0.4s';
            setTimeout(() => toast.remove(), 400);
        }, 5000);
    });
}

function showNotification(message, type = 'info') {
    if (type === 'success') SoundManager.success();
    else if (type === 'error') SoundManager.error();
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
    fetch(`${API_URL}/questions?limit=1`)
    .then(res => res.json())
    .then(data => {
        const totalQuestions = data.pagination?.total || (Array.isArray(data) ? data.length : 0);
        animateCounter('totalQuestions', totalQuestions);
    })
    .catch(err => console.error(err));

    fetch(`${API_URL}/answers`)
    .then(res => res.json())
    .then(answers => {
        const totalAnswers = Array.isArray(answers) ? answers.length : 0;
        animateCounter('totalAnswers', totalAnswers);
    })
    .catch(err => console.error(err));

    fetch(`${API_URL}/users/leaderboard?limit=1`)
    .then(res => res.json())
    .then(data => {
        const totalUsers = data.pagination?.total || (Array.isArray(data) ? data.length : 0);
        animateCounter('totalUsers', totalUsers);
    })
    .catch(err => console.error(err));
}

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
