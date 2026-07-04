import { useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Link } from 'react-router-dom';


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
  const [phone, setPhone] = useState('');

  return (
    <section className="page-section form-page">
      <p className="eyebrow">U-002</p>
      <h1>회원가입</h1>

<div className="auth-tabs">
  <Link to="/login" className="auth-tab">로그인</Link>
  <Link to="/signup" className="auth-tab active">회원가입</Link>
</div>
      <form className="form-card">
        <label>
          아이디
          <input name="loginId" type="text" placeholder="아이디를 입력하세요" />
        </label>

        <label>
          비밀번호
          <input name="password" type="password" placeholder="비밀번호를 입력하세요" />
        </label>

        <label>
          비밀번호 확인
          <input
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
          />
        </label>

        <label>
          이름
          <input name="name" type="text" placeholder="이름을 입력하세요" />
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
          <input name="email" type="email" placeholder="abc@example.com" />
        </label>

        <div className="form-actions">
          <Button type="button">회원가입</Button>
          <Button type="button" variant="secondary">
            취소
          </Button>
        </div>
      </form>
    </section>
  );
}
