import { FormEvent, KeyboardEvent as ReactKeyboardEvent, RefObject, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  approveBookIsbnTemp,
  bulkApproveBookIsbnTemps,
  bulkDeleteBookIsbnTemps,
  enrichBookIsbnTemps,
  fetchBookIsbnTemp,
  getBookIsbnTemps,
  lookupExternalBook,
  seedBookIsbnTemps,
} from '../../../api/adminBookIsbnTempApi';
import type {
  BookIsbnBulkApproveResponse,
  BookIsbnEnrichResponse,
  BookIsbnSeedResponse,
  BookIsbnTempApproveResponse,
  BookIsbnTempBulkDeleteResponse,
  BookIsbnTempStatus,
  BookIsbnTempSummary,
  ExternalBookLookupResponse,
} from '../../../api/adminBookIsbnTempApi';
import { uploadAdminBookEpub } from '../../../api/adminBookApi';
import { getApiErrorMessage } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import styles from '../../../styles/AdminBookIsbnTempPage.module.css';

const MAX_EPUB_FILE_SIZE = 50 * 1024 * 1024;
const statusOptions: Array<{ value: BookIsbnTempStatus; label: string; code: number }> = [
  { value: 'PENDING', label: '수집 대기', code: 0 },
  { value: 'READY', label: '승인 대기', code: 1 },
  { value: 'MERGED', label: '등록 완료', code: 2 },
];

type DialogFocusOptions = {
  open: boolean;
  onClose: () => void;
  locked?: boolean;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
};

function useDialogFocus({ open, onClose, locked = false, fallbackFocusRef }: DialogFocusOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    let frameId: number | undefined;
    if (open) {
      if (!wasOpenRef.current) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      wasOpenRef.current = true;
      frameId = window.requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
        )?.focus();
      });
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      frameId = window.requestAnimationFrame(() => {
        const previous = returnFocusRef.current;
        const disabled = previous instanceof HTMLButtonElement || previous instanceof HTMLInputElement
          ? previous.disabled
          : false;
        if (previous?.isConnected && !disabled) previous.focus();
        else fallbackFocusRef?.current?.focus();
      });
    }
    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    };
  }, [fallbackFocusRef, open]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!locked) onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    const focusable = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
    )) : [];
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return { dialogRef, handleKeyDown };
}

function normalizeIsbn(value: string) {
  const isbn13 = value.replace(/[^0-9]/g, '');
  return /^\d{13}$/.test(isbn13) ? isbn13 : null;
}

function splitAuthors(value: FormDataEntryValue | null) {
  return String(value ?? '').split(',').map((author) => author.trim()).filter(Boolean);
}

function splitCategoryIds(value: FormDataEntryValue | null) {
  return String(value ?? '').split(',').map((categoryId) => Number(categoryId.trim()))
    .filter((categoryId) => Number.isInteger(categoryId) && categoryId > 0);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ko-KR');
}

function statusLabel(statusCd: number) {
  return statusOptions.find((option) => option.code === statusCd)?.label ?? `상태 ${statusCd}`;
}

export function AdminBookIsbnTempPage() {
  const [isbnInput, setIsbnInput] = useState('');
  const [preview, setPreview] = useState<ExternalBookLookupResponse | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isFetchingTemp, setIsFetchingTemp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [seedResult, setSeedResult] = useState<BookIsbnSeedResponse | null>(null);
  const [enrichResult, setEnrichResult] = useState<BookIsbnEnrichResponse | null>(null);
  const [operationError, setOperationError] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [tempStatus, setTempStatus] = useState<BookIsbnTempStatus>('READY');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [tempPage, setTempPage] = useState<Awaited<ReturnType<typeof getBookIsbnTemps>> | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [listVersion, setListVersion] = useState(0);
  const [selectedTempIds, setSelectedTempIds] = useState<Set<number>>(new Set());
  const [bulkTempIds, setBulkTempIds] = useState<number[]>([]);
  const listStatusRef = useRef<HTMLSelectElement>(null);
  const [approveCandidate, setApproveCandidate] = useState<BookIsbnTempSummary | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState('');
  const [approveResult, setApproveResult] = useState<BookIsbnTempApproveResponse | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BookIsbnBulkApproveResponse | null>(null);
  const [deleteTempIds, setDeleteTempIds] = useState<number[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteResult, setDeleteResult] = useState<BookIsbnTempBulkDeleteResponse | null>(null);
  const [epubBookId, setEpubBookId] = useState('');
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [isEpubConfirmOpen, setIsEpubConfirmOpen] = useState(false);
  const [isUploadingEpub, setIsUploadingEpub] = useState(false);
  const [epubError, setEpubError] = useState('');
  const [epubMessage, setEpubMessage] = useState('');
  const epubFileInputRef = useRef<HTMLInputElement>(null);

  const approveDialog = useDialogFocus({ open: approveCandidate !== null, onClose: () => setApproveCandidate(null), locked: isApproving, fallbackFocusRef: listStatusRef });
  const bulkDialog = useDialogFocus({ open: isBulkConfirmOpen, onClose: closeBulkDialog, locked: isBulkApproving, fallbackFocusRef: listStatusRef });
  const deleteDialog = useDialogFocus({ open: isDeleteConfirmOpen, onClose: closeDeleteDialog, locked: isDeleting, fallbackFocusRef: listStatusRef });
  const epubDialog = useDialogFocus({ open: isEpubConfirmOpen, onClose: () => setIsEpubConfirmOpen(false), locked: isUploadingEpub, fallbackFocusRef: epubFileInputRef });

  useEffect(() => {
    let ignore = false;
    async function loadTemps() {
      setIsListLoading(true);
      setListError('');
      setTempPage(null);
      try {
        const data = await getBookIsbnTemps(tempStatus, page, size);
        if (!ignore) {
          const lastPage = Math.max(data.totalPages - 1, 0);
          if (page > lastPage) {
            setPage(lastPage);
            return;
          }
          setTempPage(data);
          setSelectedTempIds(new Set());
        }
      } catch (error) {
        if (!ignore) setListError(getApiErrorMessage(error));
      } finally {
        if (!ignore) setIsListLoading(false);
      }
    }
    void loadTemps();
    return () => { ignore = true; };
  }, [listVersion, page, size, tempStatus]);

  useEffect(() => {
    setSelectedTempIds(new Set());
    setBulkTempIds([]);
    setIsBulkConfirmOpen(false);
    setDeleteTempIds([]);
    setIsDeleteConfirmOpen(false);
  }, [listVersion, page, size, tempStatus]);

  function refreshTemps() {
    setListVersion((current) => current + 1);
  }

  function closeBulkDialog() {
    setIsBulkConfirmOpen(false);
    setBulkTempIds([]);
  }

  function closeDeleteDialog() {
    setIsDeleteConfirmOpen(false);
    setDeleteTempIds([]);
  }

  async function handleLookup() {
    const isbn13 = normalizeIsbn(isbnInput);
    setLookupError('');
    setLookupMessage('');
    setPreview(null);
    if (!isbn13) {
      setLookupError('ISBN13 숫자 13자리를 입력해 주세요.');
      return;
    }
    setIsLookingUp(true);
    try {
      setPreview(await lookupExternalBook(isbn13));
      setLookupMessage('외부 도서 정보를 조회했습니다. 아직 DB에는 저장되지 않았습니다.');
    } catch (error) {
      setLookupError(getApiErrorMessage(error));
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleFetchTemp() {
    const isbn13 = normalizeIsbn(isbnInput);
    setLookupError('');
    setLookupMessage('');
    if (!isbn13) {
      setLookupError('ISBN13 숫자 13자리를 입력해 주세요.');
      return;
    }
    setIsFetchingTemp(true);
    try {
      const response = await fetchBookIsbnTemp(isbn13);
      setLookupMessage(`temp 저장 완료: T-${response.tempId} (${statusLabel(response.statusCd)})`);
      setTempStatus(response.statusCd === 0 ? 'PENDING' : response.statusCd === 2 ? 'MERGED' : 'READY');
      setPage(0);
      refreshTemps();
    } catch (error) {
      setLookupError(getApiErrorMessage(error));
    } finally {
      setIsFetchingTemp(false);
    }
  }

  async function handleSeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError('');
    setSeedResult(null);
    const formData = new FormData(event.currentTarget);
    const keyword = String(formData.get('keyword') ?? '').trim();
    if (!keyword) {
      setOperationError('수집 검색어를 입력해 주세요.');
      return;
    }
    setIsSeeding(true);
    try {
      const response = await seedBookIsbnTemps({ keyword, targetCount: Number(formData.get('targetCount')), pageSize: Number(formData.get('pageSize')), maxPages: Number(formData.get('maxPages')) });
      setSeedResult(response);
      setTempStatus('PENDING');
      setPage(0);
      refreshTemps();
    } catch (error) {
      setOperationError(getApiErrorMessage(error));
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleEnrich(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError('');
    setEnrichResult(null);
    const formData = new FormData(event.currentTarget);
    setIsEnriching(true);
    try {
      const response = await enrichBookIsbnTemps(Number(formData.get('limit')));
      setEnrichResult(response);
      setTempStatus('READY');
      setPage(0);
      refreshTemps();
    } catch (error) {
      setOperationError(getApiErrorMessage(error));
    } finally {
      setIsEnriching(false);
    }
  }

  function toggleTemp(tempId: number) {
    if (!selectedTempIds.has(tempId) && selectedTempIds.size >= 30) {
      setListError('일괄 작업은 한 번에 최대 30건까지 선택할 수 있습니다.');
      return;
    }
    setSelectedTempIds((current) => {
      const next = new Set(current);
      if (next.has(tempId)) next.delete(tempId);
      else next.add(tempId);
      return next;
    });
  }

  function toggleAllSelectable() {
    const selectableIds = (tempPage?.content ?? [])
      .filter((item) => (tempStatus === 'PENDING' && item.statusCd === 0)
        || (tempStatus === 'READY' && item.statusCd === 1))
      .map((item) => item.tempId)
      .slice(0, 30);
    const allSelected = selectableIds.length > 0 && selectableIds.every((tempId) => selectedTempIds.has(tempId));
    setSelectedTempIds(allSelected ? new Set() : new Set(selectableIds));
    if (!allSelected && (tempPage?.content ?? []).filter((item) => item.statusCd === (tempStatus === 'PENDING' ? 0 : 1)).length > 30) {
      setListError('현재 페이지에서 최대 30건만 선택했습니다.');
    }
  }

  function openApprove(candidate: BookIsbnTempSummary) {
    setApproveError('');
    setApproveResult(null);
    setApproveCandidate(candidate);
  }

  async function handleApprove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!approveCandidate) return;
    setApproveError('');
    const formData = new FormData(event.currentTarget);
    const authors = splitAuthors(formData.get('authors'));
    const rentalType = String(formData.get('rentalType')) as 'FREE' | 'PAID';
    const rentalPrice = rentalType === 'FREE' ? 0 : Number(formData.get('rentalPrice'));
    if (authors.length === 0) {
      setApproveError('저자를 한 명 이상 입력해 주세요.');
      return;
    }
    if (rentalType === 'PAID' && rentalPrice <= 0) {
      setApproveError('유료 도서는 대여 가격을 1원 이상 입력해 주세요.');
      return;
    }
    setIsApproving(true);
    try {
      const response = await approveBookIsbnTemp(approveCandidate.tempId, {
        title: String(formData.get('title') ?? '').trim(),
        publisherName: String(formData.get('publisherName') ?? '').trim(),
        authors,
        categoryIds: splitCategoryIds(formData.get('categoryIds')),
        rentalType,
        rentalPrice,
        status: String(formData.get('status')) as 'AVAILABLE' | 'HIDDEN' | 'INACTIVE',
        detail: { description: String(formData.get('description') ?? '').trim() || undefined },
      });
      setApproveResult(response);
      setApproveCandidate(null);
      setEpubBookId(String(response.bookId));
      setPage(0);
      refreshTemps();
    } catch (error) {
      setApproveError(getApiErrorMessage(error));
    } finally {
      setIsApproving(false);
    }
  }

  function prepareBulkApprove() {
    setBulkError('');
    setBulkResult(null);
    const snapshot = Array.from(selectedTempIds).slice(0, 30);
    if (snapshot.length === 0) {
      setListError('일괄 승인할 READY 항목을 선택해 주세요.');
      return;
    }
    setBulkTempIds(snapshot);
    setIsBulkConfirmOpen(true);
  }

  async function handleBulkApprove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBulkError('');
    if (bulkTempIds.length === 0) {
      setBulkError('승인 대상이 없습니다. dialog를 닫고 READY 항목을 다시 선택해 주세요.');
      return;
    }
    const formData = new FormData(event.currentTarget);
    const rentalType = String(formData.get('rentalType')) as 'FREE' | 'PAID';
    const rentalPrice = rentalType === 'FREE' ? 0 : Number(formData.get('rentalPrice'));
    if (rentalType === 'PAID' && rentalPrice <= 0) {
      setBulkError('유료 도서는 대여 가격을 1원 이상 입력해 주세요.');
      return;
    }
    setIsBulkApproving(true);
    try {
      const response = await bulkApproveBookIsbnTemps({
        tempIds: bulkTempIds, limit: bulkTempIds.length,
        maxCandidates: bulkTempIds.length, rentalType, rentalPrice,
        status: String(formData.get('status')) as 'AVAILABLE' | 'HIDDEN' | 'INACTIVE',
      });
      setBulkResult(response);
      setIsBulkConfirmOpen(false);
      setSelectedTempIds(new Set());
      setBulkTempIds([]);
      setPage(0);
      refreshTemps();
    } catch (error) {
      setBulkError(getApiErrorMessage(error));
    } finally {
      setIsBulkApproving(false);
    }
  }

  function prepareBulkDelete() {
    setDeleteError('');
    setDeleteResult(null);
    const snapshot = Array.from(selectedTempIds).slice(0, 30);
    if (tempStatus !== 'PENDING' || snapshot.length === 0) {
      setListError('삭제할 PENDING 항목을 선택해 주세요.');
      return;
    }
    setDeleteTempIds(snapshot);
    setIsDeleteConfirmOpen(true);
  }

  async function handleBulkDelete() {
    setDeleteError('');
    if (deleteTempIds.length === 0) {
      setDeleteError('삭제 대상이 없습니다. dialog를 닫고 PENDING 항목을 다시 선택해 주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await bulkDeleteBookIsbnTemps(deleteTempIds);
      setDeleteResult(response);
      setIsDeleteConfirmOpen(false);
      setSelectedTempIds(new Set());
      setDeleteTempIds([]);
      refreshTemps();
    } catch (error) {
      setDeleteError(getApiErrorMessage(error));
      setIsDeleteConfirmOpen(false);
      setSelectedTempIds(new Set());
      setDeleteTempIds([]);
      refreshTemps();
    } finally {
      setIsDeleting(false);
    }
  }

  function prepareEpubUpload() {
    setEpubError('');
    setEpubMessage('');
    const bookId = Number(epubBookId);
    if (!Number.isInteger(bookId) || bookId <= 0) {
      setEpubError('EPUB을 등록할 bookId를 입력해 주세요.');
      return;
    }
    if (!epubFile) {
      setEpubError('업로드할 EPUB 파일을 선택해 주세요.');
      return;
    }
    if (!epubFile.name.toLowerCase().endsWith('.epub')) {
      setEpubError('.epub 확장자 파일만 업로드할 수 있습니다.');
      return;
    }
    if (epubFile.size > MAX_EPUB_FILE_SIZE) {
      setEpubError('EPUB 파일은 50MB 이하만 업로드할 수 있습니다.');
      return;
    }
    setIsEpubConfirmOpen(true);
  }

  async function handleEpubUpload() {
    if (!epubFile) return;
    setIsUploadingEpub(true);
    try {
      const response = await uploadAdminBookEpub(Number(epubBookId), epubFile);
      setEpubMessage(`${response.fileName} 업로드 완료 (EPUB version ${response.epubVersion})`);
      setEpubFile(null);
      setIsEpubConfirmOpen(false);
    } catch (error) {
      setEpubError(getApiErrorMessage(error));
    } finally {
      setIsUploadingEpub(false);
    }
  }

  const temps = tempPage?.content ?? [];
  const totalPages = Math.max(tempPage?.totalPages ?? 1, 1);
  const selectableItems = temps
    .filter((item) => (tempStatus === 'PENDING' && item.statusCd === 0)
      || (tempStatus === 'READY' && item.statusCd === 1))
    .slice(0, 30);
  const allSelectableSelected = selectableItems.length > 0
    && selectableItems.every((item) => selectedTempIds.has(item.tempId));

  return (
    <section className={`page-section ${styles.page}`} aria-labelledby="isbn-temp-title">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>External Books</span><h1 id="isbn-temp-title">외부 도서 등록</h1><p>ISBN 수집, 외부 정보 보강, 승인, EPUB 등록을 한 화면에서 처리합니다.</p></div>
        <Link className="button button-secondary" to="/admin/books">도서 목록</Link>
      </header>

      <section className={styles.panel} aria-labelledby="lookup-title">
        <div className={styles.panelHeader}><div><h2 id="lookup-title">ISBN13 단건 조회</h2><p>외부 정보를 먼저 확인한 뒤 temp에 저장합니다.</p></div></div>
        <div className={styles.inlineForm}>
          <label>ISBN13<input value={isbnInput} onChange={(event) => { setIsbnInput(event.target.value); setPreview(null); setLookupMessage(''); setLookupError(''); }} inputMode="numeric" placeholder="9791193000861" /></label>
          <Button type="button" onClick={handleLookup} disabled={isLookingUp || isFetchingTemp}>{isLookingUp ? '조회 중' : '외부 정보 조회'}</Button>
          <Button type="button" variant="secondary" onClick={handleFetchTemp} disabled={isLookingUp || isFetchingTemp}>{isFetchingTemp ? '저장 중' : 'temp 저장'}</Button>
        </div>
        {lookupError ? <p className={styles.error} role="alert">{lookupError}</p> : null}
        {lookupMessage ? <p className={styles.success} role="status" aria-live="polite">{lookupMessage}</p> : null}
        {preview ? (
          <article className={styles.preview} aria-label="외부 도서 미리보기">
            {preview.coverImageUrl ? <img src={preview.coverImageUrl} alt={`${preview.title ?? preview.isbn13} 표지`} /> : <div className={styles.coverPlaceholder}>표지 없음</div>}
            <div className={styles.previewBody}>
              <div><span className={styles.isbn}>{preview.isbn13}</span><h3>{preview.title || '제목 없음'}</h3><p>{preview.author || '저자 없음'} · {preview.publisher || '출판사 없음'}</p></div>
              <dl className={styles.metadata}><div><dt>출간일</dt><dd>{preview.pubDate || '-'}</dd></div><div><dt>알라딘 분류</dt><dd>{preview.aladinCategoryName || preview.aladinCategoryId || '-'}</dd></div><div><dt>중복 상태</dt><dd>{preview.duplicate?.status || '-'}</dd></div></dl>
              <p>{preview.description || '책 소개가 없습니다.'}</p>
              <div className={styles.providerGrid}><span>정보나루: {preview.providers?.infonaru || '-'}</span><span>네이버: {preview.providers?.naver || '-'}</span><span>알라딘: {preview.providers?.aladin || '-'}</span></div>
              {preview.duplicate?.existingBookId ? <Link to={`/admin/books/${preview.duplicate.existingBookId}/edit`}>기존 도서 B-{preview.duplicate.existingBookId} 보기</Link> : null}
              {preview.duplicate?.candidates?.length ? <div className={styles.warningList}><strong>중복 후보</strong>{preview.duplicate.candidates.map((candidate) => <span key={candidate.bookId}>B-{candidate.bookId} {candidate.title} ({candidate.status})</span>)}</div> : null}
              {preview.warnings?.length ? <ul className={styles.warningList}>{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
            </div>
          </article>
        ) : null}
      </section>

      <div className={styles.twoColumns}>
        <section className={styles.panel} aria-labelledby="seed-title">
          <div className={styles.panelHeader}><div><h2 id="seed-title">ISBN 후보 수집</h2><p>정보나루에서 PENDING 후보를 수집합니다.</p></div></div>
          <form className={styles.formGrid} onSubmit={handleSeed}>
            <label className={styles.wide}>검색어<input name="keyword" required placeholder="인공지능" /></label>
            <label>목표 건수<input name="targetCount" type="number" min="1" defaultValue="10" required /></label>
            <label>페이지 크기<input name="pageSize" type="number" min="1" max="100" defaultValue="20" required /></label>
            <label>최대 페이지<input name="maxPages" type="number" min="1" defaultValue="5" required /></label>
            <Button type="submit" disabled={isSeeding}>{isSeeding ? '수집 중' : '후보 수집'}</Button>
          </form>
          {seedResult ? <div className={styles.resultBox} role="status" aria-live="polite"><strong>{seedResult.collectedCount}건 수집 / {seedResult.pagesFetched}페이지 조회</strong><span>{seedResult.collectedIsbns.length ? seedResult.collectedIsbns.join(', ') : '새로 저장된 ISBN 없음'}</span></div> : null}
        </section>
        <section className={styles.panel} aria-labelledby="enrich-title">
          <div className={styles.panelHeader}><div><h2 id="enrich-title">외부 정보 보강</h2><p>PENDING 후보를 조회해 READY로 전환합니다.</p></div></div>
          <form className={styles.inlineForm} onSubmit={handleEnrich}><label>처리 건수<input name="limit" type="number" min="1" defaultValue="10" required /></label><Button type="submit" disabled={isEnriching || isDeleting}>{isEnriching ? '보강 중' : '정보 보강'}</Button></form>
          {enrichResult ? <div className={styles.resultBox} role="status" aria-live="polite"><strong>{enrichResult.attemptedCount}건 시도 / {enrichResult.readyCount}건 READY</strong>{enrichResult.failedIsbns.length ? <span>실패: {enrichResult.failedIsbns.join(', ')}</span> : <span>실패 없음</span>}</div> : null}
        </section>
      </div>
      {operationError ? <p className={styles.error} role="alert">{operationError}</p> : null}

      <section className={styles.panel} aria-labelledby="temp-list-title">
        <div className={styles.panelHeader}>
          <div><h2 id="temp-list-title">temp 후보 목록</h2><p>READY 항목은 단건 또는 선택 일괄 승인할 수 있습니다.</p></div>
          <div className={styles.listActions}>
            <label>상태<select ref={listStatusRef} value={tempStatus} onChange={(event) => { setTempStatus(event.target.value as BookIsbnTempStatus); setPage(0); }}>{statusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label>페이지 크기<select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label>
            <Button type="button" variant="secondary" onClick={refreshTemps} disabled={isListLoading}>새로고침</Button>
            {tempStatus === 'READY' ? <Button type="button" onClick={prepareBulkApprove} disabled={selectedTempIds.size === 0 || isListLoading}>선택 {selectedTempIds.size}건 승인</Button> : null}
            {tempStatus === 'PENDING' ? <Button type="button" variant="danger" onClick={prepareBulkDelete} disabled={selectedTempIds.size === 0 || isListLoading || isDeleting || isEnriching}>선택 {selectedTempIds.size}건 삭제</Button> : null}
          </div>
        </div>
        {listError ? <p className={styles.error} role="alert">{listError}</p> : null}
        {approveResult ? <p className={styles.success} role="status">B-{approveResult.bookId} 생성 완료. <Link to={`/admin/books/${approveResult.bookId}/edit`}>도서 수정/EPUB 등록</Link></p> : null}
        {deleteError ? <p className={styles.error} role="alert">{deleteError}</p> : null}
        {deleteResult ? <div className={styles.resultBox} role="status" aria-live="polite"><strong>{deleteResult.deletedCount}건 삭제 완료</strong><span>삭제 ID: {deleteResult.deletedTempIds.join(', ')}</span><span>현재 temp 후보만 삭제되며 같은 ISBN은 seed/fetch/enrich로 다시 수집될 수 있습니다.</span></div> : null}
        {bulkResult ? <div className={styles.resultBox} role="status" aria-live="polite"><strong>{bulkResult.approvedCount}건 승인 완료</strong><div className={styles.linkList}>{bulkResult.approvedBookIds.map((bookId) => <Link to={`/admin/books/${bookId}/edit`} key={bookId}>B-{bookId}</Link>)}</div>{bulkResult.failures.length ? <ul>{bulkResult.failures.map((failure) => <li key={`${failure.isbn13}-${failure.reason}`}>{failure.isbn13}: {failure.reason}</li>)}</ul> : <span>실패 없음</span>}</div> : null}
        <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th><input type="checkbox" aria-label={`현재 페이지 ${tempStatus} 최대 30건 선택`} checked={allSelectableSelected} onChange={toggleAllSelectable} disabled={selectableItems.length === 0} /></th><th>temp</th><th>표지</th><th>도서</th><th>ISBN13</th><th>외부 분류</th><th>상태</th><th>갱신</th><th>관리</th></tr></thead>
          <tbody>{isListLoading ? <tr><td colSpan={9}>목록을 불러오는 중입니다.</td></tr> : temps.length === 0 ? <tr><td colSpan={9}>표시할 후보가 없습니다.</td></tr> : temps.map((item) => <tr key={item.tempId}>
            <td><input type="checkbox" aria-label={`T-${item.tempId} 선택`} checked={selectedTempIds.has(item.tempId)} onChange={() => toggleTemp(item.tempId)} disabled={!((tempStatus === 'PENDING' && item.statusCd === 0) || (tempStatus === 'READY' && item.statusCd === 1))} /></td><td>T-{item.tempId}</td><td>{item.coverImageUrl ? <img className={styles.tableCover} src={item.coverImageUrl} alt="" /> : '-'}</td><td><strong>{item.bookTitle || '-'}</strong><small>{item.author || '-'} · {item.publisher || '-'}</small></td><td>{item.isbn13}</td><td>{item.aladinCategoryName || item.aladinCategoryId || '-'}</td><td><span className={`${styles.statusBadge} ${styles[`status${item.statusCd}`]}`}>{statusLabel(item.statusCd)}</span></td><td>{formatDate(item.updatedAt)}</td><td><Button type="button" variant="secondary" onClick={() => openApprove(item)} disabled={item.statusCd !== 1}>단건 승인</Button></td>
          </tr>)}</tbody>
        </table></div>
        <div className={styles.pagination}><Button type="button" variant="secondary" onClick={() => setPage((current) => current - 1)} disabled={page <= 0 || isListLoading}>이전</Button><span>{page + 1} / {totalPages} 페이지 · 총 {tempPage?.totalElements ?? 0}건</span><Button type="button" variant="secondary" onClick={() => setPage((current) => current + 1)} disabled={page + 1 >= totalPages || isListLoading}>다음</Button></div>
      </section>

      <section className={styles.panel} aria-labelledby="epub-direct-title">
        <div className={styles.panelHeader}><div><h2 id="epub-direct-title">EPUB 직접 등록</h2><p>승인으로 생성된 bookId에 EPUB 본문을 등록합니다.</p></div></div>
        <p className={styles.dangerNotice}>기존 EPUB을 교체하면 해당 도서 사용자의 읽기 진행률이 초기화되고 기존 북마크가 삭제됩니다.</p>
        <div className={styles.inlineForm}><label>bookId<input value={epubBookId} onChange={(event) => setEpubBookId(event.target.value)} inputMode="numeric" placeholder="1671" /></label><label>EPUB 파일<input ref={epubFileInputRef} key={epubFile?.name ?? 'empty-epub'} type="file" accept=".epub,application/epub+zip" onChange={(event) => { setEpubFile(event.target.files?.[0] ?? null); setEpubError(''); setEpubMessage(''); }} /></label><Button type="button" onClick={prepareEpubUpload} disabled={isUploadingEpub || !epubFile}>{isUploadingEpub ? '업로드 중' : 'EPUB 업로드'}</Button></div>
        {epubFile ? <p className={styles.fileInfo}>{epubFile.name} · {(epubFile.size / 1024 / 1024).toFixed(1)}MB</p> : null}
        {epubError ? <p className={styles.error} role="alert">{epubError}</p> : null}{epubMessage ? <p className={styles.success} role="status" aria-live="polite">{epubMessage}</p> : null}
      </section>

      {approveCandidate ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => { if (!isApproving) setApproveCandidate(null); }}><div ref={approveDialog.dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="approve-title" aria-busy={isApproving} onKeyDown={approveDialog.handleKeyDown} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.panelHeader}><div><h2 id="approve-title">T-{approveCandidate.tempId} 단건 승인</h2><p>승인 내용을 확인하면 실제 도서가 생성됩니다.</p></div></div>
        <form className={styles.formGrid} onSubmit={handleApprove}><label className={styles.wide}>제목<input name="title" required defaultValue={approveCandidate.bookTitle ?? ''} /></label><label className={styles.wide}>출판사<input name="publisherName" required defaultValue={approveCandidate.publisher ?? ''} /></label><label className={styles.wide}>저자(쉼표 구분)<input name="authors" required defaultValue={approveCandidate.author ?? ''} /></label><label className={styles.wide}>카테고리 ID(쉼표 구분, 선택하지 않으면 빈 배열)<input name="categoryIds" placeholder="1, 3" /></label><label>대여 유형<select name="rentalType" defaultValue="FREE"><option value="FREE">무료</option><option value="PAID">유료</option></select></label><label>대여 가격<input name="rentalPrice" type="number" min="0" defaultValue="0" /></label><label>상태<select name="status" defaultValue="AVAILABLE"><option value="AVAILABLE">AVAILABLE</option><option value="HIDDEN">HIDDEN</option><option value="INACTIVE">INACTIVE</option></select></label><label className={styles.wide}>책 소개<textarea name="description" defaultValue={preview?.isbn13 === approveCandidate.isbn13 ? preview.description : ''} /></label>{approveError ? <p className={`${styles.error} ${styles.wide}`} role="alert">{approveError}</p> : null}<div className={`${styles.modalActions} ${styles.wide}`}><Button type="button" variant="secondary" onClick={() => setApproveCandidate(null)} disabled={isApproving}>취소</Button><Button type="submit" disabled={isApproving}>{isApproving ? '승인 중' : '도서 생성 승인'}</Button></div></form>
      </div></div> : null}

      {isBulkConfirmOpen ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => { if (!isBulkApproving) closeBulkDialog(); }}><div ref={bulkDialog.dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="bulk-title" aria-busy={isBulkApproving} onKeyDown={bulkDialog.handleKeyDown} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.panelHeader}><div><h2 id="bulk-title">선택 {bulkTempIds.length}건 일괄 승인</h2><p>dialog를 연 시점에 고정된 선택 {bulkTempIds.length}건을 모두 승인 시도합니다.</p></div></div>
        <form className={styles.formGrid} onSubmit={handleBulkApprove}><label>대여 유형<select name="rentalType" defaultValue="FREE"><option value="FREE">무료</option><option value="PAID">유료</option></select></label><label>대여 가격<input name="rentalPrice" type="number" min="0" defaultValue="0" /></label><label>상태<select name="status" defaultValue="AVAILABLE"><option value="AVAILABLE">AVAILABLE</option><option value="HIDDEN">HIDDEN</option><option value="INACTIVE">INACTIVE</option></select></label><p className={`${styles.dangerNotice} ${styles.wide}`}>승인 후 temp 상태가 MERGED로 바뀌며 실제 도서가 생성됩니다. 선택 ID: {bulkTempIds.join(', ')}</p>{bulkError ? <p className={`${styles.error} ${styles.wide}`} role="alert">{bulkError}</p> : null}<div className={`${styles.modalActions} ${styles.wide}`}><Button type="button" variant="secondary" onClick={closeBulkDialog} disabled={isBulkApproving}>취소</Button><Button type="submit" disabled={isBulkApproving || bulkTempIds.length === 0}>{isBulkApproving ? '승인 중' : `선택 ${bulkTempIds.length}건 모두 승인`}</Button></div></form>
      </div></div> : null}

      {isDeleteConfirmOpen ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => { if (!isDeleting) closeDeleteDialog(); }}><div ref={deleteDialog.dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" aria-busy={isDeleting} onKeyDown={deleteDialog.handleKeyDown} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.panelHeader}><div><h2 id="delete-title">선택 {deleteTempIds.length}건 삭제</h2><p id="delete-description">dialog를 연 시점에 선택한 PENDING 후보를 모두 삭제합니다.</p></div></div>
        <p className={styles.dangerNotice}>삭제한 현재 temp 후보는 복구할 수 없습니다. 다만 같은 ISBN은 이후 seed/fetch/enrich 실행으로 다시 수집될 수 있습니다.</p>
        <p>삭제 ID: {deleteTempIds.join(', ')}</p>
        {deleteError ? <p className={styles.error} role="alert">{deleteError}</p> : null}
        <div className={styles.modalActions}><Button type="button" variant="secondary" onClick={closeDeleteDialog} disabled={isDeleting}>취소</Button><Button type="button" variant="danger" onClick={handleBulkDelete} disabled={isDeleting || deleteTempIds.length === 0}>{isDeleting ? '삭제 중' : `선택 ${deleteTempIds.length}건 삭제`}</Button></div>
      </div></div> : null}

      {isEpubConfirmOpen ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => { if (!isUploadingEpub) setIsEpubConfirmOpen(false); }}><div ref={epubDialog.dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="epub-title" aria-describedby="epub-description" aria-busy={isUploadingEpub} onKeyDown={epubDialog.handleKeyDown} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.panelHeader}><div><h2 id="epub-title">EPUB 업로드 확인</h2><p id="epub-description">B-{epubBookId}에 {epubFile?.name} 파일을 등록합니다.</p></div></div><p className={styles.dangerNotice}>기존 콘텐츠가 있으면 사용자 읽기 진행률이 초기화되고 기존 북마크가 삭제됩니다.</p>{epubError ? <p className={styles.error} role="alert">{epubError}</p> : null}<div className={styles.modalActions}><Button type="button" variant="secondary" onClick={() => setIsEpubConfirmOpen(false)} disabled={isUploadingEpub}>취소</Button><Button type="button" variant="danger" onClick={handleEpubUpload} disabled={isUploadingEpub}>{isUploadingEpub ? '업로드 중' : '영향을 확인하고 업로드'}</Button></div>
      </div></div> : null}
    </section>
  );
}
