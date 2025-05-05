import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Pagination, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEdit, FaTrash, FaUndo } from 'react-icons/fa';

const API_URL_ARTICLE = 'http://localhost:8000/article/api/v1/Article';
const API_URL_ARTICLE_FILTER = `${API_URL_ARTICLE}/filter`;
const API_URL_ARTICLE_ADMIN = `${API_URL_ARTICLE}/admin`;
const API_URL_ARTICLE_EDITOR = `${API_URL_ARTICLE}/editor`;

const PostHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const token = localStorage.getItem('token') || '';
  const userAccountId = user?.userDetails?.userAccountId || localStorage.getItem('userAccountId') || '';

  const checkToken = () => {
    if (!token || !userAccountId) {
      setError('Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  };

  const fetchPosts = async (page = 1) => {
    if (!checkToken()) return;
    try {
      setLoading(true);
      setError('');
      const url = `${API_URL_ARTICLE_FILTER}?pageNumber=${page}&pageSize=${pageSize}&userAccountId=${userAccountId}&status=${statusFilter}&sortBy=publishedat&sortOrder=desc`;
      console.log('Fetching posts from:', url);
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('API Response:', response.data);
      if (response.data.statusCode === 200 && response.data.data) {
        setPosts(response.data.data.items || []);
        setTotalPages(response.data.data.totalPages || 1);
        setTotalCount(response.data.data.totalCount || 0);
        setCurrentPage(response.data.data.pageNumber || 1);
      } else {
        throw new Error(response.data.message || 'Không thể lấy danh sách bài viết.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy danh sách bài viết: ' + (err.response?.data?.message || err.message));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage, statusFilter, userAccountId]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDeletePost = async (id) => {
    if (!checkToken()) return;
    const post = posts.find((p) => p.id === id);
    if (!post) {
      setError('Bài viết không tồn tại.');
      return;
    }

    // Editor chỉ có thể xóa bài DRAFT, PENDING, REJECTED
    if (user.roleId === 2 && !['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) {
      setError('Bạn chỉ có thể xóa bài ở trạng thái Bản nháp, Chờ duyệt hoặc Bị từ chối.');
      return;
    }

    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        const response = await axios.delete(`${API_URL_ARTICLE}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.statusCode === 200) {
          setPosts(posts.filter((post) => post.id !== id));
          setSuccess('Đã xóa bài viết thành công.');
          fetchPosts(currentPage); // Gọi lại để cập nhật danh sách
        } else {
          setError(`Xóa bài viết thất bại: ${response.data.message || 'Lỗi không xác định'}`);
        }
      } catch (err) {
        setError(`Có lỗi xảy ra khi xóa bài viết: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleUpdateStatus = async (postId, newStatus) => {
    if (!checkToken()) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) {
      setError('Bài viết không tồn tại.');
      return;
    }

    // Editor chỉ có thể thay đổi trạng thái DRAFT, PENDING, REJECTED thành DRAFT hoặc PENDING
    if (user.roleId === 2) {
      if (!['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) {
        setError('Bạn chỉ có thể cập nhật trạng thái của bài Bản nháp, Chờ duyệt hoặc Bị từ chối.');
        return;
      }
      if (!['DRAFT', 'PENDING'].includes(newStatus)) {
        setError('Bạn chỉ có thể chuyển trạng thái thành Bản nháp hoặc Chờ duyệt.');
        return;
      }
    }

    try {
      const apiUrl = user.roleId === 1 ? API_URL_ARTICLE_ADMIN : API_URL_ARTICLE_EDITOR;
      const response = await axios.put(
        `${apiUrl}/${postId}`,
        { status: newStatus }, // Chỉ gửi trường status để tránh lỗi API
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.statusCode === 200) {
        setSuccess(`Đã cập nhật trạng thái bài viết thành ${newStatus}!`);
        setPosts(posts.map((post) => (post.id === postId ? { ...post, status: newStatus } : post)));
        fetchPosts(currentPage); // Gọi lại để đảm bảo dữ liệu đồng bộ
      } else {
        setError(`Cập nhật trạng thái thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      setError(`Cập nhật trạng thái thất bại: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleViewPost = (post) => {
    if (!post?.id) {
      setError('Không thể xem bài viết: ID không hợp lệ.');
      return;
    }
    navigate(`/news/${post.id}`, { state: { article: post, articleId: post.id } });
  };

  const handleEditPost = (post) => {
    if (!post?.id) {
      setError('Không thể chỉnh sửa bài viết: ID không hợp lệ.');
      return;
    }
    // Editor chỉ có thể chỉnh sửa bài DRAFT, PENDING, REJECTED
    if (user.roleId === 2 && !['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) {
      setError('Bạn chỉ có thể chỉnh sửa bài ở trạng thái Bản nháp, Chờ duyệt hoặc Bị từ chối.');
      return;
    }
    navigate(`/edit-post/${post.id}`, { state: { post } });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="badge bg-success">Đã xuất bản</span>;
      case 'DRAFT':
        return <span className="badge bg-warning text-dark">Bản nháp</span>;
      case 'PENDING':
        return <span className="badge bg-info">Chờ duyệt</span>;
      case 'HIDDEN':
        return <span className="badge bg-secondary">Đã ẩn</span>;
      case 'REJECTED':
        return <span className="badge bg-danger">Bị từ chối</span>;
      default:
        return <span className="badge bg-secondary">Không xác định</span>;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="mt-4 flex-grow-1">
        <h2>Lịch Sử Đăng Tin</h2>

        <Form.Group controlId="statusFilter" className="mb-3">
          <Form.Label>Lọc theo trạng thái</Form.Label>
          <Form.Control
            as="select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
            }}
          >
            <option value="">Tất cả</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="PUBLISHED">Đã xuất bản</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="HIDDEN">Đã ẩn</option>
          </Form.Control>
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {loading ? (
          <Alert variant="info">Đang tải dữ liệu...</Alert>
        ) : posts.length === 0 ? (
          <Alert variant="info">Bạn chưa có bài viết nào.</Alert>
        ) : (
          <>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày xuất bản</th>
                  <th>Ngày cập nhật</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{post.title || 'Không có tiêu đề'}</td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td>{formatDateTime(post.createAt)}</td>
                    <td>{formatDateTime(post.publishedAt)}</td>
                    <td>{formatDateTime(post.updateAt)}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewPost(post)}
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </Button>
                      {(user?.roleId === 1 || ['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditPost(post)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Button>
                          {post.status === 'PENDING' && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleUpdateStatus(post.id, 'DRAFT')}
                              title="Thu hồi"
                            >
                              <FaUndo />
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDeletePost(post.id)}
                            title="Xóa"
                          >
                            <FaTrash />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>Tổng số bài viết: {totalCount}</div>
              <Pagination>
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {[...Array(totalPages).keys()].map((page) => (
                  <Pagination.Item
                    key={page + 1}
                    active={page + 1 === currentPage}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {page + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default PostHistory;