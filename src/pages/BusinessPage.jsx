import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import '../assets/css/BusinessPage.css';

const API_URL_ARTICLE_FILTER = 'http://localhost:8000/article/api/v1/Article/filter';
const API_URL_CATEGORY_FILTER = 'http://localhost:8000/article/api/v1/Category/filter';

const BusinessPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topicId = '806ab3d3-ff3a-4242-b6c1-2562626dc599';
  const token = localStorage.getItem('token') || '';

  const fetchCategories = async () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(API_URL_CATEGORY_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 15,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Phản hồi danh mục:', response.data);

      const categoryData = response.data?.data?.items || [];
      const formattedCategories = categoryData
        .filter((cat) => cat.topic.id === topicId)
        .map((cat) => ({
          name: cat.name.toLowerCase().replace(/\s+/g, '-'),
          label: cat.name,
          categoryId: cat.id,
        }));

      setCategories(formattedCategories);

      if (formattedCategories.length > 0 && !activeTab) {
        setActiveTab(formattedCategories[0].name);
      } else if (formattedCategories.length === 0) {
        setError('Không có danh mục nào cho chủ đề này.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      if (error.response?.status === 404) {
        setError('Endpoint không tồn tại hoặc server không hoạt động. Vui lòng kiểm tra URL API: ' + API_URL_CATEGORY_FILTER);
      } else {
        setError('Lấy danh sách danh mục thất bại: ' + errorMessage);
      }
      console.error('Lỗi khi lấy danh mục:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find((cat) => cat.name === activeTab);
      if (!selectedCategory || !selectedCategory.categoryId) {
        setArticles([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(API_URL_ARTICLE_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 10,
          topicId: topicId,
          categoryId: selectedCategory.categoryId,
          sortBy: 'createAt',
          sortOrder: 'desc',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Phản hồi bài viết:', response.data);

      const articleData = response.data?.data?.items || [];
      const formattedArticles = articleData.map((item) => ({
        id: item.id,
        category: activeTab,
        image: item.thumbnail,
        title: item.title,
        summary: item.content.replace(/<[^>]+>/g, '').slice(0, 100),
        content: item.content,
        images: [],
        video: null,
        comments: [],
      }));

      setArticles(formattedArticles);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      if (error.response?.status === 404) {
        setError('Endpoint không tồn tại hoặc server không hoạt động. Vui lòng kiểm tra URL API: ' + API_URL_ARTICLE_FILTER);
      } else {
        setError('Lấy danh sách bài viết thất bại: ' + errorMessage);
      }
      console.error('Lỗi khi lấy bài viết:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    const interval = setInterval(() => {
      fetchCategories();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab && categories.length > 0) {
      fetchArticles();
    }
  }, [activeTab, categories]);

  const handleViewDetail = (article) => {
    navigate(`/news/${article.id}`);
  };

  const filteredArticles = articles;

  return (
    <ErrorBoundary>
      <Container fluid className="p-0">
        <Header />
        <Container className="my-5">
          <h2 className="mb-4">Kinh doanh</h2>

          <div className="category-tabs mb-4">
            <Row>
              <Col>
                {categories.map((category) => (
                  <span
                    key={category.name}
                    className={`category-tab ${activeTab === category.name ? 'active' : ''}`}
                    onClick={() => setActiveTab(category.name)}
                  >
                    {category.label}
                  </span>
                ))}
              </Col>
            </Row>
          </div>

          {error && (
            <Row>
              <Col>
                <p className="text-center text-danger">{error}</p>
              </Col>
            </Row>
          )}
          {loading && (
            <Row>
              <Col>
                <p className="text-center">Đang tải...</p>
              </Col>
            </Row>
          )}

          {!loading && !error && filteredArticles.length > 0 ? (
            <Row className="mb-5">
              <Col md={6}>
                <Card
                  className="border-0 main-article position-relative"
                  onClick={() => handleViewDetail(filteredArticles[0])}
                >
                  <Card.Img
                    variant="top"
                    src={filteredArticles[0].image}
                    style={{ height: '400px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                    }}
                  />
                  <div className="gradient-overlay"></div>
                  <Card.Body className="position-absolute bottom-0 p-4 text-white">
                    <Card.Title className="fs-2 fw-bold">{filteredArticles[0].title}</Card.Title>
                    <Card.Text className="text-light">{filteredArticles[0].summary}...</Card.Text>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-chat-left-text me-1"></i>
                      <span>{filteredArticles[0].comments.length}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                {filteredArticles.slice(1, 3).map((article, index) => (
                  <Card
                    key={index}
                    className="border-0 sub-article mb-3"
                    onClick={() => handleViewDetail(article)}
                  >
                    <Row>
                      <Col md={4}>
                        <Card.Img
                          variant="top"
                          src={article.image}
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
          ) : (
            !loading &&
            !error && (
              <Row>
                <Col>
                  <p className="text-center text-muted">Không có bài viết nào trong danh mục này.</p>
                </Col>
              </Row>
            )
          )}

          {!loading && !error && filteredArticles.length > 3 && (
            <Row>
              {filteredArticles.slice(3).map((article, index) => (
                <Col md={4} key={index} className="mb-4">
                  <Card
                    className="border-0 news-card shadow-sm"
                    onClick={() => handleViewDetail(article)}
                  >
                    <Card.Img
                      variant="top"
                      src={article.image}
                      style={{ height: '180px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                      }}
                    />
                    <Card.Body className="p-3">
                      <Card.Title className="fs-6 fw-bold">{article.title}</Card.Title>
                      <Card.Text className="text-muted small">{article.summary}...</Card.Text>
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
        </Container>
        <Footer />
      </Container>
    </ErrorBoundary>
  );
};

export default BusinessPage;