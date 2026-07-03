import { Link } from 'react-router-dom';
import './Favorites.css';

type FavoriteBook = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  category: string;
  rentalType: '무료' | '유료';
  registeredAt: string;
  coverUrl: string;
};

const favoriteBooks: FavoriteBook[] = [
  {
    id: 1,
    title: '달러구트 꿈 백화점',
    author: '이미예',
    publisher: '팩토리나인',
    category: '소설',
    rentalType: '유료',
    registeredAt: '2026-07-01',
    coverUrl: 'https://placehold.co/120x170?text=Book',
  },
  {
    id: 2,
    title: '불편한 편의점',
    author: '김호연',
    publisher: '나무옆의자',
    category: '소설',
    rentalType: '무료',
    registeredAt: '2026-06-28',
    coverUrl: 'https://placehold.co/120x170?text=Book',
  },
  {
    id: 3,
    title: '아몬드',
    author: '손원평',
    publisher: '창비',
    category: '소설',
    rentalType: '무료',
    registeredAt: '2026-06-25',
    coverUrl: 'https://placehold.co/120x170?text=Book',
  },
  {
    id: 4,
    title: '세이노의 가르침',
    author: '세이노',
    publisher: '데이원',
    category: '자기계발',
    rentalType: '무료',
    registeredAt: '2026-06-20',
    coverUrl: 'https://placehold.co/120x170?text=Book',
  },
];

export function FavoritesPage() {
  const isEmpty = favoriteBooks.length === 0;

  return (
    <section className="page-section favorites-page">
      <div className="favorites-title-row">
        <div>
          <p className="eyebrow">U-012</p>
          <h1>내 관심도서 목록</h1>
        </div>

        <Link to="/books" className="browse-text-link">
          도서 둘러보기
        </Link>
      </div>

      <p className="favorites-description">
        나의 관심도서 목록을 확인할 수 있습니다.
      </p>

      <div className="favorites-header">
        <strong>관심도서 {favoriteBooks.length}권</strong>

        <select className="favorites-sort" defaultValue="recent">
          <option value="recent">최근 등록순</option>
          <option value="title">제목순</option>
        </select>
      </div>

      {isEmpty ? (
        <div className="form-card favorites-empty">
          <p>즐겨찾기한 도서가 없습니다.</p>

          <Link to="/books" className="browse-button">
            도서 둘러보기
          </Link>
        </div>
      ) : (
        <div className="favorites-list">
          {favoriteBooks.map((book) => (
            <article key={book.id} className="favorite-card">
              <Link to={`/books/${book.id}`} className="favorite-cover-link">
                <img src={book.coverUrl} alt={`${book.title} 표지`} />
              </Link>

              <div className="favorite-info">
                <Link to={`/books/${book.id}`} className="favorite-title">
                  {book.title}
                </Link>

                <p className="favorite-meta">
                  {book.author} | {book.publisher} | {book.category}
                </p>

                <p className="favorite-date">
                  관심 도서 목록 등록일 {book.registeredAt}
                </p>
              </div>

              <span className="favorite-type">{book.rentalType}</span>

              <button
                type="button"
                className="favorite-heart"
                aria-label={`${book.title} 즐겨찾기 해제`}
              >
                ♡
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}