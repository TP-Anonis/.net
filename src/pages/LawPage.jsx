import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Container, Row, Col, Button } from 'react-bootstrap';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_FILTER = `${API_BASE_URL}/article/api/v1/Article/filter`;
const API_URL_CATEGORY_FILTER = `${API_BASE_URL}/article/api/v1/Category/filter`;

const ITEMS_PER_PAGE = 9;

const LawPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const topicId = '6117641c-b824-4b91-b0a3-e9e48f1fce8f'; // topicId cho Pháp luật
  const token = localStorage.getItem('token') || '';

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_CATEGORY_FILTER, {
        params: { pageNumber: 1, pageSize: 15 },
        ...config,
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
      if (error.response?.status === 404) console.error('Endpoint không tồn tại hoặc server không hoạt động. Vui lòng kiểm tra URL API: ' + API_URL_CATEGORY_FILTER);
      else if (error.response?.status === 401 || error.response?.status === 403) console.log('Không thể lấy danh sách danh mục: Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      else console.error('Lỗi khi lấy danh mục:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const selectedCategory = categories.find((cat) => cat.name === activeTab);
      if (!selectedCategory || !selectedCategory.categoryId) {
        setArticles([]);
        setLoading(false);
        return;
      }
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_ARTICLE_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 10,
          topicId,
          categoryId: selectedCategory.categoryId,
          status: 'PUBLISHED',
          sortBy: 'publishedat',
          sortOrder: 'desc',
        },
        ...config,
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
      if (error.response?.status === 404) console.error('Endpoint không tồn tại hoặc server không hoạt động. Vui lòng kiểm tra URL API: ' + API_URL_ARTICLE_FILTER);
      else if (error.response?.status === 401 || error.response?.status === 403) console.log('Không thể lấy danh sách bài viết: Người dùng chưa đăng nhập hoặc token không hợp lệ.');
      else console.error('Lỗi khi lấy bài viết:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    const interval = setInterval(() => fetchCategories(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab && categories.length > 0) {
      setCurrentPage(1);
      fetchArticles();
    }
  }, [activeTab, categories]);

  const handleViewDetail = (article) => {
    navigate(`/news/${article.id}`);
  };

  const getAbsoluteThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return 'https://placehold.co/400x300?text=Image+Not+Found';
    return thumbnail.startsWith('/article/uploads/')
      ? `${API_BASE_URL}${thumbnail}`
      : `${API_BASE_URL}/article/uploads/${thumbnail}`;
  };

  const totalPages = Math.ceil((articles.length - 3) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 3;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedArticles = articles.slice(3, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      <Container fluid className="p-0">
        <Header />
        <Container className="my-5">
          <h2 className="mb-4">Pháp luật</h2>
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
          {loading && (
            <Row>
              <Col>
                <p className="text-center">Đang tải...</p>
              </Col>
            </Row>
          )}
          {!loading && articles.length > 0 ? (
            <>
              <Row className="mb-5">
                <Col md={6}>
                  <Card
                    className="border-0 main-article position-relative"
                    onClick={() => handleViewDetail(articles[0])}
                  >
                    <Card.Img
                      variant="top"
                      src={getAbsoluteThumbnailUrl(articles[0].image)}
                      style={{ height: '400px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found'; }}
                    />
                    <div className="gradient-overlay"></div>
                    <Card.Body className="position-absolute bottom-0 p-4 text-white">
                      <Card.Title className="fs-2 fw-bold">{articles[0].title}</Card.Title>
                      <Card.Text className="text-light">{articles[0].summary}...</Card.Text>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-chat-left-text me-1"></i>
                        <span>{articles[0].comments.length}</span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  {articles.slice(1, 3).map((article, index) => (
                    <Card
                      key={index}
                      className="border-0 sub-article mb-3"
                      onClick={() => handleViewDetail(article)}
                    >
                      <Row>
                        <Col md={4}>
                          <Card.Img
                            variant="top"
                            src={getAbsoluteThumbnailUrl(article.image)}
                            style={{ height: '100px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found'; }}
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
              {articles.length > 3 && (
                <Row>
                  {paginatedArticles.map((article, index) => (
                    <Col md={4} key={index} className="mb-4">
                      <Card
                        className="border-0 news-card shadow-sm"
                        onClick={() => handleViewDetail(article)}
                      >
                        <Card.Img
                          variant="top"
                          src={getAbsoluteThumbnailUrl(article.image)}
                          style={{ height: '180px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found'; }}
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
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    variant="outline-primary"
                    className="mx-1"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index + 1}
                      variant={currentPage === index + 1 ? 'primary' : 'outline-primary'}
                      className="mx-1"
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline-primary"
                    className="mx-1"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Tiếp
                  </Button>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <Row>
                <Col>
                  <p className="text-center text-muted">Không có bài viết nào trong danh mục này.</p>
                </Col>
              </Row>
            )
          )}
        </Container>
        <Footer />
      </Container>
    </ErrorBoundary>
  );
};

export default LawPage;