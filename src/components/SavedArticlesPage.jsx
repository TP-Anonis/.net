import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_STORAGE = `${API_BASE_URL}/article/api/v1/ArticleStorage`;
const API_URL_ARTICLE_DETAIL = `${API_BASE_URL}/article/api/v1/Article`;

const SavedArticlesPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useContext(AuthContext);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('token') || '';
  const currentUserAccountId = localStorage.getItem('userAccountId') || '';

  // Kiểm tra token hợp lệ
  const checkToken = () => {
    if (!token) {
      setError('Token không tồn tại. Vui lòng đăng nhập lại.');
      navigate('/login');
      return false;
    }
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        setError('Token đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        navigate('/login');
        return false;
      }
      // Đảm bảo currentUserAccountId khớp với token nếu token có userId
      if (decoded.userId && decoded.userId !== currentUserAccountId) {
        setError('Dữ liệu người dùng không khớp. Vui lòng đăng nhập lại.');
        localStorage.removeItem('userAccountId');
        navigate('/login');
        return false;
      }
      return true;
    } catch (e) {
      setError('Token không hợp lệ. Vui lòng đăng nhập lại.');
      console.error('Lỗi giải mã token:', e);
      navigate('/login');
      return false;
    }
  };

  const fetchSavedArticles = async () => {
    if (!isLoggedIn || !checkToken() || !currentUserAccountId) {
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
        if (items.length === 0) {
          setSavedArticles([]);
          setError('Không có bài viết nào trong danh sách.');
          return;
        }

        const articlesWithDetails = await Promise.all(
          items.map(async (item) => {
            try {
              const articleDetailResponse = await axios.get(`${API_URL_ARTICLE_DETAIL}/${item.article.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const articleDetail = articleDetailResponse.data.data;
              return {
                storageId: item.id,
                id: item.article.id,
                title: item.article.title || 'Tiêu đề không có',
                thumbnail: item.article.thumbnail || '',
                createAt: item.article.createAt || new Date().toISOString(),
                categoryName: articleDetail.category?.name || 'Chưa phân loại',
                author: articleDetail.userDetails?.fullName || 'Chưa xác định',
                isSaved: true,
                userAccountId: item.article.userAccountId, // Thêm userAccountId để lọc
              };
            } catch (detailError) {
              if (detailError.response && detailError.response.status === 404) {
                return {
                  storageId: item.id,
                  id: item.article.id,
                  title: item.article.title || 'Tiêu đề không có',
                  thumbnail: item.article.thumbnail || '',
                  createAt: item.article.createAt || new Date().toISOString(),
                  categoryName: 'Chưa phân loại',
                  author: 'Chưa xác định',
                  isSaved: true,
                  userAccountId: item.article.userAccountId, // Thêm userAccountId để lọc
                };
              }
              throw detailError;
            }
          })
        );

        // Lọc bài viết dựa trên userAccountId của người dùng hiện tại
        const filteredArticles = articlesWithDetails.filter(
          (article) => article.userAccountId === currentUserAccountId
        );
        setSavedArticles(filteredArticles);
        if (filteredArticles.length === 0) {
          setError('Không có bài viết nào trong danh sách của bạn.');
        }
      } else {
        setSavedArticles([]);
        setError('Không thể lấy danh sách bài viết: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      setSavedArticles([]);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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

  useEffect(() => {
    fetchSavedArticles();
  }, [token, navigate, isLoggedIn, currentUserAccountId]);

  const handleUnsaveArticle = async (storageId, articleId) => {
    if (!isLoggedIn || !checkToken() || !currentUserAccountId) {
      return;
    }

    setDeletingId(storageId);
    setError('');
    setSuccess('');

    try {
      const updatedArticles = savedArticles.filter((article) => article.storageId !== storageId);
      setSavedArticles([...updatedArticles]);

      const response = await axios.delete(`${API_URL_ARTICLE_STORAGE}/${storageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === 200) {
        setSuccess('Đã hủy lưu bài viết thành công!');
      } else if (response.data.statusCode === 404) {
        setSuccess('Bài viết đã được hủy lưu trước đó.');
      } else {
        setError('Hủy lưu bài viết thất bại: ' + (response.data.message || 'Lỗi không xác định'));
        await fetchSavedArticles();
      }
    } catch (error) {
      setSavedArticles([]);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          navigate('/login');
        } else if (error.response.status === 404) {
          setSuccess('Bài viết đã được hủy lưu trước đó.');
        } else {
          setError(
            `Hủy lưu bài viết thất bại (Mã ${error.response.status}): ${
              error.response.data?.message || error.message
            }`
          );
          await fetchSavedArticles();
        }
      } else {
        setError('Lỗi kết nối: Không thể kết nối đến server. Vui lòng kiểm tra mạng.');
        await fetchSavedArticles();
      }
    } finally {
      setDeletingId(null);
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

  return (
    <Container fluid className="p-0">
      <Header />
      <Container className="my-5">
        <h2 className="mb-4">Bài viết đã lưu</h2>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}
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
                        handleUnsaveArticle(article.storageId, article.id);
                      }}
                      disabled={deletingId === article.storageId}
                    >
                      {deletingId === article.storageId ? <Spinner as="span" animation="border" size="sm" /> : 'Hủy lưu'}
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