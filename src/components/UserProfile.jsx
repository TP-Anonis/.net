/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { requestResetPassword, resetPassword } from '../services/authApi';
import { jwtDecode } from 'jwt-decode';
import '../assets/css/UserProfile.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL_PROFILE = 'http://localhost:8000/auth/api/v1/User/profile';
const API_URL_USERS = 'http://localhost:8000/auth/api/v1/User';

const UserProfile = () => {
  const navigate = useNavigate();

  // Khởi tạo state
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    sex: '',
    birthday: '',
  });
  const [passwordData, setPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);

  // Lấy token từ localStorage
  const token = localStorage.getItem('token') || '';

  // Hàm giải mã token để lấy email
  const getEmailFromToken = () => {
    try {
      const decoded = jwtDecode(token);
      return decoded.email || 'tanphuoc058@gmail.com'; // Fallback mặc định
    } catch (e) {
      console.error('Lỗi giải mã token:', e);
      return 'tanphuoc058@gmail.com'; // Fallback mặc định
    }
  };

  // Kiểm tra token
  const checkToken = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      console.log('Token không tồn tại trong localStorage.');
      return false;
    }
    console.log('Token được sử dụng:', token);
    return true;
  };

  // Fetch dữ liệu người dùng
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!checkToken()) return;

      setLoading(true);
      try {
        // Bước 1: Lấy danh sách người dùng
        const userListResponse = await axios.get(API_URL_USERS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Danh sách người dùng:', userListResponse.data);

        const users = userListResponse.data.data || [];
        if (!users.length) {
          throw new Error('Không tìm thấy danh sách người dùng.');
        }

        // Lấy email từ token
        const currentUserEmail = getEmailFromToken();
        console.log('Email từ token:', currentUserEmail);

        // Tìm người dùng hiện tại
        const currentUser = users.find((u) => u.email === currentUserEmail);
        if (!currentUser) {
          throw new Error('Không tìm thấy người dùng hiện tại trong danh sách.');
        }

        const userAccountId = currentUser.id;
        console.log('userAccountId:', userAccountId);

        // Bước 2: Lấy thông tin cá nhân
        const profileResponse = await axios.get(`${API_URL_PROFILE}?accountId=${userAccountId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('Phản hồi hồ sơ người dùng:', profileResponse.data);

        const userData = profileResponse.data;
        if (!userData) {
          throw new Error('API không trả về dữ liệu người dùng.');
        }

        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          sex: userData.sex || '',
          birthday: userData.birthday ? userData.birthday.split('T')[0] : '',
        });
        setPasswordData((prev) => ({ ...prev, email: userData.email || '' }));
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
        setError('Lấy thông tin người dùng thất bại: ' + errorMessage);
        console.error('Lỗi khi lấy hồ sơ người dùng:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Xử lý thay đổi form thông tin
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi form mật khẩu
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý submit form thông tin
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      setError('Họ và tên không được để trống!');
    } else {
      setError('');
      console.log('Thông tin đã cập nhật:', formData);
      setIsEditing(false);
      setShowSuccessModal(true);
    }
  };

  // Xử lý chỉnh sửa
  const handleEditClick = (e) => {
    e.preventDefault();
    setIsEditing(true);
  };

  // Đóng modal thành công
  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  // Hiển thị modal đổi mật khẩu
  const handleShowPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordStep(1);
  };

  // Đóng modal đổi mật khẩu
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData((prev) => ({ ...prev, otp: '', newPassword: '', confirmPassword: '' }));
    setPasswordError('');
    setPasswordStep(1);
  };

  // Xử lý submit đổi mật khẩu
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      if (passwordStep === 1) {
        if (!passwordData.email) {
          setPasswordError('Vui lòng nhập email!');
          return;
        }
        await requestResetPassword(passwordData.email);
        setPasswordStep(2);
        setPasswordError('Mã OTP đã được gửi. Vui lòng kiểm tra email.');
      } else {
        if (!passwordData.otp) {
          setPasswordError('Vui lòng nhập mã OTP!');
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
          return;
        }
        if (passwordData.newPassword.length < 6) {
          setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
          return;
        }

        await resetPassword(passwordData.email, passwordData.newPassword, passwordData.otp);
        alert('Đổi mật khẩu thành công!');
        handleClosePasswordModal();
        setShowSuccessModal(true);
      }
    } catch (err) {
      setPasswordError(err.message || 'Thao tác thất bại! Vui lòng kiểm tra lại thông tin.');
    }
  };

  // Hiển thị khi đang tải
  if (loading) {
    return (
      <>
        <Header />
        <Container className="user-profile-container py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <div className="text-center">Đang tải thông tin người dùng...</div>
            </Col>
          </Row>
        </Container>
        <Footer />
      </>
    );
  }

  // Hiển thị khi không có dữ liệu
  if (!user) {
    return (
      <>
        <Header />
        <Container className="user-profile-container py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Alert variant="danger">{error || 'Không thể tải thông tin người dùng.'}</Alert>
            </Col>
          </Row>
        </Container>
        <Footer />
      </>
    );
  }

  // Giao diện chính
  return (
    <>
      <Header />
      <Container className="user-profile-container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-sm">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h3 className="modal-title">{formData.fullName}</h3>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="formFullName">
                    <Form.Label className="form-label">Họ và tên</Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formEmail">
                    <Form.Label className="form-label">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      disabled
                      className="form-control-custom rounded-pill"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formSex">
                    <Form.Label className="form-label">Giới tính</Form.Label>
                    <Form.Select
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formBirthday">
                    <Form.Label className="form-label">Ngày sinh</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  {isEditing ? (
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 btn-custom rounded-pill"
                    >
                      Lưu
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={handleEditClick}
                      className="w-100 btn-custom rounded-pill"
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Form>

                {/* Modal xác nhận lưu thành công */}
                <Modal show={showSuccessModal} onHide={handleCloseModal} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Thông báo</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-center">Bạn đã lưu thông tin thành công!</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onClick={handleCloseModal}>
                      Đóng
                    </Button>
                  </Modal.Footer>
                </Modal>

                {/* Modal thay đổi mật khẩu */}
                <Modal show={showPasswordModal} onHide={handleClosePasswordModal} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>{passwordStep === 1 ? 'Đặt lại mật khẩu' : 'Xác nhận OTP'}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                    <Form onSubmit={handlePasswordSubmit}>
                      {passwordStep === 1 ? (
                        <Form.Group className="mb-3" controlId="formResetEmail">
                          <Form.Label className="form-label">Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={passwordData.email}
                            onChange={handlePasswordChange}
                            placeholder="Nhập email"
                            className="form-control-custom rounded-pill"
                            required
                          />
                        </Form.Group>
                      ) : (
                        <>
                          <Form.Group className="mb-3" controlId="formOtp">
                            <Form.Label className="form-label">Mã OTP</Form.Label>
                            <Form.Control
                              type="text"
                              name="otp"
                              value={passwordData.otp}
                              onChange={handlePasswordChange}
                              placeholder="Nhập mã OTP"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formNewPassword">
                            <Form.Label className="form-label">Mật khẩu mới</Form.Label>
                            <Form.Control
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Nhập mật khẩu mới"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="formConfirmPassword">
                            <Form.Label className="form-label">Xác nhận mật khẩu mới</Form.Label>
                            <Form.Control
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Xác nhận mật khẩu mới"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                        </>
                      )}
                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 btn-custom rounded-pill"
                      >
                        {passwordStep === 1 ? 'Gửi OTP' : 'Đổi mật khẩu'}
                      </Button>
                    </Form>
                  </Modal.Body>
                </Modal>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default UserProfile;