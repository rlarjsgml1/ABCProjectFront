// 내 프로필 정보를 조회하고 하위 컴포넌트에 공유하는 Context/Provider
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getApiErrorMessage, getMyProfile } from '../api/profileApi';
import type { UserProfile } from '../types/api';

type MyProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  errorMessage: string;
  refetchProfile: () => void;
};

const MyProfileContext = createContext<MyProfileContextValue | null>(null);

export function MyProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setIsLoading(true);

      try {
        const data = await getMyProfile();
        if (!ignore) {
          setProfile(data);
          setErrorMessage('');
        }
      } catch (error) {
        if (!ignore) {
          setProfile(null);
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [reloadToken]);

  function refetchProfile() {
    setReloadToken((token) => token + 1);
  }

  return (
    <MyProfileContext.Provider value={{ profile, isLoading, errorMessage, refetchProfile }}>
      {children}
    </MyProfileContext.Provider>
  );
}

export function useMyProfile() {
  const context = useContext(MyProfileContext);

  if (!context) {
    throw new Error('useMyProfile must be used within a MyProfileProvider');
  }

  return context;
}
