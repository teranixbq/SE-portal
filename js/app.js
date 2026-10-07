const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const params = new URLSearchParams(location.search);

function getFromStore(url) {
  if (!window.PORTAL_DATA) return null;
  if (url.includes('courses.json')) return window.PORTAL_DATA.courses;
  if (url.includes('se4ds.json')) return window.PORTAL_DATA.sessions.se4ds;
  if (url.includes('ade.json')) return window.PORTAL_DATA.sessions.ade;
  const m = url.match(/content\/(.*?)\.json/);
  if (m && window.PORTAL_DATA.content[m[1]]) return window.PORTAL_DATA.content[m[1]];
  return null;
}

const getJSON = async url => {
  const stored = getFromStore(url);
  if (stored) return stored;
  try {
    const r = await fetch(url);
    if (!r.ok) throw Error('Data tidak ditemukan');
    return await r.json();
  } catch (e) {
    if (stored) return stored;
    throw e;
  }
};

function theme() {
  const saved = localStorage.getItem('se-portal-theme') || localStorage.getItem('minilify-theme');
  if (saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches)) document.body.classList.add('dark');
  $$('[data-theme]').forEach(b => b.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('se-portal-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  }));
}

function addRecent(item) {
  const old = JSON.parse(localStorage.getItem('se-portal-recent') || localStorage.getItem('minilify-recent') || '[]').filter(x => x.id !== item.id);
  localStorage.setItem('se-portal-recent', JSON.stringify([{ ...item, time: Date.now() }, ...old].slice(0, 5)));
}

function timeAgo(time) {
  const m = Math.max(1, Math.round((Date.now() - time) / 60000));
  return m < 60 ? `${m} menit lalu` : `${Math.round(m / 60)} jam lalu`;
}

function courseCard(c) {
  const isSoon = c.status === 'soon';
  return `<a class="course-card ${isSoon ? 'soon' : ''}" href="${!isSoon ? `session.html?course=${c.id}` : '#'}">
    <div class="course-meta"><span>${c.code || 'PERSONAL LIBRARY'}</span><span>${!isSoon ? `${c.sessions} pertemuan` : 'segera'}</span></div>
    <div><h2>${c.name}</h2><p>${c.description}</p></div>
    <div class="course-foot"><span>${!isSoon ? 'Buka ruang belajar ↗' : 'Coming soon'}</span><span class="badge">${!isSoon ? 'aktif' : 'soon'}</span></div>
  </a>`;
}

async function home() {
  const courses = await getJSON('data/courses.json');
  $('#course-count').textContent = `${courses.length} koleksi`;
  $('#course-grid').innerHTML = courses.map(courseCard).join('');
  const recent = JSON.parse(localStorage.getItem('se-portal-recent') || localStorage.getItem('minilify-recent') || '[]');
  if (!recent.length) return;
  $('.recent-wrap').hidden = false;
  $('#recent-list').innerHTML = recent.slice(0, 3).map(x => `<a class="recent-item" href="session.html?course=${x.course}&session=${x.id}"><b>${x.title}</b><small>${x.courseName} · ${timeAgo(x.time)} →</small></a>`).join('');
}

function diagram(id) {
  if (id === 'validasi') return `<div class="diagram"><div class="diagram-title">Foto 1 · hold-out vs 10-fold cross-validation</div><div class="visual-note"><img src="assets/images/cross-validation.jpeg" alt="Catatan dosen tentang cross-validation"><p>Catatan asli: 1.000 baris dibagi untuk training, testing, lalu validasi bergilir.</p></div><div class="split-animation"><div class="split-label">1.000 rows</div><div class="split-bar"><i class="train-part">80% training</i><i class="test-part">20% testing</i></div><div class="split-caption">hold-out split · satu pembagian untuk menguji generalisasi</div></div><div class="diagram-title fold-title">lalu validasi bergilir</div><div class="folds">${Array.from({length:10}, (_, i) => `<i style="animation-delay:${i * 80}ms"></i>`).join('')}</div><div class="fold-note"><span>90% training</span><span>10% validation berpindah setiap putaran</span></div><div class="flow" style="margin-top:20px"><span>10 putaran</span><b>→</b><span>10 skor validasi</span><b>→</b><span>rata-rata</span></div></div>`;
  if (id === 'pipeline') return `<div class="diagram"><div class="diagram-title">Foto 2 · model masuk ke aplikasi</div><div class="visual-note"><img src="assets/images/ml-pipeline.jpeg" alt="Catatan dosen tentang machine learning pipeline"><p>Catatan asli: model dievaluasi, disimpan, lalu dihubungkan ke aplikasi.</p></div><div class="pipeline-animation"><span class="pipeline-node">Dataset</span><b>→</b><span class="pipeline-node">Train</span><b>→</b><span class="pipeline-node">Model</span><b>→</b><span class="pipeline-node">Evaluate</span><b>→</b><span class="pipeline-node">Application</span></div><div class="inference-line"><i></i><span>unseen data masuk</span><b>→</b><strong>prediksi</strong></div></div>`;
  if (id === 'sdlc') return `<div class="diagram"><div class="diagram-title">siklus pengembangan</div><div class="flow"><span>Plan</span><b>→</b><span>Analyze</span><b>→</b><span>Design</span><b>→</b><span>Build</span><b>→</b><span>Test</span><b>→</b><span>Maintain</span></div></div>`;
  return '';
}

function shuffle(a) {
  return [...a].sort(() => Math.random() - .5).map(q => ({
    ...q,
    options: q.options.map((o, i) => ({o, i})).sort(() => Math.random() - .5)
  })).map(q => ({
    ...q,
    answer: q.options.findIndex(x => x.i === q.answer),
    options: q.options.map(x => x.o)
  }));
}

function closeDrawers() {
  $('#notes-drawer')?.classList.remove('open');
  $('#notes-drawer')?.setAttribute('aria-hidden', 'true');
  $('#quiz-drawer')?.classList.remove('open');
  $('#quiz-drawer')?.setAttribute('aria-hidden', 'true');
  $('#drawer-backdrop')?.classList.remove('open');
}

function openDrawer(type) {
  closeDrawers();
  $('#drawer-backdrop')?.classList.add('open');
  if (type === 'notes') {
    $('#notes-drawer')?.classList.add('open');
    $('#notes-drawer')?.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => $('#notes-canvas')?.focus());
  } else if (type === 'quiz') {
    $('#quiz-drawer')?.classList.add('open');
    $('#quiz-drawer')?.setAttribute('aria-hidden', 'false');
  }
}

function bindNotes(course, session) {
  const canvas = $('#notes-canvas');
  const key = `se-portal-notes:${course}:${session}`;
  const legacyKey = `minilify-notes:${course}:${session}`;
  if (!canvas) return;
  const save = () => {
    localStorage.setItem(key, canvas.innerHTML);
    $('#save-state').textContent = 'tersimpan otomatis · ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  };
  canvas.innerHTML = localStorage.getItem(key) || localStorage.getItem(legacyKey) || '';
  canvas.oninput = save;
  $('[data-add-note]').onclick = () => {
    const note = document.createElement('div');
    note.className = 'note-block';
    note.textContent = 'Tulis catatan...';
    canvas.append(note);
    const range = document.createRange();
    range.selectNodeContents(note);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    canvas.focus();
    save();
  };
  const addImage = file => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.src = reader.result;
      img.alt = 'Catatan gambar';
      canvas.append(img, document.createElement('p'));
      save();
    };
    reader.readAsDataURL(file);
  };
  $('#image-input').onchange = e => addImage(e.target.files[0]);
  canvas.ondragover = e => e.preventDefault();
  canvas.ondrop = e => { e.preventDefault(); addImage(e.dataTransfer.files[0]); };
  canvas.onpaste = e => {
    const img = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
    if (img) { e.preventDefault(); addImage(img); }
  };
  $('[data-export]').onclick = () => {
    const blob = new Blob([JSON.stringify({version:1, course, session, html:canvas.innerHTML, exportedAt:new Date().toISOString()}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${session}-notes.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $('#import-input').onchange = e => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (typeof data.html !== 'string') throw Error();
        canvas.innerHTML = data.html;
        save();
      } catch { alert('File backup tidak valid.'); }
    };
    reader.readAsText(e.target.files[0]);
  };
}

function bindQuiz(quizData, sessionTitle) {
  const container = $('#quiz-body');
  if (!container) return;
  if (!quizData || !quizData.length) {
    container.innerHTML = `<div class="quiz-empty-box"><p class="kicker">BELUM TERSEDIA</p><h3>Kuis Belum Ada</h3><p>Materi pada pertemuan ini belum memiliki paket soal review.</p></div>`;
    return;
  }

  const renderQuizForm = () => {
    const questions = shuffle(quizData);
    container.innerHTML = `
      <form id="quiz-form" class="quiz-form-flow">
        <div class="quiz-info-card">
          <p class="kicker">REVIEW CHAPTER</p>
          <h4>${sessionTitle}</h4>
          <p>Uji pemahaman Anda dengan ${questions.length} soal acak di bawah ini.</p>
        </div>
        <div class="quiz-questions-list">
          ${questions.map((q, i) => `
            <div class="quiz-card" data-q-idx="${i}">
              <div class="quiz-card-head">
                <span class="quiz-card-num">Soal ${i + 1} / ${questions.length}</span>
              </div>
              <p class="quiz-card-prompt">${q.question}</p>
              <div class="quiz-choice-group">
                ${q.options.map((opt, j) => `
                  <label class="quiz-choice-item">
                    <input type="radio" name="q_${i}" value="${j}" required>
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="quiz-form-actions">
          <button type="submit" class="primary full-width">Kirim Jawaban & Evaluasi</button>
        </div>
      </form>
    `;

    $('#quiz-form').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      let correctCount = 0;
      const wrongList = [];

      questions.forEach((q, i) => {
        const ans = Number(fd.get(`q_${i}`));
        if (ans === q.answer) {
          correctCount++;
        } else {
          wrongList.push({
            q: q.question,
            yourAns: ans !== undefined && !isNaN(ans) ? q.options[ans] : '(Tidak dijawab)',
            correctAns: q.options[q.answer],
            explanation: q.explanation
          });
        }
      });

      renderQuizResult(correctCount, questions.length, wrongList);
    };
  };

  const renderQuizResult = (correct, total, wrong) => {
    const isPerfect = correct === total;
    container.innerHTML = `
      <div class="quiz-result-box">
        <p class="kicker">HASIL EVALUASI</p>
        <div class="quiz-score-display">
          <span class="score-number">${correct} / ${total}</span>
          <span class="score-label">${isPerfect ? 'Sempurna!' : 'Perlu ditinjau kembali'}</span>
        </div>
        <p class="score-desc">${isPerfect ? 'Luar biasa! Seluruh konsep bab ini telah Anda pahami dengan tepat.' : 'Beberapa jawaban masih kurang tepat. Cek pembahasan di bawah ini.'}</p>
        <div class="quiz-actions-row">
          <button class="primary" id="quiz-retry-btn">Ulangi Kuis</button>
          <button class="icon-outline-btn" data-close-quiz>Tutup</button>
        </div>
      </div>
      ${wrong.length ? `
        <div class="quiz-wrong-breakdown">
          <h5>Pembahasan Jawaban</h5>
          <div class="wrong-items">
            ${wrong.map((w, idx) => `
              <div class="wrong-item">
                <p class="wrong-q"><strong>${idx + 1}.</strong> ${w.q}</p>
                <div class="wrong-answers-diff">
                  <span class="badge-wrong">Pilihan Anda: ${w.yourAns}</span>
                  <span class="badge-right">Kunci: ${w.correctAns}</span>
                </div>
                ${w.explanation ? `<p class="wrong-exp"><em>Penjelasan:</em> ${w.explanation}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
    $('#quiz-retry-btn')?.addEventListener('click', renderQuizForm);
    $$('[data-close-quiz]').forEach(b => b.addEventListener('click', closeDrawers));
  };

  renderQuizForm();
}

async function sessionPage() {
  const courseId = params.get('course') || 'se4ds';
  const [courses, sessions] = await Promise.all([
    getJSON('data/courses.json').catch(() => [
      { id: 'se4ds', name: 'Data Science For Software Engineering', code: 'M-058' },
      { id: 'ade', name: 'Advance Data Engineering', code: 'M-059' }
    ]),
    getJSON(`data/${courseId}.json`).catch(() => [])
  ]);

  const course = courses.find(x => x.id === courseId) || courses[0];
  $('#sidebar-course-code').textContent = course.code || 'KULIAH';
  $('#sidebar-course-name').textContent = course.name;
  $('#breadcrumb-course').textContent = course.shortName || course.name;

  let currentSessionId = params.get('session') || localStorage.getItem(`se-portal-last:${courseId}`) || localStorage.getItem(`minilify-last:${courseId}`);
  if (!sessions.some(s => s.id === currentSessionId)) {
    currentSessionId = sessions.find(s => s.status === 'available')?.id || sessions[0]?.id || 'pertemuan-01';
  }

  // Bind drawers buttons
  $('[data-open-notes]').onclick = () => openDrawer('notes');
  $('[data-close-notes]').onclick = closeDrawers;
  $('[data-open-quiz]').onclick = () => openDrawer('quiz');
  $('[data-close-quiz]').onclick = closeDrawers;
  $('#drawer-backdrop').onclick = closeDrawers;

  // Mobile sidebar toggle
  const toggleMobileSidebar = () => {
    $('#sidebar').classList.toggle('open');
    $('#sidebar-backdrop').classList.toggle('open');
  };
  $('#sidebar-toggle').onclick = toggleMobileSidebar;
  $('#sidebar-backdrop').onclick = () => {
    $('#sidebar').classList.remove('open');
    $('#sidebar-backdrop').classList.remove('open');
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawers();
  });

  const renderSidebar = activeId => {
    const nav = $('#sidebar-sessions');
    nav.innerHTML = sessions.map(s => `
      <button class="sidebar-item ${s.id === activeId ? 'active' : ''} ${s.status}" data-session="${s.id}">
        <span class="session-badge">${String(s.number).padStart(2, '0')}</span>
        <span class="session-nav-title">${s.title}</span>
        ${s.status !== 'available' ? '<span class="session-nav-status">segera</span>' : ''}
      </button>
    `).join('');

    $$('.sidebar-item').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.dataset.session;
        loadSession(targetId);
        $('#sidebar').classList.remove('open');
        $('#sidebar-backdrop').classList.remove('open');
      };
    });
  };

  const loadSession = async id => {
    currentSessionId = id;
    const sessionMeta = sessions.find(s => s.id === id) || { number: 1, title: id, status: 'planned' };
    const sessionNumStr = String(sessionMeta.number).padStart(2, '0');
    const labelPrefix = courseId === 'ade' ? 'Modul ' : 'Pertemuan ';

    history.replaceState(null, '', `session.html?course=${courseId}&session=${id}`);
    localStorage.setItem(`se-portal-last:${courseId}`, id);
    $('#breadcrumb-session').textContent = `${labelPrefix}${sessionNumStr}`;
    renderSidebar(id);
    closeDrawers();

    const doc = $('#doc-content');
    if (sessionMeta.status !== 'available') {
      doc.innerHTML = `
        <div class="doc-empty-state">
          <p class="kicker">${labelPrefix.toUpperCase()} ${sessionNumStr}</p>
          <h1>${sessionMeta.title}</h1>
          <p class="empty-lead">Materi sesi ini sedang disusun dan akan segera hadir.</p>
        </div>
      `;
      $('#doc-scroll').scrollTo({ top: 0, behavior: 'smooth' });
      bindQuiz([], sessionMeta.title);
      return;
    }

    try {
      const content = await getJSON(`content/${id}.json`);
      addRecent({ id, course: courseId, courseName: course.name, title: content.title });

      const currIdx = sessions.findIndex(s => s.id === id);
      const prevSession = currIdx > 0 ? sessions[currIdx - 1] : null;
      const nextSession = currIdx < sessions.length - 1 ? sessions[currIdx + 1] : null;

      doc.innerHTML = `
        <header class="doc-header">
          <div class="doc-meta"><span class="kicker">${content.eyebrow || `${labelPrefix.toUpperCase()} ${sessionNumStr}`}</span></div>
          <h1 class="doc-title">${content.title}</h1>
          <p class="doc-lead">${content.lead}</p>
        </header>

        <div class="doc-body">
          ${content.sections.map(sec => `
            <section class="doc-section" id="${sec.id}">
              <div class="section-label">${sec.label}</div>
              <h2 class="section-title">${sec.title}</h2>
              <div class="section-text">
                ${sec.body.map(p => `<p>${p}</p>`).join('')}
              </div>
              ${sec.callout ? `<div class="callout"><span class="callout-symbol">💡</span><div class="callout-text">${sec.callout}</div></div>` : ''}
              ${diagram(sec.id)}
            </section>
          `).join('')}
        </div>

        <footer class="doc-footer">
          <div class="doc-cta-card">
            <div>
              <span class="kicker">SELESAI MEMBACA</span>
              <h3>Uji pemahaman Anda sekarang</h3>
              <p>Kerjakan kuis latihan atau buka catatan belajar.</p>
            </div>
            <div class="cta-actions">
              <button class="primary" data-cta-quiz>Buka Kuis Review ↗</button>
              <button class="icon-outline-btn" data-cta-notes>✎ Catatan</button>
            </div>
          </div>

          <div class="doc-nav-row">
            ${prevSession ? `<button class="doc-nav-btn prev" data-goto="${prevSession.id}">← ${labelPrefix}${String(prevSession.number).padStart(2,'0')}: ${prevSession.title}</button>` : '<div></div>'}
            ${nextSession ? `<button class="doc-nav-btn next" data-goto="${nextSession.id}">${labelPrefix}${String(nextSession.number).padStart(2,'0')}: ${nextSession.title} →</button>` : '<div></div>'}
          </div>
        </footer>
      `;

      $('[data-cta-quiz]')?.addEventListener('click', () => openDrawer('quiz'));
      $('[data-cta-notes]')?.addEventListener('click', () => openDrawer('notes'));
      $$('[data-goto]').forEach(btn => {
        btn.onclick = () => loadSession(btn.dataset.goto);
      });

      bindNotes(courseId, id);
      bindQuiz(content.quiz, `${labelPrefix}${sessionNumStr} · ${content.title}`);
      $('#doc-scroll').scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      doc.innerHTML = `<div class="doc-empty-state"><p class="kicker">ERROR</p><h1>Materi Tidak Ditemukan</h1><p>Gagal memuat materi untuk sesi ini.</p></div>`;
    }
  };

  await loadSession(currentSessionId);
}

theme();
if (document.body.dataset.page === 'home') home().catch(console.error);
if (document.body.dataset.page === 'session') sessionPage().catch(console.error);
