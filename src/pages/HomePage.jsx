import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import '../assets/css/HomePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_TOPIC_FILTER = `${API_BASE_URL}/article/api/v1/Topic/filter`;
const API_URL_ARTICLE_FILTER = `${API_BASE_URL}/article/api/v1/Article/filter`;
const API_URL_CATEGORY_FILTER = `${API_BASE_URL}/article/api/v1/Category/filter`;

const FeaturedNews = ({ articles, onViewDetail }) => {
  if (!articles || articles.length === 0) {
    return <p className="text-center text-muted">Không có bài viết nổi bật nào.</p>;
  }

  const mainArticle = articles[0];
  const subArticles = articles.slice(1, 3);

  return (
    <section className="featured-news my-5">
      <Row>
        <Col md={6}>
          <Card className="border-0 main-article position-relative" onClick={() => onViewDetail(mainArticle)}>
            <Card.Img
              variant="top"
              src={getAbsoluteThumbnailUrl(mainArticle.image)}
              style={{ height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
              }}
            />
            <div className="gradient-overlay"></div>
            <Card.Body className="position-absolute bottom-0 p-4 text-white">
              <Card.Title className="fs-2 fw-bold">{mainArticle.title}</Card.Title>
              <Card.Text className="text-light">{mainArticle.summary.slice(0, 100)}...</Card.Text>
              <div className="d-flex align-items-center">
                <i className="bi bi-chat-left-text me-1"></i>
                <span>{mainArticle.comments.length}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          {subArticles.map((article, index) => (
            <Card key={index} className="border-0 sub-article mb-3" onClick={() => onViewDetail(article)}>
              <Row>
                <Col md={4}>
                  <Card.Img
                    variant="top"
                    src={getAbsoluteThumbnailUrl(article.image)}
                    style={{ height: '100px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                    }}
                  />
                </Col>
                <Col md={8}>
                  <Card.Body className="p-0">
                    <Card.Title className="fs-6 fw-bold">{article.title}</Card.Title>
                    <div className="d-flex align-items-center text-muted">
                      <i className="bi bi-chat-left-text me-1"></i>
                      <span>{article.comments.length}</span>
                    </div>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          ))}
        </Col>
      </Row>
    </section>
  );
};

const NewsCategory = ({ category, articles, onViewDetail }) => (
  <section className="news-category my-5">
    <h3 className="category-title mb-4">{category}</h3>
    {articles.length === 0 ? (
      <p className="text-center text-muted">Không có bài viết nào trong danh mục này.</p>
    ) : (
      <Row>
        {articles.map((article, index) => (
          <Col md={4} key={index} className="mb-4">
            <Card className="border-0 news-card shadow-sm" onClick={() => onViewDetail(article)}>
              <Card.Img
                variant="top"
                src={getAbsoluteThumbnailUrl(article.image)}
                style={{ height: '180px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                }}
              />
              <Card.Body className="p-3">
                <Card.Title className="fs-6 fw-bold">{article.title}</Card.Title>
                <Card.Text className="text-muted small">{article.summary.slice(0, 100)}...</Card.Text>
                <div className="d-flex align-items-center text-muted">
                  <i className="bi bi-chat-left-text me-1"></i>
                  <span>{article.comments.length}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    )}
  </section>
);

const getAbsoluteThumbnailUrl = (thumbnail) => {
  if (!thumbnail) return 'https://placehold.co/400x300?text=Image+Not+Found';
  return thumbnail.startsWith('/article/uploads/')
    ? `${API_BASE_URL}${thumbnail}`
    : `${API_BASE_URL}/article/uploads/${thumbnail}`;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState({});
  const [articles, setArticles] = useState({});
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token') || '';

  const fetchTopics = async () => {
    try {
      setLoading(true);
      // Bỏ qua kiểm tra token, gọi API với hoặc không có token
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_TOPIC_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 5,
          sortByNameAsc: false,
        },
        ...config,
      });

      console.log('Phản hồi chủ đề:', response.data);

      const topicData = response.data?.data?.items || [];
      setTopics(topicData);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      if (error.response?.status === 404) {
        console.error(`Không tìm thấy endpoint. Vui lòng kiểm tra URL API: ${API_URL_TOPIC_FILTER}`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Không thể lấy danh sách chủ đề: Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      } else {
        console.error('Lỗi khi lấy chủ đề:', error.response?.data || error.message);
      }
      // Không hiển thị lỗi hoặc chuyển hướng, chỉ log để debug
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Bỏ qua kiểm tra token, gọi API với hoặc không có token
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_CATEGORY_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 20,
        },
        ...config,
      });

      console.log('Phản hồi danh mục:', response.data);

      const categoryData = response.data?.data?.items || [];
      const categoriesByTopic = {};

      topics.forEach((topic) => {
        const topicCategories = categoryData
          .filter((cat) => cat.topic.id === topic.id)
          .map((cat) => ({
            name: cat.name,
            categoryId: cat.id,
          }));
        categoriesByTopic[topic.name] = topicCategories;
      });

      setCategories(categoriesByTopic);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      if (error.response?.status === 404) {
        console.error(`Không tìm thấy endpoint. Vui lòng kiểm tra URL API: ${API_URL_CATEGORY_FILTER}`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Không thể lấy danh sách danh mục: Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      } else {
        console.error('Lỗi khi lấy danh mục:', error.response?.data || error.message);
      }
      // Không hiển thị lỗi hoặc chuyển hướng, chỉ log để debug
    } finally {
      setLoading(false);
    }
  };

  const fetchArticlesForCategories = async () => {
    setLoading(true);
    try {
      const articlesByTopic = {};
      const allFeaturedArticles = [];

      for (const topic of topics) {
        const topicCategories = categories[topic.name] || [];
        const topicArticles = [];

        for (const category of topicCategories) {
          // Bỏ qua kiểm tra token, gọi API với hoặc không có token
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          const response = await axios.get(API_URL_ARTICLE_FILTER, {
            params: {
              pageNumber: 1,
              pageSize: 3,
              topicId: topic.id,
              categoryId: category.categoryId,
              status: 'PUBLISHED',
              sortBy: 'publishedat',
              sortOrder: 'desc',
            },
            ...config,
          });

          const articleData = response.data?.data?.items || [];
          const formattedArticles = articleData.map((item) => ({
            id: item.id,
            category: category.name,
            image: item.thumbnail,
            title: item.title,
            summary: item.content.replace(/<[^>]+>/g, '').slice(0, 100),
            content: item.content,
            author: item.author || 'Tác giả không xác định',
            images: [],
            video: null,
            comments: [],
          }));

          topicArticles.push(...formattedArticles);

          if (allFeaturedArticles.length < 3 && formattedArticles.length > 0) {
            allFeaturedArticles.push(...formattedArticles.slice(0, 3 - allFeaturedArticles.length));
          }
        }

        articlesByTopic[topic.name] = topicArticles;
      }

      setArticles(articlesByTopic);
      setFeaturedArticles(allFeaturedArticles);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      if (error.response?.status === 404) {
        console.error(`Không tìm thấy endpoint. Vui lòng kiểm tra URL API: ${API_URL_ARTICLE_FILTER}`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Không thể lấy danh sách bài viết: Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      } else {
        console.error('Lỗi khi lấy bài viết:', error.response?.data || error.message);
      }
      // Không hiển thị lỗi hoặc chuyển hướng, chỉ log để debug
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    if (topics.length > 0) {
      fetchCategories();
    }
  }, [topics]);

  useEffect(() => {
    if (Object.keys(categories).length > 0) {
      fetchArticlesForCategories();
    }
  }, [categories]);

  const handleViewDetail = (article) => {
    navigate(`/news/${article.id}`);
  };

  return (
    <ErrorBoundary>
      <Container fluid className="p-0">
        <Header />
        <Container className="my-5">
          <h2 className="mb-4">Trang Chủ</h2>

          {loading && (
            <Row>
              <Col>
                <p className="text-center">Đang tải...</p>
              </Col>
            </Row>
          )}

          {!loading && (
            <>
              <FeaturedNews articles={featuredArticles} onViewDetail={handleViewDetail} />
              {topics.map((topic) => (
                <NewsCategory
                  key={topic.id}
                  category={topic.name}
                  articles={articles[topic.name] || []}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </>
          )}
        </Container>
        <Footer />
      </Container>
    </ErrorBoundary>
  );
};

export default HomePage;