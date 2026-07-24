// 희망도서 신청(U022) 화면 — 도서 정보와 신청 사유를 입력받아 희망도서 신청을 등록한다
import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createBookRequest } from '../../../api/bookRequestsApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import type { BookRequestCreateRequest } from '../../../types/api';

type BookRequestPrefillState = {
  title?: string;
};

const emptyForm: BookRequestCreateRequest = {
  title: '',
  author: '',
  publisher: '',
  reason: '',
};

function validateForm(form: BookRequestCreateRequest) {
  if (!form.title.trim()) {
    return '도서 제목을 입력하세요.';
  }

  if (!form.author.trim()) {
    return '저자를 입력하세요.';
  }

  if (!form.publisher.trim()) {
    return '출판사를 입력하세요.';
  }

  if (!form.reason.trim()) {
    return '신청 사유를 입력하세요.';
  }

  return '';
}

export function BookRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as BookRequestPrefillState) ?? null;
  const [form, setForm] = useState<BookRequestCreateRequest>({ ...emptyForm, title: prefill?.title ?? '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateForm(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createBookRequest(form);
      navigate('/me/book-requests/history');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-section form-page">
      <h1 className="auth-page-title">희망도서 신청</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          도서 제목
          <input
            name="title"
            type="text"
            placeholder="도서 제목을 입력하세요"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </label>

        <label>
          저자
          <input
            name="author"
            type="text"
            placeholder="저자를 입력하세요"
            value={form.author}
            onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
          />
        </label>

        <label>
          출판사
          <input
            name="publisher"
            type="text"
            placeholder="출판사를 입력하세요"
            value={form.publisher}
            onChange={(event) => setForm((current) => ({ ...current, publisher: event.target.value }))}
          />
        </label>

        <label>
          신청 사유
          <textarea
            name="reason"
            className="book-request-reason-input"
            placeholder="신청 사유를 입력하세요"
            value={form.reason}
            onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
          />
        </label>

        {errorMessage ? <div className="status-banner status-banner-error">{errorMessage}</div> : null}

        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '신청 중...' : '신청하기'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/me/book-requests/history')}>
            신청 내역
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/me')}>
            취소
          </Button>
        </div>
      </form>
    </section>
  );
}
