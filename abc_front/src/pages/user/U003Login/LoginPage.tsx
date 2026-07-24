import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AUTH_CHANGED_EVENT,
  completeGoogleLink,
  completeGoogleSignup,
  login,
  loginWithGoogle,
} from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type {
  GoogleAuthResponse,
  GoogleAuthStatus,
  GoogleTransition,
  LoginRequest,
  LoginResponse,
} from '../../../types/api';

const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services';
const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let googleIdentityScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (window.google) {
    return Promise.resolve();
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise;
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    const handleLoad = () => resolve();
    const handleError = () => reject(new Error('Google 로그인 라이브러리를 불러오지 못했습니다.'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.id = GOOGLE_IDENTITY_SCRIPT_ID;
      script.src = GOOGLE_IDENTITY_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return googleIdentityScriptPromise;
}

function persistLogin(response: LoginResponse) {
  localStorage.setItem('accessToken', response.accessToken);
  localStorage.setItem('memberRole', response.member.role);
  localStorage.setItem('memberId', String(response.member.memberId));
  localStorage.setItem('loginId', response.member.loginId);
  localStorage.setItem('memberName', response.member.name);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

type GoogleFlow = {
  status: Extract<GoogleAuthStatus, 'SIGNUP_REQUIRED' | 'LINK_REQUIRED'>;
  transition: GoogleTransition;
};

type GoogleSignupFormProps = {
  transition: GoogleTransition;
  onComplete: (response: GoogleAuthResponse) => void;
  onCancel: () => void;
};

function GoogleSignupForm({ transition, onComplete, onCancel }: GoogleSignupFormProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await completeGoogleSignup({
        transitionToken: transition.transitionToken,
        loginId: String(formData.get('loginId') ?? '').trim(),
        name: String(formData.get('name') ?? '').trim(),
        password,
        passwordConfirm,
        phone: String(formData.get('phone') ?? '').trim() || undefined,
        birthDate: String(formData.get('birthDate') ?? ''),
        gender: String(formData.get('gender') ?? '') as 'MALE' | 'FEMALE',
      });
      onComplete(response);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">Google 가입 완료</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <p className="form-message form-message-success">Google 계정 확인이 완료됐습니다. 추가 정보를 입력해 가입을 완료하세요.</p>
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        <label>
          Google 이메일
          <input value={transition.email} readOnly />
        </label>
        <label>
          아이디
          <input name="loginId" type="text" required />
        </label>
        <label>
          이름
          <input name="name" type="text" defaultValue={transition.name ?? ''} maxLength={50} required />
        </label>
        <label>
          비밀번호
          <input name="password" type="password" required />
          <small className="field-hint">영문, 숫자, 특수문자를 포함해 8~20자로 입력하세요.</small>
        </label>
        <label>
          비밀번호 확인
          <input name="passwordConfirm" type="password" required />
        </label>
        <label>
          연락처
          <input name="phone" type="tel" maxLength={20} placeholder="010-0000-0000" />
        </label>
        <label>
          생년월일
          <input name="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} required />
        </label>
        <label>
          성별
          <select name="gender" className="signup-select" defaultValue="" required>
            <option value="" disabled>
              성별을 선택하세요
            </option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>
        </label>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : 'Google 가입 완료'}
          </Button>
        </div>
      </form>
    </section>
  );
}

type GoogleLinkFormProps = {
  transition: GoogleTransition;
  onComplete: (response: GoogleAuthResponse) => void;
  onCancel: () => void;
};

function GoogleLinkForm({ transition, onComplete, onCancel }: GoogleLinkFormProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await completeGoogleLink({
        transitionToken: transition.transitionToken,
        password: String(formData.get('password') ?? ''),
      });
      onComplete(response);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">Google 계정 연결</h1>
      <form className="form-card" onSubmit={handleSubmit}>
        <p className="form-message form-message-success">
          {transition.email}은 기존 회원 계정으로 확인됐습니다. 기존 비밀번호를 입력해 Google 계정을 연결하세요.
        </p>
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}
        <label>
          기존 비밀번호
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : 'Google 계정 연결'}
          </Button>
        </div>
      </form>
    </section>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleCallbackRef = useRef<(idToken: string) => void>(() => undefined);
  const googleInitializedRef = useRef(false);
  const signupComplete = Boolean((location.state as { signupComplete?: boolean } | null)?.signupComplete);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleSdkError, setGoogleSdkError] = useState('');
  const [googleFlow, setGoogleFlow] = useState<GoogleFlow | null>(null);

  const finishLogin = useCallback(
    (response: LoginResponse) => {
      persistLogin(response);
      navigate('/');
    },
    [navigate],
  );

  const handleGoogleResponse = useCallback(
    (response: GoogleAuthResponse) => {
      if (response.status === 'AUTHENTICATED' && response.login) {
        finishLogin(response.login);
        return;
      }

      if (
        (response.status === 'SIGNUP_REQUIRED' || response.status === 'LINK_REQUIRED') &&
        response.transition
      ) {
        setGoogleFlow({ status: response.status, transition: response.transition });
        return;
      }

      setErrorMessage('Google 로그인 응답을 처리하지 못했습니다. 다시 시도해주세요.');
    },
    [finishLogin],
  );

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      if (isGoogleSubmitting) {
        return;
      }

      setErrorMessage('');
      setGoogleSdkError('');
      setIsGoogleSubmitting(true);

      try {
        const response = await loginWithGoogle({ idToken });
        handleGoogleResponse(response);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      } finally {
        setIsGoogleSubmitting(false);
      }
    },
    [handleGoogleResponse, isGoogleSubmitting],
  );

  googleCallbackRef.current = handleGoogleCredential;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let isDisposed = false;
    const buttonContainer = googleButtonRef.current;

    void loadGoogleIdentityScript()
      .then(() => {
        if (isDisposed || !window.google) {
          return;
        }

        if (!googleInitializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: ({ credential }) => googleCallbackRef.current(credential),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          googleInitializedRef.current = true;
        }

        buttonContainer.replaceChildren();
        window.google.accounts.id.renderButton(buttonContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
          locale: 'ko',
        });
      })
      .catch((error: unknown) => {
        if (!isDisposed) {
          setGoogleSdkError(error instanceof Error ? error.message : 'Google 로그인을 준비하지 못했습니다.');
        }
      });

    return () => {
      isDisposed = true;
      buttonContainer.replaceChildren();
    };
  }, [googleClientId, googleFlow]);

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
      finishLogin(await login(payload));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (googleFlow?.status === 'SIGNUP_REQUIRED') {
    return (
      <GoogleSignupForm
        transition={googleFlow.transition}
        onComplete={handleGoogleResponse}
        onCancel={() => setGoogleFlow(null)}
      />
    );
  }

  if (googleFlow?.status === 'LINK_REQUIRED') {
    return (
      <GoogleLinkForm
        transition={googleFlow.transition}
        onComplete={handleGoogleResponse}
        onCancel={() => setGoogleFlow(null)}
      />
    );
  }

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
          <Button type="submit" disabled={isSubmitting || isGoogleSubmitting}>
            {isSubmitting ? '처리 중...' : '로그인'}
          </Button>
        </div>

        {googleClientId ? (
          <div className="google-login-container" aria-busy={isGoogleSubmitting} ref={googleButtonRef} />
        ) : (
          <p className="form-message form-message-error">Google 로그인 설정을 찾을 수 없습니다.</p>
        )}
        {googleSdkError ? <p className="form-message form-message-error">{googleSdkError}</p> : null}

        <div className="login-option-row">
          <label className="keep-login">
            <input type="checkbox" />
            <span>로그인 유지하기</span>
          </label>

          <div className="find-links">
            <Link to="/find-id">아이디 찾기</Link>
            <span>/</span>
            <Link to="/find-id?tab=password">비밀번호 찾기</Link>
          </div>
        </div>
      </form>
    </section>
  );
}
