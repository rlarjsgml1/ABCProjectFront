import { Button } from '../../../components/common/Button';
import { Link } from 'react-router-dom';


export function SignupPage() {
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
          <input name="phone" type="tel" placeholder="010-0000-0000" />
        </label>

        <label>
          생년월일
         <input name="birthDate" type="date" required />
        </label>

        <label>
          이메일
          <input name="email" type="email" placeholder="abc@example.com" />
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