// 아이디 찾기 화면(U004) — 이름/이메일로 아이디를 조회한다. 비밀번호 재설정은 백엔드 API가 없어 준비 중으로 표시한다.
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { findId } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import type { FindIdResponse } from '../../../types/api';

type FindTab = 'id' | 'password';

function formatJoinedAt(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

export function FindIdPage() {
  const [activeTab, setActiveTab] = useState<FindTab>('id');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<FindIdResponse | null>(null);

  const handleTabChange = (tab: FindTab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setResult(null);
  };

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
    <section className="page-section form-page">
      <h1 className="auth-page-title">아이디 찾기</h1>

      <div className="form-card find-id-card">
        <div className="find-tab-menu">
          <button
            type="button"
            className={`find-tab${activeTab === 'id' ? ' active' : ''}`}
            onClick={() => handleTabChange('id')}
          >
            아이디 찾기
          </button>

          <button
            type="button"
            className={`find-tab${activeTab === 'password' ? ' active' : ''}`}
            onClick={() => handleTabChange('password')}
          >
            비밀번호 재설정
          </button>
        </div>

        {activeTab === 'id' ? (
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
        ) : (
          <>
            <EmptyState title="비밀번호 재설정은 준비 중입니다." description="빠른 시일 내에 제공될 예정입니다." />

            <div className="find-links">
              <Link to="/login">로그인으로 돌아가기</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
