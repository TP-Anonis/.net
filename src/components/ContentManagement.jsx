import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Alert, Tabs, Tab, Pagination, FormSelect, FormControl } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Trash, PencilSquare } from 'react-bootstrap-icons';
import Header from './Header';
import Footer from './Footer';
import { mockArticles } from '../data/mockData';
import axios from 'axios';

const API_URL_TOPIC = 'http://localhost:5288/api/v1/Topic';
const API_URL_CATEGORY = 'http://localhost:5288/api/v1/Category';

const ContentManagement = () => {
  // Quản lý bài viết
  const initialArticles = mockArticles.map(article => ({
    ...article,
    status: article.status || 'pending',
    plagiarismScore: Math.random() * 100,
    rejectionReason: '',
  }));

  const [articles, setArticles] = useState(initialArticles);
  const [showModal, setShowModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Quản lý chủ đề
  const [topics, setTopics] = useState([]);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicId, setEditTopicId] = useState('');

  // Quản lý danh mục
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTopicId, setNewCategoryTopicId] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryTopicId, setEditCategoryTopicId] = useState('');
  const [searchCategoryName, setSearchCategoryName] = useState('');
  const [filterTopicId, setFilterTopicId] = useState('');

  // Phân trang và sắp xếp (cho chủ đề)
  const [topicPageNumber, setTopicPageNumber] = useState(1);
  const [topicPageSize] = useState(100); // Giá trị mặc định nếu sử dụng phân trang
  const [topicTotalPages, setTopicTotalPages] = useState(1);
  const [topicSortByNameAsc, setTopicSortByNameAsc] = useState(false);
  const [topicSearchName, setTopicSearchName] = useState('');
  const [usePagination, setUsePagination] = useState(false); // Bật/tắt phân trang

  // Phân trang và sắp xếp (cho danh mục)
  const [categoryPageNumber, setCategoryPageNumber] = useState(1);
  const [categoryPageSize] = useState(10);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [categorySortByNameAsc, setCategorySortByNameAsc] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Giả sử token được lưu trong localStorage sau khi đăng nhập
  const token = localStorage.getItem('token') || '';

  // Kiểm tra token trước khi gọi API
  const checkToken = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      console.log('Token không tồn tại trong localStorage.');
      return false;
    }
    console.log('Token được sử dụng:', token);
    return true;
  };

  // Lấy danh sách chủ đề
  useEffect(() => {
    const fetchTopics = async () => {
      if (!checkToken()) return;

      try {
        // Chỉ gửi các params cần thiết
        const params = {};
        if (usePagination) {
          params.pageNumber = topicPageNumber;
          params.pageSize = topicPageSize;
        }
        if (topicSortByNameAsc !== null) {
          params.sortByNameAsc = topicSortByNameAsc;
        }
        if (topicSearchName.trim()) {
          params.searchName = topicSearchName.trim();
        }

        console.log('Gửi yêu cầu GET /Topic/filter với params:', params);

        const response = await axios.get(`${API_URL_TOPIC}/filter`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const fetchedTopics = response.data.data.items || [];
        setTopics(fetchedTopics);
        setTopicTotalPages(response.data.data.totalPages || 1);

        // Log danh sách chủ đề để kiểm tra
        console.log('Danh sách chủ đề lấy từ API:', fetchedTopics);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
        setError('Không thể lấy danh sách chủ đề: ' + errorMessage);
        console.error('Lỗi khi lấy danh sách chủ đề:', error.response?.data || error.message);
      }
    };
    fetchTopics();
  }, [topicPageNumber, topicSortByNameAsc, topicSearchName, usePagination]);

  // Lấy danh sách danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      if (!checkToken()) return;

      try {
        const params = {
          pageNumber: categoryPageNumber,
          pageSize: categoryPageSize,
          sortByNameAsc: categorySortByNameAsc,
          searchName: searchCategoryName.trim() || undefined,
          topicId: filterTopicId || undefined,
        };

        console.log('Gửi yêu cầu GET /Category/filter với params:', params);

        const response = await axios.get(`${API_URL_CATEGORY}/filter`, {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCategories(response.data.data.items || []);
        setCategoryTotalPages(response.data.data.totalPages || 1);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
        setError('Không thể lấy danh sách danh mục: ' + errorMessage);
        console.error('Lỗi khi lấy danh sách danh mục:', error.response?.data || error.message);
      }
    };
    fetchCategories();
  }, [categoryPageNumber, categorySortByNameAsc, searchCategoryName, filterTopicId]);

  // Xử lý thông báo lỗi và thành công
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

  // Hàm kiểm tra đạo văn (giả lập)
  const checkPlagiarism = (article) => {
    return article.plagiarismScore > 30;
  };

  // Xử lý thay đổi trạng thái bài viết
  const handleChangeStatus = (id, newStatus) => {
    setArticles(articles.map(article =>
      article.id === id ? { ...article, status: newStatus, rejectionReason: '' } : article
    ));
  };

  // Xử lý từ chối bài viết
  const handleReject = (article) => {
    setArticles(articles.map(a =>
      a.id === article.id ? { ...a, status: 'rejected', rejectionReason } : a
    ));
    setShowModal(false);
    setRejectionReason('');
  };

  // Xử lý xóa bài viết
  const handleDelete = (id) => {
    setArticles(articles.filter(article => article.id !== id));
  };

  // Mở modal để nhập lý do từ chối
  const openRejectionModal = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
  };

  // Xử lý tạo chủ đề mới
  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      setError('Vui lòng nhập tên chủ đề!');
      return;
    }
    if (!checkToken()) return;

    try {
      await axios.post(API_URL_TOPIC, { name: newTopicName }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchResponse = await axios.get(`${API_URL_TOPIC}/filter`, {
        params: {
          ...(usePagination && { pageNumber: topicPageNumber, pageSize: topicPageSize }),
          ...(topicSortByNameAsc !== null && { sortByNameAsc: topicSortByNameAsc }),
          ...(topicSearchName.trim() && { searchName: topicSearchName.trim() }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedTopics = fetchResponse.data.data.items || [];
      setTopics(fetchedTopics);
      setTopicTotalPages(fetchResponse.data.data.totalPages || 1);
      setSuccess('Tạo chủ đề thành công!');
      setShowTopicModal(false);
      setNewTopicName('');

      // Log danh sách chủ đề sau khi tạo mới
      console.log('Danh sách chủ đề sau khi tạo:', fetchedTopics);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Tạo chủ đề thất bại: ' + errorMessage);
      console.error('Lỗi khi tạo chủ đề:', error.response?.data || error.message);
    }
  };

  // Xử lý xóa chủ đề
  const handleDeleteTopic = async (id) => {
    if (!checkToken()) return;

    try {
      await axios.delete(`${API_URL_TOPIC}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const response = await axios.get(`${API_URL_TOPIC}/filter`, {
        params: {
          ...(usePagination && { pageNumber: topicPageNumber, pageSize: topicPageSize }),
          ...(topicSortByNameAsc !== null && { sortByNameAsc: topicSortByNameAsc }),
          ...(topicSearchName.trim() && { searchName: topicSearchName.trim() }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedTopics = response.data.data.items || [];
      setTopics(fetchedTopics);
      setTopicTotalPages(response.data.data.totalPages || 1);
      setSuccess('Xóa chủ đề thành công!');

      // Log danh sách chủ đề sau khi xóa
      console.log('Danh sách chủ đề sau khi xóa:', fetchedTopics);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Xóa chủ đề thất bại: ' + errorMessage);
      console.error('Lỗi khi xóa chủ đề:', error.response?.data || error.message);
    }
  };

  // Mở modal chỉnh sửa chủ đề
  const openEditTopicModal = (topic) => {
    setEditTopicId(topic.id);
    setEditTopicName(topic.name);
    setShowEditTopicModal(true);
  };

  // Xử lý chỉnh sửa chủ đề
  const handleEditTopic = async () => {
    if (!editTopicName.trim()) {
      setError('Vui lòng nhập tên chủ đề!');
      return;
    }
    if (!editTopicId) {
      setError('ID chủ đề không hợp lệ!');
      return;
    }
    if (!checkToken()) return;

    try {
      await axios.put(`${API_URL_TOPIC}/${editTopicId}`, { id: editTopicId, name: editTopicName }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchResponse = await axios.get(`${API_URL_TOPIC}/filter`, {
        params: {
          ...(usePagination && { pageNumber: topicPageNumber, pageSize: topicPageSize }),
          ...(topicSortByNameAsc !== null && { sortByNameAsc: topicSortByNameAsc }),
          ...(topicSearchName.trim() && { searchName: topicSearchName.trim() }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const fetchedTopics = fetchResponse.data.data.items || [];
      setTopics(fetchedTopics);
      setTopicTotalPages(fetchResponse.data.data.totalPages || 1);
      setSuccess('Cập nhật chủ đề thành công!');
      setShowEditTopicModal(false);
      setEditTopicName('');
      setEditTopicId('');

      // Log danh sách chủ đề sau khi cập nhật
      console.log('Danh sách chủ đề sau khi cập nhật:', fetchedTopics);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Cập nhật chủ đề thất bại: ' + errorMessage);
      console.error('Lỗi khi cập nhật chủ đề:', error.response?.data || error.message);
    }
  };

  // Xử lý tạo danh mục mới (POST /Category)
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Vui lòng nhập tên danh mục!');
      return;
    }
    if (!newCategoryTopicId) {
      setError('Vui lòng chọn chủ đề!');
      return;
    }
    if (!checkToken()) return;

    try {
      const response = await axios.post(API_URL_CATEGORY, {
        name: newCategoryName,
        topicId: newCategoryTopicId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Tạo danh mục thành công:', response.data);

      // Tải lại danh sách danh mục sau khi tạo
      const fetchResponse = await axios.get(`${API_URL_CATEGORY}/filter`, {
        params: {
          pageNumber: categoryPageNumber,
          pageSize: categoryPageSize,
          sortByNameAsc: categorySortByNameAsc,
          searchName: searchCategoryName.trim() || undefined,
          topicId: filterTopicId || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(fetchResponse.data.data.items || []);
      setCategoryTotalPages(fetchResponse.data.data.totalPages || 1);
      setSuccess('Tạo danh mục thành công!');
      setShowCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryTopicId('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Tạo danh mục thất bại: ' + errorMessage);
      console.error('Lỗi khi tạo danh mục:', error.response?.data || error.message);
    }
  };

  // Mở modal xác nhận xóa danh mục
  const openDeleteConfirmModal = (id) => {
    setCategoryIdToDelete(id);
    setShowDeleteConfirmModal(true);
  };

  // Xử lý xóa danh mục (DELETE /Category/{id})
  const handleDeleteCategory = async () => {
    if (!categoryIdToDelete) {
      setError('ID danh mục không hợp lệ!');
      return;
    }
    if (!checkToken()) return;

    try {
      await axios.delete(`${API_URL_CATEGORY}/${categoryIdToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Xóa danh mục thành công, ID:', categoryIdToDelete);

      // Tải lại danh sách danh mục sau khi xóa
      const response = await axios.get(`${API_URL_CATEGORY}/filter`, {
        params: {
          pageNumber: categoryPageNumber,
          pageSize: categoryPageSize,
          sortByNameAsc: categorySortByNameAsc,
          searchName: searchCategoryName.trim() || undefined,
          topicId: filterTopicId || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(response.data.data.items || []);
      setCategoryTotalPages(response.data.data.totalPages || 1);
      setSuccess('Xóa danh mục thành công!');
      setShowDeleteConfirmModal(false);
      setCategoryIdToDelete(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Xóa danh mục thất bại: ' + errorMessage);
      console.error('Lỗi khi xóa danh mục:', error.response?.data || error.message);
      setShowDeleteConfirmModal(false);
      setCategoryIdToDelete(null);
    }
  };

  // Mở modal chỉnh sửa danh mục
  const openEditCategoryModal = (category) => {
    setEditCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategoryTopicId(category.topic.id);
    setShowEditCategoryModal(true);
  };

  // Xử lý chỉnh sửa danh mục (PUT /Category/{id})
  const handleEditCategory = async () => {
    if (!editCategoryName.trim()) {
      setError('Vui lòng nhập tên danh mục!');
      return;
    }
    if (!editCategoryTopicId) {
      setError('Vui lòng chọn chủ đề!');
      return;
    }
    if (!editCategoryId) {
      setError('ID danh mục không hợp lệ!');
      return;
    }
    if (!checkToken()) return;

    try {
      const response = await axios.put(`${API_URL_CATEGORY}/${editCategoryId}`, {
        id: editCategoryId,
        name: editCategoryName,
        topicId: editCategoryTopicId,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Cập nhật danh mục thành công:', response.data);

      // Tải lại danh sách danh mục sau khi chỉnh sửa
      const fetchResponse = await axios.get(`${API_URL_CATEGORY}/filter`, {
        params: {
          pageNumber: categoryPageNumber,
          pageSize: categoryPageSize,
          sortByNameAsc: categorySortByNameAsc,
          searchName: searchCategoryName.trim() || undefined,
          topicId: filterTopicId || undefined,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(fetchResponse.data.data.items || []);
      setCategoryTotalPages(fetchResponse.data.data.totalPages || 1);
      setSuccess('Cập nhật danh mục thành công!');
      setShowEditCategoryModal(false);
      setEditCategoryName('');
      setEditCategoryTopicId('');
      setEditCategoryId('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
      setError('Cập nhật danh mục thất bại: ' + errorMessage);
      console.error('Lỗi khi cập nhật danh mục:', error.response?.data || error.message);
    }
  };

  // Xử lý thay đổi trang (chủ đề)
  const handleTopicPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= topicTotalPages) {
      setTopicPageNumber(newPage);
    }
  };

  // Xử lý thay đổi trang (danh mục)
  const handleCategoryPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= categoryTotalPages) {
      setCategoryPageNumber(newPage);
    }
  };

  // Xử lý sắp xếp (chủ đề)
  const handleTopicSortToggle = () => {
    setTopicSortByNameAsc(!topicSortByNameAsc);
    setTopicPageNumber(1);
  };

  // Xử lý tìm kiếm chủ đề
  const handleSearchTopic = (e) => {
    setTopicSearchName(e.target.value);
    setTopicPageNumber(1);
  };

  // Xử lý tìm kiếm danh mục
  const handleSearchCategory = (e) => {
    setSearchCategoryName(e.target.value);
    setCategoryPageNumber(1);
  };

  // Xử lý lọc danh mục theo chủ đề
  const handleFilterByTopic = (e) => {
    setFilterTopicId(e.target.value);
    setCategoryPageNumber(1);
  };

  // Xử lý sắp xếp (danh mục)
  const handleCategorySortToggle = () => {
    setCategorySortByNameAsc(!categorySortByNameAsc);
    setCategoryPageNumber(1);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="my-5 flex-grow-1">
        <h2>Quản lý nội dung</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Tabs defaultActiveKey="articles" id="content-management-tabs" className="mb-3">
          {/* Tab Quản lý bài viết */}
          <Tab eventKey="articles" title="Quản lý bài viết">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tiêu đề</th>
                  <th>Chủ đề</th>
                  <th>Tác giả</th>
                  <th>Trạng thái</th>
                  <th>Đạo văn</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => (
                  <tr key={article.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/news/${encodeURIComponent(article.title)}`} state={{ article }}>
                        {article.title}
                      </Link>
                    </td>
                    <td>{article.category}</td>
                    <td>{article.authorId}</td>
                    <td>
                      <Badge
                        bg={
                          article.status === 'published' ? 'success' :
                          article.status === 'pending' ? 'warning' :
                          article.status === 'rejected' ? 'danger' : 'secondary'
                        }
                      >
                        {article.status === 'published' ? 'Đã xuất bản' :
                         article.status === 'pending' ? 'Đang chờ duyệt' :
                         article.status === 'rejected' ? 'Bị từ chối' : 'Nháp'}
                      </Badge>
                      {article.status === 'rejected' && article.rejectionReason && (
                        <div className="mt-1 text-danger">
                          Lý do: {article.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {checkPlagiarism(article) ? (
                        <Alert variant="danger" className="p-1 mb-0">
                          Nghi vấn đạo văn ({Math.round(article.plagiarismScore)}%)
                        </Alert>
                      ) : (
                        <Alert variant="success" className="p-1 mb-0">
                          Không có nghi vấn ({Math.round(article.plagiarismScore)}%)
                        </Alert>
                      )}
                    </td>
                    <td>
                      {article.status === 'pending' && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleChangeStatus(article.id, 'published')}
                            disabled={checkPlagiarism(article)}
                          >
                            Duyệt
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="me-2"
                            onClick={() => openRejectionModal(article)}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                      {article.status === 'published' && (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleChangeStatus(article.id, 'draft')}
                        >
                          Chuyển thành nháp
                        </Button>
                      )}
                      {article.status === 'draft' && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleChangeStatus(article.id, 'pending')}
                        >
                          Gửi duyệt
                        </Button>
                      )}
                      {article.status === 'rejected' && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleChangeStatus(article.id, 'pending')}
                        >
                          Gửi lại duyệt
                        </Button>
                      )}
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>

          {/* Tab Quản lý chủ đề */}
          <Tab eventKey="topics" title="Quản lý chủ đề">
            <div className="d-flex justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <FormControl
                  placeholder="Tìm kiếm chủ đề..."
                  value={topicSearchName}
                  onChange={handleSearchTopic}
                  style={{ width: '200px' }}
                />
                <Button variant="outline-secondary" onClick={handleTopicSortToggle}>
                  Sắp xếp theo tên {topicSortByNameAsc ? '↓' : '↑'}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setUsePagination(!usePagination)}
                >
                  {usePagination ? 'Tắt phân trang' : 'Bật phân trang'}
                </Button>
              </div>
              <Button variant="primary" onClick={() => setShowTopicModal(true)}>
                Tạo chủ đề mới
              </Button>
            </div>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Tên chủ đề</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{topic.name}</span>
                        <div>
                          <PencilSquare
                            className="me-2"
                            style={{ cursor: 'pointer', color: '#007bff' }}
                            onClick={() => openEditTopicModal(topic)}
                          />
                          <Trash
                            style={{ cursor: 'pointer', color: '#dc3545' }}
                            onClick={() => handleDeleteTopic(topic.id)}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {usePagination && (
              <Pagination className="justify-content-center">
                <Pagination.First onClick={() => handleTopicPageChange(1)} disabled={topicPageNumber === 1} />
                <Pagination.Prev onClick={() => handleTopicPageChange(topicPageNumber - 1)} disabled={topicPageNumber === 1} />
                {[...Array(topicTotalPages).keys()].map(page => (
                  <Pagination.Item
                    key={page + 1}
                    active={page + 1 === topicPageNumber}
                    onClick={() => handleTopicPageChange(page + 1)}
                  >
                    {page + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => handleTopicPageChange(topicPageNumber + 1)} disabled={topicPageNumber === topicTotalPages} />
                <Pagination.Last onClick={() => handleTopicPageChange(topicTotalPages)} disabled={topicPageNumber === topicTotalPages} />
              </Pagination>
            )}
          </Tab>

          {/* Tab Quản lý danh mục */}
          <Tab eventKey="categories" title="Quản lý danh mục">
            <div className="d-flex justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <FormControl
                  placeholder="Tìm kiếm danh mục..."
                  value={searchCategoryName}
                  onChange={handleSearchCategory}
                  style={{ width: '200px' }}
                />
                <FormSelect
                  value={filterTopicId}
                  onChange={handleFilterByTopic}
                  style={{ width: '200px' }}
                >
                  <option value="">Tất cả chủ đề</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </FormSelect>
                <Button variant="outline-secondary" onClick={handleCategorySortToggle}>
                  Sắp xếp theo tên {categorySortByNameAsc ? '↓' : '↑'}
                </Button>
              </div>
              <Button variant="primary" onClick={() => setShowCategoryModal(true)}>
                Tạo danh mục mới
              </Button>
            </div>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Chủ đề</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{category.name}</span>
                        <div>
                          <PencilSquare
                            className="me-2"
                            style={{ cursor: 'pointer', color: '#007bff' }}
                            onClick={() => openEditCategoryModal(category)}
                          />
                          <Trash
                            style={{ cursor: 'pointer', color: '#dc3545' }}
                            onClick={() => openDeleteConfirmModal(category.id)}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{category.topic?.name || 'Không xác định'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination className="justify-content-center">
              <Pagination.First onClick={() => handleCategoryPageChange(1)} disabled={categoryPageNumber === 1} />
              <Pagination.Prev onClick={() => handleCategoryPageChange(categoryPageNumber - 1)} disabled={categoryPageNumber === 1} />
              {[...Array(categoryTotalPages).keys()].map(page => (
                <Pagination.Item
                  key={page + 1}
                  active={page + 1 === categoryPageNumber}
                  onClick={() => handleCategoryPageChange(page + 1)}
                >
                  {page + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => handleCategoryPageChange(categoryPageNumber + 1)} disabled={categoryPageNumber === categoryTotalPages} />
              <Pagination.Last onClick={() => handleCategoryPageChange(categoryTotalPages)} disabled={categoryPageNumber === categoryTotalPages} />
            </Pagination>
          </Tab>
        </Tabs>
      </Container>

      {/* Modal để nhập lý do từ chối bài viết */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Từ chối bài viết</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Lý do từ chối</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Nhập lý do từ chối (ví dụ: nghi vấn đạo văn, nội dung không phù hợp...)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={() => handleReject(selectedArticle)}
            disabled={!rejectionReason.trim()}
          >
            Xác nhận từ chối
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal để tạo chủ đề mới */}
      <Modal show={showTopicModal} onHide={() => setShowTopicModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tạo chủ đề mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên chủ đề</Form.Label>
              <Form.Control
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Nhập tên chủ đề"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTopicModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreateTopic}>
            Tạo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal để chỉnh sửa chủ đề */}
      <Modal show={showEditTopicModal} onHide={() => setShowEditTopicModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa chủ đề</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên chủ đề</Form.Label>
              <Form.Control
                type="text"
                value={editTopicName}
                onChange={(e) => setEditTopicName(e.target.value)}
                placeholder="Nhập tên chủ đề"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditTopicModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleEditTopic}>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal để tạo danh mục mới */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tạo danh mục mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên danh mục</Form.Label>
              <Form.Control
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nhập tên danh mục"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chủ đề</Form.Label>
              <FormSelect
                value={newCategoryTopicId}
                onChange={(e) => setNewCategoryTopicId(e.target.value)}
              >
                <option value="">Chọn chủ đề</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </FormSelect>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreateCategory}>
            Tạo
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal để chỉnh sửa danh mục */}
      <Modal show={showEditCategoryModal} onHide={() => setShowEditCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên danh mục</Form.Label>
              <Form.Control
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Nhập tên danh mục"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chủ đề</Form.Label>
              <FormSelect
                value={editCategoryTopicId}
                onChange={(e) => setEditCategoryTopicId(e.target.value)}
              >
                <option value="">Chọn chủ đề</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </FormSelect>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditCategoryModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleEditCategory}>
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal xác nhận xóa danh mục */}
      <Modal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa danh mục này không?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDeleteCategory}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </div>
  );
};

export default ContentManagement;