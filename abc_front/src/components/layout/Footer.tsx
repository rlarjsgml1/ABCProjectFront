import { Link } from 'react-router-dom';
import abcLogo from '../../assets/abc-logo.png';

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="abc-footer-inner">
                <section className="abc-footer-brand" aria-label="ABC 정보">
                    <Link className="abc-footer-logo" to="/">
                        <img src={abcLogo} alt="ABC" />
                    </Link>
                    <p>서울특별시 강남구 테헤란로 123 ABC타워 8층</p>
                    <p>대표: 홍길동</p>
                    <p>사업자등록번호: 123-45-67890 / 통신판매업신고: 2026-서울강남-0123</p>
                    <p>이메일: support@abcbook.com</p>
                </section>

                <nav className="abc-footer-links" aria-label="푸터 바로가기">
                    <div className="abc-footer-column">
                        <h2>회사소개</h2>
                        <Link to="/privacy">개인정보처리방침</Link>
                        <Link to="/policy">관리방침</Link>
                        <Link to="/terms">이용약관</Link>
                    </div>

                    <div className="abc-footer-column">
                        <h2>고객지원</h2>
                        <Link to="/support">1:1문의하기</Link>
                        <Link to="/faq">자주 묻는 질문</Link>
                    </div>
                </nav>

                <section className="abc-footer-contact" aria-label="고객센터">
                    <strong>1234-5678</strong>
                    <p>오전 9시 - 오후 6시(토요일, 공휴일 휴무)</p>
                    <div className="abc-footer-contact-links">
                        <Link to="/support">1:1문의하기</Link>
                        <Link to="/faq">자주 묻는 질문</Link>
                    </div>
                    <small>Copyright © ABC BOOK CLOUD ALL RIGHTS RESERVED.</small>
                </section>
            </div>
        </footer>
    );
}
