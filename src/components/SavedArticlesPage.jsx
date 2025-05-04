import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL_ARTICLE_STORAGE = 'http://localhost:8000/article/api/v1/ArticleStorage';
const BACKEND_URL = 'http://localhost:8000';

const SavedArticlesPage = () => {
  const navigate = useNavigate();
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const fetchSavedArticles = async () => {
      if (!token) {
        setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        console.log('Token hiện tại:', token);
        const requestHeaders = {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'Content-Type': 'application/json', // Thêm Content-Type để khớp với Postman
        };
        console.log('Request headers:', requestHeaders);

        const response = await axios.get(
          `${API_URL_ARTICLE_STORAGE}`,
          {
            headers: requestHeaders,
            params: {
              pageNumber: 1,
              pageSize: 10,
            },
          }
        );

        console.log('Full response:', response.data);

        if (response.data && response.data.statusCode === 200) {
          const items = response.data.data.items || [];
          console.log('Items từ API:', items);
          if (items.length > 0) {
            setSavedArticles(
              items.map((item) => ({
                id: item.article.id,
                title: item.article.title,
                thumbnail: item.article.thumbnail || '',
                createAt: item.article.createAt,
                category: item.article.categoryId || 'Không có danh mục',
                userAccountEmail: 'Không xác định',
              }))
            );
          } else {
            setError('Không có bài viết nào trong danh sách.');
          }
        } else {
          setError('Không thể lấy danh sách bài viết: ' + (response.data.message || 'Lỗi không xác định'));
        }
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        if (error.response) {
          console.log('Status:', error.response.status);
          console.log('Data:', error.response.data);
          if (error.response.status === 415) {
            setError('Lỗi 415: Server yêu cầu Content-Type: application/json. Đã cập nhật header.');
          } else if (error.response.status === 401) {
            setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            navigate('/login');
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
  }, [token, navigate]);

  const handleViewArticle = (article) => {
    navigate(`/news/${article.id}`, { state: { article, articleId: article.id } });
  };

  const handleUnsaveArticle = async (articleId) => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL_ARTICLE_STORAGE}/${articleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'Content-Type': 'application/json', // Thêm Content-Type cho DELETE
        },
      });

      if (response.data.statusCode === 200) {
        setSavedArticles(savedArticles.filter((article) => article.id !== articleId));
        setError('');
      } else {
        setError('Hủy lưu bài viết thất bại: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Lỗi khi hủy lưu bài viết:', error.response || error.message);
      if (error.response) {
        if (error.response.status === 404) {
          setError('Bài viết không tồn tại trong danh sách lưu trữ.');
          setSavedArticles(savedArticles.filter((article) => article.id !== articleId));
        } else if (error.response.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
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

  if (loading) {
    return (
      <Container>
        <h3 className="my-5 text-center">Đang tải...</h3>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Header />
      <Container className="my-5">
        <h2 className="mb-4">Bài viết đã lưu</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {savedArticles.length === 0 ? (
          <p className="text-center text-muted">Bạn chưa lưu bài viết nào.</p>
        ) : (
          <Row>
            {savedArticles.map((article) => (
              <Col md={4} key={article.id} className="mb-4">
                <Card onClick={() => handleViewArticle(article)} style={{ cursor: 'pointer' }}>
                  <Card.Img
                    variant="top"
                    src={article.thumbnail ? `${BACKEND_URL}${article.thumbnail}` : 'https://placehold.co/400x300?text=Image+Not+Found'}
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
                      Danh mục: {article.category}
                    </Card.Text>
                    <Card.Text className="text-muted">
                      Tác giả: {article.userAccountEmail}
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