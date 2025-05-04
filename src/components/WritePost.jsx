import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Header from './Header';
import Footer from './Footer';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Định nghĩa các URL API
const API_URL_ARTICLE = 'http://localhost:8000/article/api/v1/Article/';
const API_URL_UPLOAD = 'http://localhost:8000/article/api/v1/Upload/images';
const API_URL_CATEGORIES = 'http://localhost:8000/article/api/v1/Category/filter?pageNumber=1&pageSize=10';
const API_URL_ARTICLE_LIST = 'http://localhost:8000/article/api/v1/Article/filter?pageNumber=1&pageSize=10';
const BACKEND_URL = 'http://localhost:8000';

const WritePost = ({ onArticleCreated }) => {
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
  const [createdArticle, setCreatedArticle] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token') || '';
  const storedUserAccountId = localStorage.getItem('userAccountId') || '';

  // Xác định endpoint dựa trên vai trò từ token
  const determineEndpoint = () => {
    if (!token) return '';
    try {
      const decodedToken = jwtDecode(token);
      const roleId = decodedToken.role === 'Admin' ? 3 : decodedToken.role === 'Editor' ? 2 : 1;
      return roleId === 3 ? 'admin' : 'editor';
    } catch (error) {
      console.error('Lỗi giải mã token:', error);
      return 'editor'; // Mặc định là editor nếu không giải mã được
    }
  };

  const endpoint = determineEndpoint();
  const userAccountId = storedUserAccountId;

  // Kiểm tra xác thực
  const checkAuth = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
      return false;
    }
    if (!storedUserAccountId) {
      setError('userAccountId không tồn tại. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
      return false;
    }
    console.log('Token và userAccountId hợp lệ:', { token, userAccountId });
    try {
      const decodedToken = jwtDecode(token);
      console.log('Decoded token:', decodedToken);
      if (decodedToken.exp * 1000 < Date.now()) {
        setError('Token đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return false;
      }
    } catch (error) {
      setError('Token không hợp lệ. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  // Lấy danh sách danh mục khi component mount
  useEffect(() => {
    if (!checkAuth()) return;
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Gửi yêu cầu lấy danh mục:', API_URL_CATEGORIES);
        const response = await axios.get(API_URL_CATEGORIES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoryList = response.data?.data?.items || [];
        console.log('Danh mục nhận được:', categoryList);
        setCategories(categoryList);
        if (categoryList.length === 0) setError('Không có danh mục nào được tìm thấy.');
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
        setError('Lấy danh mục thất bại: ' + errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
  };

  // Xử lý upload hình ảnh
  const uploadImage = async (file) => {
    if (!checkAuth()) throw new Error('Xác thực không hợp lệ. Vui lòng đăng nhập lại.');
    if (!file) throw new Error('Không có file hình ảnh được chọn.');
    if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn file hình ảnh!');
    if (file.size > 5 * 1024 * 1024) throw new Error('File quá lớn! Vui lòng chọn file dưới 5MB.');

    const formData = new FormData();
    formData.append('files', file);

    try {
      console.log('Gửi yêu cầu upload hình ảnh:', API_URL_UPLOAD);
      const response = await axios.post(API_URL_UPLOAD, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      const fileNames = response.data?.data;
      if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
        throw new Error('API không trả về danh sách file hợp lệ: ' + JSON.stringify(response.data));
      }

      let relativeImageUrl = fileNames[0];
      if (!relativeImageUrl.startsWith('/uploads/')) {
        relativeImageUrl = `/uploads/${fileNames[0]}`;
      }
      const absoluteImageUrl = `${BACKEND_URL}${relativeImageUrl}`;
      console.log('Absolute Image URL:', absoluteImageUrl);
      return { relativeImageUrl, absoluteImageUrl };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi tải lên hình ảnh.';
      throw new Error(errorMessage);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('Vui lòng chọn một file hình ảnh!');
      return;
    }
    setLoading(true);
    try {
      const { relativeImageUrl, absoluteImageUrl } = await uploadImage(file);
      console.log('Preview Image URL:', absoluteImageUrl);
      setFormData((prev) => ({ ...prev, thumbnail: relativeImageUrl }));
      setPreviewImage(absoluteImageUrl);
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Làm mới danh sách bài viết
  const refreshArticleList = async () => {
    try {
      const response = await axios.get(`${API_URL_ARTICLE_LIST}&status=DRAFT,PENDING`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Danh sách bài viết sau khi tạo:', response.data);
      if (onArticleCreated) {
        onArticleCreated(response.data.data.items);
      }
    } catch (error) {
      console.error('Lỗi khi làm mới danh sách bài viết:', error);
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!checkAuth()) {
      setLoading(false);
      return;
    }

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

    try {
      const articleData = {
        title: formData.title,
        thumbnail: formData.thumbnail || '',
        content: convertAbsoluteToRelativeUrls(formData.content),
        status: formData.status,
        isShowAuthor: formData.isShowAuthor,
        userAccountId: userAccountId,
        categoryId: formData.categoryId,
      };

      console.log('Dữ liệu gửi đi:', articleData);
      console.log('Danh mục hiện có:', categories);
      console.log('Sử dụng endpoint:', endpoint);

      const response = await axios.post(`${API_URL_ARTICLE}${endpoint}`, articleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Full response from server:', response);

      const article = response.data?.data;
      if (!article) {
        throw new Error('API không trả về dữ liệu bài viết hợp lệ. Kiểm tra response: ' + JSON.stringify(response.data));
      }

      setCreatedArticle(article);
      setSuccess(
        response.data.message ||
          `Bài viết đã được tạo thành công! ${
            article.status === 'DRAFT'
              ? 'Lưu ý: Bài viết đang ở trạng thái DRAFT, hãy kiểm tra danh sách bản nháp hoặc chuyển trang.'
              : ''
          }`
      );
      setFormData({
        title: '',
        thumbnail: '',
        content: '',
        status: 'DRAFT',
        isShowAuthor: true,
        categoryId: '',
      });
      setPreviewImage(null);

      // Làm mới danh sách bài viết
      await refreshArticleList();
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      console.error('Chi tiết lỗi API:', error.response?.data);

      if (statusCode === 403) {
        const alternativeEndpoint = endpoint === 'editor' ? 'admin' : 'editor';
        console.log(`Thử lại với endpoint /${alternativeEndpoint}...`);
        try {
          const response = await axios.post(`${API_URL_ARTICLE}${alternativeEndpoint}`, articleData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`Full response from /${alternativeEndpoint}:`, response);
          const article = response.data?.data;
          if (!article) throw new Error('API không trả về dữ liệu bài viết.');

          setCreatedArticle(article);
          setSuccess(
            response.data.message ||
              `Bài viết đã được tạo thành công với quyền ${alternativeEndpoint}! ${
                article.status === 'DRAFT'
                  ? 'Lưu ý: Bài viết đang ở trạng thái DRAFT, hãy kiểm tra danh sách bản nháp hoặc chuyển trang.'
                  : ''
              }`
          );
          setFormData({
            title: '',
            thumbnail: '',
            content: '',
            status: 'DRAFT',
            isShowAuthor: true,
            categoryId: '',
          });
          setPreviewImage(null);

          // Làm mới danh sách bài viết
          await refreshArticleList();
        } catch (altError) {
          const altErrorMessage = altError.response?.data?.message || altError.message || 'Lỗi không xác định';
          setError(`Tạo bài viết thất bại: ${altErrorMessage} (Mã lỗi: ${altError.response?.status})`);
        }
      } else {
        setError(`Tạo bài viết thất bại: ${errorMessage} (Mã lỗi: ${statusCode})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertRelativeToAbsoluteUrls = (content) => {
    return content.replace(/<img[^>]+src="\/Uploads\/([^"]+)"/g, `<img src="${BACKEND_URL}/Uploads/$1"`);
  };

  const convertAbsoluteToRelativeUrls = (content) => {
    return content.replace(new RegExp(`${BACKEND_URL}/uploads/([^"]+)`, 'g'), '/uploads/$1');
  };

  const renderArticleContent = (content) => {
    if (!content) return null;
    const updatedContent = convertRelativeToAbsoluteUrls(content);
    return <div dangerouslySetInnerHTML={{ __html: updatedContent }} />;
  };

  const getAbsoluteThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return '';
    if (thumbnail.startsWith('http')) return thumbnail;
    if (thumbnail.startsWith('/uploads/')) return `${BACKEND_URL}${thumbnail}`;
    return '';
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

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="mt-4 flex-grow-1">
        <h2>Viết Bài Mới</h2>
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
            <Form.Label>Thumbnail (Tùy chọn)</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
            {previewImage && (
              <div className="mt-3">
                <p>Thumbnail URL: {previewImage}</p>
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x200?text=Image+Not+Found';
                  }}
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
              style={{ height: '400px', marginBottom: '50px' }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select name="status" value={formData.status} onChange={handleChange}>
              <option value="DRAFT">Bản nháp</option>
              <option value="PENDING">Gửi và chờ duyệt</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Hiển thị tác giả</Form.Label>
            <Form.Check
              type="checkbox"
              name="isShowAuthor"
              checked={formData.isShowAuthor}
              onChange={(e) => setFormData({ ...formData, isShowAuthor: e.target.checked })}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Danh mục</Form.Label>
            <Form.Select name="categoryId" value={formData.categoryId} onChange={handleChange} required>
              <option value="">Chọn danh mục</option>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Không có danh mục
                </option>
              )}
            </Form.Select>
          </Form.Group>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tạo bài viết'}
          </Button>
        </Form>

        {createdArticle && (
          <div className="article-preview" style={{ border: '1px solid #ccc', padding: '20px', width: '50%', margin: '40px auto' }}>
            <h2 style={{ border: '1px solid #ccc', margin: '40px auto', textAlign: 'center' }}>
              Xem trước bài viết vừa tạo
            </h2>
            <h3>Tiêu đề: {createdArticle.title || 'Không có tiêu đề'}</h3>
            {createdArticle.thumbnail ? (
              <img
                src={getAbsoluteThumbnailUrl(createdArticle.thumbnail)}
                alt="Thumbnail"
                style={{ maxWidth: '300px', marginBottom: '20px' }}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/300x200?text=Image+Not+Found';
                }}
              />
            ) : (
              <p>
                <strong>Thumbnail:</strong> Không có hình ảnh hợp lệ để hiển thị.
              </p>
            )}
            <div className="article-content">{renderArticleContent(createdArticle.content)}</div>
            <p>
              <strong>Trạng thái:</strong>{' '}
              {createdArticle.status ? (createdArticle.status === 'DRAFT' ? 'Bản nháp' : 'Gửi và chờ duyệt') : 'Không xác định'}
            </p>
            <p>
              <strong>Hiển thị tác giả:</strong>{' '}
              {createdArticle.isShowAuthor !== undefined ? (createdArticle.isShowAuthor ? 'Có' : 'Không') : 'Không xác định'}
            </p>
            {createdArticle.category ? (
              <p>
                <strong>Danh mục:</strong> {createdArticle.category.name || 'Không xác định'} (Thuộc chủ đề:{' '}
                {createdArticle.category.topic?.name || 'Không xác định'})
              </p>
            ) : (
              <p>
                <strong>Danh mục:</strong> Không xác định
              </p>
            )}
            <p>
              <strong>Tác giả:</strong>{' '}
              {createdArticle.userDetails?.fullName || createdArticle.userAccountEmail || 'Không xác định'}
            </p>
            <p>
              <strong>Ngày tạo:</strong>{' '}
              {createdArticle.createAt ? new Date(createdArticle.createAt).toLocaleString() : 'Không xác định'}
            </p>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default WritePost;