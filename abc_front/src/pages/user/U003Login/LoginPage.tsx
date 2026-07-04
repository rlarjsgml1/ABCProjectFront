import { Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button';

export function LoginPage() {
  return (
    <section className="page-section form-page">
      <p className="eyebrow">U-003</p>
      <h1 className="auth-page-title">로그인</h1>

      <form className="form-card">
        {/* 로그인 / 회원가입 탭 */}
        <div className="auth-tabs">
          <Link to="/login" className="auth-tab active">
            로그인
          </Link>
          <Link to="/signup" className="auth-tab">
            회원가입
          </Link>
        </div>

        <label>
          아이디
          <input name="loginId" type="text" placeholder="아이디를 입력하세요" />
        </label>

        <label>
          비밀번호
          <input name="password" type="password" placeholder="비밀번호를 입력하세요" />
        </label>

        <div className="form-button">
          <Button type="submit">로그인</Button>
        </div>

        <button type="button" className="google-login-btn">
          Google로 로그인하기
        </button>

        {/* 로그인 유지 / 아이디·비밀번호 찾기 */}
        <div className="login-option-row">
          <label className="keep-login">
            <input type="checkbox" />
            <span>로그인 유지하기</span>
          </label>

          <div className="find-links">
            <a href="#">아이디 찾기</a>
            <span>/</span>
            <a href="#">비밀번호 찾기</a>
          </div>
        </div>
      </form>
    </section>
  );
}