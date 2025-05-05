import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NewsDetailPage from './components/NewsDetailPage';
import HomePage from './pages/HomePage';
import WorldPage from './pages/WorldPage';
import 'bootstrap-icons/font/bootstrap-icons.css';
import BusinessPage from './pages/BusinessPage';
import SportsPage from './pages/SportsPage';
import HealthPage from './pages/HealthPage';
import EntertainmentPage from './pages/EntertainmentPage';
import UserProfile from './components/UserProfile';
import MatchSchedulePage from './pages/MatchSchedulePage';
import PostManagement from '../src/components/PostManagement';
import WritePost from './components/WritePost';
import AccountManagement from './components/AccountManagement';
import SearchResultsPage from './components/SearchResultsPage';
import EditorArticles from './components/EditorArticles';
import ContentManagement from './components/ContentManagement';
import OverviewStats from './components/OverviewStats';
import ArticleStats from './components/ArticleStats';
import PostHistory from './components/PostHistory';
import AdStats from './components/AdStats';
import AdBannerManagement from './components/AdBannerManagement';
import SavedArticlesPage from './components/SavedArticlesPage';
import ProtectedRoute from './components/ProtectedRoute';

// Ánh xạ giữa route và component
const topicMapping = {
  'the-thao': SportsPage,
  'the-gioi': WorldPage,
  'kinh-doanh': BusinessPage,
  'suc-khoe': HealthPage,
  'giai-tri': EntertainmentPage,
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
          <Route path="/match-schedule" element={<MatchSchedulePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/editor/:editorId/articles" element={<EditorArticles />} />

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
            path="/overview-stats"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <OverviewStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/article-stats"
            element={
              <ProtectedRoute allowedRoles={[3]}>
                <ArticleStats />
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