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

function diagram(id, sesId = '') {
  // ADE Module Specific Interactive Widgets
  if (sesId === 'ade-04' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Kerangka Tata Kelola DAMA & Siklus Hidup FAIR</div>
    <div class="scale-visual-grid">
      <div class="scale-card"><b>Findable (F)</b><p>Metadata kaya, pengenal unik persisten (DOI/PID)</p></div>
      <div class="scale-card"><b>Accessible (A)</b><p>Protokol terbuka & autentikasi terstandarisasi</p></div>
      <div class="scale-card"><b>Interoperable (I)</b><p>Format terbuka, kosakata terstruktur</p></div>
      <div class="scale-card"><b>Reusable (R)</b><p>Lisensi jelas, silsilah data (data lineage) lengkap</p></div>
    </div>
  </div>`;

  if (sesId === 'ade-05' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Simulasi Pagar Outlier Tukey (IQR Fence)</div>
    <div class="boxplot-graphic">
      <div class="bp-track">
        <div class="bp-whisker left"><span>Pagar Bawah: Q1 - 1.5·IQR</span></div>
        <div class="bp-box">
          <div class="bp-part q1"><b>Q1 (25%)</b><small>Kuartil Pertama</small></div>
          <div class="bp-median"><b>Median</b><small>Q2 (50%)</small></div>
          <div class="bp-part q3"><b>Q3 (75%)</b><small>Kuartil Ketiga</small></div>
        </div>
        <div class="bp-whisker right"><span>Pagar Atas: Q3 + 1.5·IQR</span></div>
        <div class="bp-outlier"><i></i><span>Pencilan Terdeteksi!</span></div>
      </div>
      <div class="bp-iqr-label">Pencilan dievaluasi (Winsorize / Investigasi / Transformasi Log) — Hindari penghapusan membabi-buta!</div>
    </div>
  </div>`;

  if (sesId === 'ade-06' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Pola Anti-Leakage: Partisi Train & Test</div>
    <div class="format-compare-grid">
      <div class="format-col rec">
        <div class="fmt-head">✓ Training Dataset (Fit + Transform)</div>
        <ul>
          <li>Fit Scaler (Min-Max / Standard / Robust)</li>
          <li>Fit Reduksi Dimensi (PCA 95% Variance)</li>
          <li>Fit Imputer Nilai Hilang</li>
        </ul>
      </div>
      <div class="format-col not-rec">
        <div class="fmt-head">⛔ Test Dataset (HANYA Transform)</div>
        <ul>
          <li>TIDAK BOLEH memanggil method .fit()</li>
          <li>Hanya menerapkan parameter dari train set</li>
          <li>Mencegah kebocoran data evaluasi!</li>
        </ul>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-07' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Alur Eksekusi Query Internal RDBMS PostgreSQL</div>
    <div class="pipeline-animated-flow">
      <div class="pipe-step"><span class="pipe-icon">📝</span><b>SQL Parser</b><small>Syntax & Lexical</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">🧠</span><b>Optimizer</b><small>Query Plan (Cost)</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">⚙️</span><b>Executor</b><small>MVCC & Lock Manager</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">📑</span><b>WAL Engine</b><small>Write-Ahead Log</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">💽</span><b>Buffer Pool</b><small>Heap Pages & B-Tree</small></div>
    </div>
  </div>`;

  if (sesId === 'ade-08' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Topologi Star Schema: Tabel Fakta & Dimensi</div>
    <div class="kanban-board-demo">
      <div class="kanban-col">
        <h5>DIMENSI WAKTU & TOKO</h5>
        <div class="kanban-card"><b>dim_date</b><br><small>date_key, day, month, year</small></div>
        <div class="kanban-card"><b>dim_store</b><br><small>store_key, region, city</small></div>
      </div>
      <div class="kanban-col" style="background:var(--tint);border-color:var(--green)">
        <h5 style="color:var(--green)">TABEL FAKTA (PUSAT)</h5>
        <div class="kanban-card" style="border-left:3px solid var(--green)">
          <b>fact_sales</b><br>
          <small>• order_id (Grain)<br>• date_key (FK)<br>• product_key (FK)<br>• customer_key (FK)<br>• qty (Measure)<br>• revenue (Measure)</small>
        </div>
      </div>
      <div class="kanban-col">
        <h5>DIMENSI PRODUK & USER</h5>
        <div class="kanban-card"><b>dim_product</b><br><small>product_key, sku, category</small></div>
        <div class="kanban-card"><b>dim_customer</b><br><small>customer_key, SCD Tipe 2</small></div>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-09' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Pola Medallion Lakehouse & Quality Gates</div>
    <div class="medallion-stack-grid">
      <div class="med-card med-bronze">
        <b>🥉 BRONZE LAYER</b>
        <small>Data mentah apa adanya dari API, CDC, file batch. Schema-on-read, immutable append-only.</small>
      </div>
      <div class="med-card med-silver">
        <b>🥈 SILVER LAYER</b>
        <small>Data bersih, deduplikasi, format terstandarisasi, lolos quality gates & schema contract.</small>
      </div>
      <div class="med-card med-gold">
        <b>🥇 GOLD LAYER</b>
        <small>Tabel agregat bisnis, model dimensional star schema, siap konsumsi BI dashboard & ML.</small>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-10' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Teorema CAP & PACELC pada Basis Data Terdistribusi</div>
    <div class="cap-triangle-grid">
      <div class="cap-box cp">
        <h6>CP (Consistency + Partition)</h6>
        <p>Konsistensi data ketat walau partisi terjadi. Contoh: MongoDB, HBase, Redis Cluster.</p>
      </div>
      <div class="cap-box ap">
        <h6>AP (Availability + Partition)</h6>
        <p>Sistem tetap merespons walau data belum sinkron (eventual consistency). Contoh: Cassandra, DynamoDB, CouchDB.</p>
      </div>
      <div class="cap-box ca">
        <h6>CA (Tradisional RDBMS)</h6>
        <p>Konsisten dan tersedia di single-node, tidak tahan kegagalan partisi jaringan. Contoh: PostgreSQL, MySQL.</p>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-11' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Evolusi: Data Warehouse vs Data Lake vs Lakehouse</div>
    <div class="agile-values-grid">
      <div class="agile-val-card">
        <div><b>Data Warehouse</b><br><small>Skema kaku saat tulis, terstruktur, optimal SQL analitik</small></div>
      </div>
      <div class="agile-val-card">
        <div><b>Data Lake</b><br><small>Biaya penyimpanan murah, multi-format, risiko 'data swamp'</small></div>
      </div>
      <div class="agile-val-card" style="border-color:var(--green);background:var(--tint)">
        <div><b style="color:var(--green)">Modern Lakehouse</b><br><small>Object store murah + ACID transactional layer (Iceberg, Delta Lake) + performa BI cepat</small></div>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-12' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Batch Processing vs Event Streaming</div>
    <div class="format-compare-grid">
      <div class="format-col rec">
        <div class="fmt-head">⚡ Real-Time Streaming (Kafka + Flink)</div>
        <ul>
          <li>Latensi: Milidetik hingga detik</li>
          <li>Kasus: Deteksi fraud seketika, telemetri IoT, alert</li>
          <li>Komputasi: Event-by-event windowing</li>
        </ul>
      </div>
      <div class="format-col not-rec" style="border-top-color:#0284c7">
        <div class="fmt-head" style="color:#0284c7">📦 Batch Processing (Apache Spark)</div>
        <ul>
          <li>Latensi: Menit hingga jam</li>
          <li>Kasus: ETL periodik, pelatihan model ML, laporan bulanan</li>
          <li>Komputasi: Partisi masif In-Memory</li>
        </ul>
      </div>
    </div>
  </div>`;

  if (sesId === 'ade-13' && id === 'sec-1') return `<div class="diagram animated-widget">
    <div class="diagram-title">Arsitektur Keamanan Data Berlapis (Defense in Depth)</div>
    <div class="security-shield-grid">
      <div class="sec-shield"><span>🔐</span><b>At-Rest</b><small>AES-256 KMS</small></div>
      <div class="sec-shield"><span>🌐</span><b>In-Transit</b><small>TLS 1.2+ HTTPS</small></div>
      <div class="sec-shield"><span>🛡</span><b>Akses</b><small>RBAC Least Privilege</small></div>
      <div class="sec-shield"><span>🎭</span><b>Privasi</b><small>Masking PII & Tokenisasi</small></div>
      <div class="sec-shield"><span>⚖️</span><b>Kepatuhan</b><small>UU PDP & GDPR</small></div>
    </div>
  </div>`;

  // Existing SE4DS & general widgets
  if (id === 'validasi') return `<div class="diagram"><div class="diagram-title">Foto 1 · hold-out vs 10-fold cross-validation</div><div class="visual-note"><img src="assets/images/cross-validation.jpeg" alt="Catatan dosen tentang cross-validation"><p>Catatan asli: 1.000 baris dibagi untuk training, testing, lalu validasi bergilir.</p></div><div class="split-animation"><div class="split-label">1.000 rows</div><div class="split-bar"><i class="train-part">80% training</i><i class="test-part">20% testing</i></div><div class="split-caption">hold-out split · satu pembagian untuk menguji generalisasi</div></div><div class="diagram-title fold-title">lalu validasi bergilir</div><div class="folds">${Array.from({length:10}, (_, i) => `<i style="animation-delay:${i * 80}ms"></i>`).join('')}</div><div class="fold-note"><span>90% training</span><span>10% validation berpindah setiap putaran</span></div><div class="flow" style="margin-top:20px"><span>10 putaran</span><b>→</b><span>10 skor validasi</span><b>→</b><span>rata-rata</span></div></div>`;
  if (id === 'pipeline') return `<div class="diagram"><div class="diagram-title">Foto 2 · model masuk ke aplikasi</div><div class="visual-note"><img src="assets/images/ml-pipeline.jpeg" alt="Catatan dosen tentang machine learning pipeline"><p>Catatan asli: model dievaluasi, disimpan, lalu dihubungkan ke aplikasi.</p></div><div class="pipeline-animation"><span class="pipeline-node">Dataset</span><b>→</b><span class="pipeline-node">Train</span><b>→</b><span class="pipeline-node">Model</span><b>→</b><span class="pipeline-node">Evaluate</span><b>→</b><span class="pipeline-node">Application</span></div><div class="inference-line"><i></i><span>unseen data masuk</span><b>→</b><strong>prediksi</strong></div></div>`;
  if (id === 'sdlc') return `<div class="diagram"><div class="diagram-title">siklus pengembangan</div><div class="flow"><span>Plan</span><b>→</b><span>Analyze</span><b>→</b><span>Design</span><b>→</b><span>Build</span><b>→</b><span>Test</span><b>→</b><span>Maintain</span></div></div>`;
  
  if (id === 'definisi') return `<div class="diagram animated-widget">
    <div class="diagram-title">Hierarki Interaktif · Piramida DIKW</div>
    <div class="dikw-container">
      <div class="dikw-level l4"><span class="dikw-name">WISDOM (Kebijaksanaan)</span><small>Pengambilan keputusan beretika & dampak nyata</small></div>
      <div class="dikw-level l3"><span class="dikw-name">KNOWLEDGE (Pengetahuan)</span><small>Sintesis pemahaman pola, konteks 'mengapa' & 'bagaimana'</small></div>
      <div class="dikw-level l2"><span class="dikw-name">INFORMATION (Informasi)</span><small>Data terstruktur, teragregasi & bermakna</small></div>
      <div class="dikw-level l1"><span class="dikw-name">DATA (Fakta Mentah)</span><small>Fakta mentah tanpa konteks (angka, teks, sinyal biner)</small></div>
    </div>
  </div>`;

  if (id === 'karakteristik-big-data') return `<div class="diagram animated-widget">
    <div class="diagram-title">Karakteristik Big Data · The 8 V's Matrix</div>
    <div class="v8-matrix">
      <div class="v8-item"><b class="v-num">V1</b><strong>Volume</strong><span>Skala terabyte hingga petabyte</span></div>
      <div class="v8-item"><b class="v-num">V2</b><strong>Velocity</strong><span>Laju aliran stream real-time</span></div>
      <div class="v8-item"><b class="v-num">V3</b><strong>Variety</strong><span>Struktur data heterogen</span></div>
      <div class="v8-item"><b class="v-num">V4</b><strong>Variability</strong><span>Variasi laju data seiring waktu</span></div>
      <div class="v8-item"><b class="v-num">V5</b><strong>Veracity</strong><span>Kebenaran & integritas data</span></div>
      <div class="v8-item"><b class="v-num">V6</b><strong>Value</strong><span>Nilai strategis bagi bisnis</span></div>
      <div class="v8-item"><b class="v-num">V7</b><strong>Visualization</strong><span>Kemampuan disajikan visual</span></div>
      <div class="v8-item"><b class="v-num">V8</b><strong>Vulnerability</strong><span>Keamanan, privasi & audit</span></div>
    </div>
  </div>`;

  if (id === 'peran-profesi') return `<div class="diagram animated-widget">
    <div class="diagram-title">Matriks Kolaborasi Peran Data</div>
    <div class="roles-matrix">
      <div class="role-box de">
        <span class="role-badge">Data Engineer</span>
        <p class="role-focus">Fokus: <b>Pipeline & Fondasi</b></p>
        <div class="role-bar"><i style="width:80%">80% waktu preparasi data</i></div>
        <p class="role-detail">Membangun arsitektur terdistribusi, ingest multi-source, data warehouse & orkestrasi Airflow.</p>
      </div>
      <div class="role-box ds">
        <span class="role-badge">Data Scientist</span>
        <p class="role-focus">Fokus: <b>Model & Pola Bisnis</b></p>
        <div class="role-bar"><i style="width:20%">20% pemodelan</i></div>
        <p class="role-detail">Eksplorasi data, uji hipotesis, dan membangun algoritma prediksi ML.</p>
      </div>
      <div class="role-box mle">
        <span class="role-badge">ML Engineer</span>
        <p class="role-focus">Fokus: <b>Produksi & Deploy</b></p>
        <div class="role-bar"><i style="width:100%">100% integrasi sistem</i></div>
        <p class="role-detail">Membawa model ke production, otomatisasi retraining, batch scoring & low-latency API.</p>
      </div>
    </div>
  </div>`;

  if (id === 'aktivitas-rekayasa') return `<div class="diagram animated-widget">
    <div class="diagram-title">Animasi Alur Pipeline Rekayasa Data</div>
    <div class="pipeline-animated-flow">
      <div class="pipe-step"><span class="pipe-icon">📥</span><b>Ingestion</b><small>API, IoT, CDC</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">💾</span><b>Raw Lake</b><small>Bronze S3 / Parquet</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">⚡</span><b>Transform</b><small>Spark / dbt / Clean</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">🏛</span><b>Warehouse</b><small>Gold Star Schema</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="pipe-step"><span class="pipe-icon">📊</span><b>Serving</b><small>BI, ML & Analytics</small></div>
    </div>
    <div class="pipeline-pulse-track"><div class="pulse-packet"></div></div>
  </div>`;

  if (id === 'skala-pengukuran') return `<div class="diagram animated-widget">
    <div class="diagram-title">Hierarki Skala Pengukuran Statistik (Stevens)</div>
    <div class="scale-visual-grid">
      <div class="scale-card">
        <span class="scale-tag nominal">Nominal</span>
        <b>Kategori Tanpa Urutan</b>
        <p>Gender, Warna, Agama</p>
        <small>Operasi: Modus, Frekuensi</small>
      </div>
      <div class="scale-card">
        <span class="scale-tag ordinal">Ordinal</span>
        <b>Kategori Berurutan</b>
        <p>Rating, Rendah/Sedang/Tinggi</p>
        <small>Operasi: Median, Persentil</small>
      </div>
      <div class="scale-card">
        <span class="scale-tag interval">Interval</span>
        <b>Selisih Sama, Nol Semu</b>
        <p>Suhu (°C, °F), Tahun</p>
        <small>Operasi: Mean, Standar Deviasi</small>
      </div>
      <div class="scale-card">
        <span class="scale-tag ratio">Rasio</span>
        <b>Nol Mutlak, Rasio Valid</b>
        <p>Pendapatan, Berat, Usia</p>
        <small>Operasi: Seluruh Aritmatika & Rasio</small>
      </div>
    </div>
  </div>`;

  if (id === 'sumarisasi-deskriptif') return `<div class="diagram animated-widget">
    <div class="diagram-title">Diagram Interaktif · Anatomi Box Plot & Deteksi Outlier</div>
    <div class="boxplot-graphic">
      <div class="bp-track">
        <div class="bp-whisker left"><span>Min (Q1 - 1.5·IQR)</span></div>
        <div class="bp-box">
          <div class="bp-part q1"><b>Q1</b><small>25%</small></div>
          <div class="bp-median"><b>Median (Q2)</b><small>50%</small></div>
          <div class="bp-part q3"><b>Q3</b><small>75%</small></div>
        </div>
        <div class="bp-whisker right"><span>Maks (Q3 + 1.5·IQR)</span></div>
        <div class="bp-outlier"><i></i><span>Outlier</span></div>
      </div>
      <div class="bp-iqr-label">◄────────── Rentang Antarkuartil (IQR = Q3 - Q1) ──────────►</div>
    </div>
  </div>`;

  if (id === 'format-data') return `<div class="diagram animated-widget">
    <div class="diagram-title">Standar Format Terbuka (FAIR) vs Proprietary</div>
    <div class="format-compare-grid">
      <div class="format-col rec">
        <div class="fmt-head">✓ Direkomendasikan (Terbuka)</div>
        <ul>
          <li><b>Teks:</b> .txt, .pdf (PDF/A), .odt</li>
          <li><b>Tabel:</b> .csv, .ods</li>
          <li><b>Database:</b> .sql dump, .csv</li>
          <li><b>Spasial:</b> .json (GeoJSON)</li>
          <li><b>Citra:</b> .png, .jpg, .svg, .tiff</li>
        </ul>
      </div>
      <div class="format-col not-rec">
        <div class="fmt-head">✕ Tidak Direkomendasikan (Tertutup)</div>
        <ul>
          <li><b>Teks:</b> .doc, .docx, .rtf</li>
          <li><b>Tabel:</b> .xls, .xlsx, .pdf (tabel)</li>
          <li><b>Database:</b> .mdb (MS Access)</li>
          <li><b>Spasial:</b> .shp, .gdb (Esri)</li>
          <li><b>Citra:</b> .ai, .cdr, .wmf</li>
        </ul>
      </div>
    </div>
  </div>`;

  if (id === 'anotasi-labeling') return `<div class="diagram animated-widget">
    <div class="diagram-title">Demonstrasi Anotasi Data untuk Supervised Learning</div>
    <div class="annotation-demo-grid">
      <div class="anno-card">
        <b>1. Named Entity Recognition (NER)</b>
        <div class="ner-box">
          <span>Kunjungan ke</span>
          <mark class="tag-loc">Jakarta<small>LOC</small></mark>
          <span>oleh</span>
          <mark class="tag-per">Budi Santoso<small>PER</small></mark>
          <span>pada</span>
          <mark class="tag-date">12 Mei 2025<small>DATE</small></mark>
        </div>
      </div>
      <div class="anno-card">
        <b>2. Object Detection (Bounding Box)</b>
        <div class="bbox-demo">
          <div class="bbox-box b1"><span>Car: 0.94</span></div>
          <div class="bbox-box b2"><span>Pedestrian: 0.88</span></div>
        </div>
      </div>
    </div>
  </div>`;

  // Additional SE4DS Widgets
  if (id === 'manifesto') return `<div class="diagram animated-widget">
    <div class="diagram-title">4 Nilai Inti Agile Manifesto</div>
    <div class="agile-values-grid">
      <div class="agile-val-card"><span class="val-left">Individu & Interaksi</span><span class="val-over">melampaui</span><span class="val-right">Proses & Tools</span></div>
      <div class="agile-val-card"><span class="val-left">Software yang Berfungsi</span><span class="val-over">melampaui</span><span class="val-right">Dokumentasi Komprehensif</span></div>
      <div class="agile-val-card"><span class="val-left">Kolaborasi dengan Klien</span><span class="val-over">melampaui</span><span class="val-right">Negosiasi Kontrak</span></div>
      <div class="agile-val-card"><span class="val-left">Tanggap terhadap Perubahan</span><span class="val-over">melampaui</span><span class="val-right">Mengikuti Suatu Rencana</span></div>
    </div>
  </div>`;

  if (id === 'praktik') return `<div class="diagram animated-widget">
    <div class="diagram-title">Alur Siklus Sprint Scrum</div>
    <div class="sprint-cycle-anim">
      <div class="sprint-step"><span>📋</span><b>Product Backlog</b><small>Daftar prioritas</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="sprint-step"><span>🎯</span><b>Sprint Planning</b><small>Target 2-4 minggu</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="sprint-step"><span>⏱</span><b>Daily Scrum</b><small>Standup 15 menit</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="sprint-step"><span>📦</span><b>Increment</b><small>Working software</small></div>
      <i class="pipe-arrow">➜</i>
      <div class="sprint-step"><span>🔍</span><b>Sprint Review</b><small>Demo & feedback</small></div>
    </div>
  </div>`;

  if (id === 'delivery') return `<div class="diagram animated-widget">
    <div class="diagram-title">Simulasi Papan Kanban Interaktif</div>
    <div class="kanban-board-demo">
      <div class="kanban-col">
        <h5>TO DO <span>(2)</span></h5>
        <div class="kanban-card"><span class="kanban-tag tag-feat">Feature</span><br>Setup pipeline data ingest</div>
        <div class="kanban-card"><span class="kanban-tag tag-task">Task</span><br>Riset arsitektur model</div>
      </div>
      <div class="kanban-col">
        <h5>IN PROGRESS <span>(1)</span></h5>
        <div class="kanban-card"><span class="kanban-tag tag-feat">Feature</span><br>Train baseline model v1</div>
      </div>
      <div class="kanban-col">
        <h5>DONE <span>(2)</span></h5>
        <div class="kanban-card"><span class="kanban-tag tag-task">Task</span><br>Setup repositori Git & CI</div>
        <div class="kanban-card"><span class="kanban-tag tag-bug">Bugfix</span><br>Perbaiki missing values CSV</div>
      </div>
    </div>
  </div>`;

  if (id === 'cicd' || id === 'culture') return `<div class="diagram animated-widget">
    <div class="diagram-title">DevOps Infinity Loop · Continuous Everything</div>
    <div class="devops-infinity-wrap">
      <div class="devops-side dev-side">
        <h6>DEVELOPMENT</h6>
        <div class="devops-pills"><span>Plan</span><span>Code</span><span>Build</span><span>Test</span></div>
      </div>
      <div class="infinity-symbol">∞</div>
      <div class="devops-side ops-side">
        <h6>OPERATIONS</h6>
        <div class="devops-pills"><span>Release</span><span>Deploy</span><span>Operate</span><span>Monitor</span></div>
      </div>
    </div>
  </div>`;

  if (id === 'tools') return `<div class="diagram animated-widget">
    <div class="diagram-title">Perbandingan Arsitektur: Virtual Machine vs Container</div>
    <div class="containers-vs-vm-grid">
      <div class="arch-stack">
        <h6>Virtual Machine (Hypervisor)</h6>
        <div class="arch-layer layer-app">App + Bins (GBs)</div>
        <div class="arch-layer layer-guest">Guest OS Kernel</div>
        <div class="arch-layer layer-host">Hypervisor</div>
        <div class="arch-layer layer-host">Host OS & Hardware</div>
      </div>
      <div class="arch-stack">
        <h6>Docker Container (Shared Kernel)</h6>
        <div class="arch-layer layer-app">App + Bins (MBs)</div>
        <div class="arch-layer layer-docker">Docker Daemon Engine</div>
        <div class="arch-layer layer-host">Host OS Kernel (Shared)</div>
        <div class="arch-layer layer-host">Hardware</div>
      </div>
    </div>
  </div>`;

  if (id === 'tradeoff') return `<div class="diagram animated-widget">
    <div class="diagram-title">Matriks Konfusi (Confusion Matrix) & Metrik Evaluasi</div>
    <div class="confusion-matrix-grid">
      <div class="cm-cell cm-tp"><b>True Positive (TP)</b><small>Aktual 1, Prediksi 1</small></div>
      <div class="cm-cell cm-fp"><b>False Positive (FP)</b><small>Aktual 0, Prediksi 1 (Tipe I)</small></div>
      <div class="cm-cell cm-fn"><b>False Negative (FN)</b><small>Aktual 1, Prediksi 0 (Tipe II)</small></div>
      <div class="cm-cell cm-tn"><b>True Negative (TN)</b><small>Aktual 0, Prediksi 0</small></div>
    </div>
    <div class="flow" style="margin-top:14px;justify-content:center">
      <span>Akurasi = (TP+TN) / Total</span>
      <span>Precision = TP / (TP+FP)</span>
      <span>Recall = TP / (TP+FN)</span>
    </div>
  </div>`;

  if (id === 'production') return `<div class="diagram animated-widget">
    <div class="diagram-title">Alur Inference Model via REST API Gateway</div>
    <div class="api-serving-anim">
      <div class="api-node">Client App (Web/Mobile)</div>
      <i class="pipe-arrow">➜ JSON Request</i>
      <div class="api-node">API Gateway & Auth</div>
      <i class="pipe-arrow">➜ Sanitized Input</i>
      <div class="api-node">ML Model Server</div>
      <i class="pipe-arrow">➜ Prediction Response</i>
      <div class="api-node">Audit & Logging</div>
    </div>
  </div>`;

  if (id === 'process') return `<div class="diagram animated-widget">
    <div class="diagram-title">Siklus Metodologi CRISP-DM untuk Data Science</div>
    <div class="crisp-cycle-grid">
      <div class="crisp-step"><span>Fase 1</span>Business Understanding</div>
      <div class="crisp-step"><span>Fase 2</span>Data Understanding</div>
      <div class="crisp-step"><span>Fase 3</span>Data Preparation</div>
      <div class="crisp-step"><span>Fase 4</span>Modeling</div>
      <div class="crisp-step"><span>Fase 5</span>Evaluation</div>
      <div class="crisp-step"><span>Fase 6</span>Deployment</div>
    </div>
  </div>`;

  if (id === 'cycle' || id === 'monitor') return `<div class="diagram animated-widget">
    <div class="diagram-title">Trinitas MLOps: Penyatuan Tiga Siklus</div>
    <div class="mlops-rings-grid">
      <div class="ring-card r1"><h6>DATA PIPELINE</h6><p>Ingest, validasi skema, feature store, versioning DVC</p></div>
      <div class="ring-card r2"><h6>MODEL PIPELINE</h6><p>Training, tuning, tracking MLflow, model registry</p></div>
      <div class="ring-card r3"><h6>SOFTWARE PIPELINE</h6><p>CI/CD, container registry, live endpoint monitoring</p></div>
    </div>
  </div>`;

  if (id === 'secure' || id === 'privacy') return `<div class="diagram animated-widget">
    <div class="diagram-title">3 Zona Keamanan & Audit Trail MLOps</div>
    <div class="security-shield-grid">
      <div class="sec-shield"><span>🛡</span><b>Zona Data</b><small>Enkripsi at-rest, akses terbatas data mentah</small></div>
      <div class="sec-shield"><span>🔒</span><b>Zona Model</b><small>Integritas bobot model, signing artefak</small></div>
      <div class="sec-shield"><span>🌐</span><b>Zona Serving</b><small>Rate limiting, WAF, sanitasi input API</small></div>
      <div class="sec-shield"><span>📝</span><b>Audit Trail</b><small>Log timestamp, identitas penyeru, hash prediksi</small></div>
    </div>
  </div>`;

  if (id === 'team' || id === 'project') return `<div class="diagram animated-widget">
    <div class="diagram-title">Matriks Kolaborasi Tim Multidisiplin</div>
    <div class="roles-matrix">
      <div class="role-box de"><span class="role-badge">Software Engineer</span><p class="role-focus">SDLC, API Architecture, CI/CD, Testing</p></div>
      <div class="role-box ds"><span class="role-badge">Data Scientist</span><p class="role-focus">EDA, Formula Matematika, Model Training, Evaluasi</p></div>
      <div class="role-box mle"><span class="role-badge">Data Engineer</span><p class="role-focus">Pipeline Ingestion, Storage, Data Quality, Lineage</p></div>
    </div>
  </div>`;

  if (id === 'evaluate' || id === 'reflect') return `<div class="diagram animated-widget">
    <div class="diagram-title">Dimensi Evaluasi Proyek Terpadu & Refleksi</div>
    <div class="scale-visual-grid">
      <div class="scale-card"><b>1. Fungsionalitas</b><p>Kesesuaian fitur terhadap user story & acceptance criteria</p></div>
      <div class="scale-card"><b>2. Kinerja & Latensi</b><p>Metrik model (Accuracy/F1) dan latensi respon sistem (p95)</p></div>
      <div class="scale-card"><b>3. Keamanan & Governance</b><p>Kepatuhan privasi data, audit log, dan proteksi kredensial</p></div>
      <div class="scale-card"><b>4. Skalabilitas</b><p>Arsitektur modular siap produksi dan kemudahan pemeliharaan</p></div>
    </div>
  </div>`;

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
              ${sec.image ? `
                <figure class="doc-media">
                  <img src="${sec.image.src}" alt="${sec.image.caption || ''}" loading="lazy">
                  <figcaption><span class="media-icon">🖼</span> ${sec.image.caption || ''}</figcaption>
                </figure>
              ` : ''}
              ${diagram(sec.id, content.sessionId)}
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
