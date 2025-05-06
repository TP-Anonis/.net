import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import CategoryFilter from '../components/CategoryFilter';
import '../assets/css/HomePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_TOPIC_FILTER = `${API_BASE_URL}/article/api/v1/Topic/filter`;
const API_URL_ARTICLE_FILTER = `${API_BASE_URL}/article/api/v1/Article/filter`;
const API_URL_CATEGORY_FILTER = `${API_BASE_URL}/article/api/v1/Category/filter`;

const ITEMS_PER_PAGE = 9;

const truncateSummary = (text, length) => {
  if (text.length <= length) return text;
  const sliced = text.slice(0, length);
  return sliced.slice(0, sliced.lastIndexOf(' ')) + '...';
};

const getAbsoluteThumbnailUrl = (thumbnail) => {
  if (!thumbnail) return 'https://placehold.co/400x300?text=Image+Not+Found';
  return thumbnail.startsWith('/article/uploads/')
    ? `${API_BASE_URL}${thumbnail}`
    : `${API_BASE_URL}/article/uploads/${thumbnail}`;
};

const FeaturedNews = ({ articles, onViewDetail }) => {
  if (!articles?.length) {
    return <p className="text-center text-muted">Không có bài viết nổi bật nào.</p>;
  }

  const mainArticle = articles[0] || {};
  const subArticles = articles.slice(1, 3) || [];

  return (
    <section className="featured-news my-5">
      <Row>
        <Col md={6}>
          {mainArticle.title && (
            <Card className="border-0 main-article position-relative" onClick={() => onViewDetail(mainArticle)}>
              <Card.Img
                variant="top"
                src={getAbsoluteThumbnailUrl(mainArticle.image)}
                style={{ height: '400px', objectFit: 'cover' }}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                }}
              />
              <div className="gradient-overlay"></div>
              <Card.Body className="position-absolute bottom-0 p-4 text-white">
                <Card.Title className="fs-2 fw-bold">{mainArticle.title}</Card.Title>
                <Card.Text className="text-light">{truncateSummary(mainArticle.summary, 100)}</Card.Text>
                <div className="d-flex align-items-center">
                  <i className="bi bi-chat-left-text me-1"></i>
                  <span>{mainArticle.comments?.length || 0}</span>
                </div>
              </Card.Body>
            </Card>
          )}
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
                    loading="lazy"
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
                      <span>{article.comments?.length || 0}</span>
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

const NewsCategory = ({ category, articles, onViewDetail }) => {
  const [visibleArticles, setVisibleArticles] = useState(4);
  const loadMore = () => setVisibleArticles((prev) => prev + 4);

  return (
    <section className="news-category my-5">
      <h3 className="category-title mb-4">{category}</h3>
      {articles?.length === 0 ? (
        <p className="text-center text-muted">Không có bài viết nào trong danh mục này.</p>
      ) : (
        <>
          <Row>
            {articles.slice(0, visibleArticles).map((article, index) => (
              <Col md={3} key={index} className="mb-4">
                <Card className="border-0 news-card shadow-sm" onClick={() => onViewDetail(article)}>
                  <Card.Img
                    variant="top"
                    src={getAbsoluteThumbnailUrl(article.image)}
                    style={{ height: '180px', objectFit: 'cover' }}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                    }}
                  />
                  <Card.Body className="p-3">
                    <Card.Title className="fs-6 fw-bold">{article.title}</Card.Title>
                    <Card.Text className="text-muted small">{truncateSummary(article.summary, 100)}</Card.Text>
                    <div className="d-flex align-items-center text-muted">
                      <i className="bi bi-chat-left-text me-1"></i>
                      <span>{article.comments?.length || 0}</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {visibleArticles < articles.length && (
            <div className="text-center">
              <Button variant="outline-primary" onClick={loadMore}>
                Xem thêm
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState({});
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const token = localStorage.getItem('token');

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(API_URL_TOPIC_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 10, // Tăng pageSize để đảm bảo lấy đủ chủ đề (bao gồm Bất động sản và Pháp luật)
          sortByNameAsc: false,
        },
      });
      const topicData = response.data?.data?.items || [];
      console.log('Danh sách chủ đề:', topicData); // Log để kiểm tra dữ liệu
      // Loại bỏ các chủ đề không mong muốn (nếu cần)
      const filteredTopics = topicData.filter(
        (topic) => !['tâm lý', 'chính trị'].includes(topic.name.toLowerCase())
      );
      setTopics(filteredTopics);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi tải chủ đề');
      console.error('Lỗi khi lấy chủ đề:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(API_URL_CATEGORY_FILTER, {
        params: {
          pageNumber: 1,
          pageSize: 20,
        },
      });
      const categoryData = response.data?.data?.items || [];
      console.log('Danh sách danh mục:', categoryData); // Log để kiểm tra dữ liệu
      setCategories(categoryData);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi tải danh mục');
      console.error('Lỗi khi lấy danh mục:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticlesForCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const articlesByTopic = {};
      const allFeaturedArticles = [];
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const promises = topics.flatMap((topic) =>
        categories
          .filter((cat) => cat.topic?.id === topic.id)
          .map((category) =>
            axios
              .get(API_URL_ARTICLE_FILTER, {
                params: {
                  pageNumber: 1,
                  pageSize: 4,
                  topicId: topic.id,
                  categoryId: category.id,
                  status: 'PUBLISHED',
                  sortBy: 'publishedat',
                  sortOrder: 'desc',
                },
                ...config,
              })
              .then((response) => ({ topic, category, data: response.data?.data?.items || [] }))
              .catch((error) => {
                console.error(`Lỗi khi lấy bài viết cho danh mục ${category.name}:`, error.response?.data || error.message);
                return { topic, category, data: [] };
              })
          )
      );

      const results = await Promise.all(promises);

      results.forEach(({ topic, category, data }) => {
        const formattedArticles = data.map((item) => ({
          id: item.id,
          category: category.name,
          image: item.thumbnail,
          title: item.title,
          summary: truncateSummary(item.content.replace(/<[^>]+>/g, ''), 100),
          content: item.content,
          author: item.author || 'Tác giả không xác định',
          images: [],
          video: null,
          comments: item.comments || [],
        }));

        if (!articlesByTopic[topic.name]) {
          articlesByTopic[topic.name] = [];
        }
        articlesByTopic[topic.name].push(...formattedArticles);

        if (allFeaturedArticles.length < 3 && formattedArticles.length > 0) {
          allFeaturedArticles.push(...formattedArticles.slice(0, 3 - allFeaturedArticles.length));
        }
      });

      console.log('Bài viết theo chủ đề:', articlesByTopic); // Log để kiểm tra dữ liệu bài viết
      setArticles(articlesByTopic);
      setFeaturedArticles(allFeaturedArticles);
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi tải bài viết');
      console.error('Lỗi khi lấy bài viết:', error.response?.data || error.message);
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
    if (categories.length > 0) {
      fetchArticlesForCategories();
    }
  }, [categories]);

  useEffect(() => {
    const filterArticles = () => {
      let filtered = Object.values(articles).flat();
      if (selectedCategory) {
        filtered = filtered.filter((article) => article.category === selectedCategory);
      }
      if (searchQuery) {
        filtered = filtered.filter((article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      setFilteredArticles(filtered);
      setCurrentPage(1);
    };
    filterArticles();
  }, [selectedCategory, searchQuery, articles]);

  const handleViewDetail = (article) => {
    if (article?.id) {
      navigate(`/news/${article.id}`);
    }
  };

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <ErrorBoundary>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <Container className="flex-grow-1 my-5">
          <Row className="align-items-center mb-4">
            <Col md={10}>
              <h2 className="mb-0">Trang Chủ</h2>
            </Col>
            <Col md={2} className="text-end">
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </Col>
          </Row>
          <Row className="mb-4">
            <Col>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
              />
            </Col>
          </Row>

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

          {!loading && !error && (
            <>
              {selectedCategory || searchQuery ? (
                filteredArticles.length > 0 ? (
                  <>
                    <Row>
                      {currentArticles.map((article, index) => (
                        <Col md={4} key={index} className="mb-4">
                          <Card className="border-0 news-card shadow-sm" onClick={() => handleViewDetail(article)}>
                            <Card.Img
                              variant="top"
                              src={getAbsoluteThumbnailUrl(article.image)}
                              style={{ height: '180px', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                              }}
                            />
                            <Card.Body className="p-3">
                              <Card.Title className="fs-6 fw-bold">{article.title}</Card.Title>
                              <Card.Text className="text-muted small">{truncateSummary(article.summary, 100)}</Card.Text>
                              <div className="d-flex align-items-center text-muted">
                                <i className="bi bi-chat-left-text me-1"></i>
                                <span>{article.comments?.length || 0}</span>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
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
                  <p className="text-center text-muted">Không có bài viết nào phù hợp.</p>
                )
              ) : (
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
            </>
          )}
        </Container>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;