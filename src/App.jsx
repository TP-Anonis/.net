import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import NewsDetailPage from './components/NewsDetailPage';
import HomePage from './pages/HomePage';
import WorldPage from './pages/WorldPage';
import 'bootstrap-icons/font/bootstrap-icons.css';
import BusinessPage from './pages/BusinessPage';
import { SportsPage } from './pages/SportsPage';
import HealthPage from './pages/HealthPage';
import EntertainmentPage from './pages/EntertainmentPage';
import UserProfile from './components/UserProfile';
import MatchSchedulePage from './pages/MatchSchedulePage';
import PostManagement from './components/PostManagement';
import WritePost from './components/WritePost';
import AccountManagement from './components/AccountManagement';
import SearchResultsPage from './components/SearchResultsPage';
import EditorArticles from './components/EditorArticles';
import ContentManagement from './components/ContentManagement';
import OverviewStats from './components/OverviewStats';
import ArticleStats from './components/ArticleStats';
import AdStats from './components/AdStats';
import AdBannerManagement from './components/AdBannerManagement';
import SavedArticlesPage from './components/SavedArticlesPage';
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
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/health/:id" element={<NewsDetailPage />} />
          <Route path="/giai-tri/:id" element={<NewsDetailPage />} />
          <Route path="/the-thao/:id" element={<NewsDetailPage />} />
          <Route path="/kinh-doanh/:id" element={<NewsDetailPage />} />
          <Route path="/match-schedule" element={<MatchSchedulePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/post-management" element={<PostManagement />} />
          <Route path="/write-post" element={<WritePost />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/account-management" element={<AccountManagement />} />
          <Route path="/editor/:editorId/articles" element={<EditorArticles />} />
          <Route path="/content-management" element={<ContentManagement />} />
          <Route path="/overview-stats" element={<OverviewStats />} />
          <Route path="/article-stats" element={<ArticleStats />} />
          <Route path="/ad-stats" element={<AdStats />} />
          <Route path="/ad-banner-management" element={<AdBannerManagement />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/saved-articles" element={<SavedArticlesPage />} />
          {/* Route động cho tất cả các chủ đề */}
          <Route
            path="/:topicRoute"
            element={<DynamicTopicPage topicMapping={topicMapping} />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

const DynamicTopicPage = ({ topicMapping }) => {
  const { topicRoute } = useParams();

  if (topicMapping[topicRoute]) {
    const TopicComponent = topicMapping[topicRoute];
    return <TopicComponent />;
  }

  return (
    <div>
      <h1>Chủ đề: {topicRoute.replace(/-/g, ' ').toUpperCase()}</h1>
      <p>Đây là trang cho chủ đề {topicRoute}. Bạn có thể thêm nội dung ở đây.</p>
    </div>
  );
};

export default App;