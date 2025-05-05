import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_STORAGE = `${API_BASE_URL}/article/api/v1/ArticleStorage`;
const API_URL_ARTICLE_DETAIL = `${API_BASE_URL}/article/api/v1/Article`;

const SavedArticlesPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useContext(AuthContext);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (!isLoggedIn || !token) {
        setError('Vui lòng đăng nhập để xem bài viết đã lưu.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(API_URL_ARTICLE_STORAGE, {
          headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
          params: { pageNumber: 1, pageSize: 10 },
        });

        if (response.data.statusCode === 200) {
          const items = response.data.data.items || [];
          if (items.length > 0) {
            const articlesWithDetails = await Promise.all(
              items.map(async (item) => {
                const articleDetailResponse = await axios.get(`${API_URL_ARTICLE_DETAIL}/${item.article.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const articleDetail = articleDetailResponse.data.data;
                return {
                  id: item.article.id,
                  title: item.article.title || 'Tiêu đề không có',
                  thumbnail: item.article.thumbnail || '',
                  createAt: item.article.createAt || new Date().toISOString(),
                  categoryName: articleDetail.category?.name || 'Chưa phân loại',
                  author: articleDetail.userDetails?.fullName || 'Chưa xác định',
                  isSaved: true,
                };
              })
            );
            setSavedArticles(articlesWithDetails);
          } else {
            setError('Không có bài viết nào trong danh sách.');
          }
        } else {
          setError('Không thể lấy danh sách bài viết: ' + (response.data.message || 'Lỗi không xác định'));
        }
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        if (error.response) {
          if (error.response.status === 401) {
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          } else if (error.response.status === 403) {
            setError('Bạn không có quyền truy cập danh sách bài viết.');
          } else {
            setError(
              `Lỗi khi lấy danh sách bài viết (Mã ${error.response.status}): ${
                error.response.data?.message || error.message
              }`
            );
          }
        } else {
          setError('Lỗi kết nối: Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSavedArticles();
  }, [token, navigate, isLoggedIn]);

  const handleUnsaveArticle = async (articleId) => {
    if (!isLoggedIn || !token) {
      setError('Vui lòng đăng nhập để hủy lưu bài viết.');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL_ARTICLE_STORAGE}/${articleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === 200) {
        setSavedArticles(savedArticles.filter((article) => article.id !== articleId));
        setError('');
      } else if (response.data.statusCode === 404) {
        setError('Bài viết không tồn tại trong danh sách lưu trữ.');
      } else {
        setError('Hủy lưu bài viết thất bại: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Lỗi khi hủy lưu bài viết:', error.response || error.message);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError(
            `Hủy lưu bài viết thất bại (Mã ${error.response.status}): ${
              error.response.data?.message || error.message
            }`
          );
        }
      } else {
        setError('Lỗi kết nối: Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
      }
    }
  };

  const handleViewArticle = (articleId) => {
    navigate(`/news/${articleId}`);
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
        <p>Đang tải...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Header />
      <Container className="my-5">
        <h2 className="mb-4">Bài viết đã lưu</h2>
        {savedArticles.length === 0 ? (
          <p className="text-center text-muted">Bạn chưa lưu bài viết nào.</p>
        ) : (
          <Row>
            {savedArticles.map((article) => (
              <Col md={4} key={article.id} className="mb-4">
                <Card onClick={() => handleViewArticle(article.id)} style={{ cursor: 'pointer' }}>
                  <Card.Img
                    variant="top"
                    src={article.thumbnail ? `${API_BASE_URL}${article.thumbnail}` : 'https://placehold.co/400x300?text=Image+Not+Found'}
                    alt={article.title}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found'; }}
                  />
                  <Card.Body>
                    <Card.Title>{article.title}</Card.Title>
                    <Card.Text className="text-muted">
                      Đăng ngày: {new Date(article.createAt).toLocaleString()}
                    </Card.Text>
                    <Card.Text className="text-muted">
                      <strong>Tên danh mục:</strong> {article.categoryName}
                    </Card.Text>
                    <Card.Text className="text-muted">
                      <strong>Tác giả:</strong> {article.author}
                    </Card.Text>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsaveArticle(article.id);
                      }}
                    >
                      Hủy lưu
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
      <Footer />
    </Container>
  );
};

export default SavedArticlesPage;