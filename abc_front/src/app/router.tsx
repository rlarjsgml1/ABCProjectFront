import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { UserLayout } from '../components/layout/UserLayout';
import { MyPageProfileLayout } from '../components/mypage/MyPageProfileLayout';

function lazyNamed<T extends ComponentType<object>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  });
}

function page(element: ReactNode) {
  return <Suspense fallback={<div className="page-section">불러오는 중입니다...</div>}>{element}</Suspense>;
}

const AdminDashboardPage = lazyNamed(() => import('../pages/admin/A001Dashboard/AdminDashboardPage'), 'AdminDashboardPage');
const AdminMemberListPage = lazyNamed(() => import('../pages/admin/A002Members/AdminMemberListPage'), 'AdminMemberListPage');
const AdminMemberDetailPage = lazyNamed(() => import('../pages/admin/A003MemberDetail/AdminMemberDetailPage'), 'AdminMemberDetailPage');
const AdminBookListPage = lazyNamed(() => import('../pages/admin/A004Books/AdminBookListPage'), 'AdminBookListPage');
const AdminBookCreatePage = lazyNamed(() => import('../pages/admin/A005BookCreate/AdminBookCreatePage'), 'AdminBookCreatePage');
const AdminBookEditPage = lazyNamed(() => import('../pages/admin/A006BookEdit/AdminBookEditPage'), 'AdminBookEditPage');
const AdminCategoryPage = lazyNamed(() => import('../pages/admin/A007Categories/AdminCategoryPage'), 'AdminCategoryPage');
const AdminRentalListPage = lazyNamed(() => import('../pages/admin/A008Rentals/AdminRentalListPage'), 'AdminRentalListPage');
const AdminPaymentListPage = lazyNamed(() => import('../pages/admin/A009Payments/AdminPaymentListPage'), 'AdminPaymentListPage');
const AdminReportListPage = lazyNamed(() => import('../pages/admin/A010Reports/AdminReportListPage'), 'AdminReportListPage');
const AdminBookRequestPage = lazyNamed(() => import('../pages/admin/A011BookRequests/AdminBookRequestPage'), 'AdminBookRequestPage');
const AdminNoticePage = lazyNamed(() => import('../pages/admin/A012Notices/AdminNoticePage'), 'AdminNoticePage');
const AdminCouponsPointsPage = lazyNamed(() => import('../pages/admin/A013CouponsPoints/AdminCouponsPointsPage'), 'AdminCouponsPointsPage');
const AdminChallengePage = lazyNamed(() => import('../pages/admin/A014Challenges/AdminChallengePage'), 'AdminChallengePage');
const AdminLibraryPage = lazyNamed(() => import('../pages/admin/A015Libraries/AdminLibraryPage'), 'AdminLibraryPage');
const AdminStatisticsPage = lazyNamed(() => import('../pages/admin/A016Statistics/AdminStatisticsPage'), 'AdminStatisticsPage');
const AdminAuditLogPage = lazyNamed(() => import('../pages/admin/A017AuditLogs/AdminAuditLogPage'), 'AdminAuditLogPage');
const AdminCollectionPage = lazyNamed(() => import('../pages/admin/A018Collections/AdminCollectionPage'), 'AdminCollectionPage');
const AdminSettingsPage = lazyNamed(() => import('../pages/admin/AdminSettings/AdminSettingsPage'), 'AdminSettingsPage');
const BookDetailPage = lazyNamed(() => import('../pages/user/U008BookDetail/BookDetailPage'), 'BookDetailPage');
const BooksPage = lazyNamed(() => import('../pages/user/U006Books/BooksPage'), 'BooksPage');
const HomePage = lazyNamed(() => import('../pages/user/U001Home/HomePage'), 'HomePage');
const LoginPage = lazyNamed(() => import('../pages/user/U003Login/LoginPage'), 'LoginPage');
const MyPage = lazyNamed(() => import('../pages/user/U014MyPage/MyPage'), 'MyPage');
const AttendancePage = lazyNamed(() => import('../pages/user/U016Attendance/AttendancePage'), 'AttendancePage');
const PointsCouponsPage = lazyNamed(() => import('../pages/user/U017PointsCoupons/PointsCouponsPage'), 'PointsCouponsPage');
const ProfileEditPage = lazyNamed(() => import('../pages/user/U015ProfileEdit/ProfileEditPage'), 'ProfileEditPage');
const ReadingStatsPage = lazyNamed(() => import('../pages/user/U026ReadingStats/ReadingStatsPage'), 'ReadingStatsPage');
const SearchResultsPage = lazyNamed(() => import('../pages/user/U007SearchResults/SearchResultsPage'), 'SearchResultsPage');
const SignupPage = lazyNamed(() => import('../pages/user/U002Signup/SignupPage'), 'SignupPage');
const FindIdPage = lazyNamed(() => import('../pages/user/U004FindId/FindIdPage'), 'FindIdPage');
const FavoritesPage = lazyNamed(() => import('../pages/user/U012Favorites/FavoritesPage'), 'FavoritesPage');
const RecentBooksPage = lazyNamed(() => import('../pages/user/U028RecentBooks/RecentBooksPage'), 'RecentBooksPage');
const PaymentsPage = lazyNamed(() => import('../pages/user/U018Payments/PaymentsPage'), 'PaymentsPage');
const ReportsPage = lazyNamed(() => import('../pages/user/U021Reports/ReportsPage'), 'ReportsPage');
const BookRequestPage = lazyNamed(() => import('../pages/user/U022BookRequest/BookRequestPage'), 'BookRequestPage');
const BookRequestHistoryPage = lazyNamed(() => import('../pages/user/U023BookRequestHistory/BookRequestHistoryPage'), 'BookRequestHistoryPage');
const MyRentalsPage = lazyNamed(() => import('../pages/user/U010MyRentals/MyRentalsPage'), 'MyRentalsPage');
const ViewerPage = lazyNamed(() => import('../pages/user/U011Viewer/ViewerPage'), 'ViewerPage');
const RentPaymentPage = lazyNamed(() => import('../pages/user/U009RentPayment/RentPaymentPage'), 'RentPaymentPage');
const PaymentCompletePage = lazyNamed(() => import('../pages/user/U030PaymentComplete/PaymentCompletePage'), 'PaymentCompletePage');
const ChallengesPage = lazyNamed(() => import('../pages/user/U027Challenges/ChallengesPage'), 'ChallengesPage');
const NoticeListPage = lazyNamed(() => import('../pages/user/U029Notices/NoticeListPage'), 'NoticeListPage');
const NoticeDetailPage = lazyNamed(() => import('../pages/user/U029Notices/NoticeDetailPage'), 'NoticeDetailPage');
const NotificationsPage = lazyNamed(() => import('../pages/user/U019Notifications/NotificationsPage'), 'NotificationsPage');
const EventPage = lazyNamed(() => import('../pages/user/U020Event/EventPage'), 'EventPage');

export const router = createBrowserRouter([
  {
    element: <UserLayout />,
    children: [
      { path: '/', element: page(<HomePage />) },
      { path: '/events', element: page(<EventPage />) },
      { path: '/books', element: page(<BooksPage />) },
      { path: '/search', element: page(<SearchResultsPage />) },
      { path: '/notices', element: page(<NoticeListPage />) },
      { path: '/notices/:noticeId', element: page(<NoticeDetailPage />) },
      { path: '/books/:bookId', element: page(<BookDetailPage />) },
      {
        path: '/books/:bookId/rent',
        element: (
          <ProtectedRoute>
            {page(<RentPaymentPage />)}
          </ProtectedRoute>
        ),
      },
      {
        path: '/books/:bookId/rent/complete',
        element: (
          <ProtectedRoute>
            {page(<PaymentCompletePage />)}
          </ProtectedRoute>
        ),
      },
      { path: '/login', element: page(<LoginPage />) },
      { path: '/signup', element: page(<SignupPage />) },
      { path: '/find-id', element: page(<FindIdPage />) },
      {
        path: '/me',
        element: <MyPageProfileLayout />,
        children: [
          { index: true, element: page(<MyPage />) },
          { path: 'notifications', element: page(<NotificationsPage />) },
          { path: 'profile', element: page(<ProfileEditPage />) },
          { path: 'attendance', element: page(<AttendancePage />) },
          { path: 'challenges', element: page(<ChallengesPage />) },
          { path: 'points-coupons', element: page(<PointsCouponsPage />) },
          { path: 'statistics', element: page(<ReadingStatsPage />) },
          { path: 'favorites', element: page(<FavoritesPage />) },
          { path: 'recent-books', element: page(<RecentBooksPage />) },
          { path: 'payments', element: page(<PaymentsPage />) },
          { path: 'reports', element: page(<ReportsPage />) },
          { path: 'book-requests', element: page(<BookRequestPage />) },
          { path: 'book-requests/history', element: page(<BookRequestHistoryPage />) },
          { path: 'rentals', element: page(<MyRentalsPage />) },
        ],
      },
    ],
  },
  {
    path: '/rentals/:rentalId/read',
    element: (
      <ProtectedRoute>
        {page(<ViewerPage />)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: page(<AdminDashboardPage />) },
      { path: 'members', element: page(<AdminMemberListPage />) },
      { path: 'members/:memberId', element: page(<AdminMemberDetailPage />) },
      { path: 'books', element: page(<AdminBookListPage />) },
      { path: 'books/new', element: page(<AdminBookCreatePage />) },
      { path: 'books/:bookId/edit', element: page(<AdminBookEditPage />) },
      { path: 'categories', element: page(<AdminCategoryPage />) },
      { path: 'rentals', element: page(<AdminRentalListPage />) },
      { path: 'payments', element: page(<AdminPaymentListPage />) },
      { path: 'reports', element: page(<AdminReportListPage />) },
      { path: 'book-requests', element: page(<AdminBookRequestPage />) },
      { path: 'notices', element: page(<AdminNoticePage />) },
      { path: 'coupons-points', element: page(<AdminCouponsPointsPage />) },
      { path: 'challenges', element: page(<AdminChallengePage />) },
      { path: 'libraries', element: page(<AdminLibraryPage />) },
      { path: 'statistics', element: page(<AdminStatisticsPage />) },
      { path: 'audit-logs', element: page(<AdminAuditLogPage />) },
      { path: 'collections', element: page(<AdminCollectionPage />) },
      { path: 'settings', element: page(<AdminSettingsPage />) },
    ],
  },
]);
