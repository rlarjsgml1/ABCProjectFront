// 로그인 화면(U003) — 아이디/비밀번호로 로그인하고 인증 정보를 저장한다.
import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT, login } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { LoginRequest } from '../../../types/api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signupComplete = Boolean((location.state as { signupComplete?: boolean } | null)?.signupComplete);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload: LoginRequest = {
      loginId: String(formData.get('loginId') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
    };

    try {
      const response = await login(payload);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('memberRole', response.member.role);
      localStorage.setItem('memberId', String(response.member.memberId));
      localStorage.setItem('loginId', response.member.loginId);
      localStorage.setItem('memberName', response.member.name);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate('/');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">로그인</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">
            로그인
          </Link>
          <Link to="/signup" className="auth-tab">
            회원가입
          </Link>
        </div>

        {signupComplete ? <p className="form-message form-message-success">회원가입이 완료되었습니다. 로그인해 주세요.</p> : null}
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        <label>
          아이디
          <input name="loginId" type="text" placeholder="아이디를 입력하세요" required />
        </label>

        <label>
          비밀번호
          <input name="password" type="password" placeholder="비밀번호를 입력하세요" required />
        </label>

        <div className="form-button">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '로그인'}
          </Button>
        </div>

        <button type="button" className="google-login-btn">
          Google로 로그인하기
        </button>

        <div className="login-option-row">
          <label className="keep-login">
            <input type="checkbox" />
            <span>로그인 유지하기</span>
          </label>

          <div className="find-links">
            <Link to="/find-id">아이디 찾기</Link>
            <span>/</span>
            <Link to="/find-id">비밀번호 찾기</Link>
          </div>
        </div>
      </form>
    </section>
  );
}
