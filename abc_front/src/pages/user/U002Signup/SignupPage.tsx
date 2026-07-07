import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../../api/authApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { SignupRequest } from '../../../types/api';

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

export function SignupPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const gender = String(formData.get('gender') ?? '');
    const payload: SignupRequest = {
      loginId: String(formData.get('loginId') ?? '').trim(),
      password: String(formData.get('password') ?? ''),
      passwordConfirm: String(formData.get('passwordConfirm') ?? ''),
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
          아이디
          <input name="loginId" type="text" placeholder="아이디를 입력하세요" required />
        </label>

        <label>
          비밀번호
          <input name="password" type="password" placeholder="비밀번호를 입력하세요" required />
        </label>

        <label>
          비밀번호 확인
          <input
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            required
          />
        </label>

        <label>
          이름
          <input name="name" type="text" placeholder="이름을 입력하세요" required />
        </label>

        <label>
          성별
          <select name="gender" className="signup-select" defaultValue="" required>
            <option value="" disabled>
              성별을 선택하세요
            </option>
            <option value="F">여성</option>
            <option value="M">남성</option>
          </select>
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
        </label>

        <label>
          생년월일
          <input name="birthDate" type="date" required />
        </label>

        <label>
          이메일
          <input name="email" type="email" placeholder="abc@example.com" required />
        </label>

        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '회원가입'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
            취소
          </Button>
        </div>
      </form>
    </section>
  );
}
