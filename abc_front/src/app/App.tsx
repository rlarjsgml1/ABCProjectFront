// 앱의 최상위 진입 컴포넌트 — 라우터 설정을 적용해 전체 화면을 렌더링한다
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return <RouterProvider router={router} />;
}
