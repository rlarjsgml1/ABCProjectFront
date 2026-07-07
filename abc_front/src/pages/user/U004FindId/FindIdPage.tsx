import { Button } from '../../../components/common/Button';

export function FindIdPage() {
  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">아이디 찾기</h1>

      <form className="form-card find-id-card">
        {/* 아이디 찾기 / 비밀번호 재설정 탭 메뉴 */}
        <div className="find-tab-menu">
          <button type="button" className="find-tab active">
            아이디 찾기
          </button>

          <button type="button" className="find-tab">
            비밀번호 재설정
          </button>
        </div>

        {/* 이름 입력 */}
        <label>
          이름
          <input
            type="text"
            name="name"
            placeholder="이름을 입력해주세요."
          />
        </label>

        {/* 생년월일 입력 */}
        <label>
          생년월일
          <input
            type="text"
            name="birthDate"
            placeholder="생년월일 8자리를 입력해주세요."
            maxLength={8}
          />
        </label>

        {/* 이메일 입력 */}
        <label>
          이메일
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력해주세요."
          />
        </label>

        {/* 아이디 찾기 버튼 */}
      <div className="form-button">
        <Button type="button">아이디 찾기</Button>
      </div>
      </form>
    </section>
  );
}
