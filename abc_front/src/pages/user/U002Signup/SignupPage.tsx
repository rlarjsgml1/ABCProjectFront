// 회원가입 화면(U002) — 아이디/비밀번호/개인정보를 입력받아 회원가입을 처리한다.
import { FormEvent, MouseEvent, UIEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkLoginId, signup } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { SignupRequest } from '../../../types/api';

const PASSWORD_RULE_MESSAGE = '영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.';

// TODO: 법무 검토 전 임시 문구입니다. 실제 약관/개인정보처리방침 확정 시 교체해주세요.
const TERMS_OF_SERVICE_TEXT = `제1조 (목적)
이 약관은 ABC(이하 "회사")가 제공하는 전자책 대여 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회원이 단말기를 통해 도서를 대여, 열람, 구매할 수 있도록 회사가 제공하는 일체의 서비스를 의미합니다.
2. "회원"이란 이 약관에 동의하고 회사와 이용계약을 체결한 자를 의미합니다.
3. "콘텐츠"란 서비스를 통해 제공되는 전자책 및 관련 부가 정보를 의미합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경사유를 명시하여 사전에 공지합니다.

제4조 (이용계약의 성립)
1. 이용계약은 회원이 되고자 하는 자가 약관 내용에 동의하고 회원가입을 신청한 후, 회사가 이를 승낙함으로써 성립됩니다.
2. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.
   가. 실명이 아니거나 타인의 명의를 이용한 경우
   나. 허위 정보를 기재하거나 회사가 요구하는 내용을 기재하지 않은 경우
   다. 기타 회원으로 등록하는 것이 서비스 운영상 현저히 지장이 있다고 판단되는 경우

제5조 (회원정보의 변경)
회원은 개인정보관리 화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다.

제6조 (회원의 의무)
1. 회원은 관계 법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 합니다.
2. 회원은 회사의 사전 승낙 없이 서비스를 이용하여 영업활동을 할 수 없습니다.
3. 회원은 콘텐츠를 회사가 정한 이용목적 범위를 벗어나 복제, 전송, 출판, 배포, 방송 등에 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.

제7조 (서비스의 제공 및 변경)
1. 회사는 회원에게 도서 대여, 검색, 열람 등의 서비스를 제공합니다.
2. 회사는 운영상, 기술상의 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경할 수 있습니다.

제8조 (서비스 이용의 제한 및 중지)
회사는 회원이 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 단계적으로 제한하거나 이용계약을 해지할 수 있습니다.

제9조 (손해배상)
회사는 무료로 제공되는 서비스와 관련하여 회원에게 발생한 손해에 대하여 책임을 지지 않습니다. 다만 회사의 고의 또는 중대한 과실로 인한 경우에는 그러하지 않습니다.

제10조 (분쟁의 해결)
이 약관과 관련하여 발생한 분쟁에 대해서는 대한민국 법을 적용하며, 소송이 제기될 경우 회사의 본점 소재지를 관할하는 법원을 관할 법원으로 합니다.

부칙
이 약관은 2026년 1월 1일부터 시행합니다.`;

const PRIVACY_POLICY_TEXT = `1. 수집하는 개인정보 항목
회사는 회원가입, 서비스 이용을 위해 아래와 같은 개인정보를 수집합니다.
- 필수항목: 아이디, 비밀번호, 이름, 이메일, 생년월일
- 선택항목: 성별, 전화번호

2. 개인정보의 수집 및 이용목적
1. 회원 식별 및 본인 확인, 서비스 부정이용 방지
2. 도서 대여, 결제 등 서비스 제공 및 계약 이행
3. 공지사항 전달, 고객 문의 응대
4. 서비스 개선을 위한 통계 분석

3. 개인정보의 보유 및 이용기간
회사는 회원 탈퇴 시 지체 없이 개인정보를 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
- 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
- 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)
- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)

4. 개인정보의 제3자 제공
회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만 회원이 사전에 동의한 경우 또는 법령의 규정에 의한 경우는 예외로 합니다.

5. 개인정보처리의 위탁
회사는 서비스 운영을 위해 필요한 범위 내에서 개인정보 처리 업무 일부를 외부 업체에 위탁할 수 있으며, 위탁 시 관련 법령에 따라 필요한 사항을 계약서 등에 명시합니다.

6. 정보주체의 권리·의무 및 행사방법
회원은 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원탈퇴를 통해 개인정보 수집 및 이용 동의를 철회할 수 있습니다.

7. 개인정보의 안전성 확보조치
회사는 개인정보의 안전성 확보를 위해 비밀번호 암호화, 접근권한 관리, 접속기록 보관 등 기술적·관리적 조치를 취하고 있습니다.

8. 개인정보 보호책임자
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지는 개인정보 보호책임자를 지정하고 있으며, 관련 문의는 고객센터를 통해 접수받습니다.

부칙
이 개인정보처리방침은 2026년 1월 1일부터 시행합니다.`;

type AgreementType = 'terms' | 'privacy';

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// 포커스가 벗어났을 때 화면 공유/캡처 등으로 번호가 그대로 노출되지 않도록 중간 자리를 x로 가린다.
function maskPhoneNumber(value: string) {
  const parts = value.split('-');
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[0]}-${'x'.repeat(parts[1].length)}-${parts[2]}`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type LoginIdCheckStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

export function SignupPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [loginIdCheckStatus, setLoginIdCheckStatus] = useState<LoginIdCheckStatus>('idle');
  const [loginIdCheckMessage, setLoginIdCheckMessage] = useState('');
  const [checkedLoginId, setCheckedLoginId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMismatchMessage, setPasswordMismatchMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordMismatchOpen, setIsPasswordMismatchOpen] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [openAgreement, setOpenAgreement] = useState<AgreementType | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);

  const handleLoginIdChange = (value: string) => {
    setLoginId(value);
    // 확인 이후 아이디를 다시 수정하면 이전 결과를 무효화해서 재확인을 유도한다.
    if (checkedLoginId !== null && checkedLoginId !== value.trim()) {
      setLoginIdCheckStatus('idle');
      setLoginIdCheckMessage('');
    }
  };

  const handleCheckLoginId = async () => {
    const trimmed = loginId.trim();

    if (!trimmed) {
      setLoginIdCheckStatus('error');
      setLoginIdCheckMessage('아이디를 입력해주세요.');
      return;
    }

    setLoginIdCheckStatus('checking');
    setLoginIdCheckMessage('');

    try {
      const result = await checkLoginId(trimmed);
      setCheckedLoginId(trimmed);
      setLoginIdCheckStatus(result.available ? 'available' : 'unavailable');
    } catch (error) {
      setCheckedLoginId(null);
      setLoginIdCheckStatus('error');
      setLoginIdCheckMessage(getApiErrorMessage(error));
    }
  };

  const checkPasswordMatch = (nextPassword: string, nextPasswordConfirm: string) => {
    setPasswordMismatchMessage(
      nextPasswordConfirm && nextPassword !== nextPasswordConfirm ? '비밀번호가 다릅니다.' : '',
    );
  };

  const openAgreementModal = (type: AgreementType) => {
    setOpenAgreement(type);
    setHasScrolledToBottom(false);
    setIsAgreementChecked(false);
  };

  const closeAgreementModal = () => {
    setOpenAgreement(null);
  };

  const handleAgreementScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 4) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAgreementConfirm = () => {
    if (openAgreement === 'terms') {
      setAgreeTerms(true);
    } else if (openAgreement === 'privacy') {
      setAgreePrivacy(true);
    }
    closeAgreementModal();
  };

  // 체크 안 된 상태에서는 체크박스를 disabled로 막아서 브라우저 네이티브 토글이 절대 못 일어나게 한다.
  // (checkbox의 onClick에서 preventDefault()만으로 막으면, 모달을 취소해도 나중에 체크된 것처럼 보이는 케이스가 있었다.)
  const handleTermsLabelClick = (event: MouseEvent<HTMLLabelElement>) => {
    if (!agreeTerms) {
      event.preventDefault();
      openAgreementModal('terms');
    }
  };

  const handlePrivacyLabelClick = (event: MouseEvent<HTMLLabelElement>) => {
    if (!agreePrivacy) {
      event.preventDefault();
      openAgreementModal('privacy');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);
    const trimmedLoginId = loginId.trim();

    if (loginIdCheckStatus !== 'available' || checkedLoginId !== trimmedLoginId) {
      setLoginIdCheckStatus('error');
      setLoginIdCheckMessage('아이디 중복 확인을 먼저 해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setIsPasswordMismatchOpen(true);
      return;
    }

    setIsSubmitting(true);

    const gender = String(formData.get('gender') ?? '');
    const payload: SignupRequest = {
      loginId: trimmedLoginId,
      password,
      passwordConfirm,
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phone: phone.trim() || undefined,
      birthDate: String(formData.get('birthDate') ?? ''),
      gender: gender || undefined,
    };

    try {
      await signup(payload);
      navigate('/login', { state: { signupComplete: true } });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">회원가입</h1>

      <div className="auth-tabs">
        <Link to="/login" className="auth-tab">로그인</Link>
        <Link to="/signup" className="auth-tab active">회원가입</Link>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        <label>
          <span>아이디<span className="required-mark">*</span></span>
          <div className="field-inline-row">
            <input
              name="loginId"
              type="text"
              placeholder="아이디를 입력하세요"
              value={loginId}
              onChange={(event) => handleLoginIdChange(event.target.value)}
              required
            />
            <Button
              type="button"
              variant="secondary"
              className="field-inline-button"
              onClick={() => void handleCheckLoginId()}
              disabled={loginIdCheckStatus === 'checking'}
            >
              {loginIdCheckStatus === 'checking' ? '확인 중...' : '중복 확인'}
            </Button>
          </div>
          {loginIdCheckStatus === 'available' && checkedLoginId === loginId.trim() ? (
            <small className="field-success">사용 가능한 아이디입니다.</small>
          ) : loginIdCheckStatus === 'unavailable' && checkedLoginId === loginId.trim() ? (
            <small className="field-error">이미 사용 중인 아이디입니다.</small>
          ) : loginIdCheckStatus === 'error' ? (
            <small className="field-error">{loginIdCheckMessage}</small>
          ) : (
            <small className="field-hint">영문/숫자 조합으로 입력 후 중복 확인 버튼을 눌러주세요.</small>
          )}
        </label>

        <label>
          <span>비밀번호<span className="required-mark">*</span></span>
          <input
            name="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              checkPasswordMatch(event.target.value, passwordConfirm);
            }}
            required
          />
          <small className="field-hint">{PASSWORD_RULE_MESSAGE}</small>
        </label>

        <label>
          <span>비밀번호 확인<span className="required-mark">*</span></span>
          <input
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={passwordConfirm}
            onChange={(event) => {
              setPasswordConfirm(event.target.value);
              checkPasswordMatch(password, event.target.value);
            }}
            onBlur={() => checkPasswordMatch(password, passwordConfirm)}
            required
          />
          {passwordMismatchMessage ? (
            <small className="field-error">{passwordMismatchMessage}</small>
          ) : passwordConfirm && password === passwordConfirm ? (
            <small className="field-success">비밀번호가 동일합니다.</small>
          ) : (
            <small className="field-hint">위와 동일한 비밀번호를 입력해주세요.</small>
          )}
        </label>

        <label>
          <span>이름<span className="required-mark">*</span></span>
          <input name="name" type="text" placeholder="이름을 입력하세요" maxLength={50} required />
          <small className="field-hint">50자 이하로 입력해주세요.</small>
        </label>

        <label>
          성별
          <select name="gender" className="signup-select" defaultValue="">
            <option value="" disabled>
              성별을 선택하세요
            </option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
            <option value="NONE">선택 안 함</option>
          </select>
          <small className="field-hint">선택하지 않아도 가입할 수 있어요.</small>
        </label>

        <label>
          전화번호
          <input
            name="phone"
            type="tel"
            value={isPhoneFocused ? phone : maskPhoneNumber(phone)}
            onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
            onFocus={() => setIsPhoneFocused(true)}
            onBlur={() => setIsPhoneFocused(false)}
            inputMode="numeric"
            maxLength={13}
            placeholder="010-0000-0000"
          />
          <small className="field-hint">010-0000-0000 형식으로 입력해주세요. 입력하지 않아도 가입할 수 있어요.</small>
        </label>

        <label>
          <span>생년월일<span className="required-mark">*</span></span>
          <input name="birthDate" type="date" max={getTodayDateString()} required />
          <small className="field-hint">오늘보다 이후 날짜는 선택할 수 없어요.</small>
        </label>

        <label>
          <span>이메일<span className="required-mark">*</span></span>
          <input name="email" type="email" placeholder="abc@example.com" required />
          <small className="field-hint">example@domain.com 형식으로 입력해주세요. 가입 시 중복 여부를 확인합니다.</small>
        </label>

        <div className="form-checkbox-row agreement-checkbox-row">
          <div className="agreement-checkbox-item">
            <label className="keep-login" onClick={handleTermsLabelClick}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={agreeTerms}
                style={agreeTerms ? undefined : { pointerEvents: 'none' }}
                onChange={(event) => setAgreeTerms(event.target.checked)}
                onKeyDown={(event) => {
                  if (!agreeTerms && (event.key === ' ' || event.key === 'Enter')) {
                    event.preventDefault();
                    openAgreementModal('terms');
                  }
                }}
                required
              />
              <span>이용약관 동의 (필수)</span>
            </label>
            <button type="button" className="agreement-view-button" onClick={() => openAgreementModal('terms')}>
              전문 보기
            </button>
          </div>
          <div className="agreement-checkbox-item">
            <label className="keep-login" onClick={handlePrivacyLabelClick}>
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={agreePrivacy}
                style={agreePrivacy ? undefined : { pointerEvents: 'none' }}
                onChange={(event) => setAgreePrivacy(event.target.checked)}
                onKeyDown={(event) => {
                  if (!agreePrivacy && (event.key === ' ' || event.key === 'Enter')) {
                    event.preventDefault();
                    openAgreementModal('privacy');
                  }
                }}
                required
              />
              <span>개인정보 수집 및 이용 동의 (필수)</span>
            </label>
            <button type="button" className="agreement-view-button" onClick={() => openAgreementModal('privacy')}>
              전문 보기
            </button>
          </div>
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '회원가입'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
            취소
          </Button>
        </div>
      </form>

      {isPasswordMismatchOpen ? (
        <div className="membership-modal-backdrop" onClick={() => setIsPasswordMismatchOpen(false)}>
          <section
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-mismatch-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="membership-modal-header">
              <div>
                <p className="eyebrow">SIGNUP</p>
                <h2 id="password-mismatch-title">비밀번호가 일치하지 않습니다</h2>
              </div>
              <button
                className="membership-modal-close"
                type="button"
                aria-label="닫기"
                onClick={() => setIsPasswordMismatchOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="membership-modal-body">
              <p>비밀번호와 비밀번호 확인이 서로 다릅니다. 다시 입력해주세요.</p>
              <Button type="button" onClick={() => setIsPasswordMismatchOpen(false)}>
                확인
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {openAgreement ? (
        <div className="membership-modal-backdrop" onClick={closeAgreementModal}>
          <section
            className="membership-modal agreement-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agreement-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="membership-modal-header">
              <div>
                <p className="eyebrow">SIGNUP</p>
                <h2 id="agreement-modal-title">
                  {openAgreement === 'terms' ? '이용약관' : '개인정보 수집 및 이용 동의'}
                </h2>
              </div>
              <button className="membership-modal-close" type="button" aria-label="닫기" onClick={closeAgreementModal}>
                ×
              </button>
            </div>

            <div className="membership-modal-body">
              <div className="agreement-scroll-box" onScroll={handleAgreementScroll}>
                <pre className="agreement-scroll-text">
                  {openAgreement === 'terms' ? TERMS_OF_SERVICE_TEXT : PRIVACY_POLICY_TEXT}
                </pre>
              </div>

              {!hasScrolledToBottom ? (
                <p className="agreement-scroll-hint">전문을 끝까지 스크롤하면 동의할 수 있습니다.</p>
              ) : null}

              <label className="keep-login agreement-confirm-checkbox">
                <input
                  type="checkbox"
                  checked={isAgreementChecked}
                  disabled={!hasScrolledToBottom}
                  onChange={(event) => setIsAgreementChecked(event.target.checked)}
                />
                <span>전문을 확인했으며 동의합니다.</span>
              </label>

              <div className="form-actions">
                <Button type="button" onClick={handleAgreementConfirm} disabled={!isAgreementChecked}>
                  확인
                </Button>
                <Button type="button" variant="secondary" onClick={closeAgreementModal}>
                  취소
                </Button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
