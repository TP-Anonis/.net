import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Row, Col, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Header from './Header';
import Footer from './Footer';
import axios from 'axios';

const API_URL_ARTICLE = 'http://localhost:5288/api/v1/Article';
const API_URL_UPLOAD = 'http://localhost:5288/api/v1/Upload/images';
const API_URL_CATEGORIES = 'http://localhost:5288/api/v1/Category/filter?pageNumber=1&pageSize=50';
const BACKEND_URL = 'http://localhost:5288';

const PostManagement = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [trash, setTrash] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showTrashModal, setShowTrashModal] = useState(false);
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
  const [totalCount, setTotalCount] = useState(0);

  const token = localStorage.getItem('token') || '';

  const checkToken = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      return false;
    }
    return true;
  };

  const fetchPosts = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL_ARTICLE}/filter?pageNumber=${page}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.statusCode === 200) {
        setPosts(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setTotalCount(response.data.data.totalCount);
        setCurrentPage(response.data.data.pageNumber);
      } else {
        setError('Không thể lấy danh sách bài viết.');
        setPosts([]);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy danh sách bài viết.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      if (!checkToken()) return;

      try {
        setLoading(true);
        let allCategories = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(`${API_URL_CATEGORIES}&pageNumber=${page}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const categoryList = response.data?.data?.items || [];
          console.log(`Categories page ${page}:`, categoryList);

          allCategories = [...allCategories, ...categoryList];
          hasMore = page < response.data.data.totalPages;
          page += 1;
        }

        setCategories(allCategories);
        if (allCategories.length === 0) {
          setError('Không có danh mục nào được tìm thấy.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error.response?.data || error.message);
        setError('Lấy danh mục thất bại: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

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
    setPreviewImage(post.thumbnail || null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  const uploadImage = async (file) => {
    if (!checkToken()) {
      throw new Error('Token xác thực không tồn tại.');
    }

    if (!file) {
      throw new Error('Không có file hình ảnh được chọn.');
    }

    const formData = new FormData();
    formData.append('files', file);

    try {
      const response = await axios.post(API_URL_UPLOAD, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fileNames = response.data?.data;
      if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
        throw new Error('API không trả về danh sách file hợp lệ.');
      }

      const imageUrl = `${BACKEND_URL}/uploads/${fileNames[0]}`;
      return imageUrl;
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
      setFormData({ ...formData, thumbnail: imageUrl });
      setPreviewImage(imageUrl);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const convertRelativeToAbsoluteUrls = (content) => {
    if (!content) return '';
    return content.replace(
      /<img[^>]+src="\/Uploads\/([^"]+)"/g,
      `<img src="${BACKEND_URL}/uploads/$1"`
    );
  };

  const convertAbsoluteToRelativeUrls = (content) => {
    if (!content) return '';
    return content.replace(
      new RegExp(`${BACKEND_URL}/uploads/([^"]+)`, 'g'),
      '/uploads/$1'
    );
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
        id: selectedPost.id,
        title: formData.title,
        thumbnail: formData.thumbnail || '',
        content: convertAbsoluteToRelativeUrls(formData.content),
        isShowAuthor: formData.isShowAuthor,
        categoryId: formData.categoryId,
        ...(formData.status && { status: formData.status }),
        ...(localStorage.getItem('userAccountId') && { userAccountId: localStorage.getItem('userAccountId') }),
      };

      console.log('Dữ liệu gửi PUT:', articleData);

      const response = await axios.put(`${API_URL_ARTICLE}/admin/${selectedPost.id}`, articleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Update response:', response.data);

      if (response.data.statusCode === 200) {
        setSuccess('Đã cập nhật bài viết thành công!');
        setPosts(posts.map((post) =>
          post.id === selectedPost.id ? { ...post, ...response.data.data } : post
        ));
        handleCloseModal();
      } else {
        setError(`Cập nhật bài viết thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      setError(`Cập nhật bài viết thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này? Bài viết sẽ được chuyển vào thùng rác.')) {
      if (!checkToken()) return;

      try {
        const response = await axios.delete(`${API_URL_ARTICLE}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Delete response:', response.data);

        if (response.data.statusCode === 200) {
          const postToDelete = posts.find((post) => post.id === id);
          if (postToDelete) {
            setTrash([...trash, { ...postToDelete, deletedAt: new Date().toISOString() }]);
            setPosts(posts.filter((post) => post.id !== id));
            setSuccess('Đã chuyển bài viết vào thùng rác.');
          } else {
            setError('Không tìm thấy bài viết để xóa.');
          }
        } else {
          setError(`Xóa bài viết thất bại: ${response.data.message || 'Lỗi không xác định'}`);
        }
      } catch (err) {
        console.error('Delete error:', err.response?.data || err.message);
        setError(`Có lỗi xảy ra khi xóa bài viết: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleRestorePost = (id) => {
    const postToRestore = trash.find((post) => post.id === id);
    if (postToRestore) {
      setPosts([...posts, { ...postToRestore, deletedAt: null }]);
      setTrash(trash.filter((post) => post.id !== id));
    }
  };

  const handlePermanentlyDeletePost = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác.')) {
      setTrash(trash.filter((post) => post.id !== id));
    }
  };

  const handleViewPost = (post) => {
    navigate(`/news/${post.id}`, { state: { article: post, articleId: post.id } });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge bg="success">Đã đăng</Badge>;
      case 'DRAFT':
        return <Badge bg="warning" text="dark">Bản nháp</Badge>;
      case 'PENDING':
        return <Badge bg="info">Chờ duyệt</Badge>;
      case 'HIDDEN':
        return <Badge bg="secondary">Đã ẩn</Badge>;
      case 'APPROVED':
        return <Badge bg="success">Đã duyệt</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">Bị từ chối</Badge>;
      default:
        return <Badge bg="secondary">Không xác định</Badge>;
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
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản Lý Bài Viết</h2>
          <div>
            <Button
              variant="outline-secondary"
              onClick={() => setShowTrashModal(true)}
              title="Xem thùng rác"
            >
              <i className="bi bi-trash"></i> Thùng rác ({trash.length})
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

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
                  <th>Ngày đăng</th>
                  <th>Ngày cập nhật</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, index) => (
                  <tr key={post.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{post.title}</td>
                    <td>{getStatusBadge(post.status)}</td>
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
                        <i className="bi bi-eye"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(post)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-2"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                Tổng số bài viết: {totalCount}
              </div>
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
            <Modal.Title>Sửa bài viết</Modal.Title>
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
                  value={formData.title || ''}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề bài viết"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Thumbnail</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {previewImage && (
                  <div className="mt-3">
                    <p>Thumbnail URL: {previewImage}</p>
                    <img
                      src={previewImage}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Nội dung</Form.Label>
                <ReactQuill
                  value={formData.content || ''}
                  onChange={handleContentChange}
                  modules={quillModules}
                  theme="snow"
                  style={{ height: '400px', marginBottom: '50px' }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select name="status" value={formData.status || 'DRAFT'} onChange={handleChange}>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING">Gửi và chờ duyệt</option>
                  <option value="PUBLISHED">Đã đăng</option>
                  <option value="HIDDEN">Đã ẩn</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hiển thị tác giả</Form.Label>
                <Form.Check
                  type="checkbox"
                  name="isShowAuthor"
                  checked={formData.isShowAuthor ?? true}
                  onChange={(e) => setFormData({ ...formData, isShowAuthor: e.target.checked })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select
                  name="categoryId"
                  value={formData.categoryId || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Không có danh mục</option>
                  )}
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-content-start">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Lưu'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showTrashModal} onHide={() => setShowTrashModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Thùng rác ({trash.length})</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {trash.length === 0 ? (
              <p>Thùng rác trống.</p>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tiêu đề</th>
                    <th>Trạng thái</th>
                    <th>Ngày xóa</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {trash.map((post, index) => (
                    <tr key={post.id}>
                      <td>{index + 1}</td>
                      <td>{post.title}</td>
                      <td>{getStatusBadge(post.status)}</td>
                      <td>{formatDateTime(post.deletedAt)}</td>
                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleRestorePost(post.id)}
                        >
                          <i className="bi bi-arrow-counterclockwise"></i> Khôi phục
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handlePermanentlyDeletePost(post.id)}
                        >
                          <i className="bi bi-trash"></i> Xóa vĩnh viễn
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTrashModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default PostManagement;