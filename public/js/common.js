/* ============================================================
   eGovFrame 5.0 공통 JavaScript
   ============================================================ */

'use strict';

const Egov = {
    // 알림 메시지 표시
    alert(message, type = 'info') {
        const container = document.getElementById('alert-container') || document.querySelector('.egov-content');
        if (!container) { window.alert(message); return; }
        const div = document.createElement('div');
        div.className = `alert alert-${type} alert-dismissible fade show`;
        div.role = 'alert';
        div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="닫기"></button>`;
        container.insertBefore(div, container.firstChild);
        setTimeout(() => div.remove(), 5000);
    },

    // 확인 다이얼로그
    confirm(message) {
        return window.confirm(message);
    },

    // 폼 유효성 검사 (Bootstrap 5 방식)
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return true;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return false;
        }
        return true;
    },

    // 삭제 확인
    confirmDelete(formId, msg = '정말 삭제하시겠습니까?') {
        if (Egov.confirm(msg)) {
            document.getElementById(formId)?.submit();
        }
    },

    // 숫자 포맷 (천 단위 콤마)
    formatNumber(num) {
        return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '0';
    },

    // 날짜 포맷 YYYYMMDD → YYYY-MM-DD
    formatDate(str) {
        if (!str || str.length < 8) return str;
        return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
    },

    // 휴대폰 번호 자동 하이픈 (010-1234-5678). 숫자만 허용, 최대 11자리.
    formatPhone(digits) {
        const d = (digits || '').replace(/\D/g, '').slice(0, 11);
        if (d.length < 4) return d;
        if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
        return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    },

    // [data-phone] 또는 지정한 input 에 자동 하이픈 동작을 연결한다.
    // 백스페이스/커서 이동 시에도 자연스럽게 동작하도록 input 이벤트로 재포맷한다.
    bindPhoneInputs(root) {
        const scope = root || document;
        const inputs = scope.querySelectorAll('input[data-phone]');
        inputs.forEach(function (el) {
            const reformat = function () {
                el.value = Egov.formatPhone(el.value);
            };
            // 초기값(서버 렌더링)도 정규화
            if (el.value) reformat();
            el.addEventListener('input', reformat);
        });
    },

    // KRDS 스타일 저장완료 모달. 버튼 클릭 시 redirectUrl 로 이동(없으면 닫기).
    showSaveModal(message, redirectUrl, btnLabel) {
        const existing = document.getElementById('egov-save-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'egov-save-modal';
        overlay.className = 'egov-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'egov-save-modal-msg');

        const box = document.createElement('div');
        box.className = 'egov-modal-box';

        const icon = document.createElement('div');
        icon.className = 'egov-modal-icon';
        icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';

        const msg = document.createElement('p');
        msg.id = 'egov-save-modal-msg';
        msg.className = 'egov-modal-msg';
        msg.textContent = message || '저장되었습니다.';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'krds-btn primary';
        btn.textContent = btnLabel || '확인';

        const close = function () {
            overlay.remove();
            if (redirectUrl) window.location.href = redirectUrl;
        };
        btn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
        document.addEventListener('keydown', function onKey(e) {
            if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(); }
        });

        box.appendChild(icon);
        box.appendChild(msg);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        btn.focus();
    }
};

// 페이지 로드 후 플래시 메시지 자동 페이드
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert.auto-dismiss');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 3000);
    });

    // ----- 휴대폰 입력 자동 하이픈 ([data-phone] 전역 적용) -----
    Egov.bindPhoneInputs(document);

    // ----- 헤더 스크롤 효과 -----
    const header = document.querySelector('.egov-header');
    if (header) {
        const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ----- 스크롤 리빌 애니메이션 -----
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 주요 블록을 자동으로 reveal 대상으로 지정 (페이지별 수정 없이 전역 적용)
    const targets = document.querySelectorAll(
        '.page-title-bar, .search-bar, .egov-content .card, .egov-content > .container-fluid > .row, ' +
        '.egov-content .alert, nav[aria-label="페이지 네비게이션"]'
    );
    targets.forEach((el, i) => {
        el.classList.add('reveal');
        el.classList.add('r-d' + ((i % 5) + 1));
    });

    if (reduce || !('IntersectionObserver' in window)) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in-view');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});
