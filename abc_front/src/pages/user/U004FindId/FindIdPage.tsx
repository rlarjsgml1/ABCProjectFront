// 아이디 찾기 / 비밀번호 재설정 화면(U004).
// 비밀번호 재설정은 백엔드 API가 아직 없다 — ERD 문서 "13.12 비밀번호 재설정 정책" 스펙으로 프론트만 미리 준비해둔 상태.
import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, findId, requestPasswordReset, verifyPasswordResetCode } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { FindIdResponse } from '../../../types/api';

type FindTab = 'id' | 'password';
type ResetStep = 'request' | 'verify' | 'reset' | 'done';

const PASSWORD_RULE_MESSAGE = '영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.';
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;

function formatJoinedAt(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

function FindIdForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<FindIdResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setResult(null);
    setIsSubmitting(true);

    try {
      const data = await findId({ name: name.trim(), email: email.trim() });
      setResult(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      {result ? (
        result.found ? (
          <p className="form-message form-message-success">
            회원님의 아이디는 <strong>{result.loginId}</strong> 입니다.
            {result.joinedAt ? ` (가입일: ${formatJoinedAt(result.joinedAt)})` : ''}
          </p>
        ) : (
          <p className="form-message form-message-error">일치하는 회원 정보가 없습니다.</p>
        )
      ) : null}

      <label>
        이름
        <input
          type="text"
          name="name"
          placeholder="이름을 입력해주세요."
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        이메일
        <input
          type="email"
          name="email"
          placeholder="이메일을 입력해주세요."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <div className="form-button">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '조회 중...' : '아이디 찾기'}
        </Button>
      </div>

      <div className="find-links">
        <Link to="/login">로그인으로 돌아가기</Link>
      </div>
    </form>
  );
}

function PasswordResetForm() {
  const [step, setStep] = useState<ResetStep>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [loginId, setLoginId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordMismatchMessage, setPasswordMismatchMessage] = useState('');

  const checkPasswordMatch = (nextPassword: string, nextPasswordConfirm: string) => {
    setPasswordMismatchMessage(
      nextPasswordConfirm && nextPassword !== nextPasswordConfirm ? '비밀번호가 다릅니다.' : '',
    );
  };

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await requestPasswordReset({ loginId: loginId.trim(), name: name.trim(), email: email.trim() });
      // 정책상 일치 여부와 무관하게 항상 200 OK + 공통 메시지가 내려온다 (회원 존재 여부 비노출).
      setRequestMessage(data.message || '입력한 정보가 일치하면 인증 코드가 이메일로 발송됩니다.');
      setStep('verify');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const data = await verifyPasswordResetCode({ loginId: loginId.trim(), code: code.trim() });
      setResetToken(data.resetToken);
      setStep('reset');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (newPassword !== newPasswordConfirm) {
      setPasswordMismatchMessage('비밀번호가 다릅니다.');
      return;
    }

    if (!PASSWORD_PATTERN.test(newPassword)) {
      setErrorMessage(PASSWORD_RULE_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset({ resetToken, newPassword, newPasswordConfirm });
      setStep('done');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToRequest = () => {
    setStep('request');
    setErrorMessage('');
    setCode('');
    setResetToken('');
  };

  if (step === 'done') {
    return (
      <div className="form-card">
        <p className="form-message form-message-success">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</p>

        <div className="find-links">
          <Link to="/login">로그인으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form className="form-card" onSubmit={handleResetSubmit}>
        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        <label>
          새 비밀번호
          <input
            type="password"
            placeholder="새 비밀번호를 입력해주세요."
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              checkPasswordMatch(event.target.value, newPasswordConfirm);
            }}
            required
          />
          <small className="field-hint">{PASSWORD_RULE_MESSAGE}</small>
        </label>

        <label>
          새 비밀번호 확인
          <input
            type="password"
            placeholder="새 비밀번호를 다시 입력해주세요."
            value={newPasswordConfirm}
            onChange={(event) => setNewPasswordConfirm(event.target.value)}
            onBlur={() => checkPasswordMatch(newPassword, newPasswordConfirm)}
            required
          />
          {passwordMismatchMessage ? <small className="field-error">{passwordMismatchMessage}</small> : null}
        </label>

        <div className="form-button">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>
      </form>
    );
  }

  if (step === 'verify') {
    return (
      <form className="form-card" onSubmit={handleVerifySubmit}>
        <p className="form-message form-message-success">{requestMessage}</p>

        {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

        <label>
          인증 코드
          <input
            type="text"
            placeholder="이메일로 받은 6자리 코드를 입력해주세요."
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={6}
            required
          />
          <small className="field-hint">인증 코드는 발급 후 10분간 유효합니다.</small>
        </label>

        <div className="form-button">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '확인 중...' : '코드 확인'}
          </Button>
        </div>

        <div className="find-links">
          <button type="button" className="agreement-view-button" onClick={handleBackToRequest}>
            처음부터 다시 요청하기
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="form-card" onSubmit={handleRequestSubmit}>
      {errorMessage ? <p className="form-message form-message-error">{errorMessage}</p> : null}

      <label>
        아이디
        <input
          type="text"
          placeholder="아이디를 입력해주세요."
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          required
        />
      </label>

      <label>
        이름
        <input
          type="text"
          placeholder="이름을 입력해주세요."
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        이메일
        <input
          type="email"
          placeholder="이메일을 입력해주세요."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <div className="form-button">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '요청 중...' : '인증 코드 요청'}
        </Button>
      </div>

      <div className="find-links">
        <Link to="/login">로그인으로 돌아가기</Link>
      </div>
    </form>
  );
}

export function FindIdPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<FindTab>(searchParams.get('tab') === 'password' ? 'password' : 'id');

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">아이디 찾기</h1>

      <div className="form-card find-id-card">
        <div className="find-tab-menu">
          <button
            type="button"
            className={`find-tab${activeTab === 'id' ? ' active' : ''}`}
            onClick={() => setActiveTab('id')}
          >
            아이디 찾기
          </button>

          <button
            type="button"
            className={`find-tab${activeTab === 'password' ? ' active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            비밀번호 재설정
          </button>
        </div>

        {activeTab === 'id' ? <FindIdForm /> : <PasswordResetForm />}
      </div>
    </section>
  );
}
