import React, { useState, useEffect, useContext } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Header from './Header';
import Footer from './Footer';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_URL_ARTICLE = 'http://localhost:8000/article/api/v1/Article';
const API_URL_UPLOAD = 'http://localhost:5288/api/v1/Upload/images';
const API_URL_CATEGORIES = 'http://localhost:5288/api/v1/Category/filter?pageNumber=1&pageSize=50';
const BACKEND_URL = 'http://localhost:5288';

const PostManagement = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    content: '',
    status: 'DRAFT',
    isShowAuthor: true,
    categoryId: '',
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
  });

  const token = localStorage.getItem('token') || '';

  const checkToken = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      return false;
    }
    return true;
  };

  const isAdmin = user?.roleId === 3;
  const isEditor = user?.roleId === 2;

  const fetchPosts = async (page = 1) => {
    if (!checkToken()) return;
    try {
      setIsLoading(true);
      let allPosts = [];
      let currentPageToFetch = page;
      let hasMore = true;

      while (allPosts.length < pageSize && hasMore) {
        const queryParams = new URLSearchParams({
          pageNumber: currentPageToFetch,
          pageSize,
          status: filters.status,
          categoryId: filters.categoryId,
        }).toString();
        const response = await axios.get(`${API_URL_ARTICLE}/filter?${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.statusCode === 200) {
          const fetchedPosts = response.data.data.items || [];
          allPosts = [...allPosts, ...fetchedPosts];
          setTotalPages(response.data.data.totalPages);
          setCurrentPage(page);
          hasMore = currentPageToFetch < response.data.data.totalPages;
          currentPageToFetch += 1;
        } else {
          setError('Không thể lấy danh sách bài viết.');
          setPosts([]);
          break;
        }
      }

      // Cắt danh sách để chỉ hiển thị tối đa 10 bài
      setPosts(allPosts.slice(0, pageSize));
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy danh sách bài viết: ' + (err.response?.data?.message || err.message));
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!checkToken()) return;
    try {
      setLoading(true);
      let allCategories = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${API_URL_CATEGORIES}&pageNumber=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoryList = response.data?.data?.items || [];
        allCategories = [...allCategories, ...categoryList];
        hasMore = page < response.data.data.totalPages;
        page += 1;
      }
      setCategories(allCategories);
      if (allCategories.length === 0) setError('Không có danh mục nào được tìm thấy.');
    } catch (error) {
      setError('Lấy danh mục thất bại: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(currentPage);
    fetchCategories();
  }, [currentPage, filters]);

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

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPost(null);
    setFormData({
      title: '',
      thumbnail: '',
      content: '',
      status: 'DRAFT',
      isShowAuthor: true,
      categoryId: '',
    });
    setPreviewImage(null);
    setError('');
    setSuccess('');
  };

  const handleShowModal = (post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || '',
      thumbnail: post.thumbnail || '',
      content: post.content || '',
      status: post.status || 'DRAFT',
      isShowAuthor: post.isShowAuthor ?? true,
      categoryId: post.category?.id || '',
    });
    setPreviewImage(post.thumbnail ? `${BACKEND_URL}${post.thumbnail}` : null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const uploadImage = async (file) => {
    if (!checkToken()) throw new Error('Token xác thực không tồn tại.');
    if (!file) throw new Error('Không có file hình ảnh được chọn.');
    const formData = new FormData();
    formData.append('files', file);
    try {
      const response = await axios.post(API_URL_UPLOAD, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fileNames = response.data?.data;
      if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0)
        throw new Error('API không trả về danh sách file hợp lệ.');
      return fileNames[0].startsWith('/uploads/') ? fileNames[0] : `/uploads/${fileNames[0]}`;
    } catch (error) {
      throw new Error('Upload hình ảnh thất bại: ' + (error.response?.data?.message || error.message));
    }
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
    setLoading(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, thumbnail: imageUrl }));
      setPreviewImage(`${BACKEND_URL}${imageUrl}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.title || !formData.content) {
      setError('Vui lòng nhập tiêu đề và nội dung!');
      setLoading(false);
      return;
    }
    if (!formData.categoryId) {
      setError('Vui lòng chọn danh mục!');
      setLoading(false);
      return;
    }
    if (!checkToken()) {
      setLoading(false);
      return;
    }

    try {
      const articleData = {
        id: selectedPost?.id,
        title: formData.title,
        thumbnail: formData.thumbnail || '',
        content: formData.content,
        isShowAuthor: formData.isShowAuthor,
        categoryId: formData.categoryId,
        status: formData.status,
        userAccountId: selectedPost?.userAccountId || user?.id,
      };
      const url = `${API_URL_ARTICLE}/admin/${selectedPost?.id || ''}`;
      const method = selectedPost ? 'put' : 'post';
      const response = await axios[method](url, articleData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (response.data.statusCode === 200 || response.data.statusCode === 201) {
        setSuccess(`Đã ${selectedPost ? 'cập nhật' : 'tạo'} bài viết thành công!`);
        fetchPosts(currentPage);
        handleCloseModal();
      } else {
        setError(`Thao tác thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      setError(`Thao tác thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (postId, newStatus) => {
    if (!checkToken()) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) {
      setError('Không tìm thấy bài viết.');
      return;
    }

    const validStatuses = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN'];
    if (!validStatuses.includes(newStatus)) {
      setError(`Trạng thái '${newStatus}' không hợp lệ. Vui lòng chọn một trong: ${validStatuses.join(', ')}.`);
      return;
    }

    if (!isAdmin && !canEditStatus(post, newStatus)) {
      setError('Bạn không có quyền thay đổi trạng thái này.');
      return;
    }

    try {
      const articleData = { status: newStatus };
      const response = await axios.put(`${API_URL_ARTICLE}/update-status/${postId}`, articleData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (response.data.statusCode === 200) {
        let successMessage = '';
        switch (newStatus) {
          case 'DRAFT':
            successMessage = 'Bài viết đã được chuyển thành bản nháp!';
            break;
          case 'PENDING':
            successMessage = 'Bài viết đã được gửi để duyệt!';
            break;
          case 'PUBLISHED':
            successMessage = 'Bài viết đã được xuất bản!';
            break;
          case 'REJECTED':
            successMessage = 'Bài viết đã bị từ chối!';
            break;
          case 'HIDDEN':
            successMessage = 'Bài viết đã được ẩn!';
            break;
          default:
            successMessage = `Đã cập nhật trạng thái thành ${newStatus}!`;
        }
        setSuccess(successMessage);
        await fetchPosts(currentPage);
      } else {
        setError(`Cập nhật trạng thái thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      const errorMessage = error.response
        ? `Cập nhật trạng thái thất bại: ${error.response.data?.message || error.message} (Status: ${error.response.status})`
        : `Cập nhật trạng thái thất bại: ${error.message}`;
      setError(errorMessage);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!checkToken()) return;
    const post = posts.find((p) => p.id === postId);
    if (!isAdmin && !canDelete(post)) {
      setError('Bạn không có quyền xóa bài viết này.');
      return;
    }
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        const response = await axios.delete(`${API_URL_ARTICLE}/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.statusCode === 200) {
          setSuccess('Đã xóa bài viết.');
          fetchPosts(currentPage);
        } else {
          setError(`Xóa bài viết thất bại: ${response.data.message || 'Lỗi không xác định'}`);
        }
      } catch (error) {
        setError(`Xóa bài viết thất bại: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const canEditContent = (post) => isAdmin || (isEditor && ['DRAFT', 'PENDING', 'REJECTED'].includes(post?.status));
  const canEditStatus = (post, newStatus) =>
    isAdmin ||
    (isEditor &&
      ['DRAFT', 'PENDING', 'REJECTED'].includes(post?.status) &&
      ['DRAFT', 'PENDING'].includes(newStatus) &&
      ((post.status === 'DRAFT' && newStatus === 'PENDING') ||
        (post.status === 'PENDING' && newStatus === 'DRAFT') ||
        (post.status === 'REJECTED' && ['DRAFT', 'PENDING'].includes(newStatus))));
  const canDelete = (post) => isAdmin || (isEditor && ['DRAFT', 'PENDING', 'REJECTED'].includes(post?.status));
  const canToggleAuthor = (post) => isAdmin || (isEditor && post?.status !== 'PUBLISHED');

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: <Badge bg="warning" text="dark">Bản nháp</Badge>,
      PENDING: <Badge bg="info">Chờ duyệt</Badge>,
      PUBLISHED: <Badge bg="success">Đã xuất bản</Badge>,
      REJECTED: <Badge bg="danger">Bị từ chối</Badge>,
      HIDDEN: <Badge bg="secondary">Đã ẩn</Badge>,
    };
    return badges[status] || <Badge bg="secondary">Không xác định</Badge>;
  };

  const formatDateTime = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : 'Chưa có';

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'blockquote', 'code-block'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleContentChange = (value) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleViewPost = (post) => {
    navigate(`/news/${post.id}`, { state: { article: post, articleId: post.id } });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Container className="mt-4 flex-grow">
        <h2 className="text-2xl font-bold mb-4">Quản Lý Bài Viết</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form className="mb-4">
          <div className="d-flex gap-3">
            <Form.Group style={{ width: '200px' }}>
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">Tất cả</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="REJECTED">Bị từ chối</option>
                <option value="HIDDEN">Đã ẩn</option>
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ width: '200px' }}>
              <Form.Label>Danh mục</Form.Label>
              <Form.Select name="categoryId" value={filters.categoryId} onChange={handleFilterChange}>
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex align-items-end">
              <Button variant="primary" onClick={() => fetchPosts(1)}>
                Lọc
              </Button>
            </div>
          </div>
        </Form>

        {isLoading ? (
          <Alert variant="info">Đang tải dữ liệu...</Alert>
        ) : posts.length === 0 ? (
          <Alert variant="info">Không có bài viết nào để hiển thị.</Alert>
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
                  <th>Ngày chỉnh sửa</th>
                  <th style={{ width: '200px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{post.title}</td>
                    <td>{getStatusBadge(post.status)}</td>
                    <td>{formatDateTime(post.createAt)}</td>
                    <td>{formatDateTime(post.publishedAt)}</td>
                    <td>{formatDateTime(post.updateAt)}</td>
                    <td className="text-end">
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2 rounded"
                        onClick={() => handleViewPost(post)}
                        title="Xem chi tiết"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="me-2 rounded"
                        onClick={() => handleShowModal(post)}
                        title="Chỉnh sửa"
                        disabled={!canEditContent(post)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      {post.status === 'PENDING' && isAdmin && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2 rounded"
                            onClick={() => handleUpdateStatus(post.id, 'PUBLISHED')}
                            title="Duyệt và xuất bản"
                          >
                            <i className="bi bi-check-circle"></i>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="me-2 rounded"
                            onClick={() => handleUpdateStatus(post.id, 'REJECTED')}
                            title="Từ chối"
                          >
                            <i className="bi bi-x-circle"></i>
                          </Button>
                        </>
                      )}
                      {(post.status === 'PUBLISHED' || post.status === 'HIDDEN') && isAdmin && (
                        <Button
                          variant={post.status === 'PUBLISHED' ? 'secondary' : 'success'}
                          size="sm"
                          className="me-2 rounded"
                          onClick={() => handleUpdateStatus(post.id, post.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED')}
                          title={post.status === 'PUBLISHED' ? 'Ẩn bài viết' : 'Hiển thị lại'}
                        >
                          <i className={post.status === 'PUBLISHED' ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        className="rounded"
                        onClick={() => handleDeletePost(post.id)}
                        title="Xóa"
                        disabled={!canDelete(post)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-center mt-3">
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
            <Modal.Title>{selectedPost ? 'Sửa bài viết' : 'Tạo bài viết'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            {loading && <div className="text-center">Đang tải...</div>}
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
                    <img src={previewImage} alt="Preview" className="max-w-full max-h-48 object-contain" />
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
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isAdmin ? false : !canEditStatus(selectedPost, formData.status)}
                >
                  {isAdmin ? (
                    <>
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="PUBLISHED">Đã xuất bản</option>
                      <option value="REJECTED">Bị từ chối</option>
                      <option value="HIDDEN">Đã ẩn</option>
                    </>
                  ) : (
                    <>
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PENDING">Chờ duyệt</option>
                    </>
                  )}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hiển thị tác giả</Form.Label>
                <Form.Check
                  type="checkbox"
                  name="isShowAuthor"
                  checked={formData.isShowAuthor}
                  onChange={handleChange}
                  disabled={!canToggleAuthor(selectedPost)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-end">
                <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                  Đóng
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : selectedPost ? 'Lưu' : 'Tạo'}
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
export default PostManagement;