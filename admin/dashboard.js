// ── Admin Dashboard ───────────────────────────────────────────────

let currentReports = [];
let currentComments = [];
let currentFilter = 'all';
let dashboardLoadingTimer = null;

// ── 토스트 유틸리티 (login.js와 공유) ───────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');

  // 이전 토스트들 제거 (중복 방지)
  const prevToasts = container.querySelectorAll('.toast');
  prevToasts.forEach(t => {
    t.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => t.remove(), 300);
  });

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // duration이 0이어도 반드시 제거
  const removeToast = () => {
    toast.style.animation = 'slideInRight 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  };

  if (duration > 0) {
    setTimeout(removeToast, duration);
  } else {
    // duration=0인 경우, 다음 토스트가 나올 때 제거됨 (위의 prevToasts 로직)
  }

  return toast;
}

// ── 로딩바 유틸리티 ───────────────────────────────────────────────
function showLoadingBar() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }
}

function hideLoadingBar() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

async function initDashboard() {

  // 1️⃣ 로딩 상태 시작
  showLoadingBar();

  // 2️⃣ 3초 후 진행 상황 표시
  dashboardLoadingTimer = setTimeout(() => {
    showToast('데이터 로드 중...', 'info', 0);
  }, LOADING_TIMEOUT);

  try {
    // 3️⃣ 데이터 로드
    await loadReports();
    await loadComments();

    // 3️⃣-1️⃣ 자동 신고 처리 실행 (목업)
    const autoHandleResult = await executeAutoReportHandler(currentReports, currentComments);
    if (autoHandleResult.processed > 0) {
      showToast(`자동 신고 처리: ${autoHandleResult.processed}개 댓글`, 'info', 3000);
    }

    // 4️⃣ UI 이벤트 바인딩
    const filterSelect = document.getElementById('filter-status');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderReportsList();
      });
    }

    const modalCloseBtn = document.getElementById('modal-close');
    const modal = document.getElementById('report-modal');
    const backdrop = document.querySelector('.modal-backdrop');

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        if (modal) modal.hidden = true;
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (modal) modal.hidden = true;
      });
    }

    // 5️⃣ 화면 렌더링
    renderReportsList();
    updateStats();
    updateAutoHandlerIndicator();

    // 6️⃣ 로딩 완료
    if (dashboardLoadingTimer) clearTimeout(dashboardLoadingTimer);
    hideLoadingBar();
    showToast('페이지 로딩완료', 'success', 2000);
  } catch (error) {
    console.error('[대시보드] 오류 발생:', error);
    if (dashboardLoadingTimer) clearTimeout(dashboardLoadingTimer);
    hideLoadingBar();
    showToast('대시보드 로딩 실패', 'error', 3000);
  }
}

async function loadReports() {
  try {
    if (!window._firebase) {
      console.warn('Firebase not initialized');
      return;
    }

    // 익명 로그인 보장
    const { auth, signInAnonymously } = window._firebase;
    try {
      await signInAnonymously(auth);
    } catch (e) {
    }

    const { db, collection: col, getDocs, query, orderBy, limit } = window._firebase;
    const reportsRef = query(col(db, 'reports'), orderBy('time', 'desc'), limit(50));
    const snapshot = await getDocs(reportsRef);

    currentReports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (e) {
    console.error('Failed to load reports:', e);
  }
}

async function loadComments() {
  try {
    if (!window._firebase) {
      console.warn('Firebase not initialized');
      return;
    }

    const { db, collection: col, getDocs, query, limit } = window._firebase;
    const commentsRef = query(col(db, 'comments'), limit(100));
    const snapshot = await getDocs(commentsRef);

    currentComments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (e) {
    console.error('Failed to load comments:', e);
  }
}

function getCommentById(commentId) {
  return currentComments.find(c => c.id === commentId);
}

function getReportsByCommentId(commentId) {
  return currentReports.filter(r => r.commentId === commentId);
}

function renderReportsList() {
  const listEl = document.getElementById('reports-list');
  if (!listEl) return;

  // 신고된 댓글별로 그룹화
  const reportMap = {};
  currentReports.forEach(report => {
    if (!reportMap[report.commentId]) {
      reportMap[report.commentId] = [];
    }
    reportMap[report.commentId].push(report);
  });

  // 필터 적용
  const filtered = Object.entries(reportMap).filter(([commentId, reports]) => {
    if (currentFilter === 'all') return true;
    // 처리 상태는 나중에 구현
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-message';
    empty.textContent = '신고된 댓글이 없습니다.';
    listEl.replaceChildren(empty);
    return;
  }

  listEl.replaceChildren(...filtered
    .map(([commentId, reports]) => {
      const comment = getCommentById(commentId);
      return comment ? createReportItem(commentId, comment, reports) : null;
    })
    .filter(Boolean));
}

// Builds one report row with textContent only; report fields come from the database and are not trusted
function createReportItem(commentId, comment, reports) {
  const reporterCount = uniqueReportsByReporter(reports).length;
  const uniqueReasons = [...new Set(reports.map(r => r.reason || 'unknown'))];

  // 신고 상태 (모두 같다고 가정)
  const status = reports[0]?.status || 'pending';
  const statusClass = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';

  const item = document.createElement('div');
  item.className = 'report-item';
  item.addEventListener('click', () => openReportModal(commentId));

  const info = document.createElement('div');
  info.className = 'report-info';

  const title = document.createElement('h3');
  title.textContent = comment.text.substring(0, 50) + (comment.text.length > 50 ? '...' : '');

  const meta = document.createElement('p');
  meta.className = 'report-meta';
  const countStrong = document.createElement('strong');
  countStrong.textContent = `${reporterCount}명`;
  const themeStrong = document.createElement('strong');
  themeStrong.textContent = comment.themeId || 'basic';
  meta.append('신고 수: ', countStrong, ' • 테마: ', themeStrong);

  const badges = document.createElement('div');
  uniqueReasons.forEach(reason => {
    const badge = document.createElement('span');
    badge.className = 'report-reason-badge';
    badge.textContent = getReasonLabel(reason);
    badges.appendChild(badge);
  });
  const statusBadge = document.createElement('span');
  statusBadge.className = `report-status-badge ${statusClass}`;
  statusBadge.textContent = getStatusLabel(statusClass);
  badges.appendChild(statusBadge);

  info.append(title, meta, badges);

  const count = document.createElement('div');
  count.className = 'report-count';
  const countNumber = document.createElement('span');
  countNumber.className = 'report-count-number';
  countNumber.textContent = String(reporterCount);
  const countLabel = document.createElement('span');
  countLabel.className = 'report-count-label';
  countLabel.textContent = '신고';
  count.append(countNumber, countLabel);

  item.append(info, count);
  return item;
}

function openReportModal(commentId) {
  const comment = getCommentById(commentId);
  const reports = getReportsByCommentId(commentId);

  if (!comment) return;

  // 모달 내용 설정
  document.getElementById('modal-comment-text').textContent = comment.text;

  const time = comment.time ? new Date(comment.time.toDate?.() || comment.time).toLocaleString('ko-KR') : '알 수 없음';
  document.getElementById('modal-comment-meta').textContent = `작성일: ${time} • 테마: ${comment.themeId || 'basic'} • 작성자 UID: ${comment.uid.substring(0, 8)}...`;

  // 신고 사유별 카운트 (사용자별 1회)
  const reporters = uniqueReportsByReporter(reports);
  const reasonCounts = {};
  reporters.forEach(r => {
    const reason = r.reason || 'unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  const reasonItems = Object.entries(reasonCounts).map(([reason, count]) => {
    const item = document.createElement('div');
    item.className = 'report-reason-item';
    item.textContent = `${getReasonLabel(reason)}: ${count}명`;
    return item;
  });

  document.getElementById('modal-report-reasons').replaceChildren(...reasonItems);
  document.getElementById('modal-report-count').textContent = `${reporters.length}명`;

  // 버튼 이벤트
  const approveBtn = document.getElementById('modal-approve-btn');
  const rejectBtn = document.getElementById('modal-reject-btn');

  if (approveBtn) {
    approveBtn.onclick = () => handleReportApprove(commentId);
  }

  if (rejectBtn) {
    rejectBtn.onclick = () => handleReportReject(commentId);
  }

  // 모달 표시
  const modal = document.getElementById('report-modal');
  if (modal) modal.hidden = false;
}

async function handleReportApprove(commentId) {
  if (!confirm('이 댓글을 삭제하시겠습니까?')) return;

  try {
    if (!window._firebase) return;

    const { db, updateDoc, docRef } = window._firebase;

    // 댓글 삭제
    await updateDoc(docRef(db, 'comments', commentId), { deleted: true });

    // 해당 댓글의 모든 신고를 "approved"로 업데이트
    const reportsToUpdate = currentReports.filter(r => r.commentId === commentId);
    for (const report of reportsToUpdate) {
      await updateDoc(docRef(db, 'reports', report.id), { status: 'approved' });
    }

    alert('댓글이 삭제되었습니다.');

    // 모달 닫기 및 목록 새로고침
    const modal = document.getElementById('report-modal');
    if (modal) modal.hidden = true;

    await loadReports();
    await loadComments();
    renderReportsList();
    updateStats();
  } catch (e) {
    console.error('Failed to approve report:', e);
    alert('처리 중 오류가 발생했습니다.');
  }
}

async function handleReportReject(commentId) {
  if (!confirm('이 신고를 반려하시겠습니까?')) return;

  try {
    if (!window._firebase) return;

    const { db, updateDoc, docRef } = window._firebase;

    // 해당 댓글의 모든 신고를 "rejected"로 업데이트
    const reportsToUpdate = currentReports.filter(r => r.commentId === commentId);
    for (const report of reportsToUpdate) {
      await updateDoc(docRef(db, 'reports', report.id), { status: 'rejected' });
    }

    alert('신고가 반려되었습니다.');

    const modal = document.getElementById('report-modal');
    if (modal) modal.hidden = true;

    await loadReports();
    await loadComments();
    renderReportsList();
    updateStats();
  } catch (e) {
    console.error('Failed to reject report:', e);
  }
}

function updateStats() {
  const totalReports = currentReports.length;
  // status가 없거나 "pending"인 신고들만 카운트 (처리 대기)
  const pendingReports = new Set(
    currentReports
      .filter(r => !r.status || r.status === 'pending')
      .map(r => r.commentId)
  ).size;
  const resolvedReports = currentComments.filter(c => c.deleted).length;

  document.getElementById('total-reports').textContent = totalReports;
  document.getElementById('pending-reports').textContent = pendingReports;
  document.getElementById('resolved-reports').textContent = resolvedReports;
}

function updateAutoHandlerIndicator() {
  const stats = getAutoHandlerStats(currentReports);
  const indicatorEl = document.getElementById('auto-handler-indicator');

  if (!indicatorEl) {
    return;
  }

  const statusText = stats.highRiskCount > 0
    ? `⚠️ 위험: ${stats.highRiskCount}개 댓글 자동 삭제 대기`
    : stats.atRiskCount > 0
    ? `⚡ 주의: ${stats.atRiskCount}개 댓글 임계값 근처`
    : '✅ 정상';

  const statusClass = stats.highRiskCount > 0 ? 'danger' : stats.atRiskCount > 0 ? 'warning' : 'safe';

  indicatorEl.innerHTML = `
    <div class="auto-handler-status ${statusClass}">
      <span>${statusText}</span>
      <button type="button" class="auto-handler-details-btn" onclick="showAutoHandlerDetails()">
        자세히 보기
      </button>
    </div>
  `;

}

function getReasonLabel(reason) {
  const labels = {
    'spam': '스팸',
    'badword': '욕설/혐오',
    'inappropriate': '부적절한 내용',
    'other': '기타'
  };
  return labels[reason] || reason;
}

function getStatusLabel(status) {
  const labels = {
    'pending': '대기 중',
    'approved': '승인됨',
    'rejected': '반려됨'
  };
  return labels[status] || '대기 중';
}

function showAutoHandlerDetails() {
  const stats = getAutoHandlerStats(currentReports);

  // 자동 삭제 대상 찾기
  const candidates = findAutoDeleteCandidates(currentReports);

  let detailsHtml = `
    <h3>자동 신고 처리 통계</h3>
    <div style="margin: 16px 0; padding: 16px; background: var(--crema-bg); border-radius: 8px;">
      <p><strong>임계값 설정</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>신고 횟수: ${stats.autoDeleteThresholds.reportCount}회 이상</li>
        <li>가중치 점수: ${stats.autoDeleteThresholds.weightedScore}점 이상</li>
      </ul>
    </div>

    <div style="margin: 16px 0; padding: 16px; background: var(--crema-bg); border-radius: 8px;">
      <p><strong>신고 사유별 가중치</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>욕설/혐오 (badword): ${stats.reportWeights.badword}점</li>
        <li>스팸 (spam): ${stats.reportWeights.spam}점</li>
        <li>부적절한 내용 (inappropriate): ${stats.reportWeights.inappropriate}점</li>
        <li>기타 (other): ${stats.reportWeights.other}점</li>
      </ul>
    </div>

    <div style="margin: 16px 0; padding: 16px; background: var(--crema-bg); border-radius: 8px;">
      <p><strong>현재 상태</strong></p>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>자동 삭제 대기: <span style="color: #d32f2f; font-weight: bold;">${stats.highRiskCount}개</span></li>
        <li>임계값 근처: <span style="color: #ff9800; font-weight: bold;">${stats.atRiskCount}개</span></li>
        <li>총 신고된 댓글: ${stats.totalComments}개</li>
      </ul>
    </div>
  `;

  if (candidates.length > 0) {
    detailsHtml += `
      <div style="margin: 16px 0; padding: 16px; background: #ffebee; border-radius: 8px; border-left: 4px solid #d32f2f;">
        <p><strong style="color: #d32f2f;">⚠️ 자동 삭제 대기 목록</strong></p>
        <ul style="margin: 8px 0; padding-left: 20px;">
    `;

    candidates.forEach((candidate, idx) => {
      const comment = currentComments.find(c => c.id === candidate.commentId);
      const text = comment?.text.substring(0, 50) || '(삭제됨)';
      detailsHtml += `
        <li>
          [${idx + 1}] "${text}..."
          <br/>
          <small style="color: #666;">신고 ${candidate.decision.reportCount}명 | 점수 ${candidate.decision.score}점 | ${candidate.decision.reason}</small>
        </li>
      `;
    });

    detailsHtml += `
        </ul>
      </div>
    `;
  }

  alert(detailsHtml.replace(/<[^>]*>/g, (match) => {
    // 간단한 텍스트 변환 (alert는 HTML을 지원하지 않으므로 텍스트로 표시)
    if (match === '<br/>') return '\n';
    if (match.includes('strong')) return match.replace(/<\/?strong>/g, '');
    return '';
  }));

}
