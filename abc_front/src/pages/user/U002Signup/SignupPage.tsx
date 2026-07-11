import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { SignupRequest } from '../../../types/api';

const PASSWORD_RULE_MESSAGE = '영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.';

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

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function SignupPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMismatchMessage, setPasswordMismatchMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordMismatchOpen, setIsPasswordMismatchOpen] = useState(false);

  const checkPasswordMatch = (nextPassword: string, nextPasswordConfirm: string) => {
    setPasswordMismatchMessage(
      nextPasswordConfirm && nextPassword !== nextPasswordConfirm ? '비밀번호가 다릅니다.' : '',
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);

    if (password !== passwordConfirm) {
      setIsPasswordMismatchOpen(true);
      return;
    }

    setIsSubmitting(true);

    const gender = String(formData.get('gender') ?? '');
    const payload: SignupRequest = {
      loginId: String(formData.get('loginId') ?? '').trim(),
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
          <input name="loginId" type="text" placeholder="아이디를 입력하세요" required />
          <small className="field-hint">영문/숫자 조합으로 입력해주세요. 가입 시 중복 여부를 확인합니다.</small>
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
            onChange={(event) => setPasswordConfirm(event.target.value)}
            onBlur={() => checkPasswordMatch(password, passwordConfirm)}
            required
          />
          {passwordMismatchMessage ? (
            <small className="field-error">{passwordMismatchMessage}</small>
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
            <option value="M">남성</option>
            <option value="F">여성</option>
            <option value="NONE">선택 안 함</option>
          </select>
          <small className="field-hint">선택하지 않아도 가입할 수 있어요.</small>
        </label>

        <label>
          전화번호
          <input
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
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

        <div className="form-checkbox-row">
          <label className="keep-login">
            <input type="checkbox" name="agreeTerms" />
            <span>이용약관 동의 (필수)</span>
          </label>
          <label className="keep-login">
            <input type="checkbox" name="agreePrivacy" />
            <span>개인정보 수집 및 이용 동의 (필수)</span>
          </label>
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
    </section>
  );
}
