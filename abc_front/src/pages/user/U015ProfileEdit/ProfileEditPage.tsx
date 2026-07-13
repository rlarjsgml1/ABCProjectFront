// 프로필 수정 화면(U015) — 회원 기본 정보 수정과 비밀번호 변경을 담당한다.
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeMyPassword, getApiErrorMessage, updateMyProfile } from '../../../api/profileApi';
import { Button } from '../../../components/common/Button';
import { MyPageLayout } from '../../../components/mypage/MyPageLayout';
import { useMyProfile } from '../../../context/MyProfileContext';
import type { UserPasswordChangeRequest, UserProfile, UserProfileUpdateRequest } from '../../../types/api';

const emptyProfile: UserProfile = {
  loginId: '-',
  name: '',
  email: '',
  phone: '',
  gender: '',
  birthDate: '-',
  role: '-',
  status: '-',
};

const initialPasswordForm: UserPasswordChangeRequest = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

// API-ME-002 기준으로 수정 가능한 필드만 검증한다.
function validateProfileForm(form: UserProfileUpdateRequest) {
  if (!form.name.trim()) {
    return '이름을 입력하세요.';
  }

  if (!form.email.trim() || !form.email.includes('@')) {
    return '올바른 이메일을 입력하세요.';
  }

  if (!form.phone.trim()) {
    return '연락처를 입력하세요.';
  }

  if (!form.gender) {
    return '성별을 선택하세요.';
  }

  return '';
}

// API-ME-003은 현재 비밀번호와 새 비밀번호 확인값을 모두 요구한다.
function validatePasswordForm(form: UserPasswordChangeRequest) {
  if (!form.currentPassword || !form.newPassword || !form.newPasswordConfirm) {
    return '현재 비밀번호와 새 비밀번호를 모두 입력하세요.';
  }

  if (form.newPassword.length < 8) {
    return '새 비밀번호는 8자 이상이어야 합니다.';
  }

  if (form.newPassword !== form.newPasswordConfirm) {
    return '새 비밀번호 확인이 일치하지 않습니다.';
  }

  return '';
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { profile, isLoading, refetchProfile } = useMyProfile();
  const [form, setForm] = useState<UserProfileUpdateRequest>({ name: '', email: '', phone: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState<UserPasswordChangeRequest>(initialPasswordForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, email: profile.email, phone: profile.phone, gender: profile.gender });
    }
  }, [profile]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateProfileForm(form);

    if (validationMessage) {
      setProfileError(validationMessage);
      setProfileMessage('');
      return;
    }

    setIsSaving(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const updatedProfile = await updateMyProfile(form);
      setForm({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        gender: updatedProfile.gender,
      });
      refetchProfile();
      setProfileMessage('회원정보가 저장되었습니다.');
    } catch (error) {
      setProfileError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validatePasswordForm(passwordForm);

    if (validationMessage) {
      setPasswordError(validationMessage);
      setPasswordMessage('');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      await changeMyPassword(passwordForm);
      setPasswordForm(initialPasswordForm);
      setPasswordMessage('비밀번호가 변경되었습니다.');
    } catch (error) {
      setPasswordError(getApiErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  }

  const displayProfile = profile ?? emptyProfile;

  return (
    <MyPageLayout titleId="profile-edit-title">
        <section className="page-section profile-edit-form">
          <div className="section-heading-row">
            <div>
              <h2 id="profile-edit-title">프로필 수정</h2>
            </div>
            <Button type="button" variant="secondary" onClick={() => navigate('/me')}>
              내 서재로 이동
            </Button>
          </div>
          <p>수정 가능한 개인정보와 비밀번호를 관리합니다.</p>
        </section>

        <div className="notice-panel" role="note">
          아이디, 생년월일, 권한, 상태는 수정할 수 없습니다. 이름, 이메일, 연락처, 성별만 변경됩니다.
        </div>

        <form className="page-section profile-edit-form" onSubmit={handleProfileSubmit}>
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">BASIC INFO</p>
              <h2>기본 정보</h2>
            </div>
          </div>
          <div className="profile-form-grid">
            <label>
              아이디
              <input value={displayProfile.loginId} readOnly />
            </label>
            <label>
              생년월일
              <input value={displayProfile.birthDate} readOnly />
            </label>
            <label>
              이름
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              이메일
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              연락처
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label>
              성별
              <select
                name="gender"
                value={form.gender}
                onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
              >
                <option value="">선택</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
                <option value="OTHER">기타</option>
              </select>
            </label>
          </div>
          {profileError ? <div className="status-banner status-banner-error">{profileError}</div> : null}
          {profileMessage ? <div className="status-banner status-banner-success">{profileMessage}</div> : null}
          <div className="form-action-row">
            <Button type="button" variant="secondary" onClick={() => navigate('/me')}>
              취소
            </Button>
            <Button type="submit" disabled={isSaving || isLoading}>
              {isSaving ? '저장 중' : '저장'}
            </Button>
          </div>
        </form>

        <form className="page-section profile-edit-form" onSubmit={handlePasswordSubmit}>
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">PASSWORD</p>
              <h2>비밀번호 변경</h2>
            </div>
          </div>
          <div className="profile-form-grid">
            <label>
              현재 비밀번호
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
              />
            </label>
            <label>
              새 비밀번호
              <input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                name="newPasswordConfirm"
                type="password"
                value={passwordForm.newPasswordConfirm}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPasswordConfirm: event.target.value }))
                }
              />
            </label>
          </div>
          {passwordError ? <div className="status-banner status-banner-error">{passwordError}</div> : null}
          {passwordMessage ? <div className="status-banner status-banner-success">{passwordMessage}</div> : null}
          <div className="form-action-row">
            <Button type="submit" disabled={isChangingPassword || isLoading}>
              {isChangingPassword ? '변경 중' : '비밀번호 변경'}
            </Button>
          </div>
        </form>

        <section className="page-section withdrawal-panel">
          <p className="eyebrow">WITHDRAWAL</p>
          <h2>회원 탈퇴</h2>
          <p>탈퇴 기능은 안전 확인 절차가 준비된 뒤 활성화됩니다. 현재 화면에서는 신청할 수 없습니다.</p>
          <button className="button button-danger" type="button" disabled aria-disabled="true">
            회원 탈퇴 비활성화
          </button>
        </section>
    </MyPageLayout>
  );
}
