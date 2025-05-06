import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Alert, Pagination, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEdit, FaTrash, FaUndo, FaPaperPlane } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API_URL_ARTICLE = 'http://localhost:8000/article/api/v1/Article';
const API_URL_ARTICLE_FILTER = `${API_URL_ARTICLE}/filter`;
const API_URL_ARTICLE_ADMIN = `${API_URL_ARTICLE}/admin`;
const API_URL_ARTICLE_EDITOR = `${API_URL_ARTICLE}/editor`;
const API_URL_UPDATE_STATUS = `${API_URL_ARTICLE}/update-status`; // Thêm endpoint mới
const API_URL_UPLOAD = 'http://localhost:8000/article/api/v1/Upload/images';
const API_URL_CATEGORY_FILTER = 'http://localhost:8000/article/api/v1/Category/filter';
const API_BASE_URL = 'http://localhost:8000';

const PostHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('DRAFT');
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    content: '',
    isShowAuthor: true,
    categoryId: '',
  });
  const [previewImage, setPreviewImage] = useState(null);

  const token = localStorage.getItem('token') || '';
  const currentUserAccountId = user?.userDetails?.userAccountId || localStorage.getItem('userAccountId') || '';

  const checkToken = () => {
    if (!token || !currentUserAccountId) {
      setError('Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 2000);
      return false;
    }
    return true;
  };

  const fetchCategories = async () => {
    if (!checkToken()) return;
    try {
      const response = await axios.get(API_URL_CATEGORY_FILTER, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          pageNumber: 1,
          pageSize: 100,
        },
      });

      if (response.data.statusCode === 200 && response.data.data) {
        setCategories(response.data.data.items || []);
      } else {
        throw new Error(response.data.message || 'Không thể lấy danh sách danh mục.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy danh sách danh mục: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchPosts = async (page = 1) => {
    if (!checkToken()) return;
    try {
      setLoading(true);
      setError('');
      const url = `${API_URL_ARTICLE_FILTER}?pageNumber=${page}&pageSize=${pageSize}&userAccountId=${currentUserAccountId}&status=${statusFilter}&sortBy=publishedAt&sortOrder=desc`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.statusCode === 200 && response.data.data) {
        if (!response.data.data.items || response.data.data.items.length === 0) {
          setError('Danh sách bài viết rỗng.');
          setPosts([]);
          return;
        }
        const filteredPosts = response.data.data.items.filter((post) => {
          if (!post.id || typeof post.id !== 'string') {
            console.warn('Bài viết không có ID hợp lệ:', post);
            return false;
          }
          if (!post.userDetails?.userAccountId) {
            console.warn('Bài viết không có userAccountId:', post);
            return false;
          }
          return post.userDetails.userAccountId === currentUserAccountId;
        });
        console.log('Danh sách bài viết:', filteredPosts);
        setPosts(filteredPosts);
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
    fetchCategories();
    fetchPosts(currentPage);
  }, [currentPage, statusFilter, currentUserAccountId]);

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
          fetchPosts(currentPage);
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
      const response = await axios.put(
        `${API_URL_UPDATE_STATUS}/${postId}`, // Sử dụng endpoint mới
        { status: newStatus }, // Payload chỉ chứa status
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.statusCode === 200) {
        setSuccess(`Đã cập nhật trạng thái bài viết thành ${newStatus === 'PENDING' ? 'Chờ duyệt' : newStatus}!`);
        setPosts(posts.map((post) => (post.id === postId ? { ...post, status: newStatus } : post)));
        fetchPosts(currentPage);
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

  const handleShowModal = async (post) => {
    if (!checkToken()) return;
    console.log('ID bài viết được chọn:', post.id);
    if (!post?.id || typeof post.id !== 'string') {
      setError('Không thể chỉnh sửa bài viết: ID không hợp lệ.');
      return;
    }

    if (user.roleId === 2 && !['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) {
      setError('Bạn chỉ có thể chỉnh sửa bài ở trạng thái Bản nháp, Chờ duyệt hoặc Bị từ chối.');
      return;
    }

    try {
      const response = await axios.get(`${API_URL_ARTICLE}/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.statusCode === 200 && response.data.data) {
        const postData = response.data.data;
        if (!postData.id) {
          setError('Dữ liệu bài viết không hợp lệ: Thiếu ID.');
          return;
        }

        if (!postData.category?.id) {
          setError('Dữ liệu bài viết không hợp lệ: Thiếu categoryId.');
          return;
        }

        console.log('Dữ liệu bài viết lấy từ API:', postData);
        setSelectedPost(postData);
        setFormData({
          title: postData.title || '',
          thumbnail: postData.thumbnail || '',
          content: postData.content || '',
          isShowAuthor: postData.isShowAuthor || true,
          categoryId: postData.category.id,
        });
        setPreviewImage(postData.thumbnail ? `${API_BASE_URL}${postData.thumbnail}` : null);
        setShowModal(true);
      } else {
        setError('Không thể lấy thông tin bài viết để chỉnh sửa.');
      }
    } catch (err) {
      setError(`Có lỗi xảy ra khi lấy thông tin bài viết: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setFormData({
      title: '',
      thumbnail: '',
      content: '',
      isShowAuthor: true,
      categoryId: '',
    });
    setPreviewImage(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('Vui lòng chọn một file hình ảnh!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn! Vui lòng chọn file dưới 5MB.');
      return;
    }

    setLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('files', file);
      const response = await axios.post(API_URL_UPLOAD, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const fileNames = response.data?.data;
      if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
        throw new Error('API không trả về mảng fileNames hợp lệ.');
      }
      const relativeImageUrl = fileNames[0].startsWith('/article/uploads/')
        ? fileNames[0]
        : `/article/uploads/${fileNames[0]}`;
      setFormData((prev) => ({ ...prev, thumbnail: relativeImageUrl }));
      setPreviewImage(`${API_BASE_URL}${relativeImageUrl}`);
      setError('');
    } catch (error) {
      setError('Tải lên hình ảnh thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!token || !selectedPost?.id) {
      setError('Vui lòng đăng nhập lại hoặc kiểm tra ID bài viết.');
      setLoading(false);
      return;
    }

    if (typeof selectedPost.id !== 'string' || selectedPost.id.trim() === '') {
      setError('ID bài viết không hợp lệ.');
      setLoading(false);
      return;
    }

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(selectedPost.id)) {
      setError('ID bài viết không đúng định dạng UUID.');
      setLoading(false);
      return;
    }

    if (!formData.title || !formData.content) {
      setError('Vui lòng nhập tiêu đề và nội dung!');
      setLoading(false);
      return;
    }

    if (!formData.categoryId || !uuidRegex.test(formData.categoryId) || !categories.some(cat => cat.id === formData.categoryId)) {
      setError('Danh mục không hợp lệ. Vui lòng chọn danh mục từ danh sách.');
      setLoading(false);
      return;
    }

    if (selectedPost.userDetails?.userAccountId !== currentUserAccountId) {
      setError('Bạn chỉ có thể chỉnh sửa bài viết của chính mình.');
      setLoading(false);
      return;
    }
    if (user.roleId === 2 && !['DRAFT', 'PENDING', 'REJECTED'].includes(selectedPost.status)) {
      setError('Bạn chỉ có thể chỉnh sửa bài viết với trạng thái Bản nháp, Chờ duyệt hoặc Bị từ chối.');
      setLoading(false);
      return;
    }

    try {
      const articleData = {
        id: selectedPost.id,
        title: formData.title,
        thumbnail: formData.thumbnail || '',
        content: formData.content,
        isShowAuthor: formData.isShowAuthor,
        categoryId: formData.categoryId,
      };

      console.log('ID bài viết gửi đi:', selectedPost.id);
      console.log('Dữ liệu gửi đi:', articleData);

      const response = await axios.put(`${API_URL_ARTICLE_EDITOR}/${selectedPost.id}`, articleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === 200) {
        setSuccess('Đã cập nhật bài viết thành công!');
        fetchPosts(currentPage);
        handleCloseModal();
      } else {
        setError(`Cập nhật thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Lỗi chi tiết:', error.response?.data);
      setError(`Cập nhật thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
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

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="mt-4 flex-grow-1">
        <h2>Quản lý tin đăng</h2>

        <Form.Group controlId="statusFilter" className="mb-3">
          <Form.Label>Lọc theo trạng thái</Form.Label>
          <Form.Control
            as="select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
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
                      {(user.roleId === 1 || ['DRAFT', 'PENDING', 'REJECTED'].includes(post.status)) && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(post)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Button>
                          {post.status === 'DRAFT' && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handleUpdateStatus(post.id, 'PENDING')}
                              title="Gửi duyệt"
                            >
                              <FaPaperPlane />
                            </Button>
                          )}
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

        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Chỉnh sửa Bài Viết</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            {loading && <div className="text-center">Đang xử lý...</div>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Tiêu đề</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề bài viết"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thumbnail</Form.Label>
                <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                {previewImage && (
                  <div className="mt-3">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="max-w-full max-h-48 object-contain"
                      onError={(e) => { e.target.src = '/path/to/fallback-image.jpg'; }}
                    />
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nội dung</Form.Label>
                <ReactQuill
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  theme="snow"
                  className="h-96 mb-12"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hiển thị tác giả</Form.Label>
                <Form.Check
                  type="checkbox"
                  name="isShowAuthor"
                  checked={formData.isShowAuthor}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Chọn danh mục</Form.Label>
                <Form.Control
                  as="select"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.topic.name})
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                  Đóng
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default PostHistory;