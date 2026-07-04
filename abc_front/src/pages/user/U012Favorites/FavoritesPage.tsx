import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteMyFavorite, getMyFavorites } from '../../../api/favoritesApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import type { FavoriteBookItem, FavoriteSort } from '../../../types/api';

const pageSize = 20;

function formatAuthors(authors: string[]) {
  return authors.length > 0 ? authors.join(', ') : '-';
}

function formatRentalType(value: string) {
  if (value === 'FREE') {
    return '무료';
  }

  if (value === 'PAID') {
    return '유료';
  }

  return value || '-';
}

function formatRegisteredDate(book: FavoriteBookItem) {
  const value = book.registeredAt ?? book.createdAt;

  if (!value) {
    return '-';
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(time);
}

export function FavoritesPage() {
  const [favoriteBooks, setFavoriteBooks] = useState<FavoriteBookItem[]>([]);
  const [sort, setSort] = useState<FavoriteSort>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingBookId, setIsDeletingBookId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getMyFavorites({ sort, page: 0, size: pageSize });

        if (!ignore) {
          setFavoriteBooks(data.content);
        }
      } catch (error) {
        if (!ignore) {
          setFavoriteBooks([]);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      ignore = true;
    };
  }, [sort]);

  async function handleDeleteFavorite(bookId: number) {
    setIsDeletingBookId(bookId);
    setErrorMessage('');

    try {
      await deleteMyFavorite(bookId);
      setFavoriteBooks((books) => books.filter((book) => book.bookId !== bookId));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsDeletingBookId(null);
    }
  }

  const isEmpty = !isLoading && favoriteBooks.length === 0;

  return (
    <section className="page-section favorites-page">
      <div className="favorites-title-row">
        <div>
          <p className="eyebrow">U-012</p>
          <h1>즐겨찾기</h1>
        </div>

        <Link to="/books" className="browse-text-link">
          도서 둘러보기
        </Link>
      </div>

      <p className="favorites-description">
        내가 즐겨찾기한 도서 목록을 확인할 수 있습니다.
      </p>

      <div className="favorites-header">
        <strong>즐겨찾기 {favoriteBooks.length}권</strong>

        <select className="favorites-sort" value={sort} onChange={(event) => setSort(event.target.value as FavoriteSort)}>
          <option value="recent">최근 등록순</option>
          <option value="title">제목순</option>
        </select>
      </div>

      {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}
      {isLoading ? <div className="status-banner">즐겨찾기 목록을 불러오는 중입니다.</div> : null}

      {isEmpty ? (
        <div className="form-card favorites-empty">
          <p>즐겨찾기한 도서가 없습니다.</p>

          <Link to="/books" className="browse-button">
            도서 둘러보기
          </Link>
        </div>
      ) : null}

      {!isLoading && favoriteBooks.length > 0 ? (
        <div className="favorites-list">
          {favoriteBooks.map((book) => (
            <article key={book.bookId} className="favorite-card">
              <Link to={`/books/${book.bookId}`} className="favorite-cover-link">
                <img src={book.coverImageUrl} alt={`${book.title} 표지`} />
              </Link>

              <div className="favorite-info">
                <Link to={`/books/${book.bookId}`} className="favorite-title">
                  {book.title}
                </Link>

                <p className="favorite-meta">
                  {formatAuthors(book.authors)} | {book.publisherName}
                </p>

                <p className="favorite-date">
                  즐겨찾기 등록일 {formatRegisteredDate(book)}
                </p>
              </div>

              <span className="favorite-type">{formatRentalType(book.rentalType)}</span>

              <button
                type="button"
                className="favorite-heart"
                aria-label={`${book.title} 즐겨찾기 해제`}
                disabled={isDeletingBookId === book.bookId}
                onClick={() => void handleDeleteFavorite(book.bookId)}
              >
                ♡
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
