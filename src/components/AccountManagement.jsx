import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Table, Button, Badge, Form, InputGroup, Pagination, Container, Modal, Alert, Spinner, Row, Col, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { sendVerificationEmail, registerEditor, verifyCode } from '../services/authApi';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import '../assets/css/Login.css';

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

  // State cho modal đăng ký biên tập viên
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    sex: 'Female',
    role: 'Editor',
    birthday: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerVerifyCodeInput, setRegisterVerifyCodeInput] = useState('');
  const [registerVerifyError, setRegisterVerifyError] = useState('');

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
    if (!checkToken()) return;
    if (!accountId || typeof accountId !== 'string') {
      setError('ID tài khoản không hợp lệ. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.patch(
        `http://localhost:8000/auth/api/v1/User/lock?accountId=${accountId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message !== 'Khóa tài khoản người dùng thành công') {
        throw new Error(response.data.message || 'Khóa tài khoản thất bại.');
      }

      setSuccessMessage('Khóa tài khoản người dùng thành công.');
      await fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      const errorStatus = error.response?.status || 'N/A';
      setError(`Lỗi khi khóa tài khoản: ${errorStatus} - ${errorMessage}`);
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
      const response = await axios.patch(
        `http://localhost:8000/auth/api/v1/User/unlock?accountId=${accountId}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.message !== 'Mở khóa tài khoản người dùng thành công') {
        throw new Error(response.data.message || 'Mở khóa tài khoản thất bại.');
      }

      setSuccessMessage('Mở khóa tài khoản người dùng thành công.');
      await fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.statusText || error.message;
      const errorStatus = error.response?.status || 'N/A';
      setError(`Lỗi khi mở khóa tài khoản: ${errorStatus} - ${errorMessage}`);
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

  // Xử lý đăng ký biên tập viên
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterFormData({ ...registerFormData, [name]: value });
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự!';
    }
    return '';
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');

    if (
      !registerFormData.email ||
      !registerFormData.password ||
      !registerFormData.confirmPassword ||
      !registerFormData.fullName ||
      !registerFormData.birthday
    ) {
      setRegisterError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (registerFormData.password !== registerFormData.confirmPassword) {
      setRegisterError('Mật khẩu xác nhận không khớp!');
      return;
    }

    const passwordError = validatePassword(registerFormData.password);
    if (passwordError) {
      setRegisterError(passwordError);
      return;
    }

    try {
      setLoading(true);

      const userData = {
        email: registerFormData.email,
        password: registerFormData.password,
        fullName: registerFormData.fullName,
        sex: registerFormData.sex,
        role: 'Editor', // Đảm bảo vai trò là Editor
        birthday: new Date(registerFormData.birthday).toISOString(),
      };

      await registerEditor(userData); // Sử dụng registerEditor thay vì registerUser
      await sendVerificationEmail(registerFormData.email);
      setIsRegistered(true);
    } catch (err) {
      setRegisterError(err.message || 'Đăng ký biên tập viên thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerifySubmit = async (e) => {
    e.preventDefault();
    setRegisterVerifyError('');

    try {
      setLoading(true);
      await verifyCode(registerFormData.email, registerVerifyCodeInput);
      setSuccessMessage('Xác thực email thành công! Tài khoản biên tập viên đã được tạo.');
      setShowRegisterModal(false);
      setRegisterFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        sex: 'Female',
        role: 'Editor',
        birthday: '',
      });
      setIsRegistered(false);
      setRegisterVerifyCodeInput('');
      fetchUsers(); // Cập nhật danh sách người dùng
    } catch (err) {
      setRegisterVerifyError(err.message || 'Mã xác thực không đúng. Vui lòng thử lại!');
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

        {/* Modal xác minh tài khoản */}
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

        {/* Modal đăng ký biên tập viên */}
        <Modal show={showRegisterModal} onHide={() => { setShowRegisterModal(false); setIsRegistered(false); setRegisterVerifyCodeInput(''); setRegisterError(''); setRegisterVerifyError(''); }} centered dialogClassName="custom-wide-modal" size="xl">
          <Modal.Body className="p-0">
            <Row className="m-0">
              <Col md={4} className="d-none d-md-block login-left-section">
                <div className="d-flex justify-content-center align-items-center h-100">
                  <Image src="../src/assets/img/logo.png" alt="Logo" className="login-logo" fluid />
                </div>
              </Col>

              <Col md={8} className="login-right-section p-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="modal-title">{isRegistered ? 'Xác thực email' : 'Đăng ký biên tập viên'}</h3>
                  <Button variant="link" className="p-0" onClick={() => { setShowRegisterModal(false); setIsRegistered(false); setRegisterVerifyCodeInput(''); setRegisterError(''); setRegisterVerifyError(''); }} disabled={loading}>
                    <i className="bi bi-x-lg"></i>
                  </Button>
                </div>

                {registerError && <Alert variant="danger">{registerError}</Alert>}
                {registerVerifyError && <Alert variant="danger">{registerVerifyError}</Alert>}

                {!isRegistered ? (
                  <Form onSubmit={handleRegisterSubmit}>
                    <Row className="g-4">
                      <Col md={6}>
                        <Form.Group controlId="formRegisterEmail">
                          <Form.Label className="form-label">Email</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-envelope"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="email"
                              name="email"
                              value={registerFormData.email}
                              onChange={handleRegisterChange}
                              placeholder="Nhập email"
                              required
                              className="form-control-custom rounded-end"
                              disabled={loading}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="formRegisterFullName">
                          <Form.Label className="form-label">Họ và tên</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-person"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="text"
                              name="fullName"
                              value={registerFormData.fullName}
                              onChange={handleRegisterChange}
                              placeholder="Nhập họ và tên"
                              required
                              className="form-control-custom rounded-end"
                              disabled={loading}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-4 mt-3">
                      <Col md={6}>
                        <Form.Group controlId="formRegisterPassword">
                          <Form.Label className="form-label">Mật khẩu</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-lock"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="password"
                              name="password"
                              value={registerFormData.password}
                              onChange={handleRegisterChange}
                              placeholder="Nhập mật khẩu"
                              required
                              className="form-control-custom rounded-end"
                              disabled={loading}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="formRegisterConfirmPassword">
                          <Form.Label className="form-label">Xác nhận mật khẩu</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>
                              <i className="bi bi-lock"></i>
                            </InputGroup.Text>
                            <Form.Control
                              type="password"
                              name="confirmPassword"
                              value={registerFormData.confirmPassword}
                              onChange={handleRegisterChange}
                              placeholder="Xác nhận mật khẩu"
                              required
                              className="form-control-custom rounded-end"
                              disabled={loading}
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="g-4 mt-3">
                      <Col md={6}>
                        <Form.Group controlId="formRegisterSex">
                          <Form.Label className="form-label">Giới tính</Form.Label>
                          <Form.Select
                            name="sex"
                            value={registerFormData.sex}
                            onChange={handleRegisterChange}
                            className="form-control-custom"
                            disabled={loading}
                          >
                            <option value="Female">Nữ</option>
                            <option value="Male">Nam</option>
                            <option value="Other">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="formRegisterBirthday">
                          <Form.Label className="form-label">Ngày sinh</Form.Label>
                          <Form.Control
                            type="date"
                            name="birthday"
                            value={registerFormData.birthday}
                            onChange={handleRegisterChange}
                            required
                            className="form-control-custom"
                            disabled={loading}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 btn-custom rounded-pill mt-4"
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
                          Đang xử lý...
                        </>
                      ) : (
                        'Đăng ký'
                      )}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleRegisterVerifySubmit}>
                    <Form.Group controlId="formVerifyCode">
                      <Form.Label className="form-label">Nhập mã xác thực</Form.Label>
                      <Form.Control
                        type="text"
                        value={registerVerifyCodeInput}
                        onChange={(e) => setRegisterVerifyCodeInput(e.target.value)}
                        placeholder="Nhập mã xác thực từ email"
                        required
                        className="form-control-custom"
                        disabled={loading}
                      />
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 btn-custom rounded-pill mt-4"
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
                          onClick={() => sendVerificationEmail(registerFormData.email)}
                          disabled={loading}
                        >
                          Gửi lại mã
                        </Button>
                      </p>
                    </div>
                  </Form>
                )}
              </Col>
            </Row>
          </Modal.Body>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default AccountManagement;