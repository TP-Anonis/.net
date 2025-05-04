import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Table, Button, Badge, Form, InputGroup, Pagination, Container, Modal, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail } from '../services/authApi';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const AccountManagement = () => {
  const navigate = useNavigate();

  // State cho người dùng
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewers, setViewers] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  // State cho modal xác minh
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState(null);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Token từ localStorage
  const token = localStorage.getItem('token');

  // Kiểm tra token
  const checkToken = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      setTimeout(() => navigate('/login'), 3000);
      return false;
    }
    return true;
  };

  // Lấy danh sách người dùng
  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    if (!checkToken()) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:8000/auth/api/v1/User?page=${currentPage}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success !== undefined && !response.data.success) {
        throw new Error(response.data.message || 'Không thể lấy danh sách người dùng.');
      }

      if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Dữ liệu người dùng không hợp lệ hoặc trống.');
      }

      setUsers(response.data.data);
      setTotalPages(response.data.totalPages || 1);
      setFilteredUsers(response.data.data);

      const viewerList = response.data.data.filter(user => user.role.toLowerCase() === 'viewer');
      const editorList = response.data.data.filter(user => user.role.toLowerCase() === 'editor');
      setViewers(viewerList);
      setEditors(editorList);
    } catch (error) {
      setError(`Lỗi khi lấy danh sách người dùng: ${error.response?.status || 'N/A'} - ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lọc người dùng dựa trên tìm kiếm
  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);

    const viewerList = filtered.filter(user => user.role.toLowerCase() === 'viewer');
    const editorList = filtered.filter(user => user.role.toLowerCase() === 'editor');
    setViewers(viewerList);
    setEditors(editorList);
  }, [searchQuery, users]);

  // Xử lý khóa người dùng
  const handleLockUser = async (accountId) => {
    // Kiểm tra token và accountId trước khi gửi yêu cầu
    if (!checkToken()) return;
    if (!accountId || typeof accountId !== 'string') {
      setError('ID tài khoản không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Khóa tài khoản với accountId:', accountId);
      const response = await axios.patch(
        `http://localhost:8000/auth/api/v1/User/lock`,
        { accountId: accountId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Phản hồi từ API khóa:', response.data);

      if (response.data.message !== 'Khóa tài khoản người dùng thành công') {
        throw new Error(response.data.message || 'Khóa tài khoản thất bại.');
      }

      setSuccessMessage('Khóa tài khoản người dùng thành công.');
      await fetchUsers();
    } catch (error) {
      // Cải thiện xử lý lỗi để lấy thông tin chi tiết từ server
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      const errorStatus = error.response?.status || 'N/A';
      setError(`Lỗi khi khóa tài khoản: ${errorStatus} - ${errorMessage}`);
      console.error('Chi tiết lỗi khóa tài khoản:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý mở khóa người dùng
  const handleUnlockUser = async (accountId) => {
    if (!checkToken()) return;
    if (!accountId || typeof accountId !== 'string') {
      setError('ID tài khoản không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('Mở khóa tài khoản với accountId:', accountId);
      const response = await axios.patch(
        `http://localhost:8000/auth/api/v1/User/unlock`,
        { accountId: accountId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Phản hồi từ API mở khóa:', response.data);

      if (response.data.message !== 'Mở khóa tài khoản người dùng thành công') {
        throw new Error(response.data.message || 'Mở khóa tài khoản thất bại.');
      }

      setSuccessMessage('Mở khóa tài khoản người dùng thành công.');
      await fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      const errorStatus = error.response?.status || 'N/A';
      setError(`Lỗi khi mở khóa tài khoản: ${errorStatus} - ${errorMessage}`);
      console.error('Chi tiết lỗi mở khóa tài khoản:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xem bài viết của biên tập viên
  const handleViewArticles = (editorId) => {
    navigate(`/editor/${editorId}/articles`);
  };

  // Xử lý gửi email xác minh
  const handleSendVerification = async (editor) => {
    if (!checkToken()) return;

    setLoading(true);
    try {
      await sendVerificationEmail(editor.email);
      setSelectedEditor(editor);
      setShowVerifyModal(true);
      setVerifyError('');
    } catch (err) {
      setError('Gửi email xác minh thất bại: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác minh mã OTP
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');

    if (!verifyCodeInput) {
      setVerifyError('Vui lòng nhập mã xác thực!');
      return;
    }

    if (!checkToken()) return;

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/auth/api/v1/Auth/verifyEmail',
        {
          email: selectedEditor.email,
          otp: verifyCodeInput,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setUsers(users.map(user =>
          user.id === selectedEditor.id ? { ...user, isVerified: true } : user
        ));
        setShowVerifyModal(false);
        setVerifyCodeInput('');
        fetchUsers();
      } else {
        throw new Error(response.data.message || 'Mã xác thực không đúng.');
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Mã xác thực không đúng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Tạo nút phân trang
  const renderPagination = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev
          onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="my-5 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản Lý Tài Khoản</h2>
          <Button variant="primary" onClick={() => setShowRegisterModal(true)}>
            Thêm Biên Tập Viên
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        {loading && (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        )}

        <Tabs defaultActiveKey="viewers" id="account-management-tabs" className="mb-3">
          <Tab eventKey="viewers" title="Quản lý thông tin độc giả">
            <Form className="mb-3">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm độc giả theo email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Button variant="outline-primary">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th>Xác minh</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {viewers.map((viewer, index) => (
                  <tr key={viewer.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{viewer.email}</td>
                    <td>
                      <Badge bg={viewer.status === 'Enable' ? 'success' : 'danger'}>
                        {viewer.status === 'Enable' ? 'Kích hoạt' : 'Khóa'}
                      </Badge>
                    </td>
                    <td>{viewer.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                    <td>
                      {viewer.status === 'Enable' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleLockUser(viewer.id)}
                        >
                          Khóa
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleUnlockUser(viewer.id)}
                        >
                          Mở khóa
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {renderPagination()}
          </Tab>

          <Tab eventKey="editors" title="Quản lý thông tin biên tập viên">
            <Form className="mb-3">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm biên tập viên theo email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Button variant="outline-primary">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>

            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th>Xác minh</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {editors.map((editor, index) => (
                  <tr key={editor.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{editor.email}</td>
                    <td>
                      <Badge bg={editor.status === 'Enable' ? 'success' : 'danger'}>
                        {editor.status === 'Enable' ? 'Kích hoạt' : 'Khóa'}
                      </Badge>
                    </td>
                    <td>{editor.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                    <td>
                      {editor.status === 'Enable' ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleLockUser(editor.id)}
                        >
                          Khóa
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleUnlockUser(editor.id)}
                        >
                          Mở khóa
                        </Button>
                      )}
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewArticles(editor.id)}
                      >
                        Xem bài viết
                      </Button>
                      {!editor.isVerified && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleSendVerification(editor)}
                        >
                          Xác minh
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {renderPagination()}
          </Tab>
        </Tabs>

        <Modal show={showVerifyModal} onHide={() => { setShowVerifyModal(false); setVerifyCodeInput(''); setVerifyError(''); }} centered>
          <Modal.Body className="p-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="modal-title">Xác minh tài khoản</h3>
              <Button variant="link" className="p-0" onClick={() => { setShowVerifyModal(false); setVerifyCodeInput(''); setVerifyError(''); }} disabled={loading}>
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>

            {verifyError && <Alert variant="danger">{verifyError}</Alert>}
            {loading && (
              <div className="text-center">
                <Spinner animation="border" />
              </div>
            )}

            <Form onSubmit={handleVerifySubmit}>
              <Form.Group className="mb-4" controlId="formVerifyCode">
                <Form.Label className="form-label">Nhập mã xác thực</Form.Label>
                <Form.Control
                  type="text"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  placeholder="Nhập mã xác thực từ email"
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                className="w-100 btn-custom rounded-pill mb-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác thực'
                )}
              </Button>

              <div className="text-center mt-3">
                <p className="mb-0 link-text">
                  Không nhận được mã?{' '}
                  <Button
                    variant="link"
                    className="p-0 text-primary link-text"
                    onClick={() => sendVerificationEmail(selectedEditor?.email)}
                    disabled={loading}
                  >
                    Gửi lại mã
                  </Button>
                </p>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showRegisterModal} onHide={() => { setShowRegisterModal(false); }} centered>
          <Modal.Body className="p-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="modal-title">Đăng Ký Biên Tập Viên</h3>
              <Button variant="link" className="p-0" onClick={() => setShowRegisterModal(false)} disabled={loading}>
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
            {/* Form đăng ký biên tập viên sẽ được thêm tương tự Register.js */}
          </Modal.Body>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default AccountManagement;