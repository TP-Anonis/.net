import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_EDITOR = `${API_BASE_URL}/article/api/v1/Article/editor`;
const API_URL_ARTICLE_ADMIN = `${API_BASE_URL}/article/api/v1/Article/admin`;
const API_URL_UPLOAD = `${API_BASE_URL}/article/api/v1/Upload/images`;
const API_URL_CATEGORIES = `${API_BASE_URL}/article/api/v1/Category/filter?pageNumber=1&pageSize=10`;

const WritePost = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    thumbnail: '',
    content: '',
    status: 'PENDING', // Mặc định là PENDING cho Editor
    isShowAuthor: true,
    categoryId: '',
    userAccountId: '',
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');
  const userAccountId = localStorage.getItem('userAccountId');

  const checkAuth = () => {
    if (!token || !userAccountId) {
      setError('Vui lòng đăng nhập lại.');
      return false;
    }
    try {
      const decodedToken = jwtDecode(token);
      if (decodedToken.exp * 1000 < Date.now()) {
        setError('Token đã hết hạn. Vui lòng đăng nhập lại.');
        return false;
      }
      const role = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (user.roleId === 3 && role !== 'Admin') {
        setError('Token không chứa vai trò Admin. Vui lòng đăng nhập lại.');
        return false;
      }
      if (user.roleId === 2 && role !== 'Editor') {
        setError('Token không chứa vai trò Editor. Vui lòng đăng nhập lại.');
        return false;
      }
    } catch (error) {
      setError('Token không hợp lệ. Vui lòng đăng nhập lại.');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!checkAuth()) return;

    if (!user || (user.roleId !== 2 && user.roleId !== 3)) {
      setError('Bạn không có quyền viết bài! Vui lòng đăng nhập bằng tài khoản Editor hoặc Admin.');
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_URL_CATEGORIES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoryList = response.data?.data?.items || [];
        setCategories(categoryList);
        if (categoryList.length === 0) {
          setError('Không có danh mục nào được tìm thấy.');
        }
      } catch (error) {
        setError('Lấy danh mục thất bại: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();

    setFormData((prev) => ({
      ...prev,
      status: user.roleId === 3 ? 'PUBLISHED' : 'PENDING',
      userAccountId: user.roleId === 3 ? '' : userAccountId,
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
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

    if (!checkAuth()) {
      setLoading(false);
      return;
    }

    if (!formData.title) {
      setError('Vui lòng nhập tiêu đề!');
      setLoading(false);
      return;
    }
    if (!formData.content) {
      setError('Vui lòng nhập nội dung!');
      setLoading(false);
      return;
    }
    if (!formData.categoryId) {
      setError('Vui lòng chọn danh mục!');
      setLoading(false);
      return;
    }

    if (user.roleId === 2 && formData.status === 'PUBLISHED') {
      setError('Editor không được tạo bài với trạng thái Đã xuất bản!');
      setLoading(false);
      return;
    }

    try {
      const articleData = {
        title: formData.title,
        thumbnail: formData.thumbnail || '',
        content: formData.content,
        status: formData.status,
        isShowAuthor: formData.isShowAuthor,
        categoryId: formData.categoryId,
        userAccountId: formData.userAccountId || userAccountId,
      };

      const apiUrl = user.roleId === 3 ? API_URL_ARTICLE_ADMIN : API_URL_ARTICLE_EDITOR;

      const response = await axios.post(apiUrl, articleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        setSuccess('Bài viết đã được tạo thành công!');
        setFormData({
          title: '',
          thumbnail: '',
          content: '',
          status: user.roleId === 3 ? 'PUBLISHED' : 'PENDING',
          isShowAuthor: true,
          categoryId: '',
          userAccountId: user.roleId === 3 ? '' : userAccountId,
        });
        // Điều hướng về PostHistory sau khi tạo thành công
        navigate('/post-history');
      } else {
        throw new Error('API không trả về mã trạng thái 201!');
      }
    } catch (error) {
      setError(`Tạo bài viết thất bại: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
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
    <>
      <Header />
      <Container className="my-4">
        <h2>Viết Bài Mới</h2>
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
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nội dung</Form.Label>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              modules={quillModules}
              theme="snow"
              style={{ height: '300px', marginBottom: '60px' }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange}>
              {user.roleId === 2 ? (
                <>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PENDING">Gửi ngay và chờ duyệt</option>
                </>
              ) : (
                <>
                  <option value="PUBLISHED">Đã xuất bản</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="REJECTED">Bị từ chối</option>
                  <option value="HIDDEN">Đã ẩn</option>
                </>
              )}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Hiển thị tác giả</Form.Label>
            <Form.Check
              type="checkbox"
              checked={formData.isShowAuthor}
              onChange={(e) => setFormData({ ...formData, isShowAuthor: e.target.checked })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Danh mục</Form.Label>
            <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {user.roleId === 3 && (
            <Form.Group className="mb-3">
              <Form.Label>Tác giả (UserAccountId)</Form.Label>
              <Form.Control
                type="text"
                name="userAccountId"
                value={formData.userAccountId}
                onChange={handleChange}
                placeholder="Nhập ID tác giả"
              />
            </Form.Group>
          )}

          <Button type="submit" variant="primary" disabled={loading}>
            Tạo bài viết
          </Button>
        </Form>
      </Container>
      <Footer />
    </>
  );
};

export default WritePost;