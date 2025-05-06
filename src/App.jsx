import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NewsDetailPage from './components/NewsDetailPage';
import HomePage from './pages/HomePage';
import WorldPage from './pages/WorldPage';
import BusinessPage from './pages/BusinessPage';
import SportsPage from './pages/SportsPage';
import HealthPage from './pages/HealthPage';
import EntertainmentPage from './pages/EntertainmentPage';
import RealEstatePage from './pages/RealEstatePage'; // Import mới
import LawPage from './pages/LawPage'; // Import mới
import UserProfile from './components/UserProfile';
import MatchSchedulePage from './pages/MatchSchedulePage';
import PostManagement from './components/PostManagement';
import WritePost from './components/WritePost';
import AccountManagement from './components/AccountManagement';
import SearchResultsPage from './components/SearchResultsPage';
import EditorArticles from './components/EditorArticles';
import ContentManagement from './components/ContentManagement';
import ComprehensiveStatistics from './components/ComprehensiveStatistics';
import PostHistory from './components/PostHistory';
import AdStats from './components/AdStats';
import AdBannerManagement from './components/AdBannerManagement';
import SavedArticlesPage from './components/SavedArticlesPage';
import CategoryFilter from './components/CategoryFilter';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Ánh xạ giữa route và component
const topicMapping = {
  'the-thao': SportsPage,
  'the-gioi': WorldPage,
  'kinh-doanh': BusinessPage,
  'suc-khoe': HealthPage,
  'giai-tri': EntertainmentPage,
  'bat-dong-san': RealEstatePage, // Thêm route cho Bất động sản
  'phap-luat': LawPage, // Thêm route cho Pháp luật
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Các route công khai - Không yêu cầu đăng nhập hoặc vai trò cụ thể */}
          <Route path="/" element={<HomePage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/health/:id" element={<NewsDetailPage />} />
          <Route path="/giai-tri/:id" element={<NewsDetailPage />} />
          <Route path="/the-thao/:id" element={<NewsDetailPage />} />
          <Route path="/kinh-doanh/:id" element={<NewsDetailPage />} />
          <Route path="/bat-dong-san/:id" element={<NewsDetailPage />} /> {/* Thêm route chi tiết cho Bất động sản */}
          <Route path="/phap-luat/:id" element={<NewsDetailPage />} /> {/* Thêm route chi tiết cho Pháp luật */}
          <Route path="/match-schedule" element={<MatchSchedulePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/editor/:editorId/articles" element={<EditorArticles />} />
          <Route path="/category-filter" element={<CategoryFilter />} />

          {/* Route động cho các chủ đề từ topicMapping */}
          {Object.keys(topicMapping).map((path) => (
            <Route
              key={path}
              path={`/${path}`}
              element={React.createElement(topicMapping[path])}
            />
          ))}

          {/* Độc giả (roleId === 1), Biên tập viên (roleId === 2), Quản trị viên (roleId === 3) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={[1, 2, 3]}>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-articles"
            element={
              <ProtectedRoute allowedRoles={[1, 2, 3]}>
                <SavedArticlesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-history"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <PostHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/write-post"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <WritePost />
              </ProtectedRoute>
            }
          />
          {/* Chỉ Quản trị viên (roleId === 3) */}
          <Route
            path="/post-management"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <PostManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-management"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <AccountManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/content-management"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <ContentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comprehensive-stats"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <ComprehensiveStatistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad-stats"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <AdStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ad-banner-management"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <AdBannerManagement />
              </ProtectedRoute>
            }
          />

          {/* Route catch-all để xử lý mọi URL không hợp lệ và chuyển về / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;